function AboutAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
};

AboutAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

AboutAssistant.prototype.setup = function() {
	this.scroller = this.controller.getSceneScroller();

	this.initAppMenu({ 'items':[
		Mojo.Menu.editItem,
		{ label: $L('New Search Card'),	command: 'new-search-card' },
		{ label: $L('Accounts...'), command:'accounts' },
		{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
		{ label: $L('Help...'),			command:Mojo.Menu.helpCmd },
		{ label: $L('Donate...'),		command:'donate' }
	]});

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("About Spaz"), command:'scroll-top', 'class':"palm-header left", width:320}				
				]
			}

		]
	});
	jQuery('#about-version').text("v"+Mojo.appInfo.version);
};

AboutAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


AboutAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

AboutAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
