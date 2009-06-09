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
};
