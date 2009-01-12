function StageAssistant () {
	sc.app.twit = new scTwit('funkatron', 'blueb3rryp1e');
	sc.app.lastFriendsTimelineId = 1;
}

StageAssistant.prototype.setup = function() {
	this.controller.pushScene('friends-timeline');
}
