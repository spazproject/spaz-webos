function StageAssistant () {
	sc.app.twit = new scTwit('dreadnaughttest', 'perlsucks');
	// sc.app.twit = new scTwit(); // username and password will be provided by login scene
}

StageAssistant.prototype.setup = function() {
	this.controller.pushScene('my-timeline');
	// this.controller.pushScene('user-detail', {
	// 	userid:'funkatron'
	// });
	// 

}
