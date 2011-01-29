function StageLightweightSearchAssistant () {
	this.firstload = true;
	
	// alert('this is the lightweight search assistant!');
}
StageLightweightSearchAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};
StageLightweightSearchAssistant.prototype.setup = function() {
	var thisSA = this;	
};
