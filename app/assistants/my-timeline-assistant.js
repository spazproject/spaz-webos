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
	
	
	Mojo.Log.error('argFromPusher: %j', argFromPusher);
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
	
	/**
	 * empties the timeline and resets the lastids in the twit object
	 * 
	 * bound to temp_cache_cleared 
	 * 
	 * we define this here to get the closure thisA
	 */
	this.resetTwitState = function() {
		Mojo.Log.error('Resetting twit state');
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
	
	/*
		when we first create this, the cache is definitely NOT loaded
	*/
	this.cacheLoaded = false;
	
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
					{label:$L('Favorites'), icon:'favorite', command:'favorites', shortcut:'F'},
					{label:$L('Friends and Followers'), icon:'friends-followers', command:'friends-followers', shortcut:'L'},
					{label:$L('Search'), icon:'search', command:'search', shortcut:'S'}
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
			itemTemplate: 'account-panel/user-list-entry',
			listTemplate: 'account-panel/user-list-container',
			dividerTemplate:'account-panel/user-list-separator',
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
			remap if we have an originalEvent
		*/
		if (e.originalEvent) {
			Mojo.Log.error('originalEvent target: %s', e.originalEvent.target.outerHTML);
			event_target = e.originalEvent.target;
		} else {
			event_target = e.target;
		}
		
		var jqtarget = jQuery(event_target);
		
		if (jqtarget.is('.account-item .info')) {
			var userid, account_type, account_api_url;
			
			Mojo.Log.info('tap on .account-item.info, pushing user-detail');
			userid = e.item.username;
			account_type = e.item.type;
			
			if (account_type === SPAZCORE_ACCOUNT_CUSTOM) {
				account_api_url = Spaz.Prefs.getCustomAPIUrl(e.item.id);
			}
			
			Mojo.Controller.stageController.pushScene(
				'user-detail',
				{
					'userid':'@'+userid,
					'account_type':account_type,
					'account_api_url':account_api_url,
					'auth_obj':Spaz.Prefs.getAuthObject(e.item.id)
				}
			);
			return;
		
		} else if (App.username // ick
						&& App.type
						&& (App.username.toLowerCase() === e.item.username.toLowerCase())
						&& (App.type.toLowerCase() === e.item.type.toLowerCase())) {
							
			Mojo.Log.error('This is the same account we are currently using. Closing panel');
			thisA.controller.stageController.sendEventToCommanders({'type':Mojo.Event.command, 'command':'toggle-accounts-panel'});
		
		} else {
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
		}


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
			lookahead:   30,
			renderLimit: 10,
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
		more button
	*/
	jQuery('#more-mytimeline-button').bind(Mojo.Event.tap, function() {
		thisA.loadMore.call(thisA);
	});
	this.moreButtonAttributes = {};
	this.moreButtonModel = {
		"buttonLabel" : "More",
		"buttonClass" : 'Primary'
	};
	this.controller.setupWidget('more-mytimeline-button', this.moreButtonAttributes, this.moreButtonModel);
	
	
	/*
		all of the data goes here. this data is filtered and copied to 
		this.timeline_model as appropriate
	*/
	App.master_timeline_model = {
		'items':[]
	};
	
	
	this.showFollowSpazPopup();
	
	this.showDonationPopup();
	
	this.showNewVersionPopup();
};



MyTimelineAssistant.prototype.activate = function(params) {
	
	if (!params) {
		params = {};
	}
	
	Mojo.Log.error('ACTIVATE');

	Mojo.Log.error('params: %j', params);

	var thisA = this; // for closures

	if (!params.returnFromPop && !this.cacheLoaded) { // don't run this if returnFromPop = true was passed
		
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
				if (params && params.refresh) {
					params.refresh = false;
				}
				thisA.markCacheAsRead = true;
				thisA.cacheLoaded = true;
			}
			thisA.cacheLoaded = true;
			
		}.bind(this));
	}

	/*
	Prepare for timeline entry taps
	*/
	thisA.bindTimelineEntryTaps('my-timeline');

	thisA.bindScrollToRefresh();

	this.showBetaWarningAlert();
	
};


MyTimelineAssistant.prototype.deactivate = function(event) {
	
	var thisA = this;
	
	Mojo.Log.error('DEACTIVATE');
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('my-timeline');
	
	thisA.unbindScrollToRefresh();
	
	if(!this.scroller){
		this.scroller = this.controller.getSceneScroller();
	}
	App[this._filterState + "-scroll-position"] = this.scroller.mojo.getState();
	
};



MyTimelineAssistant.prototype.cleanup = function(event) {
	
	Mojo.Log.error('CLEANUP');	
	
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	// jQuery(document).unbind('load_from_mytimeline_cache_done');

	jQuery('#more-mytimeline-button').unbind(Mojo.Event.tap);

	
	this.stopTrackingStageActiveState();
	
	// this.stopRefresher();
};


MyTimelineAssistant.prototype.considerForNotification = function(params){   
	Mojo.Log.error('NOTIFICATION RECEIVED in MyTimelineAssistant:%j', params);

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
	
	return params;   
};



MyTimelineAssistant.prototype.refresh = function(mark_as_read, page) {
	var thisA = this;

	Mojo.Log.info('refresh()');

	if (mark_as_read !== false) {
		mark_as_read = true;
	}
	
	if (page && !sch.isNumber(page)) {
		page = 1;
	}
	
	if (thisA.isTopmostScene() && mark_as_read) {
		thisA.markAllAsRead();
	}

	this.showInlineSpinner('activity-spinner-my-timeline', 'Loading…');

	this.resetScrollstate();
	
	function getCombinedTimeline(statusobj) {

		if ( statusobj.isInternetConnectionAvailable === true) {

			var combined_opts = {
				'friends_count':App.prefs.get('timeline-friends-getcount'),
				'replies_count':App.prefs.get('timeline-replies-getcount'),
				'dm_count':App.prefs.get('timeline-dm-getcount'),
				'home_page':page,
				'replies_page':page,
				'dm_page':page
			};
			if (page >= 2) {
				combined_opts.home_since	= 1;
				combined_opts.replies_since = 1;
				combined_opts.dm_since		= 1;
			}
			
			
			thisA.twit.getCombinedTimeline(
				combined_opts,
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

								/*
									rework for RTs
								*/
								if (data[i].SC_is_retweet) {
									data[i].retweeting_user = data[i].user;
									data[i].user = data[i].retweeted_status.user;
									data[i].id = data[i].retweeted_status.id;
									data[i].in_reply_to_status_id = data[i].retweeted_status.in_reply_to_status_id;
									data[i].isSent = data[i].isSent;
									data[i].text = data[i].retweeted_status.text;
								}

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

	var lastTweetID = false;
	if (!App.prefs.get('timeline-scrollonupdate')) {
		// remember first visible item
		for (var i=0; i<this.timeline_model.items.length; i++) {
			Mojo.Log.error("index", i);
			var itemNode = this.timeline_list.mojo.getNodeByIndex(i);
			if (itemNode !== undefined) {
				Mojo.Log.error("node %j", itemNode);
				var offset = Element.viewportOffset (itemNode);
				Mojo.Log.error("offset", offset.top);
				if (offset.top > 0) {
					lastTweetID = this.timeline_model.items[i].data.id;
					Mojo.Log.error("index", i, "offset", offset.top, "id", lastTweetID, this.timeline_model.items[i].data.text);
					break;
				}
			}
		}
	}
	
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
	
	this.resetScrollstate();	
	
	// this filters and updates the model
	this.filterTimeline(null, false, true);	

	if (!App.prefs.get('timeline-scrollonupdate') && lastTweetID) {
		var lastidx = -1;
		for (var i=0; i < this.timeline_model.items.length; i++) {
			if (this.timeline_model.items[i].data.id == lastTweetID) {
				lastidx = i;
				break;
			}
		}

		if (lastidx >= 0 && (lastidx < this.timeline_model.items.length-1) ) {
			Mojo.Log.error('Revealing item:', lastidx, this.timeline_model.items[i].data.text);
			this.timeline_list.mojo.revealItem(lastidx, false);
			var itemNode = this.timeline_list.mojo.getNodeByIndex(i);
			if (itemNode !== undefined) {
				Mojo.Log.error("node %j", itemNode);
				Element.scrollTo(itemNode);
			}
		}
	}
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



MyTimelineAssistant.prototype.loadMore = function(event) {
	if (this.mytimeline_more_page) {
		this.mytimeline_more_page++;
	} else {
		this.mytimeline_more_page = 2;
	}
	
	this.refresh(true, this.mytimeline_more_page);
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
		
		this.filterTimeline(null, true, false, true);
		
	}

	Mojo.Timing.pause("timing_loadTimelineCache");
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
};



MyTimelineAssistant.prototype.saveTimelineCache = function() {
	
	this.getAppAssistant().saveTimelineCache(this.twit);
	
};

/**
 * this filters and updates the model
 */
MyTimelineAssistant.prototype.filterTimeline = function(command, scroll_to_top, scroll_to_new, loadingCache) {
	
	if (!command) {
		if (this._filterState) {
			command = this._filterState;
		} else {
			command = 'filter-timeline-all';
		}
	}
	if(!loadingCache && !scroll_to_new){
		if(!this.scroller){
			this.scroller = this.controller.getSceneScroller();
		}
		App[this._filterState + "-scroll-position"] = this.scroller.mojo.getState();
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
	
	/*
		scroll me!
	*/
	
	if (App.prefs.get('timeline-scrollonupdate')) {
		if (scroll_to_top || scroll_to_new) {
			this.resetScrollstate();
	
			if (scroll_to_top) {
				if(App[command + "-scroll-position"]){
					this.scroller.mojo.setState(App[command + "-scroll-position"], false);
				}else {
					this.scrollToTop();
				}
			}
			if (App.prefs.get('timeline-scrollonupdate') && scroll_to_new) {
				if (this.isTopmostScene()) {
					this.scrollToNew();
				}
			}
		} else {
			this.resetScrollstate();	
		}
	}
	
	
	
};


MyTimelineAssistant.prototype.resetScrollstate = function() {
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
};


/**
 * set the filterstate directly to be applied next time around 
 */
MyTimelineAssistant.prototype.setFilterState = function(state) {
    Mojo.Log.info('NEW FILTER STATE:'+state);
    this._filterState = state;
};

