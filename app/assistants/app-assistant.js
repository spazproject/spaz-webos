function AppAssistant(appController) {
	var thisSA = this;	

	this.sc = sc;

	/*
		model for saving Tweets to Depot
	*/
	sc.app.Tweets = new Tweets();

	sc.app.search_cards = [];
	sc.app.new_search_card = 0;
	sc.app.search_card_prefix = "searchcard_";

	sc.app.username = null;
	sc.app.password = null;
	
	sc.app.prefs = new scPrefs(default_preferences);

}


AppAssistant.prototype.handleLaunch = function(launchParams) {
	var thisA = this;

	dump("Launch Parameters:");
	dump(launchParams);
	
	if (launchParams && launchParams.fromstage) {
		
		if (launchParams.fromstage === 'main') {
			PalmSystem.activate();
		} else {
			var stageController = this.controller.getStageController(launchParams.fromstage);
			if (stageController) {
				stageController.window.focus();
			}			
		}
		
	}
	
	// // Look for an existing main stage by name.
	// var stageProxy = this.controller.getStageProxy(MainStageName);
	// var stageController = this.controller.getStageController(MainStageName);
	// 
	// if (stageProxy) {
	// 	// If the stage exists, just bring it to the front by focusing its window
	// 	//	 or if it's just the proxy then it's being focused, so exit
	// 	if (stageController) {
	// 		stageController.window.focus();
	// 	}
	// } else {
	// 			
	// 	/*
	// 		We can't go to the login screen until the 
	// 		prefs have fully loaded
	// 	*/
	// 
	// 	jQuery().bind('spazprefs_loaded', function() {
	// 		Mojo.Log.info("Prefs loaded!");
	// 
	// 		// var username = sc.app.prefs.get('username');
	// 		// var password = sc.app.prefs.get('password');
	// 
	// 		sc.app.twit = new scTwit();
	// 
	// 		// if (username && password) {
	// 		// 	sc.app.twit.setCredentials(username, password);
	// 		// }
	// 	
	// 		// Create a callback function to set up the new main stage
	// 		// once it is done loading. It is passed the new stage controller
	// 		// as the first parameter.
	// 		var pushMainScene = function(stageController) {
	// 			stageController.pushScene('start');
	// 		};
	// 		var stageArguments = {
	// 			name: MainStageName,
	// 			lightweight: true
	// 		};
	// 
	// 		thisA.controller.createStageWithCallback(stageArguments, pushMainScene, "card");
	// 
	// 		// if (thisSA.firstload) {
	// 		// 	dump('FIRSTLOAD ----------------------');
	// 		// 	thisSA.controller.pushScene('start', {'firstload':true});
	// 		// 	thisSA.firstload = false;
	// 		// } else {
	// 		// 	thisSA.controller.pushScene('start');
	// 		// }
	// 
	// 	});
	// 
	// 	/*
	// 		load our prefs
	// 		default_preferences is from default_preferences.js, loaded in index.html
	// 	*/
	// 
	// 	sc.app.prefs.load();
	// 	Mojo.Log.info("loading prefs…");
	// }
};