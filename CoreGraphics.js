/**
 * CoreGraphics interface 1.0
 * Copyright 2016 Brett Houtz
 *
 * CoreGraphics supplies an object-oriented interface for graphics for the HTML5 Canvas.
 */

/**
 * Interface for a single image or text.
 */
class Wrap {
	pass(){}
	SMOOTH(t){
		return 3*t*t - 2*t*t*t;
	}
	LINEAR(t){
		return t;
	}
	constructor(depth, fn, props, content, ...args){
		this.depth = depth;
		this.fn = fn;
		this.args = args;
		this.props = props;
		this.content = content;
		this.eachStep = this.pass;
	}
	/**
	* Move to new position.
	* @param {numbers} args new position
	*/
	move(...args){
		this.args.splice(0, args.length, ...args);
	}
	/**
	 * Move to new position over time
	 * @param  {string}   mode     "SMOOTH" for motion that accelerates and decelerates, or "LINEAR"
	 * for motion  with a constant speed
	 * @param  {Function} callback called once done moving
	 * @param  {integer}   steps    how many steps moving should take
	 * @param  {numbers}   args  new  position
	 */
	moveAnimated(mode, callback, steps, ...args){
		this.step = 0;
		this.startArgs = this.args.slice();
		this.eachStep = ()=>{
			this.step++;
			for(let i=0;i<this.args.length;i++){
				this.args[i] = this.startArgs[i] + (args[i]-this.startArgs[i])*this[mode](this.step/steps);
			}
			if(this.step==steps){
				this.eachStep = this.pass;
				callback(this);
			}
		}
	}
	/**
	 * @param  {number} n new depth
	 */
	changeDepth(n){
		this.kill();
		this.depth.add(n, this);
	}
	/**
	 * Stop rendering this Wrap. After this is called, the Wrap is useless.
	 */
	kill(){
		this.depth.remove(this);
	}
}

class Depth {
	constructor(){
		this.map = new Map();
	}
	add(n, wrap){
		if([...this.map.keys()].indexOf(n) >= 0){
			this.map.get(n).push(wrap);
		}else{
			this.map.set(n, [wrap]);
		}
	}
	remove(wrap){
		for(let n of this.map.keys()){
			let i = this.map.get(n).indexOf(wrap);
			if(i >= 0){
				this.map.get(n).splice(i, 1);
				break;
			}
		}
	}
	get(n){
		if([...this.map.keys()].indexOf(n) >= 0){
			return this.map.get(n);
		}
		return [];
	}
	clear(){
		this.map = new Map();
	}
	keys(){
		return [...this.map.keys()];
	}
}

/**
 * Interface for the canvas. Manages all image loading and drawing. Images and text may be made to
 * automatically persist over frames. Peristant images are managed through Wrap objects.
 * Before any drawing is done, files must be registered. Then load() must be called. After loading
 * has finished, each frame follows the cycle of clear(), drawing method calls, and render().
 * The parameters args in draw, pdraw, text, and ptext follow conventions described here
 * (excluding img): http://www.w3schools.com/jsref/canvas_drawimage.asp
 */
class CoreGraphics{
	/**
	* All params except the first are an optional initial call to registerFiles
	* @param {CanvasRenderingContext2D} ctx
	* @param {string[]}, [filenames=[]] image names, without extension or prefix
	* @param {string} [extension=''] extension common to all image names
	* @param {string} [prefix=''] path and/or prefix common to all image names
	*/
	constructor(ctx, filenames=[], extension='', prefix=''){
		this.ctx = ctx;
		this.loadStatus = -1;
		this.filenames = [];
		this.images = {};
		this.frames = new Depth();
		this.persistants = new Depth();
		this.registerFiles(filenames, extension, prefix);
		this.textPropNames = {
			font: "font",
			color: "fillStyle",
			align: "textAlign",
			baseline: "textBaseline"
		};
		this.props = {};
	}
	/**
	* Adds filenames to the roster of images.
	* @param {CanvasRenderingContext2D} ctx
	* @param {string[]}, [filenames=[]] image names, without extension or prefix
	* @param {string} [extension=''] extension common to all image names
	* @param {string} [prefix=''] path and/or prefix common to all image names
	*/
	registerFiles(filenames, extension='', prefix=''){
		if(this.loadStatus >= 0){
			throw "CoreGraphics: cannot register files once load has started.";
		}
		for(let name of filenames){
			this.filenames.push([name, extension, prefix]);
		}
	}
	/**
	 * Begins loading the registered images.
	 */
	load(){
		if(this.loadStatus >= 0) throw "CoreGraphics: has already loaded";
		if(this.filenames.length == 0){
			this.loadStatus = 1;
			return;
		}
		this.loadStatus = 0;
		for(let ne of this.filenames){
			let img = new Image();
			img.onload = (() => this.loadStatus++);
			img.src = ne[2] + ne[0] + ne[1];
			this.images[ne[0]] = img;
		}
	}
	/**
	 * @return {number}
	 *    -1: load has not yet started
	 * 		0-1: load is in progress
	 * 		1: load has completed
	 */
	getLoadProgress(){
		if(this.loadStatus < 0 || this.filenames.length==0){
			return this.loadStatus
		}
		return this.loadStatus/this.filenames.length;
	}
	/**
	 * @return {boolean} whether the load has completed
	 */
	isLoaded(){
		return this.loadStatus==this.filenames.length;
	}
	/**
	 * Clears the canvas for a new frame.
	 */
	clear(){
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	}
	/**
	* Prepares an image to be rendered that will persist after clear() is called.
	* @param  {string} name    the filename of the registered image
	* @param  {number} depth   depth at which to draw (higher is drawn over lower)
	* @param  {numbers} args position
	* @return {Wrap}         Wrap object for the image
	*/
	pdraw(name, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.persistants, "drawImage", {}, this.images[name], ...args);
		this.persistants.add(depth, wrap);
		return wrap;
	}
	/**
	* Prepares an image to be rendered that won't persist after clear().
	* @param  {string} name    the filename of the registered image
	* @param  {number} depth   depth at which to draw (higher is drawn over lower)
	* @param  {numbers} args position
	* @return {Wrap}         Wrap object for the image. Probably useless to save.
	*/
	draw(name, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.frames, "drawImage", {}, this.images[name], ...args);
		this.frames.add(depth, wrap);
		return wrap;
	}
	/**
	 * Determines the properties of text drawn after the call.
	 * @param {Object} props may have keys font, color, align, and baseline.
	 */
	setText(props){
		this.props = props;
		for(let p of Object.keys(props)){
			if(this.textPropNames.hasOwnProperty(p)){
				this.ctx[this.textPropNames[p]] = props[p];
			}
		}
	}
	/**
	 * Just like pdraw, but displays text.
	 * @param  {string} txt     Text to be drawn.
	 * @param  {number} depth   depth at which to draw (higher is drawn over lower)
	 * @param  {numbers} args position
	 * @return {Wrap}         Wrap object for the text
	 */
	ptext(txt, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.persistants, "fillText", this.props, txt, ...args);
		this.persistants.add(depth, wrap);
		return wrap;
	}
	/**
	 * Just like draw, but displays text.
	 * @param  {string} txt     Text to be drawn.
	 * @param  {number} depth   depth at which to draw (higher is drawn over lower)
	 * @param  {numbers} args position
	 * @return {Wrap}         Wrap object for the text
	 */
	text(txt, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.frames, "fillText", this.props, txt, ...args);
		this.frames.add(depth, wrap);
		return wrap;
	}
	/**
	 * Actually draws all images and text prepared by pdraw(), draw(), ptext(), and text().
	 */
	render(){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot render until loaded.";
		let arr=[];for(let x of (new Set(this.persistants.keys().concat(this.frames.keys()))))arr.push(x);let depths=arr // BEFORE ARRAY.FROM
		//let depths = [...(new Set(this.persistants.keys().concat(this.frames.keys())))] AFTER ARRAY.FROM
		.sort((a,b)=>a-b);
		for(let n of depths){
			for(let wrap of this.persistants.get(n)){
				wrap.eachStep();
				this.setText(wrap.props);
				this.ctx[wrap.fn](wrap.content, ...wrap.args);
			}
			for(let wrap of this.frames.get(n)){
				wrap.eachStep();
				this.setText(wrap.props);
				this.ctx[wrap.fn](wrap.content, ...wrap.args);
			}
		}
		this.frames.clear();
	}
	/**
	 * Kills all images and text.
	 */
	killAll(){
		this.frames.clear();
		this.persistants.clear();
	}
}
