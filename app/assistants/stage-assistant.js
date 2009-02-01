function StageAssistant () {
	sc.app.twit = new scTwit(); // username and password will be provided by login scene
	// sc.app.twit = new scTwit('spaztest', 'perlsucks');
}

StageAssistant.prototype.setup = function() {
	this.controller.pushScene('login');
	// this.controller.pushScene('my-timeline');
	// this.controller.pushScene('search-twitter', {searchterm:'funkatron'});
	// this.controller.pushScene('user-detail', 'poop');
}
