/*
 * CoreGraphics interface 1.0
 * Brett Houtz
 *
 * CoreGraphics supplies an object-oriented interface for graphics for the HTML5 Canvas. Image
 * loading is managed through the interface. Images and text may be made to automatically persist
 * over frames. Peristant images are managed through Wrap objects.
 *
 * Before any drawing is done, files must be registered. Then load() must be called. After loading
 * has finished, each frame follows the cycle of clear(), drawing method calls, and render().
 * The parameters args in draw, pdraw, text, and ptext follow conventions described here
 * (excluding img): http://www.w3schools.com/jsref/canvas_drawimage.asp
 *
 * CoreGraphics object:
 * constructor(context canvas_context, [strings] image_filenames?, string file_extension?):
 * 		last two arguments are optional call to registerFiles
 * registerFiles([strings] image_filenames, string file_extension):
 * 		adds image_filenames (paths to files) to the roster of images. file_extension will be
 * 		concatenated to the end, and later references to these files must exclude the extension
 * load():
 * 		begins loading the registered images
 * getLoadProgress():
 * 		-1: load has not yet started
 * 		0-1: load is in progress
 * 		1: load has completed
 * isLoaded():
 * 		returns true if load has completed
 * clear():
 * 		clears the canvas for a new frame
 * pdraw(string image_filename, number depth, ...args):
 * 		prepares an image to be rendered at the given depth depth (higher is drawn over lower) that
 *		will persist after clear() is called. returns an Wrap object.
 * draw(string image_filename, number depth, ...args):
 * 		behaves just like persistant, but the image automatically killed by clear. draw returns an
 * 		Wrap object, but it is unlikely to be useful to save
 * setText(oject props):
 *		determines the properties of text drawn after the call. the props object may have keys
 *		font, color, align, and baseline.
 * text(string text, number depth, ...args):
 *		just like draw, but displays text.
 * ptext(string text, number depth, ...args):
 *		just like persistant, but displays text.
 * render():
 * 		renders the images prepared by persistant and draw
 * killAll():
 *		kills all images and text
 *
 * -------------------------------------------------------------------------------------------------
 * Wrap object:
 * move(...args):
 *		move to new position args.
 * moveAnimated(string mode, function callback(this), int steps, ...args):
 *		move to new position args over steps steps. once finished, callback will be called, with this
 *		Wrap passed as an argument. mode may be either "SMOOTH", for a motion that accelerates and
 *		decelerates, or "LINEAR" for a motion with constant speed.
 * changeDepth(number n):
 *		change depth to n.
 * kill():
 *		stop rendering this Wrap. after this is called, this object is useless.
 *
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
	move(...args){
		this.args.splice(0, args.length, ...args);
	}
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
	changeDepth(n){
		this.kill();
		this.depth.add(n, this);
	}
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

class CoreGraphics{
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
	registerFiles(filenames, extension='', prefix=''){
		if(this.loadStatus >= 0){
			throw "CoreGraphics: cannot register files once load has started.";
		}
		for(let name of filenames){
			this.filenames.push([name, extension, prefix]);
		}
	}
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
	getLoadProgress(){
		if(this.loadStatus < 0 || this.filenames.length==0){
			return this.loadStatus
		}
		return this.loadStatus/this.filenames.length;
	}
	isLoaded(){
		return this.loadStatus==this.filenames.length;
	}
	clear(){
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	}
	draw(name, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.frames, "drawImage", {}, this.images[name], ...args);
		this.frames.add(depth, wrap);
		return wrap;
	}
	pdraw(name, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.persistants, "drawImage", {}, this.images[name], ...args);
		this.persistants.add(depth, wrap);
		return wrap;
	}
	setText(o){
		this.props = o;
		for(let p of Object.keys(o)){
			if(this.textPropNames.hasOwnProperty(p)){
				this.ctx[this.textPropNames[p]] = o[p];
			}
		}
	}
	text(txt, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.frames, "fillText", this.props, txt, ...args);
		this.frames.add(depth, wrap);
		return wrap;
	}
	ptext(txt, depth, ...args){
		if(this.loadStatus < 1) throw "CoreGraphics: cannot draw until loaded.";
		let wrap = new Wrap(this.persistants, "fillText", this.props, txt, ...args);
		this.persistants.add(depth, wrap);
		return wrap;
	}
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
	killAll(){
		this.frames.clear();
		this.persistants.clear();
	}
}
