function MyTimelineAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}



MyTimelineAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.setupCommonMenus({
		viewMenuLabel:'My Timeline',
		switchMenuLabel:'View'
	});

	this.scroller = this.controller.getSceneScroller();

	
	
	
	
	/* setup widgets here */
	
	
	
	
	/* add event handlers to listen to events from widgets */

	/*
		jQuery is used to listen to events from SpazTwit library
	*/
	jQuery().bind('error_user_timeline_data', { thisAssistant:this }, function(e, response) {
		console.log('error_user_timeline_data - response:');
		console.dir(response);
		e.data.thisAssistant.spinnerOff();
	});
	
	jQuery().bind('new_friends_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		/*
			If there are new tweets, process them
		*/
		if (tweets && tweets.length>0) {
			
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
			
			/*
				prepend the rendered markup to the timeline, so it shows on top
			*/
			jQuery('#my-timeline').prepend(itemhtml);
			
			e.data.thisAssistant.scroller.palm.revealElement(
				jQuery('#my-timeline>div.timeline-entry.new:last').get()
			);				
			
		} else {
			Luna.log("no new tweets");
		}

		/*
			remove extra items
		*/
		sch.removeExtraElements('#my-timeline>div.timeline-entry', 150);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('div.timeline-entry>.status>.meta>.date', 'data-created_at');
		
		e.data.thisAssistant.spinnerOff();
	});

	
	
	/*
		if update succeeds
	*/
	jQuery().bind('update_succeeded', { thisAssistant:this }, function(e, data) {
		e.data.thisAssistant.renderSuccessfulPost(e, data);
		e.data.thisAssistant.spinnerOff();
	});
	
	/*
		if update fails
	*/
	jQuery().bind('update_failed', { thisAssistant:this }, function(e, data) {
		e.data.thisAssistant.spinnerOff();
	});

}



MyTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	
	/*
		Make request to Twitter
	*/
	this.getData();
	
	this.addPostPopup();
	
	$('my-timeline').observe(Luna.Event.tap, function(e) {
		
		console.dir(e.findElement('#my-timeline>div.timeline-entry>.user'));
		
		var el;
		if (el = e.findElement('#my-timeline>div.timeline-entry>.user')) {
			var userid = el.readAttribute('data-user-screen_name');
			Luna.Controller.stageController.pushScene('user-detail', userid);
		}
		
	});
	
}


MyTimelineAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.removePostPopup();
}

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


MyTimelineAssistant.prototype.getData = function() {
	this.spinnerOn();
	sc.helpers.markAllAsRead('#my-timeline>div.timeline-entry');
	sc.app.twit.getFriendsTimeline();
};

