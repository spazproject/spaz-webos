function StageAssistant () {

}



StageAssistant.prototype.setup = function() {
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
		
		// if (thisSA.firstload) {
		// 	dump('FIRSTLOAD ----------------------');
		// 	thisSA.controller.pushScene('login', {'firstload':true});
		// 	thisSA.firstload = false;
		// } else {
		// 	thisSA.controller.pushScene('login');
		// }
		
		
	});
	
	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	sc.app.prefs = new scPrefs(default_preferences);
	sc.app.prefs.load();
}
