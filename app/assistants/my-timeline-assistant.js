function MyTimelineAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}



MyTimelineAssistant.prototype.setup = function() {
	
	// alert('MyTimelineAssistant.prototype.setup');
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('My Timeline'), command:'scroll-top'},
					{label: $L('Filter timeline'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
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
				{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T', disabled:true},
				{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'},
				{label:$L('Followers'),   command:'followers', shortcut:'L'},
				{}
			]
		}]
	});

	this.scroller = this.controller.getSceneScroller();


	
	
	
	/* setup widgets here */
	
	
	
	
	/* add event handlers to listen to events from widgets */


}



MyTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// alert('MyTimelineAssistant.prototype.activate');
	
	console.log('getScenes()');
	console.dir(Luna.Controller.stageController.getScenes());
	console.log('activeScene()');
	console.dir(Luna.Controller.stageController.activeScene());
	console.log('topScene()');
	console.dir(Luna.Controller.stageController.topScene());
	console.log('isChildWindow()');
	console.dir(Luna.Controller.stageController.isChildWindow());
	
	
	
	this.addPostPopup();

	
	var thisA = this; // for closures
	
	/*
		jQuery is used to listen to events from SpazTwit library
	*/
	jQuery().bind('error_user_timeline_data', { thisAssistant:this }, function(e, response) {
		console.log('error_user_timeline_data - response:');
		console.dir(response);
		e.data.thisAssistant.spinnerOff();
	});
	
	// jQuery().bind('new_friends_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
	/*
		Get combined timeline data
	*/
	jQuery().bind('new_combined_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		/*
			If there are new tweets, process them
		*/
		if (tweets && tweets.length>0) {

			var rendertweets = tweets;
			
			jQuery.each( rendertweets, function() {
				// console.dir(this)
				this.text = makeItemsClickable(this.text);
				
				/*
					Render the tweet
				*/
				if (this.SC_is_dm) {
					var itemhtml = Luna.View.render({object: this, template: 'shared/dm'});
				} else {
					var itemhtml = Luna.View.render({object: this, template: 'shared/tweet'});
				}
				
				/*
					make jQuery obj
				*/
				var jqitem = jQuery(itemhtml);
				
				/*
					attach data object to item html
				*/
				jqitem.data('item', this);
				
				if (this.SC_is_reply) {
					jqitem.addClass('reply');
				}
				
				if (this.SC_is_dm) {
					jqitem.addClass('dm');
				}
				
				dump(jqitem.attr('class'))
				
				// dump(this.user.screen_name +" is from "+ this.SC_timeline_from);
				
				/*
					put item on timeline
				*/
				jQuery('#my-timeline').prepend(jqitem);
			});
			
			
			e.data.thisAssistant.scrollToNew();
			
		} else {
			Luna.log("no new tweets");
		}

		/*
			remove extra items
		*/
		sch.removeExtraElements('#my-timeline>div.timeline-entry', 300);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('div.timeline-entry>.status>.meta>.date', 'data-created_at');
		
		/*
			re-apply filtering
		*/
		e.data.thisAssistant.filterTimeline();
		
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
	
	
	/*
		listen for clicks on user avatars
		Note that these will hear clicks across all active scenes, not just
		this one.
	*/
	jQuery('div.timeline-entry>.user', this.scroller).live(Luna.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Luna.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('.username.clickable', this.scroller).live(Luna.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Luna.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('.hashtag.clickable', this.scroller).live(Luna.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('div.timeline-entry>.status>.meta', this.scroller).live(Luna.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-status-id');
		Luna.Controller.stageController.pushScene('message-detail', statusid);
	});
	
	
	/*
		the "hold" event might be a little too short, and interfere with normal clicks, so not using
	*/
	// jQuery('#my-timeline>div.timeline-entry').live(Luna.Event.hold, function(e) {
	// 	var statusid = jQuery(this).attr('data-status-id');
	// 	Luna.Controller.stageController.pushScene('message-detail', statusid);
	// });


	
	/*
		Make request to Twitter
	*/
	this.getData();
	

	

	
}


MyTimelineAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	// alert('MyTimelineAssistant.prototype.deactivate');
	
	this.removePostPopup();
	
	jQuery().unbind('error_user_timeline_data');
	jQuery().unbind('new_combined_timeline_data');
	jQuery().unbind('update_succeeded');
	jQuery().unbind('update_failed');
	
	jQuery('div.timeline-entry>.user', this.scroller).die(Luna.Event.tap);
	jQuery('.username.clickable', this.scroller).die(Luna.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Luna.Event.tap);
	jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Luna.Event.tap);
}

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


MyTimelineAssistant.prototype.getData = function() {
	this.spinnerOn();
	sc.helpers.markAllAsRead('#my-timeline>div.timeline-entry');
	
	// /*
	// 	this is just to avoid network requests
	// */
	// jQuery.getJSON('user_timeline.json', function(data, textStatus) {
	// 	jQuery().trigger('new_friends_timeline_data', [data]);
	// });
	
	sc.app.twit.getCombinedTimeline();
};

MyTimelineAssistant.prototype.refresh = function() {
	this.getData();
};