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
	
	var thisA = this;
	
	
	if (argFromPusher && argFromPusher.firstload === true) {
		// console.debug();
		// this.clearTimelineCache();
	}
	
	


	this.cacheVersion = 3;  // we increment this when we change how the cache works
	
	
	this.cacheDepot = makeCacheDepot(false);
	
	
	/**
	 * empties the timeline and resets the lastids in the twit object
	 * 
	 * bound to temp_cache_cleared 
	 * 
	 * we define this here to get the closure thisA; haven't sorted out how to
	 * bind an event using SpazCore to a scope without making it un-removable
	 */
	this.resetTwitState = function() {
		jQuery('.timeline').empty();
		thisA.twit.setLastId(SPAZCORE_SECTION_HOME, 0);
		thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, 0);
		thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     0);

	};
	

}



MyTimelineAssistant.prototype.setup = function() {
	
	sch.debug('SETUP');
	
	var thisA = this;
	
	// this.tweetsModel = [];

	this.scroller = this.controller.getSceneScroller();
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.initAppMenu({ 'items':loggedin_appmenu_items });

	this.initTwit('DOM');
	
	/*
		this will set the state for this.isFullScreen
	*/
	this.trackStageActiveState();



	

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label: sc.app.username, command:'scroll-top', width:260},
					{label: $L('Filter timeline'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'}
				
				]
			}
			
		],
		cmdMenuItems: [
			{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
			{
				/*
					So we don't get the hard-to-see disabled look on the selected button,
					we make the current toggle command "IGNORE", which will not trigger an action
				*/
				toggleCmd:'IGNORE',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'IGNORE', shortcut:'T', 'class':"palm-header left"},
					{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
					{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'}
				]
			},
			{label: $L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}
			
		]
	});


	this.timelineFilterMenuModel = {
		items: [
				{label:$L('Show All Messages'),				secondaryIconPath:'', command:'filter-timeline-all'}, 
				{label:$L('Replies and Direct Messages'),	secondaryIconPath:'', command:'filter-timeline-replies-dm'}, 
				{label:$L('Just Replies'),					secondaryIconPath:'', command:'filter-timeline-replies'}, 
				{label:$L('Just Direct Messages'),			secondaryIconPath:'', command:'filter-timeline-dms'}
		]
	};

	// Set up submenu widget that was wired into the viewMenu above
	this.controller.setupWidget("filter-menu", undefined, this.timelineFilterMenuModel);
	
	


	
	this.setupInlineSpinner('activity-spinner-my-timeline');
	
	
	this.refreshOnActivate = true;
	
	
	sch.listen(document, 'temp_cache_cleared', this.resetTwitState);
	
	this.loadTimelineCache();
	
	
	this.initTimeline();
	
};



MyTimelineAssistant.prototype.activate = function(params) {
	
	sch.debug('ACTIVATE');
	
	var thisA = this; // for closures

	var tts = sc.app.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#my-timeline', tts);
	
	this.activateStarted = true;
	

	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('#my-timeline');

	/*
		start the mytimeline 
	*/
	if (this.refreshOnActivate || (params && params.refresh === true)) {
		this.mytl.start();
		this.refreshOnActivate = false;
	}

};


MyTimelineAssistant.prototype.deactivate = function(event) {
	
	sch.debug('DEACTIVATE');
	
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('#my-timeline');
	
	

	
	
	/*
		save timeline cache
	*/
	sch.debug('saving timeline cache…');
	this.saveTimelineCache();
	
};



MyTimelineAssistant.prototype.cleanup = function(event) {
	
	sch.dump('CLEANUP');
	
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	// jQuery().unbind('load_from_mytimeline_cache_done');

	this.cleanupTimeline();

	this.stopTrackingStageActiveState();
	
	sch.unlisten(document, 'temp_cache_cleared', this.resetTwitState);
	
	
	// this.stopRefresher();
};


/**
 * initializes the timeline 
 */
MyTimelineAssistant.prototype.initTimeline = function() {
	
	sch.debug('initializing Timeline in assistant');
  // TODO: Timeline list widget
	this.timelineModel = {items: []};
  // this.controller.setupWidget("list-id", {}, this.timelineModel);
	
	var thisA = this;
	/*
		set up the combined "my" timeline
	*/
	this.mytl   = new SpazTimeline({
		'timeline_container_selector' :'#my-timeline',
		'entry_relative_time_selector':'span.date',
		
		'success_event':'new_combined_timeline_data',
		'failure_event':'error_combined_timeline_data',
		'event_target' :document,
		
		'refresh_time':sc.app.prefs.get('network-refreshinterval'),
		'max_items':100, // this isn't actually used atm

		'request_data': function() {
			if (thisA.isTopmostScene()) {
				// sc.helpers.markAllAsRead('#my-timeline div.timeline-entry.new');
				jQuery('#my-timeline div.timeline-entry.new').removeClass('new');
			}
			thisA.getData();
		},
		'data_success': function(e, data) {
			data = data.reverse();
			var no_dupes = [];
			
			var previous_count = jQuery('#my-timeline div.timeline-entry').length;
			
			var $oldFirst = jQuery('#my-timeline div.timeline-entry:first');
			
			for (var i=0; i < data.length; i++) {
				
				/*
					only add if it doesn't already exist
				*/
				if (jQuery('#my-timeline div.timeline-entry[data-status-id='+data[i].id+']').length<1) {
					
					sc.app.Tweets.save(data[i]);
					data[i].text = Spaz.makeItemsClickable(data[i].text);
					no_dupes.push(data[i]);
				}
				
			};
			
			thisA.mytl.addItems(no_dupes);

      // TODO: Timeline list widget
      sc.app.Tweets.bucket.all(function(tweets) {
        thisA.timelineModel.items = tweets;
        sc.info("Finished loading tweets. There are now " + tweets.length);
      //   thisA.controller.modelChanged(thisA.timelineModel);
      });
			
			/*
				sort timeline
			*/
			var before = new Date();
			
			// don't sort if we don't have anything new!
			if (no_dupes.length > 0) {
				// get first of new times
				var new_first_time = no_dupes[0].SC_created_at_unixtime;
				// get last of new times
				var new_last_time  = no_dupes[no_dupes.length-1].SC_created_at_unixtime;
				// get first of OLD times
				var old_first_time = parseInt($oldFirst.attr('data-timestamp'), 10);
				
				sch.debug('new_first_time:'+new_first_time);
				sch.debug('new_last_time:'+new_last_time);
				sch.debug('old_first_time:'+old_first_time);
				
				// sort if either first new or last new is OLDER than the first old
				if (new_first_time < old_first_time || new_last_time < old_first_time) {
					jQuery('#my-timeline div.timeline-entry').tsort({attr:'data-timestamp', place:'orig', order:'desc'});					
				} else {
					sch.debug('Didn\'t resort…');
				}

			}
			var after = new Date();
			var total = new Date();
			total.setTime(after.getTime() - before.getTime());
			sch.debug('Sorting took ' + total.getMilliseconds() + 'ms');
			
			sc.helpers.updateRelativeTimes('#my-timeline div.timeline-entry span.date', 'data-created_at');
			
			/*
				re-apply filtering
			*/
			thisA.filterTimeline();
			
			/*
				Get new counts
			*/
			var new_count         = jQuery('#my-timeline div.timeline-entry.new:visible').length;
			var new_mention_count = jQuery('#my-timeline div.timeline-entry.new.reply:visible').length;
			var new_dm_count      = jQuery('#my-timeline div.timeline-entry.new.dm:visible').length;
			
			/*
				Scroll to the first new if there are new messages
				and there were already some items in the timeline
			*/
			if (new_count > 0) {

				// thisA.playAudioCue('newmsg');
				
				if (previous_count > 0) {
					if (sc.app.prefs.get('timeline-scrollonupdate')) {
						if (thisA.isTopmostScene()) {
							sch.dump("Scrolling to New because previous_count > 0 (it wasn't empty before we added new stuff)");
							thisA.scrollToNew();
						}
					}
				}
			}
			
			/*
				if we're not fullscreen, show a dashboard notification of new count(s)
			*/
			if (!thisA.isFullScreen) {
				
				if (new_count > 0 && sc.app.prefs.get('notify-newmessages')) {
					thisA.newMsgBanner(new_count, 'newMessages');
				}
				if (new_mention_count > 0 && sc.app.prefs.get('notify-mentions')) {
					thisA.newMsgBanner(new_mention_count, 'newMentions');
				}
				if (new_dm_count > 0 && sc.app.prefs.get('notify-dms')) {
					thisA.newMsgBanner(new_dm_count, 'newDirectMessages');
				}
				
			} else {
				sch.dump("I am not showing a banner! in "+thisA.controller.sceneElement.id);
			}
			
			thisA.hideInlineSpinner('activity-spinner-my-timeline');
			
			thisA.saveTimelineCache();
		},
		'data_failure': function(e, error_array) {
			dump('error_combined_timeline_data - response:');
			thisA.hideInlineSpinner('activity-spinner-my-timeline');
			
			var err_msg = $L("There were errors retrieving your combined timeline");
			thisA.displayErrorInfo(err_msg, error_array);
		},
		'renderer': function(obj) {
			try {
				if (obj.SC_is_dm) {
					return sc.app.tpl.parseTemplate('dm', obj);
				} else {
					return sc.app.tpl.parseTemplate('tweet', obj);
				}				
			} catch(err) {
				sch.error("There was an error rendering the object: "+sch.enJSON(obj));
				sch.error("Error:"+sch.enJSON(err));
				return '';
			}
			
			
		}
	});
	
	/*
		override the standard removeExtraItems
	*/
	this.mytl.removeExtraItems = this.removeExtraItems;
	
};



MyTimelineAssistant.prototype.cleanupTimeline = function() {
	
	sch.debug('cleaning up Timeline in assistant');
	
	var thisA = this;
	
	if (this.mytl && this.mytl.cleanup) {
		/*
			unbind and stop refresher for public timeline
		*/
		this.mytl.cleanup();		
	}
	
};



MyTimelineAssistant.prototype.loadTimelineCache = function() {
	
	var thisA = this;

	this._loadTimelineCache = function() {
		var data = TempCache.load('mytimelinecache');

		if (data !== null) {
			thisA.twit.setLastId(SPAZCORE_SECTION_HOME, data[SPAZCORE_SECTION_HOME + '_lastid']);
			thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
			thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);

			document.getElementById('my-timeline').innerHTML = data.tweets_html;
			sch.markAllAsRead('#my-timeline div.timeline-entry');
		}
		sch.unlisten(document, 'temp_cache_load_db_success', this._loadTimelineCache);
		
	};

	
	
	
	
	if (!TempCache.exists()) {
		sch.dump('CACHE DOES NOT EXIST');
		sch.listen(document, 'temp_cache_load_db_success', this._loadTimelineCache);
		TempCache.loadFromDB();
	} else {
		this._loadTimelineCache();
	}
	
	
};

MyTimelineAssistant.prototype.saveTimelineCache = function() {
	
	var tweetsModel_html = document.getElementById('my-timeline').innerHTML;
	
	sch.dump(tweetsModel_html);
	
	var twitdata = {};
	twitdata['version']                            = this.cacheVersion || -1;
	twitdata['tweets_html']                        = tweetsModel_html;
	twitdata[SPAZCORE_SECTION_HOME + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_HOME);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);
	
	sch.debug(twitdata);
	sch.debug('LASTIDS!');
	sch.debug(twitdata[SPAZCORE_SECTION_HOME + '_lastid']);
	sch.debug(twitdata[SPAZCORE_SECTION_REPLIES + '_lastid']);
	sch.debug(twitdata[SPAZCORE_SECTION_DMS     + '_lastid']);
	
		
	TempCache.save('mytimelinecache', twitdata);
	
	TempCache.saveToDB();
	
	
};



MyTimelineAssistant.prototype.getData = function() {
	
	var thisA = this;
	
	if (thisA.isTopmostScene()) {
		sc.helpers.markAllAsRead('#my-timeline div.timeline-entry');
	}
	
	function getCombinedTimeline(statusobj) {
		
		dump(statusobj);
		
		if ( statusobj.isInternetConnectionAvailable === true) {
			thisA._getData.call(thisA);
		} else {
			thisA.showBanner('Not connected to Internet');
		}
		
	}
	
	if ( Mojo.Host.current === Mojo.Host.browser ) {
		this._getData();
	}	
	/*
		only get data if we're connected
	*/
	this.checkInternetStatus( getCombinedTimeline );
};

MyTimelineAssistant.prototype._getData = function() {
	
	this.showInlineSpinner('activity-spinner-my-timeline', 'Loading tweets…', true);

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
	this.mytl.start();
};



MyTimelineAssistant.prototype.renderTweets = function(tweets, render_callback, from_cache) {
	
	

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
		);
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
 * fires 'get_one_status_succeeded' on retrieval
 */
MyTimelineAssistant.prototype.getTweetFromModel = function(id, isdm) {
	

};



/*
	add to tweetsModel
*/
MyTimelineAssistant.prototype.addTweetToModel = function(twobj) {
	// var newlen = this.tweetsModel.push(twobj);
	// dump('this.tweetsModel is now '+newlen+' items long');
};


MyTimelineAssistant.prototype.removeExtraItems = function() {

	sch.debug('Removing Extra Items ==================================================');

	sch.debug("normal tweets: " + jQuery('#my-timeline div.timeline-entry:not(.reply):not(.dm)').length);
	sch.debug("reply tweets: "  + jQuery('#my-timeline div.timeline-entry.reply').length);
	sch.debug("dm tweets: "     + jQuery('#my-timeline div.timeline-entry.dm').length);

	/*
		from html timeline
	*/
	sch.debug('timeline-maxentries:'+sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));

	jQuery('#my-timeline>div:empty').remove(); // remove empty containers

	sch.debug("normal tweets: " + jQuery('#my-timeline div.timeline-entry:not(.reply):not(.dm)').length);
	sch.debug("reply tweets: "  + jQuery('#my-timeline div.timeline-entry.reply').length);
	sch.debug("dm tweets: "     + jQuery('#my-timeline div.timeline-entry.dm').length);	
	sch.debug("jQuery('.timeline').children().length:"+jQuery('.timeline').children().length);
	sch.debug("jQuery('#my-timeline').get(0).outerHTML:\n"+jQuery('#my-timeline').get(0).outerHTML);
};



/**
 *  
 */
MyTimelineAssistant.prototype.filterTimeline = function(command) {
	
	if (!command) {
		command = this._filterState;
		return;
	}
	
	
	var states = [
					'filter-timeline-all',
					'filter-timeline-replies-dm',
					'filter-timeline-replies',
					'filter-timeline-dms'
	];
	
	for (var i=0; i < states.length; i++) {
		if (command === states[i]) {
			jQuery('#my-timeline').addClass(states[i]);
		} else {
			jQuery('#my-timeline').removeClass(states[i]);
		}
	};
	
	sch.dump("Scrolling to top after applying filter");
	this.scrollToTop();
	
	this._filterState = command;	
};


