function UserDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);	
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	Mojo.Log.error('argFromPusher: %j', argFromPusher);
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the user data
		*/
		this.userid  = argFromPusher;
		this.userRetrieved = false;
	
	} else if (argFromPusher.userid) {
		
		this.userid = argFromPusher.userid;
		this.userRetrieved = false;		
	
	} else if (argFromPusher.userobj) {
		this.userobj = argFromPusher.userobj;
		this.userRetrieved = true;
	}
	
	if (argFromPusher.account_type) {
		this.user_type = argFromPusher.account_type;
	}
	
	if (argFromPusher.account_api_url) {
		this.user_api_url = argFromPusher.account_api_url;
	}
	
	if (argFromPusher.auth_obj) {
		this.auth_obj = argFromPusher.auth_obj;
	}
	
}

UserDetailAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

UserDetailAssistant.prototype.setup = function() {
	var thisA = this;
	
	this.initTwit();

	if (App.username) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("User Details"), command:'scroll-top', 'class':"palm-header left", width:260},
						{label: $L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}
					]
				}

			],
			cmdMenuItems:[
				{},
				{
					items: [
						{label:$L('Search for User'),  icon:'search-person', command:'search-for-user', shortcut:'R'},
						{label:$L('Mention'),  icon:'at', command:'mention', shortcut:'M'},
						{label:$L('DM'),  icon:'dms', command:'dm', shortcut:'D'},
						{label:$L('Follow/Unfollow'), disabled:true, icon:'start-following', command:'follow', shortcut:'F'},
						{label:$L('Block'), icon:'more', command:'more', shortcut:'B'}
					]
				},
				{}
			]
		});
		this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
		
		this.setCommand('search-for-user', function(e) {
			if (this.userRetrieved === true) {
				thisA.searchFor('from:'+thisA.userobj.screen_name+' OR to:'+thisA.userobj.screen_name);
			}
		});
		this.setCommand('mention', function(e) {
			if (this.userRetrieved === true) {
				this.prepReply(this.userobj.screen_name);
			}
		});
		this.setCommand('dm', function(e) {
			if (this.userRetrieved === true) {
				this.prepDirectMessage('@'+this.userobj.screen_name);
			}
		});
		this.setCommand('follow', function(e) {
			if (this.userRetrieved === true && this.userobj.you_are_following) {
				if (this.userobj.you_are_following === 'yes') {
					this.twit.removeFriend(
						this.userobj.id,
						function(data){
							thisA.userobj.you_are_following = 'no';
							thisA.setFollowButtonIcon(thisA.userobj.you_are_following);
							
							thisA.showBanner($L('Removed friend #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
						},
						function(xhr, msg, exc){
							thisA.showBanner($L('Failed to remove friend #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
						}	
					);
				} else if (this.userobj.you_are_following === 'no') {
					this.twit.addFriend(
						this.userobj.id,
						function(data){
							thisA.userobj.you_are_following = 'yes';
							thisA.setFollowButtonIcon(thisA.userobj.you_are_following);
							thisA.showBanner($L('Added friend #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
						},
						function(xhr, msg, exc){
							thisA.showBanner($L('Failed to add friend #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
						}		
					);
				}
			}
		});
		this.setCommand('block', function(e) {
			Mojo.Log.error('block');
		});
		this.setCommand('block-and-report', function(e) {
			Mojo.Log.error('block and report');
		});
		this.setCommand('more', function(e) {
			var near = e.originalEvent && e.originalEvent.target;
			this.controller.popupSubmenu({
				onChoose: function(command) {
					Mojo.Log.error('COMMAND: %s', command);
					if (thisA.userRetrieved === true) {
						switch(command) {
							
							case 'block':
								thisA.twit.block(
									thisA.userobj.id,
									function(data){
										thisA.showBanner($L('Blocked #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
										Mojo.Controller.getAppController().sendToNotificationChain({"event":"blocked_user", "blocked_userid":thisA.userobj.id});
									},
									function(xhr, msg, exc){
										thisA.showBanner($L('Failed to block #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
									}
								);
								break;
								
							case 'block-and-report':
								thisA.twit.reportSpam(
									thisA.userobj.id,
									function(data){
										thisA.showBanner($L('Blocked & reported #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
										Mojo.Controller.getAppController().sendToNotificationChain({"event":"blocked_user", "blocked_userid":thisA.userobj.id});
									},
									function(xhr, msg, exc){
										thisA.showBanner($L('Failed to block & report #{screen_name}').interpolate({'screen_name':thisA.userobj.screen_name}));
									}
								);
								break;
							
						}
					}
				},
				placeNear: near,
				items: [
					{ label: $L("Block"), command: "block" },
					{ label: $L("Block & Report Spammer"), command: "block-and-report" }
				]
			});
		});
		
			
	} else {
		this.setupCommonMenus({});	
		
		this.initAppMenu();
	};
	
	

	this.scroller = this.controller.getSceneScroller();
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	jQuery(document).bind('new_user_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		var rendertweets = tweets;
		
		if (rendertweets) {
			// they come in oldest-first, so reverse it since we're rendering as a collection
			rendertweets = rendertweets.reverse();

			jQuery.each( rendertweets, function() {
				this.text = Spaz.makeItemsClickable(this.text);

				/*
					save this tweet to Depot
				*/
				App.Tweets.save(this);

			});

			/*
				Render the new tweets as a collection (speed increase, I suspect)
			*/

			var itemhtml = App.tpl.parseArray('tweet', rendertweets);

			jQuery('#user-timeline').html(itemhtml);

			/*
				Update relative dates
			*/
			sch.updateRelativeTimes('#user-timeline>div.timeline-entry .meta>.date', 'data-created_at');
		}

	});
	
	
	jQuery(document).bind('get_user_succeeded', function(e, userobj) {
		thisA.userRetrieved = true;
		thisA.userobj = userobj;
		
		sch.debug(thisA.userobj);
		
		thisA.userobj.description = Spaz.makeItemsClickable(thisA.userobj.description);
		
		var itemhtml = App.tpl.parseTemplate('user-detail', thisA.userobj);
		jQuery('#user-detail').html(itemhtml);
		sch.debug(jQuery('#user-detail').get(0).outerHTML);
		
		thisA.getUserTimeline(thisA.userobj);

		/*
			get the relationship state
		*/
		if (App.username && App.type) {
			
			/*
				disable until we can get friendship info
			*/
			thisA.enableFollowButton(false);
			
			if ( thisA.user_type && (App.type !== thisA.user_type) ) {
				
				// can't get following info because the services aren't the same
								
			} else if (App.type === SPAZCORE_ACCOUNT_TWITTER) {
				thisA.twit.showFriendship(
					thisA.userobj.id,
					null,
					function(data) {
						
						thisA.enableFollowButton(true);
						
						Mojo.Log.error('show friendship result: %j', data);
						if (data.relationship.target.followed_by) {
							Mojo.Log.error('You are following this user!');
							thisA.userobj.you_are_following = 'yes';
						} else {
							Mojo.Log.error('You are NOT following this user!');
							thisA.userobj.you_are_following = 'no';
						}
						thisA.setFollowButtonIcon(thisA.userobj.you_are_following);
					},
					function(xhr, msg, exc) {
						thisA.showAlert($L('Could not retrieve relationship info:\n'+sch.stripTags(xhr.responseText)), $L('Error'));
					}
				);
				
			} else if (thisA.userobj.following !== null) { // the .following attribute exists and this is not twitter
			
				thisA.enableFollowButton(true);
				if (thisA.userobj.following === true) {  // i am following this user
					thisA.userobj.you_are_following = 'yes';
				} else {  // i am NOT following this user
					thisA.userobj.you_are_following = 'no';
				}
				thisA.setFollowButtonIcon(thisA.userobj.you_are_following);
				
			}
			
		}
		
	});
	
	
	
	jQuery(document).bind('get_user_failed', function(e, error_obj) {
		// error_obj.url
		// error_obj.xhr
		// error_obj.msg
		var err_msg = $L('There was an error retrieving this user');
		thisA.displayErrorInfo(err_msg, error_obj);
		
	});
	


	jQuery(document).bind('create_friendship_succeeded',  { thisAssistant:this }, function(e, userobj) {
		jQuery('#follow-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-following', 'true')
			.html($L('Stop Following'));
	});
	jQuery(document).bind('destroy_friendship_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#follow-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-following', 'false')
			.html($L('Follow'));		
	});

	jQuery(document).bind('create_block_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#block-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-blocked', 'true')
			.html($L('Unblock'));
	});
	jQuery(document).bind('destroy_block_succeeded', { thisAssistant:this }, function(e, userobj) {
		jQuery('#block-user[data-screen_name="'+userobj.screen_name+'"]')
			.attr('data-blocked', 'false')
			.html($L('Block'));
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
		var jqtarget = jQuery(e.target),
		    userid,
		    isdm,
		    status_id,
		    status_obj;

		e.stopImmediatePropagation();
		
		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			userid = jQuery(this).attr('data-user-id');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
			return;
			
		} else if (jqtarget.is('.username.clickable')) {
			userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;
			
		} else if (jqtarget.is('.hashtag.clickable')) {
			var hashtag = jqtarget.attr('data-hashtag');
			thisA.searchFor('#'+hashtag);
			return;
			
		} else if (jqtarget.is('div.timeline-entry .meta')) {
			status_id = jqtarget.attr('data-status-id');
			isdm = false;
			status_obj = null;

			if (jqtarget.parent().parent().hasClass('dm')) {
				isdm = true;
			}

			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
			
		} else if (jqtarget.is('div.timeline-entry a[href]')) {
			return;

		} else {
			status_id = jQuery(this).attr('data-status-id');
			isdm = false;
			status_obj = null;

			if (jQuery(this).hasClass('dm')) {
				isdm = true;
			}
			
			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
		}
	});

	jQuery('#user-detail div.user-image', this.scroller).live(Mojo.Event.tap, function(e) {
		var avatar_url = thisA.userobj.profile_image_url.replace('_normal', '');
		Mojo.Controller.stageController.pushScene('view-image', {'imageURLs':[avatar_url]});
	});

	jQuery('#user-detail .username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
	});

	jQuery('#user-detail .hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});
	
	
	/*
		kick off the "get the user obj" process, if we need to
	*/
	if (!this.userRetrieved) {
		
		/*
			if we've passed some info on how to get the user info, get it remotely
			and pass the extra data
		*/
		if (this.user_type || this.user_api_url || this.auth_obj) {		
			App.Tweets.getRemoteUser(
				this.userid,
				function(r) {
					jQuery(document).trigger('get_user_succeeded', [r]);
				},
				function(r) {
					jQuery(document).trigger('get_user_failed', [r]);
				},
				{
					'auth_obj':this.auth_obj,
					'user_type':this.user_type,
					'user_api_url':this.user_api_url
				}
			);
			
		/*
			otherwise, just get it the "normal" way
		*/
		} else {
			App.Tweets.getUser(
				this.userid,
				function(r) {
					jQuery(document).trigger('get_user_succeeded', [r]);
				},
				function(r) {
					jQuery(document).trigger('get_user_failed', [r]);
				}
			);
		
		}
	
	/*
		just trigger the get_user_succeeded event with the object we already have
	*/
	} else {
	    jQuery(document).trigger('get_user_succeeded', [this.userobj]);
	}

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
	jQuery('#user-detail-actions #follow-user', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-actions #block-user', this.scroller).die(Mojo.Event.tap);
	
	// jQuery('#user-detail-container .username.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('#user-detail-container .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('#user-detail-container div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-timeline-trigger', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail-container div.timeline-entry', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail div.user-image', this.scroller).die(Mojo.Event.tap);
	
	jQuery('#user-detail .username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#user-detail .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	
};

UserDetailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	jQuery(document).unbind('new_user_timeline_data');
	jQuery(document).unbind('get_user_succeeded');
	jQuery(document).unbind('get_user_failed');
	jQuery(document).unbind('create_friendship_succeeded');
	jQuery(document).unbind('destroy_friendship_succeeded');
	jQuery(document).unbind('create_block_succeeded');
	jQuery(document).unbind('destroy_block_succeeded');
	
};

/**
 * Sets the icon for the follow button
 * 
 * @param {string} current_state 'yes' or 'no'
 */
UserDetailAssistant.prototype.setFollowButtonIcon = function(current_state) {
	Mojo.Log.error('this.cmdMenuModel.items[1].items[3]: %j', this.cmdMenuModel.items[1].items[3]);
	if (current_state == 'yes') {
		this.cmdMenuModel.items[1].items[3].icon = 'stop-following';
	} else {
		this.cmdMenuModel.items[1].items[3].icon = 'start-following';
	}
	this.controller.modelChanged(this.cmdMenuModel);
};


UserDetailAssistant.prototype.enableFollowButton = function(enabled) {
	
	if (enabled) {
		this.cmdMenuModel.items[1].items[3].disabled = false;
		this.controller.modelChanged(this.cmdMenuModel);
	} else {
		this.cmdMenuModel.items[1].items[3].disabled = true;
		this.controller.modelChanged(this.cmdMenuModel);
	}
	
};


UserDetailAssistant.prototype.getUserTimeline = function(userobj) {
	var thisA = this;
	
	if (!userobj) {
		userobj = this.userobj;
	}
	
	if ( this.user_type && (App.type !== this.user_type) ) {
		Mojo.Log.error('Can\'t getUserTimeline because user type is not current App.type');
		jQuery('#user-timeline-trigger').hide();
		return;
	}
	
	/*
		get the user timeline
	*/
	this.twit.getUserTimeline(userobj.id);
};
