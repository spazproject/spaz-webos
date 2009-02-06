function UserDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	console.dir(argFromPusher);
	
	scene_helpers.addCommonSceneMethods(this);	
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the user data
		*/
		this.userid  = argFromPusher;
		this.userRetrieved = false;
	} else {
		this.userobj = argFromPusher.userobj;
		this.userRetrieved = true;
	}
	
}

UserDetailAssistant.prototype.setup = function() {
	
	// alert('UserDetailAssistant.prototype.setup');
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('User Detail'), command:'scroll-top'}
				]
			}
		],
		cmdMenuItems: [
			{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
		]
	});

	this.scroller = this.controller.getSceneScroller();
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	
	
	/* add event handlers to listen to events from widgets */
	
	jQuery().bind('new_user_timeline_data', { thisAssistant:this }, function(e, tweets) {

		console.dir(e.data.thisAssistant);

		console.log('user\'s tweets:');
		console.dir(tweets);

		this.userobj = tweets[0].user;
		console.log('user\'s info:');
		console.dir(this.userobj);

		this.userRetrieved = true;		

		var itemhtml = Luna.View.render({object:this.userobj, template: 'user-detail/user-detail'});
		jQuery('#user-detail').html(itemhtml);
		
		

		/*
			reverse the tweets for collection rendering (faster)
		*/
		var rendertweets = tweets;
		rendertweets.reverse();

		jQuery.each( rendertweets, function() {
			console.dir(this)
			this.text = sch.autolink(this.text);
			this.text = sch.autolinkTwitter(this.text);
		});

		/*
			Render the new tweets as a collection (speed increase, I suspect)
		*/
		var itemhtml = Luna.View.render({collection: rendertweets, template: 'shared/tweet'});
		jQuery('#user-timeline').html(itemhtml);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#user-timeline>div.timeline-entry>.status>.meta>.date', 'data-created_at');
		// e.data.thisAssistant.spinnerOff();

		
	});
	
	
	
	


}


UserDetailAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// alert('UserDetailAssistant.prototype.activate');
	
	console.log('getScenes()');
	console.dir(Luna.Controller.stageController.getScenes());
	console.log('activeScene()');
	console.dir(Luna.Controller.stageController.activeScene());
	console.log('topScene()');
	console.dir(Luna.Controller.stageController.topScene());
	console.log('isChildWindow()');
	console.dir(Luna.Controller.stageController.isChildWindow());
	
	
	

	var thisA = this;

	jQuery('#user-detail-actions #view-user-posts').live(Luna.Event.tap, function(e) {
		console.log(jQuery(this).attr('id'));
		jQuery('#user-timeline').slideToggle('500');
	});
	jQuery('#user-detail-actions #search-user').live(Luna.Event.tap, function(e) {
		var screen_name = jQuery(this).attr('data-screen_name');
		console.log("searching for '"+screen_name+"'");
		
		thisA.searchFor('from:'+screen_name+' OR to:'+screen_name);
		
		// thisA.findAndSwap("search-twitter", {
		// 	'searchterm': 'from:'+screen_name+' OR to:'+screen_name
		// });
	});
	jQuery('#user-detail-actions #reply-to-user').live(Luna.Event.tap, function(e) {
		console.log(jQuery(this).attr('id'));
		thisA.prepReply(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #dm-user').live(Luna.Event.tap, function(e) {
		console.log(jQuery(this).attr('id'));
		thisA.prepDirectMessage(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #follow-user').live(Luna.Event.tap, function(e) {
		console.log(jQuery(this).attr('id'));
		Luna.Controller.notYetImplemented();
	});
	jQuery('#user-detail-actions #block-user').live(Luna.Event.tap, function(e) {
		console.log(jQuery(this).attr('id'));
		Luna.Controller.notYetImplemented();
	});

	if (!this.userRetrieved) {
		sc.app.twit.getUserTimeline(this.userid);
	}
	
	this.addPostPopup();

}





UserDetailAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	// alert('UserDetailAssistant.prototype.deactivate');
	
	this.removePostPopup();
	
	/*
		We have to unbind our event listeners or weird/bad things happen
	*/
	jQuery('#user-detail-actions #view-user-posts').die(Luna.Event.tap);
	jQuery('#user-detail-actions #search-user').die(Luna.Event.tap);
	jQuery('#user-detail-actions #reply-to-user').die(Luna.Event.tap);
	jQuery('#user-detail-actions #dm-user').die(Luna.Event.tap);
	jQuery('#user-detail-actions #follow-user').die(Luna.Event.tap);
	jQuery('#user-detail-actions #block-user').die(Luna.Event.tap);
}

UserDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	

}
