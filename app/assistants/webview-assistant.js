function WebviewAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	if (args.URL) {
		this.passedURL = args.URL;
	}
}

WebviewAssistant.prototype.setup = function() {
	var attr = {
		minFontSize:18,
		virtualpagewidth: this.controller.window.innerWidth,
		virtualpageheight: 32 
	};

	var tfAttr = {
		hintText: $L('Enter URL')
	};

	this.model = {
		'value':null
	};
	
	this.controller.setupWidget('webview', attr, {});
	this.controller.setupWidget('url_field', tfAttr, this.model);
	
	this.urlChangedHandler = this.urlChanged.bindAsEventListener(this);
	this.controller.listen('url_field', Mojo.Event.propertyChanged, this.urlChangedHandler);
	this.linkClicked = this.linkClicked.bindAsEventListener(this);
	this.controller.listen('webview', Mojo.Event.webViewLinkClicked, this.linkClicked);
}

WebviewAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	if (event && event.searchterm) {
		this.passedURL = event.URL;
	}


	if (this.passedURL) {
		this.model.value = this.passedURL;
		this.controller.modelChanged(this.model);
		// this.search(this.passedURL);
		this.passedURL = null; // eliminate this so it isn't used anymore
	}
}


WebviewAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

WebviewAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening('url_field', Mojo.Event.propertyChanged,    this.urlChangedHandler);
	this.controller.stopListening('webview',   Mojo.Event.webViewLinkClicked, this.linkClicked);
}


WebviewAssistant.prototype.urlChanged = function(event) {
	var wb = this.controller.get('webview');
	if (wb === null) {
		Mojo.log("couldn't find web adapter");
	} else {
		wb.mojo.openURL(event.value);
	}
};

WebviewAssistant.prototype.linkClicked = function(event) {
	var wb = this.controller.get('webview');
	wb.mojo.openURL(event.url);
};
