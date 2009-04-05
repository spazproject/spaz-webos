function StageAssistant () {
	this.firstload = true;	
}



StageAssistant.prototype.setup = function() {
	// this.controller.pushScene('binding');
	// this.controller.pushScene('my-timeline');
	// this.controller.pushScene('search-twitter', {searchterm:'funkatron'});
	// this.controller.pushScene('user-detail', 'poop');
	
	/*
		model for saving Tweets to Depot
	*/
	sc.app.Tweets = new Tweets();
	
	sc.app.search_cards = [];
	sc.app.new_search_card = 0;
	
	sc.app.username = null;
	sc.app.password = null;
	
	
	
	/*
		We can't go to the login screen until the 
		prefs have fully loaded
	*/
	var thisSA = this;
	jQuery().bind('spazprefs_loaded', function() {
		
		// var username = sc.app.prefs.get('username');
		// var password = sc.app.prefs.get('password');
	
		sc.app.twit = new scTwit();
	
		// if (username && password) {
		// 	sc.app.twit.setCredentials(username, password);
		// }
		
	
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
	sc.app.prefs = new scPrefs(default_preferences);
	sc.app.prefs.load();
}


StageAssistant.prototype.onPrefsLoad = function() {

};