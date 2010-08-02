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
	
	var thisA = this;
	
	// this.tweetsModel = [];

	this.scroller = this.controller.getSceneScroller();
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });

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
  this.controller.setupWidget("timeline-filter", {delay: 500}, {});
	
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
	this.controller.listen("my-timeline", Mojo.Event.listTap, this.handleTimelineTap);
	this.controller.listen("timeline-filter", Mojo.Event.filter, this.handleFilterField.bind(this));
  this.filterField = this.controller.get("timeline-filter");

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
	
	// jQuery(document).unbind('load_from_mytimeline_cache_done');

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
	this.controller.setupWidget("my-timeline", {
    itemTemplate: "shared/tweet", 
    hasNoWidgets: true, 
    lookahead: 20, 
    renderLimit: 20,
    formatters: this.formatters }, this.timelineModel);
    

	
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
			thisA.getData();
		},
		'data_success': function(e, data) {
			var previous_count = thisA.timelineModel.items.length;
		  // set last since_id for setting new class on entries
			if(thisA.timelineModel.items.length > 0)
        thisA.last_created_at_unixtime = thisA.timelineModel.items[0].SC_created_at_unixtime;
      else
        thisA.last_created_at_unixtime = -1;
        
			var tweet;
			for (var i=0, j = data.length; i < j; i++) {
			  tweet = data[i];
			  tweet.text = Spaz.makeItemsClickable(tweet.text);
			  if(tweet.sender) {
			    tweet.user = tweet.sender;
			    tweet.sender = null;
			  }
				sc.app.Tweets.save(tweet);
			};
			
			Mojo.Log.error("About to render timeline");
      thisA.filterTimeline();

			/*
				Get new counts
			*/
			var new_count         = data.select(function(tweet) {
			  return !tweet.not_new;
			}).length;
			var new_mention_count = data.select(function(tweet) {
			  return (!tweet.not_new && tweet.SC_is_reply);
			}).length;
			var new_dm_count      = data.select(function(tweet) {
			  return (!tweet.not_new && tweet.SC_is_dm);
			}).length;
			
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
		},
		'data_failure': function(e, error_array) {
			dump('error_combined_timeline_data - response:');
			thisA.hideInlineSpinner('activity-spinner-my-timeline');
			
			var err_msg = $L("There were errors retrieving your combined timeline");
			thisA.displayErrorInfo(err_msg, error_array);
		},
		'renderer': function() {}
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
				jQuery(document).trigger('my_timeline_refresh');
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


