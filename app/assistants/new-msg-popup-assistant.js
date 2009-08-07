function NewMsgPopupAssistant(message) {
	this.message = message;
}

NewMsgPopupAssistant.prototype.setup = function() {
	this.update(this.message); 
	
	var okButton = this.controller.get("okButton"); 
	Mojo.Event.listen(okButton, Mojo.Event.tap, this.handleOk.bindAsEventListener(this));
	
	var closeButton = this.controller.get("closeButton"); 
	Mojo.Event.listen(closeButton, Mojo.Event.tap, this.handleClose.bindAsEventListener(this));
};

NewMsgPopupAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


NewMsgPopupAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

NewMsgPopupAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

NewMsgPopupAssistant.prototype.update = function(message) { 
    this.info = {eventSubtitle: message, subject: "News"}; 
    //  Use render to convert the object and its properties along with a view file into a string 
    //    containing HTML 
    var renderedInfo = Mojo.View.render({object: this.info, template:'new-msg-popup/item-info'}); 
    //  Insert the HTML into the DOM, replacing the existing content. */ 
    var infoElement = this.controller.get('info'); 
    infoElement.update(renderedInfo); 
}; 
NewMsgPopupAssistant.prototype.handleOk = function(){ 
    Mojo.Log.info("Popup Ok received"); 
}; 
NewMsgPopupAssistant.prototype.handleClose = function(){ 
    this.controller.window.close(); 
}; 

