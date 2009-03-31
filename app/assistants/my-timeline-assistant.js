/**
 * events raised here:
 * 'my_timeline_refresh' 
 */


function MyTimelineAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	if (argFromPusher && argFromPusher.firstload === true) {
		console.debug();
		this.clearTimelineCache();
	}
	
	
	/*
		this property will hold the setInterval return
	*/
	this.refresher = null;
}



MyTimelineAssistant.prototype.setup = function() {
	
	
	this.tweetsModel = [];
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.initAppMenu();

	this.initTwit();


	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label: sc.app.username, command:'scroll-top'},
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
				// {label:$L('Home'),        iconPath:'images/theme/menu-icon-home.png', command:'home', shortcut:'H'},
				{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T', disabled:true},
				{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
				{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'},
				// {label:$L('Followers'),   icon:'remove-vip', command:'followers', shortcut:'L'},
				{}
			]
		}]
	});

	this.scroller = this.controller.getSceneScroller();


	
	
	
	/* setup widgets here */
	
	
	
	
	/* add event handlers to listen to events from widgets */
	dump('Loading Timeline Cache ###################################');
	this.loadTimelineCache();
	
	
	/*
		We use this to delay the request until activation
	*/
	this.loadOnActivate = true;
}



MyTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	this.addPostPopup();

	
	var thisA = this; // for closures
	
	/*
		Listen for error
	*/
	jQuery().bind('error_combined_timeline_data', { thisAssistant:this }, function(e, error_array) {
		dump('error_combined_timeline_data - response:');
		dump(error_array);
		// e.data.thisAssistant.spinnerOff();
		thisA.hideInlineSpinner('#my-timeline');
		thisA.startRefresher();

		var err_msg = $L("There were errors retrieving your combined timeline");
		thisA.displayErrorInfo(err_msg, error_array);
	});
	


	/*
		Get combined timeline data
	*/
	jQuery().bind('new_combined_timeline_data', { thisAssistant:this }, function(e, tweets, render_callback) {
		
		e.data.thisAssistant.renderTweets.call(e.data.thisAssistant, tweets, render_callback);

	});

	
	jQuery().bind('my_timeline_refresh', { thisAssistant:this }, function(e) {
		e.data.thisAssistant.refresh();
	});
	
	/*
		listen for clicks on user avatars
	*/
	jQuery('div.timeline-entry>.user', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('.username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('.hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.hold, function(e) {
		var status_id = jQuery(this).attr('data-status-id');
		var isdm = false;
		var status_obj = null;
		
		// dump("ISDM:"+jQuery(this).parent().parent().hasClass('dm'));
		
		if (jQuery(this).hasClass('dm')) {
			isdm = true;
			// status_obj = sch.deJSON( jQuery(this).parent().parent().children('.entry-json').text() );
			status_obj = thisA.getTweet(parseInt(status_id));
		}
		Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
	});
	
	jQuery('div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var status_id = jQuery(this).attr('data-status-id');
		var isdm = false;
		var status_obj = null;
		
		// dump("ISDM:"+jQuery(this).parent().parent().hasClass('dm'));
		
		if (jQuery(this).parent().parent().hasClass('dm')) {
			isdm = true;
			// status_obj = sch.deJSON( jQuery(this).parent().parent().children('.entry-json').text() );
			status_obj = thisA.getTweet(parseInt(status_id));
		}
		Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
	});
	
	// jQuery('a[href]', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	e.preventDefault();
	// 	var href = jQuery(this).attr('href');
	// 	Mojo.Controller.stageController.pushScene('webview', {'url':href});
	// 	return false;
	// });
	
	
	// jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.dragStart, function(e) {
	// 	alert('dragStart!');
	// });
	// jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.hold, function(e) {
	// 	alert('hold!');
	// });
	

	if (this.loadOnActivate) {
		/*
			Make request to Twitter
		*/
		this.getData();

		this.startRefresher();
		
		/*
			Disable this so we don't load on next activation
		*/
		this.loadOnActivate = false;
	}
	
}


MyTimelineAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.removePostPopup();
	
	jQuery().unbind('error_user_timeline_data');
	jQuery().unbind('new_combined_timeline_data');
	jQuery().unbind('update_succeeded');
	jQuery().unbind('update_failed');
	jQuery().unbind('my_timeline_refresh');
	
	jQuery('div.timeline-entry>.user', this.scroller).die(Mojo.Event.tap);
	jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry', this.scroller).die(Mojo.Event.hold);
	jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('a[href]', this.scroller).die(Mojo.Event.tap);
	
	
}

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.stopRefresher();
}


MyTimelineAssistant.prototype.loadTimelineCache = function() {
	// Mojo.Log.info('Timeline Caching disabled for now');

	var thisA = this;

	this.mojoDepot = new Mojo.Depot({
		name:'SpazDepot',
		replace:false
	});
	
	this.mojoDepot.simpleGet('SpazMyTimelineCache_'+sc.app.username,
		function(data) {
			dump('loading cache');
			
			try {
				thisA.twit.setLastId(SPAZCORE_SECTION_FRIENDS, data[SPAZCORE_SECTION_FRIENDS + '_lastid']);
				thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
				thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);

				/*
					it seems to be double-encoded coming from the depot
				*/				
				tl_data = sch.deJSON(sch.deJSON(data.tweets_json));
				dump('My Timeline Cache loaded ##########################################');
				dump(tl_data);
				thisA.renderTweets(tl_data,
					function() {
						sch.markAllAsRead('#my-timeline>div.timeline-entry');
					}
				);				
			} catch (e) {
				dump('Couldn\'t load cache');
				dump(e.name + ":" + e.message);
			}
		},
		function() { dump('My Timeline Cache load failed') }
	);
	
};

MyTimelineAssistant.prototype.saveTimelineCache = function() {
	// Mojo.Log.info('Timeline Caching disabled for now');
	
	// if (this.tweetsModel.length > 0) {
		var tweetsModel_json = sch.enJSON(this.tweetsModel);

		var twitdata = {}
		twitdata['tweets_json']                        = tweetsModel_json;
		twitdata[SPAZCORE_SECTION_FRIENDS + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_FRIENDS);
		twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
		twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);

		this.mojoDepot = new Mojo.Depot({
			name:'SpazDepot',
			replace:false
		});



		this.mojoDepot.simpleAdd('SpazMyTimelineCache_'+sc.app.username, twitdata,
			function() { dump('My Timeline Cache Saved') },
			function(msg) { dump('My Timeline Cache save failed:'+msg) }
		);
	
};



MyTimelineAssistant.prototype.getEntryElementByStatusId = function(id) {
	
	var el = jQuery('#my-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	
	return el;
	
};




MyTimelineAssistant.prototype.getData = function() {
	sch.markAllAsRead('#my-timeline>div.timeline-entry');
	this.showInlineSpinner('#my-timeline', 'Looking for new tweets…');
	
	/*
		friends_count is the only one that gets used currently
	*/
	this.twit.getCombinedTimeline({
		'friends_count':sc.app.prefs.get('timeline-friends-getcount'),
		'replies_count':sc.app.prefs.get('timeline-replies-getcount'),
		'dm_count':sc.app.prefs.get('timeline-dm-getcount')
	});
};


MyTimelineAssistant.prototype.refresh = function(e) {
	this.stopRefresher();
	this.getData();
};



MyTimelineAssistant.prototype.renderTweets = function(tweets, render_callback) {
	
	var thisA = this;
	
	/*
		If there are new tweets, process them
	*/
	// if (tweets && tweets.length>0) {
	if (tweets && tweets.length>0) {

		var rendertweets = tweets;
		
		Mojo.Timing.resume('my_timeline_render');

		jQuery.each( rendertweets, function() {
			/*
				check to see if this item exists
			*/
			if (!thisA.getEntryElementByStatusId(this.id)) {
				
				/*
					add to tweetsModel
				*/
				thisA.addTweetToModel(this);
				
				this.text = makeItemsClickable(this.text);

				/*
					Render the tweet
				*/
				if (this.SC_is_dm) {
					var itemhtml = sc.app.tpl.parseTemplate('dm', this);
				} else {
					var itemhtml = sc.app.tpl.parseTemplate('tweet', this);
				}

				/*
					make jQuery obj
				*/
				var jqitem = jQuery(itemhtml);

				if (this.SC_is_reply) {
					jqitem.addClass('reply');
				}

				if (this.SC_is_dm) {
					jqitem.addClass('dm');
				}


				/*
					put item on timeline
				*/
				jQuery('#my-timeline', thisA.scroller).prepend(jqitem);
			} else {
				dump('Tweet ('+this.id+') already is in timeline');
			}
			
		});
		
		
		Mojo.Timing.pause('my_timeline_render');
		Mojo.Log.info(Mojo.Timing.reportTiming("my_timeline_render", "my_timeline_render -- \n"));
		
		if ( sc.app.prefs.get('timeline-scrollonupdate') ) {
			this.scrollToNew();
		}
		
		
	} else {
		dump("no new tweets");
	}
	
	/*
		remove extra items
	*/
	// sch.removeExtraElements('#my-timeline>div.timeline-entry', sc.app.prefs.get('timeline-maxentries'));
	
	sch.removeExtraElements('#my-timeline>div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline>div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
	sch.removeExtraElements('#my-timeline>div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));


	/*
		Update relative dates
	*/
	sch.updateRelativeTimes('div.timeline-entry .meta>.date', 'data-created_at');
	
	/*
		re-apply filtering
	*/
	thisA.filterTimeline();
	
	/*
		we are done rendering, so call the optional callback
	*/
	if (render_callback) {
		dump('Calling render_callback #################################');
		render_callback();
	}
	
	var new_count = jQuery('#my-timeline>div.timeline-entry.new:visible').length;
	
	if (new_count > 0) {
		thisA.newMsgBanner(new_count);
		thisA.playAudioCue('newmsg');		
	}

	// thisA.spinnerOff();
	thisA.hideInlineSpinner('#my-timeline');
	thisA.startRefresher();
	
	/*
		Save this in case we need to load from cache
	*/
	thisA.saveTimelineCache();

};



MyTimelineAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	
	this.stopRefresher(); // in case one is already running
	
	this.refresher = setInterval(function() {
			jQuery().trigger('my_timeline_refresh');
		}, sc.app.prefs.get('network-refreshinterval')
	);
}

MyTimelineAssistant.prototype.stopRefresher = function() {
	dump('Stopping refresher');
	/*
		Clear refresher
	*/
	clearInterval(this.refresher);
}


/**
 * Gets tweet from this.tweetsModel, or false if DNE 
 */
MyTimelineAssistant.prototype.getTweet = function(id) {
	
	for(var i=0; i < this.tweetsModel.length; i++) {
		if (this.tweetsModel[i].id == id) {
			return this.tweetsModel[i]
		}
	}
	
	return false;
	
};



/*
	add to tweetsModel
*/
MyTimelineAssistant.prototype.addTweetToModel = function(twobj) {
	var newlen = this.tweetsModel.push(twobj);
	dump('this.tweetsModel is now '+newlen+' items long')
	if (newlen > sc.app.prefs.get('timeline-maxentries')) {
		this.tweetsModel.shift();
		dump('SHIFTED: this.tweetsModel is now '+this.tweetsModel.length+' items long');
	}
};


