function ManageFollowersAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);

}

ManageFollowersAssistant.prototype.setup = function() {
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Search Twitter'), command:'scroll-top'},
					// {label: $L('Show me'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
				]
			},
			{
				items: [
					{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
					{label:$L('Update'),   icon:'sync', command:'refresh', shortcut:'R'}					
				]
			}
		],
		cmdMenuItems: [{ items:
			[
				{},
				{label:$L('Home'),        command:'home', shortcut:'H'},
				{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
				{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'},
				{label:$L('Followers'),   command:'followers', shortcut:'L', disabled:true},
				{}
			]
		}]
	});

	this.scroller = this.controller.getSceneScroller();
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
}

ManageFollowersAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


ManageFollowersAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

ManageFollowersAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
