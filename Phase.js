// Phase v1.0

class Phase {
	constructor(init, update, draw, end){
		this.init = init || this.pass;
		this.update = update || this.pass;
		this.draw = draw || this.pass;
		this.end = end || this.pass;
		this.waiting = false;
		this.interval = null;
	}
	pass(){}
	begin(framerate){
		this.init(this);
		this.resume(framerate);
	}
	stop(){
		this.pause();
		this.end(this);
	}
	switchTo(that, framerate){
		this.stop();
		that.begin(framerate);
	}
	wait(time){
		this.waiting = true;
		setTimeout(()=>{
			this.waiting = false
		}, time);
	}
	pause(){
		clearInterval(this.interval);
		this.interval = null;
	}
	resume(framerate){
		if(!this.interval){
			this.interval = setInterval(() => {
				if(!this.waiting){
					this.update(this);
					this.draw(this);
				}
			}, 1000/framerate);
		}
	}
}
