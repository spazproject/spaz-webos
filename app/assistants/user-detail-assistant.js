function UserDetailAssistant(argFromPusher) {
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
		this.userid  = argFromPusher;
		this.userRetrieved = false;
	} else {
		this.userobj = argFromPusher.userobj;
		this.userRetrieved = true;
	}
	
}

UserDetailAssistant.prototype.setup = function() {
	
	this.setupCommonMenus({
		viewMenuLabel:'User Detail',
		switchMenuLabel:'View'
	});

	this.scroller = this.controller.getSceneScroller();
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	
	
	/* add event handlers to listen to events from widgets */
}


UserDetailAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	// if (this.userRetrieved) { // we have the user object already!
	// 	this._processTimeline(SPAZCORE_SECTION_REPLIES, ret_items, finished_event);
	// }
	
	jQuery().bind('new_user_timeline_data', { thisAssistant:this }, function(e, tweets) {
		console.log('user\'s tweets:');
		console.dir(tweets);
		
		this.userobj = tweets[0].user;
		console.log('user\'s info:');
		console.dir(this.userobj);
		
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
		e.data.thisAssistant.spinnerOff();
	});
	
	this.spinnerOn();
	sc.app.twit.getUserTimeline(this.userid);
}





UserDetailAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

UserDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
