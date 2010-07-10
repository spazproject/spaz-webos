function ViewImageAssistant(params) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
	
	var params = params || {};
	
	this.imageURLs = params.imageURLs || [];
	
	if (sch.isString(this.imageURLs)) {
		this.imageURLs = [this.imageURLs];
	}
	
	sch.dump(params);
}

ViewImageAssistant.prototype.setup = function() {
	
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.trackStageActiveState();
	
	/*
		view and command menus
	*/
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("View image"), command:'scroll-top', 'class':"palm-header left", width:320}				
				]
			}

		],
		cmdMenuItems: []
	});
	
	this.initAppMenu({ 'items':loggedin_appmenu_items });	
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.controller.setupWidget("imageview", this.attributes = {
			noExtractFS: true
		},
		this.model = {
			onLeftFunction: this.onLeft.bind(this),
			onRightFunction: this.onRight.bind(this)
		}
	);
	this.controller.get('imageview').observe(Mojo.Event.imageViewChanged, this.changedImage.bind(this));    
};

ViewImageAssistant.prototype.activate = function(event) {
	
	// var width  = jQuery('#imageview').parent().width();
	// var height = jQuery('#imageview').parent().height();
	var width  = window.innerWidth;
	var height = window.innerHeight - parseInt(jQuery('#imageview').offset().top, 10) - 40;
	sch.debug(width+"x"+height);


	this.controller.get('imageview').mojo.manualSize(width, height);
	this.controller.get('imageview').mojo.centerUrlProvided(this.imageURLs[0]);

	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


ViewImageAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ViewImageAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


ViewImageAssistant.prototype.onLeft = function() {
	sch.dump('onLeft');
};

ViewImageAssistant.prototype.onRight = function() {
	sch.dump('onLeft');
};

ViewImageAssistant.prototype.changedImage = function(event) {
	if (event.error) {
		sch.debug("Failed to load image!");
		sch.dump(event.error);
	} else {
		sch.dump("Loaded the image okay!", event.url);
	}
	
};