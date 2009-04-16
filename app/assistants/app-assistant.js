function AppAssistant(appController) {
	Mojo.Log.info("Logging from AppAssistant Constructor");
	var thisSA = this;	

	/*
		Remap JSON parser because JSON2.js one was causing probs with unicode
	*/
	sc.helpers.deJSON = function(str) {
		return Mojo.parseJSON(str);
	};
	sc.helpers.enJSON = function(obj) {
		var json = obj.toJSON();
		return json;
	};

	sc.info = Mojo.Log.info;
	sc.warn = Mojo.Log.warn;
	sc.error = Mojo.Log.error;

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
	Mojo.Log.info("Logging from AppAssistant handleLaunch");
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

};