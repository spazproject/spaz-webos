function StageAssistant () {
	



	
	
}

StageAssistant.prototype.setup = function() {
	// this.controller.pushScene('my-timeline');
	// this.controller.pushScene('search-twitter', {searchterm:'funkatron'});
	// this.controller.pushScene('user-detail', 'poop');
	
	
	/*
		We can't go to the login screen until the 
		prefs have fully loaded
	*/
	var thisSA = this;
	jQuery().bind('spazprefs_loaded', function() {
		
		var username = sc.app.prefs.get('username');
		var password = sc.app.prefs.get('password');

		sc.app.twit = new scTwit();

		if (username && password) {
			sc.app.twit.setCredentials(username, password);
		}
		
		
		if (sc.app.prefs.get('always-go-to-my-timeline')) {
			thisSA.controller.pushScene('my-timeline');	
		} else {
			thisSA.controller.pushScene('login');	
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