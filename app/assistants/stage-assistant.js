function StageAssistant () {
	this.firstload = true;	
	alert('HELLO!!!');
}

///var/usr/palm/applications/com.funkatron.app.spaz/app/assistants/stage-assistant.js:2


StageAssistant.prototype.setup = function() {
	// thisSA.controller.pushScene('start');
	// this.controller.pushScene('binding');
	// this.controller.pushScene('my-timeline');
	// this.controller.pushScene('search-twitter', {searchterm:'funkatron'});
	// this.controller.pushScene('user-detail', 'poop');
	var thisSA = this;	

	/*
		model for saving Tweets to Depot
	*/
	alert('making sc.app.Tweets');
	sc.app.Tweets = new Tweets();
	alert('made sc.app.Tweets');
	
	sc.app.search_cards = [];
	sc.app.new_search_card = 0;
	alert('made sc.app.search_cards');

	sc.app.username = null;
	sc.app.password = null;
	
	
	/*
		We can't go to the login screen until the 
		prefs have fully loaded
	*/

	jQuery().bind('spazprefs_loaded', function() {
		Mojo.Log.info("Prefs loaded!");
		
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
	Mojo.Log.info("loading prefs…");
};


StageAssistant.prototype.onPrefsLoad = function() {

};