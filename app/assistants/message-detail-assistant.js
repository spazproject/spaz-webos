function MessageDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	console.dir(argFromPusher);
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the user data
		*/
		this.status_id  = argFromPusher;
	} else {
		this.statusobj = argFromPusher.statusobj;
	}
}

MessageDetailAssistant.prototype.setup = function() {


	// alert('MessageDetailAssistant.prototype.setup');
	
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('Message Detail'), command:'scroll-top'}
				]
			}
		],
		cmdMenuItems: [
			{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
		]
	});
	
	this.scroller = this.controller.getSceneScroller();
	
	
	jQuery().bind('get_one_status_succeeded', { thisAssistant:this }, this.processStatusReturn);
	

	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
}

MessageDetailAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// alert('MessageDetailAssistant.prototype.activate');
	
	console.log('getScenes()');
	console.dir(Luna.Controller.stageController.getScenes());
	console.log('activeScene()');
	console.dir(Luna.Controller.stageController.activeScene());
	console.log('topScene()');
	console.dir(Luna.Controller.stageController.topScene());
	console.log('isChildWindow()');
	console.dir(Luna.Controller.stageController.isChildWindow());
	


	
	sc.app.twit.getOne(this.status_id);
	

	
	var thisA = this;

	jQuery('#message-detail-actions #message-detail-action-reply').live(Luna.Event.tap, function(e) {
		Luna.Controller.notYetImplemented();
		// thisA.prepReply(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#message-detail-actions #message-detail-action-retweet').live(Luna.Event.tap, function(e) {
		Luna.Controller.notYetImplemented();
	});
	jQuery('#message-detail-actions #message-detail-action-dm').live(Luna.Event.tap, function(e) {
		thisA.prepDirectMessage(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#message-detail-actions #message-detail-action-favorite').live(Luna.Event.tap, function(e) {
		Luna.Controller.notYetImplemented();
	});
	
	this.addPostPopup();
}


MessageDetailAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	// alert('MessageDetailAssistant.prototype.deactivate');
	
	this.removePostPopup();
	
	// jQuery().unbind('get_one_status_succeeded', this.processStatusReturn);
	
	jQuery('#message-detail-actions #message-detail-action-reply').die(Luna.Event.tap);
	jQuery('#message-detail-actions #message-detail-action-retweet').die(Luna.Event.tap);
	jQuery('#message-detail-actions #message-detail-action-dm').die(Luna.Event.tap);
	jQuery('#message-detail-actions #message-detail-action-favorite').die(Luna.Event.tap);
}

MessageDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


MessageDetailAssistant.prototype.processStatusReturn = function(e, statusobj) {

	console.dir(e.data.thisAssistant);

	this.statusobj = statusobj;
	this.statusRetrieved = false;

	console.log('message data:');
	console.dir(this.statusobj);
	
	this.statusobj.text = sch.autolink(this.statusobj.text);
	this.statusobj.text = sch.autolinkTwitter(this.statusobj.text, '<span class="username clickable" data-user-screen_name="#username#">@#username#</span>');
	
	var itemhtml = Luna.View.render({object:this.statusobj, template: 'message-detail/message-detail'});
	jQuery('#message-detail').html(itemhtml);
	
	sch.updateRelativeTimes('#message-detail .status>.meta>.date', 'data-created_at');
	
};