function UserDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
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
	var thisA = this;
	
	this.initAppMenu();
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('User Detail'), command:'scroll-top'}
				]
			},
			{
				items: [
					{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
				]
			}
			
		],
	});

	this.scroller = this.controller.getSceneScroller();
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	
	
	/* add event handlers to listen to events from widgets */
	
	jQuery().bind('new_user_timeline_data', { thisAssistant:this }, function(e, tweets) {

		// this.userobj = tweets[0].user;
		// this.userRetrieved = true;	

		// var itemhtml = Mojo.View.render({object:this.userobj, template: 'user-detail/user-detail'});
		// jQuery('#user-detail').html(itemhtml);

		var rendertweets = tweets;
		// they come in oldest-first, so reverse it since we're rendering as a collection
		rendertweets = rendertweets.reverse(); 

		jQuery.each( rendertweets, function() {
			this.text = makeItemsClickable(this.text);
		});

		/*
			Render the new tweets as a collection (speed increase, I suspect)
		*/
		var itemhtml = Mojo.View.render({collection: rendertweets, template: 'shared/tweet'});
		jQuery('#user-timeline').html(itemhtml);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#user-timeline>div.timeline-entry>.status>.meta>.date', 'data-created_at');
		
	});
	
	
	jQuery().bind('get_user_succeeded', function(e, userobj) {
		this.userRetrieved = true;
		
		this.userobj = userobj;
		
		var itemhtml = Mojo.View.render({object:this.userobj, template: 'user-detail/user-detail'});
		jQuery('#user-detail').html(itemhtml);		
	});
	
	
	jQuery().bind('get_user_failed', function(e, message) {
		
	});
	


}


UserDetailAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	var thisA = this; // for closures

	jQuery('#user-detail-actions #view-user-posts', this.scroller).live(Mojo.Event.tap, function(e) {
		dump(jQuery(this).attr('id'));
		jQuery('#user-timeline').slideToggle('500');
	});
	jQuery('#user-detail-actions #search-user', this.scroller).live(Mojo.Event.tap, function(e) {
		var screen_name = jQuery(this).attr('data-screen_name');
		dump("searching for '"+screen_name+"'");
		thisA.searchFor('from:'+screen_name+' OR to:'+screen_name);
	});
	jQuery('#user-detail-actions #reply-to-user', this.scroller).live(Mojo.Event.tap, function(e) {
		dump(jQuery(this).attr('id'));
		thisA.prepReply(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #dm-user', this.scroller).live(Mojo.Event.tap, function(e) {
		dump(jQuery(this).attr('id'));
		thisA.prepDirectMessage(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #follow-user', this.scroller).live(Mojo.Event.tap, function(e) {
		dump(jQuery(this).attr('id'));
		Mojo.Controller.notYetImplemented();
	});
	jQuery('#user-detail-actions #block-user', this.scroller).live(Mojo.Event.tap, function(e) {
		dump(jQuery(this).attr('id'));
		Mojo.Controller.notYetImplemented();
	});


	jQuery('.username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});

	jQuery('.hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-status-id');
		Mojo.Controller.stageController.pushScene('message-detail', statusid);
	});

	if (!this.userRetrieved) {
		
		sc.app.twit.getUser(this.userid);
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
	jQuery('#user-detail-actions #view-user-posts', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #search-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #reply-to-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #dm-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #follow-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #block-user', this.scroller).die(Mojo.Event.tap);
	
	jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
}

UserDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	

}
