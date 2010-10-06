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
	

	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	
	sch.error('argFromPusher:'+argFromPusher);
	if (argFromPusher && argFromPusher.filter) {
	    sch.error('argFromPusher.filter:'+argFromPusher.filter);
	}
	
    if (argFromPusher && argFromPusher.firstload === true) {
        // console.debug();
        // this.clearTimelineCache();
    }

    if (argFromPusher && argFromPusher.filter) {
        this.setFilterState(argFromPusher.filter);
		this.toggleCmd = argFromPusher.filter;
		// this.filterTimeline(null, true);
    }

	if (argFromPusher && argFromPusher.mark_cache_as_read === false) {
		this.markCacheAsRead = false;
	} else {
		this.markCacheAsRead = true;
	}
	
	this.cacheVersion = 3;  // we increment this when we change how the cache works	
	
	/**
	 * empties the timeline and resets the lastids in the twit object
	 * 
	 * bound to temp_cache_cleared 
	 * 
	 * we define this here to get the closure thisA
	 */
	this.resetTwitState = function() {
		App.master_timeline_model.items = [];
		thisA.timeline_model.items = [];
		thisA.controller.modelChanged(thisA.timeline_model);
		thisA.twit.setLastId(SPAZCORE_SECTION_HOME, 0);
		thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, 0);
		thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     0);

	};
	
	/*
		we might need to NOT save the cache on deactivate, if we switch users from here
	*/
	this.doNotSaveCacheOnDeactivate = false;
	
}

MyTimelineAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};


MyTimelineAssistant.prototype.setup = function() {
	Mojo.Log.error("SETUP");

	var thisA = this;
	

	this.scroller = this.controller.getSceneScroller();


	/* this function is for setup tasks that have to happen when the scene is first created */

	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });

	this.initTwit('DOM');
	//Sets up meta-tap + scroll handler
	
	this.listenForMetaTapScroll();
	
	/*
		this will set the state for this.isFullScreen
	*/
	this.trackStageActiveState();

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label: $L('Refresh'),  icon:'sync', command:'refresh', shortcut:'R'},
					{label: App.username, command:'toggle-accounts-panel', width:200},
					{label: $L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}

					//{label: $L('Filter timeline'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'}
				
				]
			}
			
		],
		cmdMenuItems: [
			{},
			{
				/*
					So we don't get the hard-to-see disabled look on the selected button,
					we make the current toggle command "IGNORE", which will not trigger an action
				*/
				toggleCmd:this.toggleCmd||'filter-timeline-all',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'filter-timeline-all', shortcut:'T', 'class':"palm-header left"},
					{label:'@',	icon:'at', command:'filter-timeline-replies'}, 
					{label:$L('DM'), icon: 'dms', secondaryIconPath:'', command:'filter-timeline-dms'},
					{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
					{label:$L('Search'),    icon:'search', command:'search', shortcut:'S'}
				]
			},
			{}
		]
	});
	
	/*
	 * Accounts list
	 */
	this.Users = new SpazAccounts(App.prefs);
	this.Users.load();
	
	sch.debug(this.Users);
	
	this.controller.setupWidget("accountList",
		this.accountsAtts = {
			itemTemplate: 'startlogin/user-list-entry',
			listTemplate: 'startlogin/user-list-container',
			dividerTemplate:'startlogin/user-list-separator',
			swipeToDelete: false,
			autoconfirmDelete: false,
			reorderable: false
			
		},
		this.accountsModel = {
			listTitle: $L('Accounts'),
			items : this.Users.getAll()
		}
	);
	Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listTap, function(e) {
		
		/*
			save current user's cache and don't save on deactivate
		*/
		thisA.saveTimelineCache();
		thisA.doNotSaveCacheOnDeactivate = true;
		
		sch.debug('CLICKED ON ITEM');
		sch.debug(sch.enJSON(e.item));
		
		/*
			set properties for new user
		*/
		App.username = e.item.username;
		App.auth		= e.item.auth;
		App.type     = e.item.type;
		App.userid	= e.item.id;
		
		sch.debug('App.username:' + App.username);
		sch.debug('App.auth:'     + App.auth);  
		sch.debug('App.type:'     + App.type);   
		sch.debug('App.userid:'	 + App.userid);
		
		App.prefs.set('last_userid', App.userid);
		
		Spaz.popAllAndPushScene("my-timeline");
	});
	
	this.setupInlineSpinner('activity-spinner-my-timeline');
	

	this.refreshOnActivate = true;
	
	
	this.controller.setupWidget("my-timeline",
		this.timeline_attributes = {
			itemTemplate: 'timeline-entry',
			listTemplate: 'timeline-container',
			emptyTemplate: 'timeline-container-empty',
			swipeToDelete: false,
			reorderable: false,
			hasNoWidgets: true,
			formatters: {
				'data': function(value, model) {
					return thisA.renderItem(value);
				}
			}
		},
		this.timeline_model = {
			items : []
		}
	);
	this.timeline_list = this.controller.get('my-timeline');
	
	/*
		all of the data goes here. this data is filtered and copied to 
		this.timeline_model as appropriate
	*/
	App.master_timeline_model = {
		'items':[]
	};
	
	
	
};



MyTimelineAssistant.prototype.activate = function(params) {
	
	if (!params) {
		params = {};
	}
	
	Mojo.Log.error('ACTIVATE');

	Mojo.Log.error('params: %j', params);

	var thisA = this; // for closures

	thisA.activateStarted = true;

	if (!params.returnFromPop) { // don't run this if returnFromPop = true was passed

		this.showInlineSpinner('activity-spinner-my-timeline', 'Loading cache…');

		/*
			load the App cache, and fire callback when it loads
		*/
		this.getAppAssistant().loadTimelineCache(function(e) {
			
			/*
				grab our data for this user in the cache
			*/
			thisA.loadTimelineCache();
			
			/*
				always mark the cached data as read, no matter what
			*/
			thisA.markAllAsRead();

			thisA.hideInlineSpinner('activity-spinner-my-timeline');

			var tts = App.prefs.get('timeline-text-size');
			thisA.setTimelineTextSize('#my-timeline', tts);

			/*
				start the mytimeline 
			*/
			if (thisA.refreshOnActivate || (params && params.refresh === true)) {
				thisA.refresh(thisA.markCacheAsRead);
				thisA.refreshOnActivate = false;
				thisA.markCacheAsRead = true;
			}
		});
	}

	/*
	Prepare for timeline entry taps
	*/
	thisA.bindTimelineEntryTaps('my-timeline');

	this.showBetaWarningAlert();
	
};


MyTimelineAssistant.prototype.deactivate = function(event) {
	
	var thisA = this;
	
	Mojo.Log.error('DEACTIVATE');
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('my-timeline');
	
		
};



MyTimelineAssistant.prototype.cleanup = function(event) {
	
	Mojo.Log.error('CLEANUP');	
	
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	// jQuery(document).unbind('load_from_mytimeline_cache_done');

	this.stopTrackingStageActiveState();
	
	// this.stopRefresher();
};


MyTimelineAssistant.prototype.considerForNotification = function(params){   
	Mojo.Log.error('NOTIFICATION RECEIVED:%j', params);

	if (params) {
	    switch(params.event) {

            case "temp_cache_cleared":
                this.resetTwitState();
                break;

    	    case "refresh":
    	        this.refresh(this.markCacheAsRead);
    	        break;
    	}
	}
	
	return;   
};



MyTimelineAssistant.prototype.refresh = function(mark_as_read) {
	var thisA = this;

	Mojo.Log.info('refresh()');

	if (mark_as_read !== false) {
		mark_as_read = true;
	}

	if (thisA.isTopmostScene() && mark_as_read) {
		thisA.markAllAsRead();
	}

	this.showInlineSpinner('activity-spinner-my-timeline', 'Loading…');

	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);

	function getCombinedTimeline(statusobj) {

		if ( statusobj.isInternetConnectionAvailable === true) {
			
			thisA.twit.getCombinedTimeline(
				{
					'friends_count':App.prefs.get('timeline-friends-getcount'),
					'replies_count':App.prefs.get('timeline-replies-getcount'),
					'dm_count':App.prefs.get('timeline-dm-getcount')
				},
				function(data) {
					
					Mojo.Log.info('getCombinedTimeline success');
					
					var new_count = 0, new_mention_count = 0, new_dm_count = 0, previous_count = 0;

					previous_count = App.master_timeline_model.items.length;
					
					if (sch.isArray(data)) {
						data = data.reverse();
						var no_dupes = [];

						for (var i=0; i < data.length; i++) {

							/*
							only add if it doesn't already exist
							*/
							if (!thisA.itemExistsInModel(data[i])) {

								App.Tweets.save(data[i]);

								data[i].text = Spaz.makeItemsClickable(data[i].text);
								data[i].Spaz_is_new = true;

								no_dupes.push(data[i]);

								new_count++;

								if (data[i].SC_is_reply) {
									new_mention_count++;
								} else if (data[i].SC_is_dm) {
									new_dm_count++;
								}
							}

						}


						thisA.addItems(no_dupes);
					}


					thisA.hideInlineSpinner('activity-spinner-my-timeline');

					/*
					if we're not fullscreen, show a dashboard notification of new count(s)
					*/
					if (!thisA.isFullScreen) {

						if (new_count > 0 && App.prefs.get('notify-newmessages')) {
							thisA.newMsgBanner(new_count, 'newMessages', 'notifications');
						}
						if (new_mention_count > 0 && App.prefs.get('notify-mentions')) {
							thisA.newMsgBanner(new_mention_count, 'newMentions', 'notifications');
						}
						if (new_dm_count > 0 && App.prefs.get('notify-dms')) {
							thisA.newMsgBanner(new_dm_count, 'newDirectMessages', 'notifications');
						}

					} else {
						Mojo.Log.info("I am not showing a banner! in "+thisA.controller.sceneElement.id);
					}

				},
				function(errors) {
					var num_errors = 1;
					var err_msg = '';
					
					if (sch.isArray(errors)) {
						num_errors = errors.length;
					}
					
					if (num_errors > 1) {
						err_msg = $L("There were #{num_errors} errors:").interpolate({'num_errors':num_errors});
					} else {
						err_msg = $L("There was #{num_errors} error:").interpolate({'num_errors':num_errors});
					}
					thisA.displayErrorInfo(err_msg, errors);

					thisA.hideInlineSpinner('activity-spinner-my-timeline');
				}
			);
		
		} else {
			thisA.showBanner('Not connected to Internet');
		}

	}

	/*
		only get data if we're connected
	*/
	this.checkInternetStatus( getCombinedTimeline );

};



/*
	redefine addItems to work with list model
*/
MyTimelineAssistant.prototype.addItems = function(new_items) {
	
	Mojo.Log.error("addItems");
	
	// now we have all the existing items from the model
	var model_items = App.master_timeline_model.items.clone();
	
	var model_item;
	for (var i=0; i < new_items.length; i++) {
		model_item = {
			'id':new_items[i].id,
			'data':sch.clone(new_items[i])
		};
		// add each item to the model
		model_items.push(model_item);
	}
	
	// sort, in reverse
	model_items.sort(function(a,b){
		return b.data.SC_created_at_unixtime - a.data.SC_created_at_unixtime; // newest first
	});
	
	// re-assign the cloned items back to the model object
	App.master_timeline_model.items = model_items;
	
	var thisA = this;	
	setTimeout(function() {
		thisA.saveTimelineCache();
	}, 1000);
	
	// this filters and updates the model
	this.filterTimeline(null, false, true);
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
};


MyTimelineAssistant.prototype.renderItem = function(obj) {
    
    var html = '';

    Mojo.Timing.resume("timing_this.mytl.renderer");
	try {
		if (obj.SC_is_dm) {
			html = App.tpl.parseTemplate('dm', obj);
		} else {
			html = App.tpl.parseTemplate('tweet', obj);
		}
		Mojo.Timing.pause("timing_this.mytl.renderer");
		return html;
		
	} catch(err) {
		sch.error("There was an error rendering the object: "+sch.enJSON(obj));
		sch.error("Error:"+sch.enJSON(err));
		Mojo.Timing.pause("timing_this.mytl.renderer");
    	
		return '';
	}
    
};

MyTimelineAssistant.prototype.itemExistsInModel = function(obj) {
	

	for (var i=0; i < App.master_timeline_model.items.length; i++) {
		if (App.master_timeline_model.items[i].id == obj.id) {
			Mojo.Log.info(obj.id +' exists in model');
			return true;
		}
	}
	Mojo.Log.info(obj.id +' does not exist in model');
	return false;
};

/**
 * loop through items in master_timeline_model and set Spaz_is_new = false, Spaz_is_read = true
 */
MyTimelineAssistant.prototype.markAllAsRead = function() {
	
	// die early
	// return;
	
	
	Mojo.Log.error("markAllAsRead");
	
	Mojo.Timing.resume("timing_html_markAllAsRead");
	
	for (var i=0; i < App.master_timeline_model.items.length; i++) {
		App.master_timeline_model.items[i].data.Spaz_is_new = false;
		App.master_timeline_model.items[i].data.Spaz_is_read = true;
	}
	
	Mojo.Timing.pause("timing_html_markAllAsRead");
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_html", "Updating HTML element times"));
	
	
	this.filterTimeline(null, false, false);
	// this.controller.modelChanged(this.timeline_model);
};


MyTimelineAssistant.prototype.loadTimelineCache = function() {
	
	sch.error('LOADTIMELINECACHE MyTimelineAssistant');
	
	Mojo.Timing.resume("timing_loadTimelineCache");
	
	var data = App.cache.load('mytimelinecache');

	if (data !== null) {
		this.twit.setLastId(SPAZCORE_SECTION_HOME, data[SPAZCORE_SECTION_HOME + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);
		
		if (data['my_master_timeline_model_items']) {
			App.master_timeline_model.items = data['my_master_timeline_model_items'];
		} else {
			App.master_timeline_model.items = [];
		}
		
		this.filterTimeline(null, true, false);
		
	}

	Mojo.Timing.pause("timing_loadTimelineCache");
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
};



MyTimelineAssistant.prototype.saveTimelineCache = function() {
	
	sch.error('SAVETIMELINECACHE');
	
	Mojo.Timing.resume("timing_saveTimelineCache");
	
	var cached_items = [];
	
	/*
		generate current counts, and create array to cache
	*/
	var num_dms = 0, num_replies = 0, num_statuses = 0;
	var max_dms = App.prefs.get('timeline-cache-maxentries-dm');
	var max_replies = App.prefs.get('timeline-cache-maxentries-reply');
	var max_statuses = App.prefs.get('timeline-cache-maxentries');
	for (var i=0; i < App.master_timeline_model.items.length; i++) {
		if (App.master_timeline_model.items[i].data.SC_is_dm) {
			num_dms++;
			if (num_dms <= max_dms) {
				cached_items.push(App.master_timeline_model.items[i]);
			}
		} else if (App.master_timeline_model.items[i].data.SC_is_reply) {
			num_replies++;
			if (num_replies <= max_replies) {
				cached_items.push(App.master_timeline_model.items[i]);
			}			
		} else {
			num_statuses++;
			if (num_statuses <= max_statuses) {
				cached_items.push(App.master_timeline_model.items[i]);
			}
		}
	}
	
	
	Mojo.Log.info('Counts: DMs %s, Replies %s, Statuses %s', num_dms, num_replies, num_statuses);
	
	Mojo.Log.info('Length of master_timeline_model.items: '+App.master_timeline_model.items.length);
	
	var twitdata = {};
	twitdata['version']                         = this.cacheVersion || -1;
	twitdata['my_master_timeline_model_items']  = cached_items;
	
	Mojo.Log.info('Length of twitdata[\'my_master_timeline_model_items\']: '+twitdata['my_master_timeline_model_items'].length);
	
	twitdata[SPAZCORE_SECTION_HOME + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_HOME);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);
	
	/*
		write out the lastIDs to a cookie, so we can use this data in
		the bgnotifier without loading the whole cache
	*/
	this.getAppAssistant().saveLastIDs(
		this.twit.getLastId(SPAZCORE_SECTION_HOME),
		this.twit.getLastId(SPAZCORE_SECTION_REPLIES),
		this.twit.getLastId(SPAZCORE_SECTION_DMS)
	);

	App.cache.save('mytimelinecache', twitdata, App.userid);
	
	Mojo.Timing.pause('timing_saveTimelineCache');
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	
};

/**
 * this filters and updates the model
 */
MyTimelineAssistant.prototype.filterTimeline = function(command, scroll_to_top, scroll_to_new) {
	
	if (!command) {
		if (this._filterState) {
			command = this._filterState;
		} else {
			command = 'filter-timeline-all';
		}
	}
	
	Mojo.Log.error('COMMAND:'+command);
	
	var states = [
					'filter-timeline-all',
					'filter-timeline-replies-dm',
					'filter-timeline-replies',
					'filter-timeline-dms'
	];
	
	var valid = false;
	for (i=0; i < states.length; i++) {
		if (command === states[i]) {
			valid = true;
		}
	};
	
	if (!valid) {
		sch.error('Not a valid command');
		this.controller.modelChanged(this.timeline_model);
		return;
	}
	
	// reset the timeline_model
	this.timeline_model.items = [];

	Mojo.Log.info('App.master_timeline_model.items length: %s', App.master_timeline_model.items.length);
	Mojo.Log.info('this.timeline_model.items length: %s', this.timeline_model.items.length);


	switch(command) {
		case 'filter-timeline-all':
			this.timeline_model.items = App.master_timeline_model.items;
			break;
			
		case 'filter-timeline-replies':
			for (i=0; i < App.master_timeline_model.items.length; i++) {
				if (App.master_timeline_model.items[i].data.SC_is_reply) {
					this.timeline_model.items.push(App.master_timeline_model.items[i]);
				}
			}
			break;
			
		case 'filter-timeline-dms':
			for (i=0; i < App.master_timeline_model.items.length; i++) {
				if (App.master_timeline_model.items[i].data.SC_is_dm) {
					this.timeline_model.items.push(App.master_timeline_model.items[i]);
				}
			}
			break;
			
		case 'filter-timeline-replies-dm':
			for (i=0; i < App.master_timeline_model.items.length; i++) {
				if (App.master_timeline_model.items[i].data.SC_is_dm || App.master_timeline_model.items[i].data.SC_is_reply) {
					this.timeline_model.items.push(App.master_timeline_model.items[i]);
				}
			}
			break;
			
		default:
			this.timeline_model.items = App.master_timeline_model.items;
			break;
	}
	
	Mojo.Log.info('this.timeline_model.items length: %s', this.timeline_model.items.length);
	
	if (this.controller) { // sanity check in case we change context
		this.controller.modelChanged(this.timeline_model);
	}
	

	this.setFilterState(command);
	
	if (scroll_to_top) {
		this.scrollToTop();
	}
	

	
	if (App.prefs.get('timeline-scrollonupdate') && scroll_to_new) {
		if (this.isTopmostScene()) {
			this.scrollToNew();
		}
	}
	
};

/**
 * set the filterstate directly to be applied next time around 
 */
MyTimelineAssistant.prototype.setFilterState = function(state) {
    Mojo.Log.info('NEW FILTER STATE:'+state);
    this._filterState = state;
};
