function StageLightweightSearchAssistant () {
	this.firstload = true;
	
	/*
		sc is attached to the appController.assistant at startup, 
		so we want to make sure we're using the same one, even
		in different stages
	*/
	sc = Mojo.Controller.getAppController().assistant.sc;
}

StageLightweightSearchAssistant.prototype.setup = function() {
	var thisSA = this;	

	/*
		model for saving Tweets to Depot
	*/
	// sc.app.Tweets = new Tweets();
	// 
	// sc.app.search_cards = [];
	// sc.app.new_search_card = 0;
	// 
	// sc.app.username = null;
	// sc.app.password = null;
	// 
	// 
	// /*
	// 	We can't go to the login screen until the 
	// 	prefs have fully loaded
	// */
	// 
	// jQuery().bind('spazprefs_loaded', function() {
	// 	Mojo.Log.info("Prefs loaded!");
	// 	
	// 	// var username = sc.app.prefs.get('username');
	// 	// var password = sc.app.prefs.get('password');
	// 
	// 	sc.app.twit = new scTwit();
	// 	
	// });
	// 
	// /*
	// 	load our prefs
	// 	default_preferences is from default_preferences.js, loaded in index.html
	// */
	// sc.app.prefs = new scPrefs(default_preferences);
	// sc.app.prefs.load();
	// Mojo.Log.info("loading prefs…");
};


StageLightweightSearchAssistant.prototype.onPrefsLoad = function() {

};