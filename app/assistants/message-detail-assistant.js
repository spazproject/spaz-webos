function MessageDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	sch.dump(argFromPusher);
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the user data
		*/
		this.status_id  = argFromPusher;
	} else {
		this.status_obj = argFromPusher.status_obj;
		this.status_id  = argFromPusher.status_id;
		this.isdm  = argFromPusher.isdm;
	}
}

MessageDetailAssistant.prototype.setup = function() {

	var thisA = this;
	
	this.initTwit();
	
	this.scroller = this.controller.getSceneScroller();
	
	if (sc.app.username && sc.app.password) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("Message Details"), command:'scroll-top', 'class':"palm-header left", width:320}		
					]
				}

			],
			cmdMenuItems:[
				{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}
				// {},
				// {label:$L('Reply'),  icon:'reply', command:'reply', shortcut:'R'},
				// {label:$L('Forward'),  icon:'forward-email', command:'retweet', shortcut:'N'},
				// {label:$L('Favorite'),  iconPath:'images/theme/menu-icon-favorite-outline.png', command:'compose', shortcut:'N'}
			]
		});
		
		this.initAppMenu({ 'items':loggedin_appmenu_items });
		
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
	
	jQuery().bind('get_one_status_succeeded', { thisAssistant:this }, this.processStatusReturn);

	jQuery().bind('get_one_status_failed', { thisAssistant:this }, function(e, error_obj) {
		var err_msg = $L("There was an error retrieving this status");
		thisA.displayErrorInfo(err_msg, error_obj);		
	});

	


	jQuery().bind('create_favorite_succeeded',  { thisAssistant:this }, function(e, statusobj) {
		jQuery('#message-detail-action-favorite[data-status-id="'+statusobj.id+'"]')
			.attr('data-favorited', 'true')
			.html('Remove as favorite');
	});
	jQuery().bind('destroy_favorite_succeeded', { thisAssistant:this }, function(e, statusobj) {
		jQuery('#message-detail-action-favorite[data-status-id="'+statusobj.id+'"]')
			.attr('data-favorited', 'false')
			.html('Add as favorite');		
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
		if (this.status_obj){
			jQuery().trigger('get_one_status_succeeded', [this.status_obj]);
		} else {
			sc.app.Tweets.get(this.status_id, this.isdm,
				function(data) {
					if (data !== null) {
						sch.error('Message '+thisA.status_id+' pulled from DB');
						jQuery().trigger('get_one_status_succeeded', [data]);
					} else { // if nothing is returned, get it from Twitter
						sch.error('DM was not in sc.app.Tweets cache');
						thisA.showAlert($L('There was an error retrieving this direct message from cache'));
					}
					
				},
				function(message) {
					sch.error('Couldn\'t retrieve message from Depot:'+message);
					thisA.showAlert($L('There was an error retrieving the message data'));
				}
			);
		}
	} else {
		sc.app.Tweets.get(
			this.status_id,
			this.isdm,
			function(data) {
				jQuery().trigger('get_one_status_succeeded', [data]);
			},
			function(message) {
				thisA.showAlert($L('There was an error retrieving the message data'));
			}
		);
		// if (this.status_obj){
		// 			jQuery().trigger('get_one_status_succeeded', [this.status_obj]);
		// 		} else {
		// 			sc.app.Tweets.get(this.status_id, this.isdm,
		// 				function(data) {
		// 					if (data !== null) {
		// 						sch.error('Message '+data.id+' pulled from DB');
		// 						jQuery().trigger('get_one_status_succeeded', [data]);
		// 					} else { // if nothing is returned, get it from Twitter
		// 						sch.error('Message '+this.status_id+' missing from DB; retrieving from Twitter');
		// 						thisA.twit.getOne(thisA.status_id);
		// 					}	
		// 				},
		// 				function(message) {
		// 					sch.error('Couldn\'t retrieve message from Depot:'+message);
		// 					thisA.twit.getOne(thisA.status_id);
		// 				}
		// 			);
		// 			
		// 
		// 		}
	}
	

	jQuery('#message-detail-container .in-reply-to-link', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-irt-status-id');
		Mojo.Controller.stageController.pushScene('message-detail', statusid);
	});



	jQuery('#message-detail-image', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('#message-detail-action-reply', this.scroller).live(Mojo.Event.tap, function(e) {
		var screen_name = jQuery(this).attr('data-screen_name');
		var in_reply_to = jQuery(this).attr('data-status-id');
		thisA.prepReply(screen_name, in_reply_to, thisA.statusobj);
	});
	// jQuery('#message-detail-action-retweet', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	thisA.prepRetweet(thisA.statusobj);
	// });
	jQuery('#message-detail-action-share', this.scroller).live(Mojo.Event.tap, function(e) {
		thisA.controller.popupSubmenu({
			onChoose:  thisA.sharePopupmenuChoose,
			placeNear: e.target,
			items: [
				{label: 'ReTweet', command: 'retweet'},
				{label: 'Quote', command:   'quote'},
				{label: 'Email', command:   'email'},
				{label: 'SMS/IM', command:  'sms'}
			]
		});
	});
	jQuery('#message-detail-action-dm', this.scroller).live(Mojo.Event.tap, function(e) {
		thisA.prepDirectMessage(jQuery(this).attr('data-screen_name'));
	});
	jQuery('#message-detail-action-favorite', this.scroller).live(Mojo.Event.tap, function(e) {
		var status_id = parseInt(jQuery(this).attr('data-status-id'), 10);		
		if (jQuery(this).attr('data-favorited') === 'true') {
			sch.dump('UNFAVORITING');
			thisA.twit.unfavorite(status_id);
		} else {
			sch.dump('FAVORITING');
			thisA.twit.favorite(status_id);
		}
	});
	
	
	jQuery('#message-detail-container .user', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});

	jQuery('#message-detail-container .username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
	});

	jQuery('#message-detail-container .hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('#message-detail-container div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-status-id');
		Mojo.Controller.stageController.pushScene('message-detail', statusid);
	});
	
	jQuery('#message-detail-container img.thumbnail', this.scroller).live(Mojo.Event.tap, function(e) {
		var siu = new SpazImageURL();
		var img_url = jQuery(this).attr('data-img-url');
		sch.dump('MAIN URL:'+img_url);
		img_url = siu.getImageForUrl(img_url);
		sch.dump('IMAGE URL:'+img_url);
		Mojo.Controller.stageController.pushScene('view-image', {'imageURLs':[img_url]});
	});
	
	// this.addPostPopup();
};


MessageDetailAssistant.prototype.deactivate = function(event) {
	jQuery('#message-detail-container .in-reply-to-link', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-image', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-action-reply', this.scroller).die(Mojo.Event.tap);
	// jQuery('#message-detail-action-retweet', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-action-share', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-action-dm', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-action-favorite', this.scroller).die(Mojo.Event.tap);
	
	jQuery('#message-detail-container .user', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-container .username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-container .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-container div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-container img.thumbnail', this.scroller).die(Mojo.Event.tap);
	
};

MessageDetailAssistant.prototype.cleanup = function(event) {
	jQuery().unbind('get_one_status_succeeded');
	jQuery().unbind('get_one_status_failed');
	jQuery().unbind('uncreate_favorite_succeeded');
	jQuery().unbind('destroy_favorite_succeeded');
};


MessageDetailAssistant.prototype.processStatusReturn = function(e, statusobj) {
	var itemhtml;
	
	var sui = new SpazImageURL();
	
	sch.dump(e.data.thisAssistant);

	e.data.thisAssistant.statusobj = statusobj;
	e.data.thisAssistant.statusRetrieved = false;

	sch.dump('message data:');
	sch.dump(e.data.thisAssistant.statusobj);
	
	e.data.thisAssistant.statusobj.SC_thumbnail_urls = sui.getThumbsForUrls(e.data.thisAssistant.statusobj.text);
	e.data.thisAssistant.statusobj.text = Spaz.makeItemsClickable(e.data.thisAssistant.statusobj.text);
	
	/*
		save this tweet to Depot
	*/
	// sc.app.Tweets.save(statusobj);
	
	/*
		render tweet
	*/
	if (e.data.thisAssistant.isdm) {
		itemhtml = sc.app.tpl.parseTemplate('message-detail-dm', e.data.thisAssistant.statusobj);
	} else {
		itemhtml = sc.app.tpl.parseTemplate('message-detail', e.data.thisAssistant.statusobj);
	}
	
	
	jQuery('#message-detail').html(itemhtml);
	
	sch.updateRelativeTimes('#message-detail .status>.meta>.date>.date-relative', 'data-created_at');
	
};


MessageDetailAssistant.prototype.sharePopupmenuChoose = function(cmd) {
	
	switch (cmd) {
		case 'retweet':
			this.prepRetweet(this.statusobj);
			break;
		case 'quote':
			this.prepQuote(this.statusobj);
			break;
		case 'email':
			this.emailTweet(this.statusobj);
			break;
		case 'sms':
			this.SMSTweet(this.statusobj);
			break;
		default:
			return;
	}
};