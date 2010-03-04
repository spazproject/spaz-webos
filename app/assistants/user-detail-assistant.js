function UserDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);	
	
	sch.debug('argFromPusher:' + sch.enJSON(argFromPusher));
	
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
	
	this.initTwit();

	if (sc.app.username && sc.app.password) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("User Details"), command:'scroll-top', 'class':"palm-header left", width:320}				
					]
				}

			],
			cmdMenuItems:[
				{
					items: [
						{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
						{}
					]
				}

			]
		});
		this.initAppMenu({ 'items':loggedin_appmenu_items });
			
	} else {
		this.setupCommonMenus({});	
		
		this.initAppMenu();
	};
	

	this.scroller = this.controller.getSceneScroller();
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	jQuery().bind('new_user_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		var rendertweets = tweets;
		// they come in oldest-first, so reverse it since we're rendering as a collection
		rendertweets = rendertweets.reverse();

		jQuery.each( rendertweets, function() {
			this.text = Spaz.makeItemsClickable(this.text);
			
			/*
				save this tweet to Depot
			*/
			sc.app.Tweets.save(this);
			
		});

		/*
			Render the new tweets as a collection (speed increase, I suspect)
		*/
		
		var itemhtml = sc.app.tpl.parseArray('tweet', rendertweets);

		jQuery('#user-timeline').html(itemhtml);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#user-timeline>div.timeline-entry .meta>.date', 'data-created_at');

	});
	
	
	jQuery().bind('get_user_succeeded', function(e, userobj) {
		thisA.userRetrieved = true;
		thisA.userobj = userobj;
		
		sch.debug(thisA.userobj);
		
		thisA.userobj.description = Spaz.makeItemsClickable(thisA.userobj.description);
		
		var itemhtml = sc.app.tpl.parseTemplate('user-detail', thisA.userobj);
		jQuery('#user-detail').html(itemhtml);
		sch.debug(jQuery('#user-detail').get(0).outerHTML);
		
		thisA.twit.getUserTimeline(thisA.userobj.id);
	});
	
	
	
	jQuery().bind('get_user_failed', function(e, error_obj) {
		// error_obj.url
		// error_obj.xhr
		// error_obj.msg
		var err_msg = $L('There was an error retrieving this user');
		thisA.displayErrorInfo(err_msg, error_obj);
		
	});
	


	jQuery().bind('create_friendship_succeeded',  { thisAssistant:this }, function(e, userobj) {
		jQuery('#follow-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-following', 'true')
			.html($L('Stop following user'));
	});
	jQuery().bind('destroy_friendship_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#follow-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-following', 'false')
			.html($L('Follow user'));		
	});

	jQuery().bind('create_block_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#block-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-blocked', 'true')
			.html($L('Unblock user'));
	});
	jQuery().bind('destroy_block_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#block-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-blocked', 'false')
			.html($L('Block user'));
	});
	

};


UserDetailAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	var thisA = this; // for closures

	jQuery('#user-timeline-trigger', this.scroller).live(Mojo.Event.tap, function(e) {
		sch.debug(jQuery(this).attr('id'));
		var jq_usertl = jQuery('#user-timeline');
		if (jq_usertl.is(':visible')) {
			jq_usertl.slideUp('500');
			jQuery(this).find('.arrow_button').addClass('palm-arrow-closed').removeClass('palm-arrow-expanded');
		} else {
			jq_usertl.slideDown('500');
			jQuery(this).find('.arrow_button').removeClass('palm-arrow-closed').addClass('palm-arrow-expanded');
		}
		
		
	});
	jQuery('#user-detail-actions #search-user', this.scroller).live(Mojo.Event.tap, function(e) {
		var screen_name = jQuery(this).attr('data-screen_name');
		sch.debug("searching for '"+screen_name+"'");
		thisA.searchFor('from:'+screen_name+' OR to:'+screen_name);
	});
	jQuery('#user-detail-actions #reply-to-user', this.scroller).live(Mojo.Event.tap, function(e) {
		sch.debug(jQuery(this).attr('id'));
		thisA.prepReply(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #dm-user', this.scroller).live(Mojo.Event.tap, function(e) {
		sch.debug(jQuery(this).attr('id'));
		thisA.prepDirectMessage(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#user-detail-actions #follow-user', this.scroller).live(Mojo.Event.tap, function(e) {
		sch.debug("Friend user:"+jQuery(this).attr('data-screen_name'));
		// Mojo.Controller.notYetImplemented();
		
		var user_id = jQuery(this).attr('data-screen_name');
		if (jQuery(this).attr('data-following') === 'true') {
			sch.debug('UN-FOLLOWING');
			thisA.twit.removeFriend(user_id);
		} else {
			sch.debug('FOLLOWING');
			thisA.twit.addFriend(user_id);
		}
		
	});
	jQuery('#user-detail-actions #block-user', this.scroller).live(Mojo.Event.tap, function(e) {
		sch.debug("Block user:"+jQuery(this).attr('data-screen_name'));
		// Mojo.Controller.notYetImplemented();
		
		
		/*
			Note that on first load of user detail, state will alwasy be 'false'
			because we don't get blocked state via the API
		*/
		var user_id = jQuery(this).attr('data-screen_name');
		if (jQuery(this).attr('data-blocked') === 'true') {
			sch.debug('UNBLOCKING:'+user_id);
			thisA.twit.unblock(user_id);
		} else {
			sch.debug('BLOCKING:'+user_id);
			thisA.twit.block(user_id);
		}

		// sch.debug('BLOCKING:'+user_id);
		// thisA.twit.block(user_id);
		
	});


	jQuery('#user-detail-container div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var jqtarget = jQuery(e.target);

		e.stopImmediatePropagation();
		
		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			var userid = jQuery(this).attr('data-user-id');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
			return;
			
		} else if (jqtarget.is('.username.clickable')) {
			var userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;
			
		} else if (jqtarget.is('.hashtag.clickable')) {
			var hashtag = jqtarget.attr('data-hashtag');
			thisA.searchFor('#'+hashtag);
			return;
			
		} else if (jqtarget.is('div.timeline-entry .meta')) {
			var status_id = jqtarget.attr('data-status-id');
			var isdm = false;
			var status_obj = null;

			if (jqtarget.parent().parent().hasClass('dm')) {
				isdm = true;
			}

			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
			
		} else if (jqtarget.is('div.timeline-entry a[href]')) {
			return;

		} else {
			var status_id = jQuery(this).attr('data-status-id');
			var isdm = false;
			var status_obj = null;

			if (jQuery(this).hasClass('dm')) {
				isdm = true;
			}
			
			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
		}
	});


	// jQuery('#user-detail-container .username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var userid = jQuery(this).attr('data-user-screen_name');
	// 	Mojo.Controller.stageController.pushScene('user-detail', userid);
	// });
	// 
	// jQuery('#user-detail-container .hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var hashtag = jQuery(this).attr('data-hashtag');
	// 	thisA.searchFor('#'+hashtag);
	// });
	// 
	// jQuery('#user-detail-container div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var statusid = jQuery(this).attr('data-status-id');
	// 	Mojo.Controller.stageController.pushScene('message-detail', statusid);
	// });
	// 
	// jQuery('#user-detail-container div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var statusid = jQuery(this).attr('data-status-id');
	// 	Mojo.Controller.stageController.pushScene('message-detail', statusid);
	// });

	if (!this.userRetrieved) {
		sc.app.Tweets.getUser(
			this.userid,
			function(r) {
				jQuery(document).trigger('get_user_succeeded', [r]);
			},
			function(r) {
				jQuery(document).trigger('get_user_failed', [r]);
			}
		);
		// this.twit.getUser(this.userid);
	}
	
	// this.addPostPopup();

};





UserDetailAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	// alert('UserDetailAssistant.prototype.deactivate');
	
	
	// this.removePostPopup();
	
	/*
		We have to unbind our event listeners or weird/bad things happen
	*/
	jQuery('#user-detail-actions #view-user-posts', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #search-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #reply-to-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #dm-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #follow-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #block-user', this.scroller).die(Mojo.Event.tap);
	
	// jQuery('#user-detail-container .username.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('#user-detail-container .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('#user-detail-container div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-timeline-trigger', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-container div.timeline-entry', this.scroller).die(Mojo.Event.tap);
};

UserDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	jQuery().unbind('new_user_timeline_data');
	jQuery().unbind('get_user_succeeded');
	jQuery().unbind('get_user_failed');
	jQuery().unbind('create_friendship_succeeded');
	jQuery().unbind('destroy_friendship_succeeded');
	jQuery().unbind('create_block_succeeded');
	jQuery().unbind('destroy_block_succeeded');
	
};
