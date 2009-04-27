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
		// this.clearTimelineCache();
	}
	
	
	/*
		this property will hold the setInterval return
	*/
	this.refresher = null;
	
	this.cacheDepot = new Mojo.Depot({
		name:'SpazDepotTimelineCache',
		displayName:'SpazDepotTimelineCache',
		replace:false,
		version:1
	});

}



MyTimelineAssistant.prototype.setup = function() {
	
	var thisA = this;
	
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
	
	jQuery().bind('load_from_mytimeline_cache_done', function() {
		thisA.clearInlineSpinner('#my-timeline-spinner-container');
		if (thisA.activateStarted === true) {
			dump('getting data!');
			thisA.getData();
		} else {
			dump('waiting for activate to load!');
			thisA.loadOnActivate = true;
		}
	});
	
	
	
	/* add event handlers to listen to events from widgets */
	dump('Loading Timeline Cache ###################################');
	this.loadTimelineCache();
	
}



MyTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	this.activateStarted = true;
	
	this.addPostPopup();

	
	var thisA = this; // for closures
	
	/*
		Listen for error
	*/
	jQuery().bind('error_combined_timeline_data', { thisAssistant:this }, function(e, error_array) {
		dump('error_combined_timeline_data - response:');
		dump(error_array);
		thisA.hideInlineSpinner('#my-timeline-spinner-container');
		thisA.startRefresher();

		var err_msg = $L("There were errors retrieving your combined timeline");
		thisA.displayErrorInfo(err_msg, error_array);
	});
	


	/*
		Get combined timeline data
	*/
	jQuery().bind('new_combined_timeline_data', { thisAssistant:this }, function(e, tweets, render_callback) {
		
		e.data.thisAssistant.renderTweets.call(e.data.thisAssistant, tweets, render_callback, false);

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
		e.stopImediatePropagation();
	});
	
	jQuery('.username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
		e.stopImediatePropagation();
	});
	
	jQuery('.hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
		e.stopImediatePropagation();
	});

	
	jQuery('div.timeline-entry .meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var status_id = jQuery(this).attr('data-status-id');
		var isdm = false;
		var status_obj = null;
		
		status_obj = thisA.getTweetFromModel(parseInt(status_id));
		
		if (jQuery(this).parent().parent().hasClass('dm')) {
			isdm = true;
		}
		
		Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
		e.stopImediatePropagation();
	});
	

	jQuery('div.timeline-entry a[href]', this.scroller).live(Mojo.Event.tap, function(e) {
		e.stopImediatePropagation();
	});
	
	jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var status_id = jQuery(this).attr('data-status-id');
		var isdm = false;
		var status_obj = null;
		
		status_obj = thisA.getTweetFromModel(parseInt(status_id));
		
		if (jQuery(this).hasClass('dm')) {
			isdm = true;
		}
		Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
	});


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
	jQuery().unbind('load_from_mytimeline_cache_done');
	
	jQuery('div.timeline-entry>.user', this.scroller).die(Mojo.Event.tap);
	jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry .meta', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry', this.scroller).die(Mojo.Event.tap);
	
	
}

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.stopRefresher();
}


MyTimelineAssistant.prototype.loadTimelineCache = function() {

	var thisA = this;

	this.showInlineSpinner('#my-timeline-spinner-container', 'Loading cached tweets…');

	this.cacheDepot.simpleGet(sc.app.username,
		function(data) {
			dump('loading cache');
			
			var tl_data = null;
			
			try {
				dump(data);
				thisA.twit.setLastId(SPAZCORE_SECTION_FRIENDS, data[SPAZCORE_SECTION_FRIENDS + '_lastid']);
				thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
				thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);
	
				/*
					it seems to be double-encoded coming from the depot
				*/				
				tl_data = sch.deJSON(data.tweets_json);
				if (sch.isString(tl_data)) { // in webkit we're sometimes double-encoded. Dunno why
					tl_data = sch.deJSON(tl_data);	
				}			
			} catch (e) {
				dump('Couldn\'t load cache');
				dump(e.name + ":" + e.message);
				jQuery().trigger('load_from_mytimeline_cache_done');
			}
			
			if (tl_data) {
				dump('My Timeline Cache loaded ##########################################');
				dump(tl_data);
				thisA.renderTweets(tl_data,
					function() {
						sch.markAllAsRead('#my-timeline>div.timeline-entry');
					},
					true // we are loading from cache
				);
			}
		},
		function(msg) {
			dump('My Timeline Cache load failed:'+msg);
			jQuery().trigger('load_from_mytimeline_cache_done');
		}
	);
	
};

MyTimelineAssistant.prototype.saveTimelineCache = function() {	
	var tweetsModel_json = sch.enJSON(this.tweetsModel);
	
	var twitdata = {}
	twitdata['tweets_json']                        = tweetsModel_json;
	twitdata[SPAZCORE_SECTION_FRIENDS + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_FRIENDS);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);
	
	
	this.cacheDepot.simpleAdd(sc.app.username, twitdata,
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
	this.showInlineSpinner('#my-timeline-spinner-container', 'Looking for new tweets…');
	
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



MyTimelineAssistant.prototype.renderTweets = function(tweets, render_callback, from_cache) {
	
	if (from_cache !== true) {
		from_cache = false;
	}
	
		
	var thisA = this;
	
	/*
		If there are new tweets, process them
	*/
	// if (tweets && tweets.length>0) {
	if (tweets && tweets.length>0) {

		var rendertweets = tweets;
		
		var tweets_added = 0;
		
		Mojo.Timing.resume('my_timeline_render');

		jQuery.each( rendertweets, function() {
			/*
				check to see if this item exists
			*/
			if (this == false) {
				dump("Tweet object was FALSE; skipping");
			} else if (!thisA.getEntryElementByStatusId(this.id)) {
				
				dump('adding '+this.id+':');
				// dump(this);
				
				/*
					add to tweetsModel
				*/
				thisA.addTweetToModel(this);
				tweets_added++;
				
				
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

				if (!from_cache) {
					jqitem.addClass('new');
				}

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
		
		dump("tweets_added:"+tweets_added);
		dump("from_cache:"+from_cache);
		dump("sc.app.prefs.get('timeline-scrollonupdate'):"+sc.app.prefs.get('timeline-scrollonupdate'));
		
		
		var num_entries = jQuery('#my-timeline div.timeline-entry').length;
		dump("num_entries:"+num_entries);
		var old_entries = num_entries - tweets_added;
		dump("old_entries:"+old_entries);
		if ( tweets_added > 0 && old_entries > 0 && !from_cache && sc.app.prefs.get('timeline-scrollonupdate') ) {
			dump("I'm going to scroll to new in 500ms!");
			setTimeout(function() { thisA.scrollToNew() }, 500);
		} else {
			dump("Not scrolling to new!");
		}
		
		
	} else {
		dump("no new tweets");
	}
	
	/*
		remove extra items
	*/
	thisA.removeExtraItems();

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
	
	if (!from_cache && new_count > 0) {
		thisA.newMsgBanner(new_count);
		thisA.playAudioCue('newmsg');		
	}

	thisA.hideInlineSpinner('#my-timeline-spinner-container');
	thisA.startRefresher();
	
	/*
		Save this in case we need to load from cache
	*/
	if (!from_cache) {
		thisA.saveTimelineCache();
	} else {
		jQuery().trigger('load_from_mytimeline_cache_done');
	}
	


};



MyTimelineAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	this.stopRefresher(); // in case one is already running
	
	var time = sc.app.prefs.get('network-refreshinterval');
	
	if (time > 0) {
		this.refresher = setInterval(function() {
				jQuery().trigger('my_timeline_refresh');
			}, time
		)
	} else {
		this.refresher = null;
	}
};

MyTimelineAssistant.prototype.stopRefresher = function() {
	dump('Stopping refresher');
	/*
		Clear refresher
	*/
	clearInterval(this.refresher);
};


/**
 * Gets tweet from this.tweetsModel, or false if DNE 
 */
MyTimelineAssistant.prototype.getTweetFromModel = function(id) {
	
	for(var i=0; i < this.tweetsModel.length; i++) {
		if (this.tweetsModel[i].id == id) {
			return this.tweetsModel[i];
		}
	}
	
	return false;
};



/*
	add to tweetsModel
*/
MyTimelineAssistant.prototype.addTweetToModel = function(twobj) {
	var newlen = this.tweetsModel.push(twobj);
	dump('this.tweetsModel is now '+newlen+' items long');
};


MyTimelineAssistant.prototype.removeExtraItems = function() {
	/*
		from html timeline
	*/
	sch.removeExtraElements('#my-timeline>div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline>div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
	sch.removeExtraElements('#my-timeline>div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));
	
	/*
		now sync the local model to the html
		We go backwards because we're splicing
	*/
	var thisA = this;
	var new_model = [];
	Mojo.Timing.resume('syncModel');
	jQuery('#my-timeline>div.timeline-entry').each( function() {
		var id = jQuery(this).attr('data-status-id');
		var this_obj = thisA.getTweetFromModel(id);
		new_model.push(this_obj);
	} );
	this.tweetsModel = new_model.reverse();
	
	Mojo.Timing.pause('syncModel');
	// alert(Mojo.Timing.reportTiming("syncModel", "syncModel Timing -- \n"));

	
	
	
	
	
	// for (var i=this.tweetsModel.length-1; i >=0; i--) {
	// 	var this_item = this.tweetsModel[i];
	// 	if (!this.getEntryElementByStatusId(this_item.id)) {
	// 		var deleted = this.tweetsModel.splice(i, 1)[0];
	// 		dump("deleted entry "+this_item.id+" in model");
	// 		dump(deleted);
	// 	} else {
	// 		dump("keeping "+this_item.id);
	// 		dump(this_item);
	// 	}
	// 	
	// }
	
	var html_count  = jQuery('#my-timeline>div.timeline-entry').length;
	var norm_count  = jQuery('#my-timeline>div.timeline-entry:not(.reply):not(.dm)').length;
	var reply_count = jQuery('#my-timeline>div.timeline-entry.reply').length;
	var dm_count    = jQuery('#my-timeline>div.timeline-entry.dm').length;
	
	
	var model_count = this.tweetsModel.length;
	
	dump('HTML COUNT:'+html_count);
	dump('NORM COUNT:'+norm_count);
	dump('REPLY COUNT:'+reply_count);
	dump('DM COUNT:'+dm_count);
	dump('MODEL COUNT:'+model_count);
	
	// var last_normal = jQuery('#my-timeline>div.timeline-entry:not(.reply):not(.dm):last');
	// var last_normal = jQuery('#my-timeline>div.timeline-entry:not(.reply):not(.dm):last');
	// 
	// 
	// 
	// function removeFromModel(tweet_array, key, value) {
	// 	var matching_tweets
	// 	
	// 	for (var i=0; i < tweet_array.length; i++) {
	// 		
	// 		if (tweet_array[i][key] == value) {
	// 			
	// 		}
	// 		
	// 	}
	// }
	// 
	
	
};