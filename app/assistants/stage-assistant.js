function StageAssistant () {
	
	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	sc.app.prefs = new scPrefs(default_preferences);

	var username = sc.app.prefs.get('username');
	var password = sc.app.prefs.get('password');
	
	
	
	sc.app.twit = new scTwit();
	
	if (username && password) {
		sc.app.twit.setCredentials(username, password);
	}
	
}

StageAssistant.prototype.setup = function() {
	this.controller.pushScene('login');
	// this.controller.pushScene('my-timeline');
	// this.controller.pushScene('search-twitter', {searchterm:'funkatron'});
	// this.controller.pushScene('user-detail', 'poop');
}
