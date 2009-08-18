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
		// console.debug();
		// this.clearTimelineCache();
	}
	
	


	this.cacheVersion = 3;  // we increment this when we change how the cache works
	
	
	this.cacheDepot = makeCacheDepot(false);

}



MyTimelineAssistant.prototype.setup = function() {
	
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
	
	this.loadTimelineCache();
};



MyTimelineAssistant.prototype.activate = function(event) {

	var thisA = this; // for closures

	var tts = sc.app.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#my-timeline', tts);
	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	this.activateStarted = true;
	
	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('#my-timeline');

	/*
		set up the public timeline
	*/
	this.mytl   = new SpazTimeline({
		'timeline_container_selector' :'#my-timeline',
		'entry_relative_time_selector':'span.date',
		
		'success_event':'new_combined_timeline_data',
		'failure_event':'error_combined_timeline_data',
		'event_target' :document,
		
		'refresh_time':sc.app.prefs.get('network-refreshinterval'),
		'max_items':50,

		'request_data': function() {
			sc.helpers.markAllAsRead('#my-timeline div.timeline-entry');
			thisA.getData();
		},
		'data_success': function(e, data) {
			var data = data.reverse();
			var no_dupes = [];
			
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
			sc.helpers.updateRelativeTimes('#my-timeline div.timeline-entry span.date', 'data-created_at');
			/*
				re-apply filtering
			*/
			thisA.filterTimeline();
			
			var new_count = jQuery('#my-timeline div.timeline-entry.new:visible').length;
			
			if (new_count > 0) {
				thisA.playAudioCue('newmsg');
			}
			
			if (new_count > 0 && !thisA.isFullScreen) {
				thisA.newMsgBanner(new_count);
			} else if (thisA.isFullScreen) {
				dump("I am not showing a banner! in "+thisA.controller.sceneElement.id);
			}
			thisA.hideInlineSpinner('activity-spinner-my-timeline');
		},
		'data_failure': function(e, error_array) {
			dump('error_combined_timeline_data - response:');
			thisA.hideInlineSpinner('activity-spinner-my-timeline');
			
			var err_msg = $L("There were errors retrieving your combined timeline");
			thisA.displayErrorInfo(err_msg, error_array);
		},
		'renderer': function(obj) {
			if (obj.SC_is_dm) {
				return sc.app.tpl.parseTemplate('dm', obj);
			} else {
				return sc.app.tpl.parseTemplate('tweet', obj);
			}
			
			
		}
	});
	
	/*
		start the mytimeline 
	*/
	if (this.refreshOnActivate) {
		this.mytl.start();
		this.refreshOnActivate = false;
	}

};


MyTimelineAssistant.prototype.deactivate = function(event) {
	
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('#my-timeline');

	/*
		unbind and stop refresher for public timeline
	*/
	this.mytl.cleanup();
	
};

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	// jQuery().unbind('load_from_mytimeline_cache_done');

	this.stopTrackingStageActiveState();
	
	this.saveTimelineCache();
	
	// this.stopRefresher();
};


MyTimelineAssistant.prototype.loadTimelineCache = function() {

	var thisA = this;
	
	var data = Spaz.loadTempCache('mytimelinecache');
	
	if (data !== null) {
		this.twit.setLastId(SPAZCORE_SECTION_FRIENDS, data[SPAZCORE_SECTION_FRIENDS + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);

		document.getElementById('my-timeline').innerHTML = data.tweets_html;
		sch.markAllAsRead('#my-timeline div.timeline-entry');		
	}
	
};

MyTimelineAssistant.prototype.saveTimelineCache = function() {
	
	var tweetsModel_html = document.getElementById('my-timeline').innerHTML;
	
	var twitdata = {};
	twitdata['version']                            = this.cacheVersion || -1;
	twitdata['tweets_html']                        = tweetsModel_html;
	twitdata[SPAZCORE_SECTION_FRIENDS + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_FRIENDS);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);
	
	
	Spaz.saveTempCache('mytimelinecache', twitdata);
	
	
};



MyTimelineAssistant.prototype.getData = function() {
	
	var thisA = this;
	
	sch.markAllAsRead('#my-timeline div.timeline-entry');
	
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
	
	
	// dump('Rendering these tweets ==========================================================');
	// dump(tweets);
	// dump('=================================================================================');
	// 
	// 
	// if (from_cache !== true) {
	// 	from_cache = false;
	// }
	// 
	// 	
	// var thisA = this;
	// 
	// /*
	// 	If there are new tweets, process them
	// */
	// // if (tweets && tweets.length>0) {
	// if (tweets && tweets.length>0) {
	// 	
	// 	profile();
	// 	
	// 	var rendertweets = tweets;
	// 	
	// 	var tweets_added = 0;
	// 	
	// 	var timeline_html = [];
	// 	
	// 	var added_ids = [];
	// 	
	// 	
	// 	function already_exists(id) {
	// 		
	// 		if (thisA.getEntryElementByStatusId(rendertweets[i].id)) {
	// 			return true;
	// 		}
	// 		if ( added_ids.indexOf(id) > -1 ) {
	// 			return true;
	// 		}
	// 		return false;
	// 		
	// 	}
	// 	
	// 	
	// 	for (var i=0; i < rendertweets.length; i++) {
	// 					
	// 		/*
	// 			check to see if this tweet exists
	// 		*/
	// 		if (rendertweets[i] == false) {
	// 
	// 			dump("Tweet object was FALSE; skipping");
	// 
	// 		} else if (!already_exists(rendertweets[i].id)) {
	// 			
	// 			added_ids.push(rendertweets[i].id);
	// 			
	// 			dump('adding '+rendertweets[i].id);
	// 			
	// 
	// 			
	// 			/*
	// 				skip rendering if we are loading from cache, as per new
	// 				approach of storing HTML timeline as well.
	// 			*/
	// 			
	// 			if (!from_cache) {
	// 				rendertweets[i].text = Spaz.makeItemsClickable(rendertweets[i].text);
	// 
	// 				if (from_cache) {
	// 					rendertweets[i].not_new = true;
	// 				}
	// 
	// 				/*
	// 					Render the tweet
	// 				*/
	// 				if (rendertweets[i].SC_is_dm) {
	// 					var itemhtml = sc.app.tpl.parseTemplate('dm', rendertweets[i]);
	// 				} else {
	// 					var itemhtml = sc.app.tpl.parseTemplate('tweet', rendertweets[i]);
	// 				}
	// 
	// 				/*
	// 					put item on timeline_html glob
	// 				*/
	// 				timeline_html[i] = itemhtml;
	// 			}
	// 			
	// 			// /*
	// 			// 	add to tweetsModel
	// 			// */
	// 			// this.addTweetToModel(rendertweets[i]);
	// 			// tweets_added++;
	// 			// 
	// 			// sc.app.Tweets.save(rendertweets[i]);
	// 			
	// 		} else {
	// 			dump('Tweet ('+rendertweets[i].id+') already is in timeline');
	// 		}
	// 
	// 	};
	// 	
	// 	if (timeline_html.length > 0) {
	// 		timeline_html.reverse();
	// 		/*
	// 			we wrap this in a simple <div> in order to get a big
	// 			speed increase when we prepend, but it does mean we 
	// 			can't assume #my-timeline>div.timeline-entry will work
	// 		*/
	// 		var tlel         = document.getElementById('my-timeline');
	// 		var htmlel       = document.createElement('div');
	// 		htmlel.innerHTML = timeline_html.join('');
	// 		tlel.insertBefore( htmlel, tlel.firstChild );
	// 		// 
	// 		// 
	// 		// 
	// 		// jQuery('#my-timeline').prepend('<div>'+timeline_html.join('')+'</div>');
	// 	}
	// 	
	// 
	// 	dump("tweets_added:"+tweets_added);
	// 	dump("from_cache:"+from_cache);
	// 	dump("sc.app.prefs.get('timeline-scrollonupdate'):"+sc.app.prefs.get('timeline-scrollonupdate'));
	// 	
	// 	if (!from_cache) {
	// 		var num_entries = jQuery('#my-timeline div.timeline-entry').length;
	// 		dump("num_entries:"+num_entries);
	// 		var old_entries = num_entries - tweets_added;
	// 		dump("old_entries:"+old_entries);
	// 		if ( tweets_added > 0 && old_entries > 0 && !from_cache && sc.app.prefs.get('timeline-scrollonupdate') ) {
	// 			dump("I'm going to scroll to new in 500ms!");
	// 			setTimeout(function() { thisA.scrollToNew(); }, 500);
	// 		} else {
	// 			dump("Not scrolling to new!");
	// 		}
	// 	}
	// 	
	// } else {
	// 	dump("no new tweets");
	// }
	// 
	// 
	// /*
	// 	we are done rendering, so call the optional callback
	// */
	// if (render_callback) {
	// 	dump('Calling render_callback #################################');
	// 	render_callback();
	// }
	// 
	// /*
	// 	remove extra items
	// */
	// this.removeExtraItems();
	// 
	// /*
	// 	Update relative dates
	// */
	// sch.updateRelativeTimes('div.timeline-entry .meta>.date', 'data-created_at');
	// 
	// /*
	// 	re-apply filtering
	// */
	// this.filterTimeline();
	// 
	// var new_count = jQuery('#my-timeline div.timeline-entry.new:visible').length;
	// 
	// if (!from_cache && new_count > 0) {
	// 	this.playAudioCue('newmsg');
	// }
	// 
	// if (!from_cache && new_count > 0 && !this.isFullScreen) {
	// 	this.newMsgBanner(new_count);
	// } else if (this.isFullScreen) {
	// 	dump("I am not showing a banner! in "+this.controller.sceneElement.id);
	// }
	// 
	// 
	// // this.hideInlineSpinner('#my-timeline-spinner-container');
	// this.startRefresher();
	// 
	// /*
	// 	Save this in case we need to load from cache
	// */
	// if (!from_cache) {		
	// 	this.hideInlineSpinner('activity-spinner-my-timeline');
	// 	this.saveTimelineCache();
	// } else {
	// 	this.hideInlineSpinner('activity-spinner-my-timeline');
	// 	jQuery().trigger('load_from_mytimeline_cache_done');
	// }
	// 
	// profileEnd();

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
 * Gets tweet from this.tweetsModel, or false if DNE 
 */
MyTimelineAssistant.prototype.getTweetFromModel = function(id) {
	
	// for(var i=0; i < this.tweetsModel.length; i++) {
	// 	if (this.tweetsModel[i].id == id) {
	// 		return this.tweetsModel[i];
	// 	}
	// }
	// 
	// return false;
};



/*
	add to tweetsModel
*/
MyTimelineAssistant.prototype.addTweetToModel = function(twobj) {
	// var newlen = this.tweetsModel.push(twobj);
	// dump('this.tweetsModel is now '+newlen+' items long');
};


MyTimelineAssistant.prototype.removeExtraItems = function() {
	/*
		from html timeline
	*/
	sch.removeExtraElements('#my-timeline div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));
	
	// /*
	// 	now sync the local model to the html
	// 	We go backwards because we're splicing
	// */
	// var thisA = this;
	// var new_model = [];
	// 
	// jQuery('#my-timeline div.timeline-entry').each( function() {
	// 	var id = jQuery(this).attr('data-status-id');
	// 	var this_obj = thisA.getTweetFromModel(id);
	// 	if (this_obj != false) {
	// 		new_model.push(this_obj);
	// 	} else {
	// 		dump('False was returned by thisA.getTweetFromModel(id). id='+id);
	// 	}
	// } );
	// this.tweetsModel = new_model.reverse();
	// 
	// 
	// var html_count  = jQuery('#my-timeline div.timeline-entry').length;
	// var norm_count  = jQuery('#my-timeline div.timeline-entry:not(.reply):not(.dm)').length;
	// var reply_count = jQuery('#my-timeline div.timeline-entry.reply').length;
	// var dm_count    = jQuery('#my-timeline div.timeline-entry.dm').length;
	// 
	// 
	// var model_count = this.tweetsModel.length;
	// 
	// dump('HTML COUNT:'+html_count);
	// dump('NORM COUNT:'+norm_count);
	// dump('REPLY COUNT:'+reply_count);
	// dump('DM COUNT:'+dm_count);
	// dump('MODEL COUNT:'+model_count);
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
	
	this._filterState = command;	
};