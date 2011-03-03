function MessageDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);

	sc.setDumpLevel(5);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	Mojo.Log.error('argFromPusher: %j', argFromPusher);
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the message data
		*/
		this.status_id  = argFromPusher;
	} else {
		this.passed_status_obj = argFromPusher.status_obj;
		this.status_id  = argFromPusher.status_id;
		this.isdm  = argFromPusher.isdm;
	}
	
	this.statusobj = null;
	
	this.message_rendered = false;
	this.conversation_rendered = false;

}

MessageDetailAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

MessageDetailAssistant.prototype.setup = function() {

	var thisA = this;
	
	this.initTwit();
	
	this.scroller = this.controller.getSceneScroller();
	
	if (App.username) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label: $L("Message Details"), command:'scroll-top', width:260},
						{label: $L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}

					]
				}

			],
			cmdMenuItems:[
				{},
				{
					items:[
						{label:$L('Reply'),  icon:'reply', command:'reply', shortcut:'R'},
						{label:$L('Share'),  icon:'forward-email',  command:'share', shortcut:'S'},
						{label:$L('Favorite'), icon:'favorite-outline', command:'favorite', disabled:true, shortcut:'F'},
						{label:$L('Delete'),  icon:'stop', command:'delete', disabled:true, shortcut:'D'}
					]
				},
				{}
			]
		});
		
		this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
		
		
		this.setCommand('reply', function(e) {
			var near = e.originalEvent && e.originalEvent.target; // need to get the DOM element location from orig event
			if (thisA.statusobj) {
				var screen_name = null, screen_names = [];
				if (thisA.statusobj.SC_is_dm) { // this is a dm
					screen_name = thisA.statusobj.sender.screen_name;
					thisA.prepDirectMessage('@'+screen_name, thisA.statusobj.text);
				} else { // this is a public reply
					screen_name = thisA.statusobj.user.screen_name;
					screen_names = sch.extractScreenNames(thisA.statusobj.SC_text_raw, [screen_name, Spaz.Prefs.getUsername()]);
					if (screen_names.length > 0) { // we want to present reply to all option
						this.controller.popupSubmenu({
							onChoose: function(cmd) {

								switch (cmd) {
									case 'reply-detail':
										thisA.prepReply(screen_name, thisA.statusobj.id, thisA.statusobj);
										break;
									case 'reply-all-detail':
										screen_names.unshift(screen_name); // add the poster's screen_name back in
										thisA.prepReply(screen_names, thisA.statusobj.id, thisA.statusobj);
										break;
									default:
										return;
								}
							},
							placeNear: near,
							items: [
								{label: $L('@reply'), command:  'reply-detail'},
								{label: $L('@reply to all'), command:  'reply-all-detail'}
							]
						});
					} else { // no extra usernames, do standard reply
						thisA.prepReply(screen_name, thisA.statusobj.id, thisA.statusobj);
					}
				}

			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('share', function(e) {
			if (thisA.statusobj) {
				thisA.showShareMenu(e, thisA.statusobj);
			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('favorite', function(e) {
			Mojo.Log.error('called favorite handler');
			if (thisA.statusobj) {
				Mojo.Log.error('statusobj defined');
				if (thisA.statusobj.SC_is_dm) {
					Mojo.Log.error("can't fave a dm");
					return; // can't fave a dm
				} else {
					if (thisA.statusobj.favorited) {
						Mojo.Log.error('UNFAVORITING %j', thisA.statusobj);
						thisA.twit.unfavorite(
							thisA.statusobj.id,
							function(data) {
								thisA.statusobj.favorited = false;
								thisA.setFavButtonState();
								thisA.showBanner($L('Removed favorite'));
							},
							function(xhr, msg, exc) {
								thisA.showBanner($L('Error removing favorite'));
							}
						);
					} else {
						Mojo.Log.error('FAVORITING %j', thisA.statusobj);
						thisA.twit.favorite(
							thisA.statusobj.id,
							function(data) {
								thisA.statusobj.favorited = true;
								thisA.setFavButtonState();
								thisA.showBanner($L('Added favorite'));								
							},
							function(xhr, msg, exc) {
								thisA.showBanner($L('Error adding favorite'));
							}
						);
					}
				}
			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('delete', function(e) {
			if (thisA.statusobj) {
				
				thisA.showAlert(
					$L('Do you want to delete this message?'),
					$L('Confirm Delete'),
					function(choice) {
						switch(choice) {
							case 'yes':
								var status_id = thisA.statusobj.id;
								if (thisA.statusobj.SC_is_dm) {
									thisA.deleteDirectMessage(status_id);
								} else {
									thisA.deleteStatus(status_id);
								}

								Mojo.Controller.stageController.popScene({'returnFromPop':true});
								break;

							default:
						}
						return true;
					},
					[
						{label:$L('Yes'), value:"yes", type:'negative'},
						{label:$L('No'), value:"no", type:'dismiss'}
					]
				);
				
			}
		});
		
		
	} else {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("Message Details"), command:'scroll-top', 'class':"palm-header left", width:320}				
					]
				}

			],
			cmdMenuItems:[]
		});
		
		this.initAppMenu();
		
	};	
	
	jQuery(document).bind('get_one_status_succeeded', { thisAssistant:this }, this.processStatusReturn);

	jQuery(document).bind('get_one_status_failed', { thisAssistant:this }, function(e, error_obj) {
		var err_msg = $L("There was an error retrieving this status");
		thisA.displayErrorInfo(err_msg, error_obj);		
	});

	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
};

MessageDetailAssistant.prototype.activate = function(event) {
	
	var thisA = this;
	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	if (this.isdm) {
		if (this.passed_status_obj){
			jQuery(document).trigger('get_one_status_succeeded', [this.passed_status_obj]);
		} else {
			App.Tweets.get(this.status_id, this.isdm,
				function(data) {
					if (data !== null) {
						Mojo.Log.error('Message '+thisA.status_id+' pulled from DB');
						jQuery(document).trigger('get_one_status_succeeded', [data]);
					} else { // if nothing is returned, get it from Twitter
						Mojo.Log.error('DM was not in App.Tweets cache');
						thisA.showAlert($L('There was an error retrieving this direct message from cache'));
					}
					
				},
				function(message) {
					Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
					thisA.showAlert($L('There was an error retrieving the message data'));
				}
			);
		}
	} else {
		App.Tweets.get(
			this.status_id,
			this.isdm,
			function(data) {
				Mojo.Log.error('Status pulled from DB');
				jQuery(document).trigger('get_one_status_succeeded', [data]);
			},
			function(xhr) {
				Mojo.Log.error('Couldn\'t retrieve message from Depot: %j', xhr);
				thisA.showAlert($L('There was an error retrieving the message data'));
			}
		);
	}
	

	jQuery('#timeline-conversation .in-reply-to', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-irt-status-id');
		Mojo.Log.error('statusid: %s', statusid);
		thisA.buildConversationView(statusid);
	});



	jQuery('#message-detail-image', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	

	
	
	
	
	jQuery('#message-detail .user', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});

	jQuery('#message-detail .username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
	});

	jQuery('#message-detail .hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

    jQuery('#message-detail div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
        var statusid = jQuery(this).attr('data-status-id');
        Mojo.Controller.stageController.pushScene('message-detail', statusid);
    });

	jQuery('#message-detail img.thumbnail', this.scroller).live(Mojo.Event.tap, function(e) {
		var siu = new SpazImageURL();
		var img_url = jQuery(this).attr('data-img-url');
		sch.debug('MAIN URL:'+img_url);
		img_url = siu.getImageForUrl(img_url);
		sch.debug('IMAGE URL:'+img_url);
		Mojo.Controller.stageController.pushScene('view-image', {'imageURLs':[img_url]});
	});
	
	/*
	    Because I didn't want to use a Mojo List due to laziness, we use the
	    OLD SKOOL way from the user detail timeline
	*/
    jQuery('#timeline-conversation div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var jqtarget = jQuery(e.target);

		e.stopImmediatePropagation();
		
		var userid,
		    status_id,
		    isdm,
		    status_obj;

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


};


MessageDetailAssistant.prototype.deactivate = function(event) {
	jQuery('#message-detail .in-reply-to', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-image', this.scroller).die(Mojo.Event.tap);
	
	jQuery('#message-detail .user', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail .username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail img.thumbnail', this.scroller).die(Mojo.Event.tap);
	

	/*
		stop listening for timeline entry taps
	*/
    jQuery('#timeline-conversation div.timeline-entry', this.scroller).die(Mojo.Event.tap);
	
	
};

MessageDetailAssistant.prototype.cleanup = function(event) {
	jQuery(document).unbind('get_one_status_succeeded');
	jQuery(document).unbind('get_one_status_failed');
};


MessageDetailAssistant.prototype.processStatusReturn = function(e, statusobj) {
	var itemhtml;
	
	var thisA = e.data.thisAssistant;
	
	if (!thisA.message_rendered) {
		var sui = new SpazImageURL();

		Mojo.Log.error('statusobj: %j', statusobj);

		if (!statusobj.SC_is_dm) {
			if (App.username) { // we may not be logged-in
				statusobj.isSent = (statusobj.user.screen_name.toLowerCase() === App.username.toLowerCase());
			} else {
				statusobj.isSent = false;
			}
			
		}

		thisA.statusobj = statusobj;
		thisA.statusRetrieved = false;

		Mojo.Log.error('message data: %j', thisA.statusobj);

		thisA.statusobj.SC_thumbnail_urls = sui.getThumbsForUrls(thisA.statusobj.text);
		thisA.statusobj.text = Spaz.makeItemsClickable(thisA.statusobj.text);

		/*
			save this tweet to Depot
		*/
		// App.Tweets.save(statusobj);

		/*
			render tweet
		*/
		if (thisA.isdm) {
			itemhtml = App.tpl.parseTemplate('message-detail-dm', thisA.statusobj);
		} else {
			itemhtml = App.tpl.parseTemplate('message-detail', thisA.statusobj);
		}


		jQuery('#message-detail').html(itemhtml);
		
		
		if (thisA.statusobj.isSent || thisA.statusobj.SC_is_dm) {
			thisA.enableDeleteButton(true);
		}

		if (!thisA.statusobj.SC_is_dm) {
			thisA.enableFavButton(true);
		}

		thisA.setFavButtonState();
		
	}
	
	
	sch.updateRelativeTimes('#message-detail .status>.meta>.date>.date-relative', 'data-created_at');


	
	if (thisA.statusobj.in_reply_to_status_id && !thisA.conversation_rendered) {
		var irt_html = App.tpl.parseTemplate('message-detail-irt', thisA.statusobj);
		jQuery('#timeline-conversation').html(irt_html).fadeIn(250);
	}
	
	thisA.message_rendered = true;
	
};

/**
 * @param {Boolean} [is_favorite] true or false. if not provided, gets value from this.statusobj
 */
MessageDetailAssistant.prototype.setFavButtonState = function(is_favorite) {
	
	if (this.statusobj && !this.statusobj.SC_is_dm) {
		
		if (is_favorite !== true && is_favorite !== false) {
			is_favorite = this.statusobj.favorited;
		}
		
		var menu_item = this.cmdMenuModel.items[1].items[2];

		Mojo.Log.error('menu_item: %j', menu_item);
		Mojo.Log.error('is_favorite: %s', is_favorite);
			
		if (is_favorite) {
			menu_item.icon = 'favorite';
			this.controller.modelChanged(this.cmdMenuModel);
		} else {
			menu_item.icon = 'favorite-outline';
			this.controller.modelChanged(this.cmdMenuModel);
		}
		
	}
};


MessageDetailAssistant.prototype.enableFavButton = function(enabled) {
	
	if (enabled) {
		this.cmdMenuModel.items[1].items[2].disabled = false;
		this.controller.modelChanged(this.cmdMenuModel);
	} else {
		this.cmdMenuModel.items[1].items[2].disabled = true;
		this.controller.modelChanged(this.cmdMenuModel);
	}
	
};



MessageDetailAssistant.prototype.enableDeleteButton = function(enabled) {
	
	if (enabled) {
		this.cmdMenuModel.items[1].items[3].disabled = false;
		this.controller.modelChanged(this.cmdMenuModel);
	} else {
		this.cmdMenuModel.items[1].items[3].disabled = true;
		this.controller.modelChanged(this.cmdMenuModel);
	}
	
};


MessageDetailAssistant.prototype.buildConversationView = function(statusid) {

    var thisA = this;

	if (!this.conversation_rendered) { this.conversation_rendered = false; }

    var $container = jQuery('#timeline-conversation');
	
	if (this.conversation_rendered) {
		Mojo.Log.error('timeline-conversation has already been set-up. returning.');
		return;
	}

	var initWindow = function() {
		$container
		    .html('<div class="loading"><img src="images/theme/loading-tiny.gif" style="display:inline-block; margin-bottom:-2px"> Loading…</div>')
		    .find('.loading')
		    .fadeIn(250);	
	};


	var build = function(base_id) {
		var convo_array = [], added_ids = [];

		initWindow();

		Mojo.Log.error("==========Retrieving base_id "+base_id+' =======================');
		App.Tweets.get(
		    base_id, // status_id
		    false, // isdm
		    onRetrieved, // success
		    function(message) { // failure
				Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
				thisA.showAlert($L('There was an error retrieving the message data'));
			}
		);



		function onRetrieved(status_obj) {		
            
            // add newly retrieved message
            Mojo.Log.error("Adding "+status_obj.id);
			status_obj.db_id = status_obj.id;
			status_obj.id    = status_obj.id;
			status_obj.text = Spaz.makeItemsClickable(status_obj.text);
			var $status_html  = jQuery(App.tpl.parseTemplate('tweet', status_obj));
            // Mojo.Log.error("Adding %s", status_html);
			$container.append($status_html.fadeIn(400));


			Mojo.Log.error("Retrieved "+status_obj.id);

			if (added_ids.indexOf(status_obj.id) !== -1) {
				Mojo.Log.error("This id has already been retrieved");
				finishLoadingConvo();
				return;
			} else {

				convo_array.push(status_obj);
				added_ids.push(status_obj.id);

				Mojo.Log.error("conversation length is now "+convo_array.length);
				Mojo.Log.error("added_ids: "+added_ids.toString());

				if (status_obj.in_reply_to_status_id
						&& (added_ids.indexOf(status_obj.in_reply_to_status_id) === -1)
						&& (status_obj.in_reply_to_status_id != status_obj.id)
						) {
					App.Tweets.get(
					    status_obj.in_reply_to_status_id, // status_id
					    false, // isdm
					    onRetrieved, // success
					    function(message) { // failure
        					Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
        					thisA.showAlert($L('There was an error retrieving the message data'));
        				}
					);
				} else {
					finishLoadingConvo();
					return;
				}				
			}
		}



		function finishLoadingConvo() {
            $container.find('.loading').fadeOut(400, function() {
                jQuery(this).remove();
            });
			thisA.conversation_rendered = true;
		}

	};
	
	build(statusid);
	
};
