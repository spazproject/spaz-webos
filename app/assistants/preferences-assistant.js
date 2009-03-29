function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
}

PreferencesAssistant.prototype.setup = function() {
	
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('Preferences'), command:'scroll-top'}
				]
			}
		],
		cmdMenuItems: [{ items:
			[]
		}]
	});


	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.controller.setupWidget("refreshRateList",
		this.accountsAtts = {
			itemTemplate: 'preferences/user-list-entry',
			listTemplate: 'preferences/user-list-container',
			dividerTemplate:'preferences/user-list-separator',
			swipeToDelete: false,
			autoconfirmDelete: false,
			reorderable: false
		},
		this.accountsModel = {
			listTitle: $L('Refresh Rates'),
			items : [
				
			]
		}
	);	
	
	/* add event handlers to listen to events from widgets */
	Mojo.Event.listen($('refreshRateList'), Mojo.Event.listTap, function(e) {
		
		Mojo.Controller.stageController.pushScene('my-timeline');
	});
	
}

PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
