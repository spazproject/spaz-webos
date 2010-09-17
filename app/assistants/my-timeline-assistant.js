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
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	var thisA = this;
	
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

	this.cacheVersion = 3;  // we increment this when we change how the cache works
	
	
	this.cacheDepot = makeCacheDepot(false);
	
	
	/**
	 * empties the timeline and resets the lastids in the twit object
	 * 
	 * bound to temp_cache_cleared 
	 * 
	 * we define this here to get the closure thisA
	 */
	this.resetTwitState = function() {
		thisA.master_timeline_model.items = [];
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
	Mojo.Log.error("SETUP")

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
            swipeToDelete: false,
            reorderable: false,
            hasNoWidgets: true
        },
        this.timeline_model = {
            items : []
        }
    );
	
	/*
		all of the data goes here. this data is filtered and copied to 
		this.timeline_model as appropriate
	*/
	this.master_timeline_model = {
		'items':[]
	};
	
	this.loadTimelineCache();
	
	sch.listen(document, 'temp_cache_cleared', this.resetTwitState);	
};



MyTimelineAssistant.prototype.activate = function(params) {
	
	Mojo.Log.error('ACTIVATE');
	
	var thisA = this; // for closures


	var tts = App.prefs.get('timeline-text-size');
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
		this.refresh();
		this.refreshOnActivate = false;
	} else {
		this.filterTimeline(null);
	}

};


MyTimelineAssistant.prototype.deactivate = function(event) {
	
	Mojo.Log.error('DEACTIVATE');
	
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

	if (!this.doNotSaveCacheOnDeactivate) {
        this.saveTimelineCache();
	}
	
	
};



MyTimelineAssistant.prototype.cleanup = function(event) {
	
	Mojo.Log.error('CLEANUP');	
	
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	// jQuery(document).unbind('load_from_mytimeline_cache_done');

	this.stopTrackingStageActiveState();
	
	sch.unlisten(document, 'temp_cache_cleared', this.resetTwitState);
	
	
	// this.stopRefresher();
};

MyTimelineAssistant.prototype.handleTimelineTap = function(e) {
	jQuery('#my-timeline [data-status-id="'+e.item.id+'"]').trigger(Mojo.Event.tap);
};



MyTimelineAssistant.prototype.getEntryElementByStatusId = function(id) {
	var el = jQuery('#my-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
};



MyTimelineAssistant.prototype.refresh = function(event) {
	var thisA = this;

	Mojo.Log.error('refresh()');

	if (thisA.isTopmostScene()) {
		// jQuery('#my-timeline div.timeline-entry.new').removeClass('new');
		thisA.markAllAsRead();
		thisA.updateRelativeTimes();

	}

	this.showInlineSpinner('activity-spinner-my-timeline', 'Loading…');


	function getCombinedTimeline(statusobj) {

		if ( statusobj.isInternetConnectionAvailable === true) {
			
			thisA.twit.getCombinedTimeline(
				{
					'friends_count':App.prefs.get('timeline-friends-getcount'),
					'replies_count':App.prefs.get('timeline-replies-getcount'),
					'dm_count':App.prefs.get('timeline-dm-getcount')
				},
				function(data) {
					
					Mojo.Log.error('getCombinedTimeline success');
					
					var new_count = 0, new_mention_count = 0, new_dm_count = 0, previous_count = 0;

					previous_count = thisA.master_timeline_model.items.length;

					data = data.reverse();
					var no_dupes = [];

					for (var i=0; i < data.length; i++) {

						/*
						only add if it doesn't already exist
						*/
						if (!thisA.itemExistsInModel(data[i])) {

							App.Tweets.save(data[i]);

							data[i].text = Spaz.makeItemsClickable(data[i].text);

							no_dupes.push(data[i]);

							new_count++;

							if (data[i].SC_is_reply) {
								new_mention_count++;
							} else if (data[i].SC_is_dm) {
								new_dm_count++;
							}
						}

					}


					thisA.updateRelativeTimes();

					thisA.addItems(no_dupes);

					thisA.hideInlineSpinner('activity-spinner-my-timeline');


					/*
					Scroll to the first new if there are new messages
					and there were already some items in the timeline
					*/
					if (new_count > 0) {

						// thisA.playAudioCue('newmsg');

						if (previous_count > 0) {
							if (App.prefs.get('timeline-scrollonupdate')) {
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
						sch.error("I am not showing a banner! in "+thisA.controller.sceneElement.id);
					}

				},
				function(xhr, msg, exc) {
					var err_msg = $L("There was an error loading new messages");
					thisA.displayErrorInfo(err_msg, null);

					/*
					Update relative dates
					*/
					thisA.updateRelativeTimes();
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
	var model_items = this.master_timeline_model.items.clone();
	
	var model_item;
	for (var i=0; i < new_items.length; i++) {
		model_item = {
			'id':new_items[i].id,
			'data':sch.clone(new_items[i]),
			'html':this.renderItem(new_items[i])
		};
		// add each item to the model
		model_items.push(model_item);
		
	}
	
	// sort, in reverse
	model_items.sort(function(a,b){
		return b.id - a.id; // newest first
	});
	
	// re-assign the cloned items back to the model object
	this.master_timeline_model.items = model_items;
	
	// this filters and updates the model
	this.filterTimeline(null);
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
	

	for (var i=0; i < this.master_timeline_model.items.length; i++) {
		if (this.master_timeline_model.items[i].id == obj.id) {
			sch.error(obj.id +' exists in model');
			return true;
		}
	}
	sch.error(obj.id +' does not exist in model');
	return false;
};

/**
 * oh my god this is probably deadly for performance 
 */
MyTimelineAssistant.prototype.markAllAsRead = function() {
	
	Mojo.Log.error("markAllAsRead");
	
	for (var i=0; i < this.master_timeline_model.items.length; i++) {
		
		var $new_element = jQuery(this.master_timeline_model.items[i].html);

		if ($new_element.length>0) {
			$new_element.removeClass('new');
			this.master_timeline_model.items[i].html = $new_element[0].outerHTML;
		}
	}
	
	this.filterTimeline(null);
	// this.controller.modelChanged(this.timeline_model);
};


/**
 * oh my god this is probably deadly for performance 
 */
MyTimelineAssistant.prototype.updateRelativeTimes = function() {
	
	Mojo.Log.error("updateRelativeTimes");
	
	for (var i=0; i < this.master_timeline_model.items.length; i++) {
		var $new_element = jQuery(this.master_timeline_model.items[i].html);

		if ($new_element) {
			var unixtime = $new_element.find('span.date').attr('data-created_at');
			$new_element.find('span.date').html(sch.getRelativeTime(unixtime));
			this.master_timeline_model.items[i].html = $new_element[0].outerHTML;
		}

	}
	
	this.filterTimeline(null);
	// this.controller.modelChanged(this.timeline_model);
};



MyTimelineAssistant.prototype.loadTimelineCache = function() {
	
	sch.error('LOADTIMELINECACHE');
	
	Mojo.Timing.resume("timing_loadTimelineCache");
	var thisA = this;

	this._loadTimelineCache = function() {
		var data = TempCache.load('mytimelinecache');

		if (data !== null) {
			thisA.twit.setLastId(SPAZCORE_SECTION_HOME, data[SPAZCORE_SECTION_HOME + '_lastid']);
			thisA.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
			thisA.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);
			
			Mojo.Log.error("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
			Mojo.Log.error("current thisA.master_timeline_model.items: %j", thisA.master_timeline_model.items);
			Mojo.Log.error("data['my_master_timeline_model_items']: %j", data['my_master_timeline_model_items']);
			Mojo.Log.error("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
			
			if (data['my_master_timeline_model_items']) {
				thisA.master_timeline_model.items = data['my_master_timeline_model_items'];
			} else {
				thisA.master_timeline_model.items = [];
			}
			
			thisA.filterTimeline(null);
			// thisA.controller.modelChanged(thisA.timeline_model);
			
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
	
	Mojo.Timing.pause("timing_loadTimelineCache");
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
};



MyTimelineAssistant.prototype.saveTimelineCache = function() {
	
	sch.error('SAVETIMELINECACHE');
	
	Mojo.Timing.resume("timing_saveTimelineCache");
	
	
	Mojo.Log.error('this.master_timeline_model: %j', this.master_timeline_model);
	
	
	var twitdata = {};
	twitdata['version']                         = this.cacheVersion || -1;
	twitdata['my_master_timeline_model_items']  = this.master_timeline_model.items;
	twitdata[SPAZCORE_SECTION_HOME + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_HOME);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);

	TempCache.save('mytimelinecache', twitdata);
	
	TempCache.saveToDB();
	Mojo.Timing.pause('timing_saveTimelineCache');
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	
};

/**
 * this filters and updates the model
 */
MyTimelineAssistant.prototype.filterTimeline = function(command, scroll_to_top) {
	
	Mojo.Log.error('typeof this: "%s"', typeof(this));
	Mojo.Log.error('this.timeline_model: %j', this.timeline_model);
	Mojo.Log.error('this.master_timeline_model: %j', this.master_timeline_model);
	
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

	Mojo.Log.error('this.master_timeline_model.items length: %s', this.master_timeline_model.items.length);
	Mojo.Log.error('this.timeline_model.items length: %s', this.timeline_model.items.length);


	switch(command) {
		case 'filter-timeline-all':
			this.timeline_model.items = this.master_timeline_model.items;
			break;
			
		case 'filter-timeline-replies':
			for (i=0; i < this.master_timeline_model.items.length; i++) {
				if (this.master_timeline_model.items[i].data.SC_is_reply) {
					this.timeline_model.items.push(this.master_timeline_model.items[i]);
				}
			}
			break;
			
		case 'filter-timeline-dms':
			for (i=0; i < this.master_timeline_model.items.length; i++) {
				if (this.master_timeline_model.items[i].data.SC_is_dm) {
					this.timeline_model.items.push(this.master_timeline_model.items[i]);
				}
			}
			break;
			
		case 'filter-timeline-replies-dm':
			for (i=0; i < this.master_timeline_model.items.length; i++) {
				if (this.master_timeline_model.items[i].data.SC_is_dm || this.master_timeline_model.items[i].data.SC_is_reply) {
					this.timeline_model.items.push(this.master_timeline_model.items[i]);
				}
			}
			break;
			
		default:
			this.timeline_model.items = this.master_timeline_model.items;
			break;
	}
	
	Mojo.Log.error('this.master_timeline_model.items length: %s', this.master_timeline_model.items.length);
	Mojo.Log.error('this.timeline_model.items length: %s', this.timeline_model.items.length);
	
	this.controller.modelChanged(this.timeline_model);
	
	if (scroll_to_top) {
		this.scrollToTop();
	}
	
	this.setFilterState(command);
};

/**
 * set the filterstate directly to be applied next time around 
 */
MyTimelineAssistant.prototype.setFilterState = function(state) {
    Mojo.Log.error('NEW FILTER STATE:'+state);
    this._filterState = state;
};