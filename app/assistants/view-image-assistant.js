// function ViewImageAssistant(params) {
// 	/* this is the creator function for your scene assistant object. It will be passed all the 
// 	   additional parameters (after the scene name) that were passed to pushScene. The reference
// 	   to the scene controller (this.controller) has not be established yet, so any initialization
// 	   that needs the scene controller should be done in the setup function below. */
// 	
// 	scene_helpers.addCommonSceneMethods(this);
// 	
// 	/*
// 		this connects App to this property of the appAssistant
// 	*/
// 	App = Spaz.getAppObj();
// 	
// 	params = params || {};
// 	
// 	this.imageURLs = params.imageURLs || [];
// 	
// 	this.window_title = params.title || $L("View image");
// 	
// 	if (sch.isString(this.imageURLs)) {
// 		this.imageURLs = [this.imageURLs];
// 	}
// 	
// 	Mojo.Log.info(params);
// }
// 
// ViewImageAssistant.prototype.aboutToActivate = function(callback){
// 	callback.defer(); //delays displaying scene, looks better
// };
// 
// ViewImageAssistant.prototype.setup = function() {
// 	
// 	var thisA = this;
// 
// 	this.imageViewer = this.controller.get('imageview');
// 	this.scroller = this.controller.getSceneScroller();
// 	
// 	this.trackStageActiveState();
// 	
// 	
// 	// /*
// 	// 	view and command menus
// 	// */
// 	// this.setupCommonMenus({
// 	// 	// viewMenuItems: [
// 	// 	// 	{
// 	// 	// 		items:[
// 	// 	// 			{label: this.window_title, command:'scroll-top', 'class':"palm-header left", width:320}				
// 	// 	// 		]
// 	// 	// 	}
// 	// 	// 
// 	// 	// ],
// 	// 	viewMenuItems: [],
// 	// 	cmdMenuItems: []
// 	// });
// 	// 
// 	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });	
// 	
// 	
// 	/* this function is for setup tasks that have to happen when the scene is first created */
// 		
// 	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
// 	
// 	/* setup widgets here */
// 	
// 	/* add event handlers to listen to events from widgets */
// 	
// 	this.controller.setupWidget("imageview", this.attributes = {
// 			noExtractFS: true
// 		},
// 		this.model = {
// 			onLeftFunction: this.onLeft.bind(this),
// 			onRightFunction: this.onRight.bind(this)
// 		}
// 	);
// 	this.imageViewer.observe(Mojo.Event.imageViewChanged, this.changedImage.bind(this));
// 	
// 	this._handleOrientationChange = this.handleOrientationChange.bindAsEventListener(this); //Handler function for handling the window resize event (when the orientation has changed
// 	this.controller.listen(this.controller.document, "orientationchange",this._handleOrientationChange);	
// };
// 
// ViewImageAssistant.prototype.activate = function(event) {
// 	
// 	// var width  = jQuery('#imageview').parent().width();
// 	// var height = jQuery('#imageview').parent().height();
// 	this.controller.enableFullScreenMode(true);
// 	this.controller.stageController.setWindowOrientation('free');
// 	this.imageViewer.mojo.centerUrlProvided(this.imageURLs[0]);
// 	this.imageViewer.mojo.manualSize(
// 		Mojo.Environment.DeviceInfo.maximumCardWidth,
// 		Mojo.Environment.DeviceInfo.maximumCardHeight
// 	); // Defaults to the full width and height
// 
// 	
// 	/* put in event handlers here that should only be in effect when this scene is active. For
// 	   example, key handlers that are observing the document */
// };
// 
// 
// ViewImageAssistant.prototype.deactivate = function(event) {
// 	/* remove any event handlers you added in activate and do any other cleanup that should happen before
// 	   this scene is popped or another scene is pushed on top */
// 	this.controller.stageController.setWindowOrientation('up');
// };
// 
// ViewImageAssistant.prototype.cleanup = function(event) {
// 	/* this function should do any cleanup needed before the scene is destroyed as 
// 	   a result of being popped off the scene stack */
// 	this.controller.stopListening(this.controller.document, 'orientationchange', this._handleOrientationChange);
// };
// 
// 
// ViewImageAssistant.prototype.handleOrientationChange=function(event) {
// 
// 	var max_width = Mojo.Environment.DeviceInfo.maximumCardWidth;
// 	var max_height = Mojo.Environment.DeviceInfo.maximumCardHeight;
// 
// 	if (event.position == 2 || event.position == 3) {
// 		//Mojo.Log.info("#####POSITION:" + event.position);
// 		this.imageViewer.mojo.manualSize(max_width, max_height);
// 		if (event.position == 2) {
// 			if (this.controller.stageController.setWindowOrientation) {
// 				this.controller.stageController.setWindowOrientation("up");
// 			};
// 		}
// 		else {
// 			if (this.controller.stageController.setWindowOrientation) {
// 				this.controller.stageController.setWindowOrientation("down");
// 			};
// 		}
// 
// 	}
// 
// 	else if (event.position == 4 || event.position == 5) {
// 		this.imageViewer.mojo.manualSize(max_height, max_width);
// 		if (event.position == 4) {
// 			if (this.controller.stageController.setWindowOrientation) {
// 				this.controller.stageController.setWindowOrientation("left");
// 			};
// 		}
// 		else {
// 			if (this.controller.stageController.setWindowOrientation) {
// 				this.controller.stageController.setWindowOrientation("right");
// 			};
// 		}
// 		Mojo.Log.info("#####POSITION:" + event.position);
// 	}
// 
// };
// 
// 
// ViewImageAssistant.prototype.onLeft = function() {
// 	Mojo.Log.info('onLeft');
// };
// 
// ViewImageAssistant.prototype.onRight = function() {
// 	Mojo.Log.info('onLeft');
// };
// 
// ViewImageAssistant.prototype.changedImage = function(event) {
// 	if (event.error) {
// 		sch.debug("Failed to load image!");
// 		Mojo.Log.info(event.error);
// 	} else {
// 		Mojo.Log.info("Loaded the image okay!", event.url);
// 	}
// 	
// };





function ViewImageAssistant(params) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	additional parameters (after the scene name) that were passed to pushScene. The reference
	to the scene controller (this.controller) has not be established yet, so any initialization
	that needs the scene controller should be done in the setup function below. */

	this.imageURLs    = params.imageURLs || [];

	this.window_title = params.title || $L("View image");

	if (sch.isString(this.imageURLs)) {
		this.imageURLs   = [this.imageURLs];
	}

	this.url          = this.imageURLs[0];


}

ViewImageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */

	/* setup widgets here */

	/* add event handlers to listen to events widgets */
	this.handleWindowResizeHandler = this.handleWindowResize.bindAsEventListener(this); //Handler function for handling the window resize event (when the orientation has changed
	this.controller.listen(this.controller.window, 'resize', this.handleWindowResizeHandler);
	this.imageViewer = this.controller.get('divImageViewer'); //Saves a reference to the dom element (the imageView widget)
	this.controller.setupWidget('divImageViewer',
		this.attributes = {
			noExtractFS: true
		},
		this.model = {
			onLeftFunction: function (){
				//Put code for grabbing images
			},
			onRightFunction: function (){

			}
		}
	); 
};

ViewImageAssistant.prototype.handleWindowResize = function (event){
	if (this.imageViewer && this.imageViewer.mojo) { // Makes sure there is an image viewer and that it is a setup widget
		this.imageViewer.mojo.manualSize(this.controller.window.innerWidth, this.controller.window.innerHeight); //Sets the new width and height of the imageViewer to the width and height of the full screen window
	}
};


ViewImageAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	example, key handlers that are observing the document */
	this.controller.enableFullScreenMode(true);
	this.controller.stageController.setWindowOrientation('free');
	this.imageViewer.mojo.centerUrlProvided(this.url); //A url, path to a local image, etc.
	this.imageViewer.mojo.manualSize(Mojo.Environment.DeviceInfo.screenWidth, Mojo.Environment.DeviceInfo.screenHeight); // Defaults to the full width and height
	
};

ViewImageAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	this scene is popped or another scene is pushed on top */
	this.controller.stageController.setWindowOrientation('up'); // Not sure if it's needed, but doesn't hurt
	
};

ViewImageAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	a result of being popped off the scene stack */
	this.controller.stopListening(this.controller.window, 'resize', this.handleWindowResizeHandler);
};