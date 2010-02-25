function StageAssistant () {
	Mojo.Log.info("Logging from StageAssistant Constructor");
	
	/*
		sc is attached to the appController.assistant at startup, 
		so we want to make sure we're using the same one, even
		in different stages
	*/
	// var sc = Mojo.Controller.getAppController().assistant.sc;
	
	/*
		overwrite this re-tarderd action;
	*/
	
	setInterval = window.setInterval;
}

StageAssistant.prototype.setup = function() {
	Mojo.Log.info("Logging from StageAssistant Setup");
	var thisSA = this;
};


StageAssistant.prototype.cleanup = function() {
	
	Mojo.Log.info("StageAssistant cleanup");
	
	var sc = null;
	
	/*
		try to clean up ALL jQuery listeners everywhere
	*/
	jQuery().unbind();
	jQuery().die();
};


StageAssistant.prototype.handleCommand = function(event){
	
	sch.error("StageAssistant handleCommand:"+event.command);
	
	var active_scene = this.controller.activeScene();
	
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			
			
			/*
				Navigation
			*/
			case 'accounts':
				Spaz.findAndSwapScene("startlogin", active_scene);
				break;
			case 'my-timeline':
				Spaz.findAndSwapScene("my-timeline", active_scene);
				break;
			case 'favorites':
				Spaz.findAndSwapScene("favorites", active_scene);
				break;
			case 'search':
				Spaz.findAndSwapScene("startsearch", active_scene);
				break;
			case 'followers':
				Spaz.findAndSwapScene("manage-followers", active_scene);
				break;
			case 'appmenu-about':
				Mojo.Controller.stageController.pushScene("about", active_scene);
				break;
			case Mojo.Menu.prefsCmd:
				Mojo.Controller.stageController.pushScene("preferences", active_scene);
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Controller.stageController.pushScene("help", active_scene);
				break;
		
			
			default:
				break;			
		}
		
	}
};

