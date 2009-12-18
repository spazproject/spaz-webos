function StageAssistant () {
	Mojo.Log.info("Logging from StageAssistant Constructor");
	this.firstload = true;
	
	/*
		sc is attached to the appController.assistant at startup, 
		so we want to make sure we're using the same one, even
		in different stages
	*/
	// var sc = Mojo.Controller.getAppController().assistant.sc;
}

StageAssistant.prototype.setup = function() {
	Mojo.Log.info("Logging from StageAssistant Setup");
	var thisSA = this;	
	
	/*
		We can't go to the login screen until the 
		prefs have fully loaded
	*/
	jQuery().bind('spazprefs_loaded', function() {
		Mojo.Log.info("Prefs loaded!");
		
		sc.app.twit = new scTwit(null, null, {
			'event_mode':'jquery'
		});
	
		if (thisSA.firstload) {
			dump('FIRSTLOAD ----------------------');
			thisSA.controller.pushScene('start', {'firstload':true});
			thisSA.firstload = false;
		} else {
			thisSA.controller.pushScene('start');
		}
		
	});
	
	
	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	sc.app.prefs = new SpazPrefs(default_preferences);
	sc.app.prefs.load();
	Mojo.Log.info("loading prefs…");
};


StageAssistant.prototype.loadPrefsFromDepot = function() {

}


StageAssistant.prototype.cleanup = function() {
	
	jQuery().unbind('spazprefs_loaded');
	
	var sc = null;
	
	/*
		try to clean up ALL jQuery listeners everywhere
	*/
	jQuery().unbind();
	jQuery().die();
};


StageAssistant.prototype.handleCommand = function(event){
	
	dump(event.command);
	
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

