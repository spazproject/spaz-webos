/**
 * @class a background notifier 
 */
var BackgroundNotifier = function(skip_init) {
	// App = Spaz.getAppObj();
	
	if (!skip_init) {
		this.init();
	}
};

/**
 * @type string 
 */
BackgroundNotifier.prototype.template = 'dashboard/bg-notify-info';

/**
 * @type boolean
 */
BackgroundNotifier.prototype.notifyOnDM = true;

/**
 * @type boolean
 */
BackgroundNotifier.prototype.notifyOnMention = true;

/**
 * @type boolean
 */
BackgroundNotifier.prototype.notifyOnTotal = true;

/**
 * an object to store counts to display to the user 
 */
BackgroundNotifier.prototype.counts = {
	'dm':0,
	'mention':0,
	'home':0
};

/**
 * an object to store since_ids for checking
 */
BackgroundNotifier.prototype.lastids = {
	'dm':1,
	'mention':1,
	'home':1
};


/**
 * @type SpazTwit
 */
BackgroundNotifier.prototype.twit = null;

/**
 * @type SpazPrefs
 */
BackgroundNotifier.prototype.prefs = null;

/**
 * @type SpazUsers
 */
BackgroundNotifier.prototype.users = null;


/**
 * initializes everything 
 */
BackgroundNotifier.prototype.init = function(onFinish) {
	var that = this;
	
    this.initTwit();

	this.loadState();

	this.notifyOnDM = Spaz.getAppObj().prefs.get('notify-dms');
	this.notifyOnMention = Spaz.getAppObj().prefs.get('notify-mentions');
	// this.notifyOnTotal = Spaz.getAppObj().prefs.get('notify-newmessages');
	this.notifyOnTotal = true;

	onFinish();
	
	// Mojo.Controller.getAppController().assistant.loadTimelineCache(function(e) {
	// 	Mojo.Log.error('LoadState ===================');
	// 	that.loadState();
	// 	Mojo.Log.error('onFinish  ===================');
	// 	if (onFinish) {
	// 		onFinish();
	// 	}
	// });
};

BackgroundNotifier.prototype.start = function() {
	Mojo.Log.info("BG NOTIFICATION DATA CHECK");
	this.checkForNewData();
};

BackgroundNotifier.prototype.skip = function() {
	Mojo.Log.info("SKIPPING BG NOTIFICATION DATA CHECK");
	this.registerNextNotification();
};

BackgroundNotifier.prototype.stop = function() {
	Mojo.Log.info("STOPPING BG NOTIFICATION DATA CHECK");
	this.unregisterNotification();
	// this.resetState();
};



BackgroundNotifier.prototype.initTwit = function() {
	var event_mode = 'jquery'; // default this to jquery because we have so much using it
	
	var users = new SpazAccounts(Spaz.getAppObj().prefs);
	
	this.twit = new SpazTwit({
	    'event_mode':event_mode,
		'timeout':1000*60
	});
	this.twit.setSource(Spaz.getAppObj().prefs.get('twitter-source'));
	
	
	var auth;
	if ( (auth = Spaz.Prefs.getAuthObject()) ) {
	    Mojo.Log.info('AuthObject: %j', auth);
		this.twit.setCredentials(auth);
		if (Spaz.Prefs.getAccountType() === SPAZCORE_ACCOUNT_CUSTOM) {
		    this.twit.setBaseURL(Spaz.Prefs.getCustomAPIUrl());
		} else {
		    this.twit.setBaseURLByService(Spaz.Prefs.getAccountType());
		}
	} else {
        Mojo.Log.info('NOT LOADING CREDENTIALS INTO TWIT');
	}
};


/**
 * loads data from the cookie into counts and lastids 
 */
BackgroundNotifier.prototype.loadState = function() {
	var state_obj = sch.deJSON(Spaz.getAppObj().prefs.get('cache_bgnotifier_data'));
	
	Mojo.Log.info('loaded state_obj - counts and lastids: %j', state_obj);
	
	if (state_obj) {	
		if (state_obj.counts) {
			if (isNaN(state_obj.counts.home)) {state_obj.counts.home = 0;}
			if (isNaN(state_obj.counts.mention)) {state_obj.counts.mention = 0;}
			if (isNaN(state_obj.counts.dm)) {state_obj.counts.dm = 0;}
			this.counts = state_obj.counts;
		}
		if (state_obj.lastids) {
			if (!state_obj.lastids.home) {state_obj.lastids.home = 1;}
			if (!state_obj.lastids.mention) {state_obj.lastids.mention = 1;}
			if (!state_obj.lastids.dm) {state_obj.lastids.dm = 1;}
			this.lastids = state_obj.lastids;			
		}
	} else {
		Mojo.Log.info('NO state_obj - resetting state of lastids and counts');
		this.resetState();
	}
	
	Mojo.Log.info('loaded state_obj AFTER CHECKS - counts and lastids: %j', state_obj);
	
};

/**
 * saves data from counts and lastids into the cookie
 */
BackgroundNotifier.prototype.saveState = function() {
	
	var state_obj = {
		'counts'  : this.counts,
		'lastids' : this.lastids
	};
	
	Mojo.Log.info('saving state_obj - counts and lastids: %j', state_obj);
	
	Spaz.getAppObj().prefs.set('cache_bgnotifier_data', sch.enJSON(state_obj));
	
	Mojo.Log.info('Just saved state_obj - counts and lastids: %j', Spaz.getAppObj().prefs.get('cache_bgnotifier_data'));
};

/**
 * reset the counts and lastids 
 */
BackgroundNotifier.prototype.resetState = function() {
	
	Mojo.Log.info('RESETTING STATE');
	
	this.counts = {
		'dm':0,
		'mention':0,
		'home':0
	};
	
	this.lastids = {
		'dm':1,
		'mention':1,
		'home':1		
	};

	this.saveState();
};

/**
 *  
 */
BackgroundNotifier.prototype.getIntervalString = function() {
	var interval = '00:15:00';
	
	var numeric = Spaz.getAppObj().prefs.get('network-refreshinterval');
	
	if (numeric) {
		interval = '00:' + sch.pad( ((numeric / 1000) / 60).toString(), 2, '0', 'STR_PAD_LEFT') + ':00';
	}
	
	Mojo.Log.info('interval: %s', interval);
	
	return interval;
};

/**
 * registers a repeating call to look for new data and notify 
 */
BackgroundNotifier.prototype.registerNextNotification = function() {
	
	var wakeupSuccess = function(response) {
	    Mojo.Log.info("Alarm Set Success: " + response.returnValue);
	    wakeupTaskId = sch.enJSON(response.taskId);
	};

	var wakeupFailure = function(response) {
	    Mojo.Log.error("Alarm Set Failure: " + response.returnValue + "-" + response.errorText);
	};

	var interval = this.getIntervalString();

	Mojo.Log.info('REGISTERING NOTIFICATION: interval:'+interval);

	if ( Spaz.getAppObj().prefs.get('network-refresh-auto') ) {
		this.wakeupRequest = new Mojo.Service.Request('palm://com.palm.power/timeout', {
		    method: 'set',
		    parameters: {
		        'key': 'com.funkatron.app.spaz.bgcheck',
		        'in': interval,
		        'wakeup': Spaz.getAppObj().prefs.get('network-refresh-wake'),
		        'uri': 'palm://com.palm.applicationManager/open',
		        'params': {
		            'id': Mojo.appInfo.id,
		            'params': {
		                'action': 'bgcheck'
		            }
		        }
		    },
		    onSuccess: wakeupSuccess,
		    onFailure: wakeupFailure
		});
	}
};

/**
 * removes an existing notification alarm 
 */
BackgroundNotifier.prototype.unregisterNotification = function() {
	this.wakeupRequest = new Mojo.Service.Request('palm://com.palm.power/timeout', {
	    method: 'clear',
	    parameters: {
	        'key': 'com.funkatron.app.spaz.bgcheck'
	    },
	    onSuccess: function(response) {
			Mojo.Log.info("Alarm Clear Success: " + response.returnValue);
		},
	    onFailure: function(response) {
			Mojo.Log.error("Alarm Clear FAILURE: " + response.returnValue);
		}
	});
};

/**
 * resets the notification alarm; used when we change timing values 
 */
BackgroundNotifier.prototype.resetNotification = function() {
	this.unregisterNotification();
	this.registerNextNotification();
};

/**
 * @param {object} template_data
 */
BackgroundNotifier.prototype.displayNotification = function(template_data, template) {
	
	this.saveState();
	
	var appController = Mojo.Controller.getAppController(); 
	
	/*
		show banner
	*/
	bannerArgs = {};
	if (Spaz.getAppObj().prefs.get('sound-enabled')) {
		bannerArgs.soundClass = 'notification';
	}
	bannerArgs.messageText = $L('New Messages');
	appController.showBanner(bannerArgs, {'fromStage':SPAZ_DASHBOARD_STAGENAME}, 'notifications');
	
	
	if (!template_data) {
		template_data = {
			'title'      : "New Messages",
			'count_dm'   : this.counts.dm,
			'message_dm' : 'DMs',
			'count_mention'   : this.counts.mention,
			'message_mention' : '@s',
			'message_home'  : 'Statuses',
			'count_home'  : this.counts.home,
			'count_total'  : this.getTotalCount()
		};
	}
	
	if (!template) {
		template = this.template;
	}
	
	
	Mojo.Log.info('Displaying Notification');
	Mojo.Log.info('template_data:');
	Mojo.Log.info(template_data);
	

	var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME); 

	var sceneArgs = {
		'template_data':template_data,
		'fromstage':SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME,
		'template':template
	};

	Mojo.Log.info('sceneArgs: %j', sceneArgs);

	if (dashboardStageController) { 
		Mojo.Log.info('DELEGATING TO dashboardStageController.delegateToSceneAssistant');
		dashboardStageController.delegateToSceneAssistant("updateDashboard", sceneArgs); 
	} else {
		Mojo.Log.info('Making new dashboardStageController');
		var pushDashboard = function(stageController){
			stageController.pushScene('dashboard', sceneArgs); 
		}; 
		appController.createStageWithCallback({
				'name':SPAZ_DASHBOARD_STAGENAME,
				'lightweight':false
			},
			pushDashboard,
			'dashboard'
		); 
	} 
	

	
};


BackgroundNotifier.prototype.closeNotification = function() {
	var appController = Mojo.Controller.getAppController();
	var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME);
	
	this.saveState();
	
	if (dashboardStageController) {
		dashboardStageController.window.close();
	}
};


/**
 * Check for updates 
 */
BackgroundNotifier.prototype.checkForNewData = function() {
	var that = this;

	this.registerNextNotification();
	this.getCombinedTimeline();
};


BackgroundNotifier.prototype.getCombinedTimeline = function() {
    
	/*
		only show this banner if we are waking from sleep
	*/
	if (Spaz.getAppObj().prefs.get('network-refresh-wake')) {
		this.showBanner($L('Checking for new messages'));
	}
	
	
	var that = this;
	
	Mojo.Log.info('this.lastids before: %j', this.lastids);
	
	/*
		load the current master timeline lastids. If they are > our lastids, use the higher values
	*/
	var lastids = Mojo.Controller.getAppController().assistant.loadLastIDs();
	if (this.lastids.home < lastids.home) { this.lastids.home = lastids.home; }
	if (this.lastids.mention < lastids.mention) { this.lastids.mention = lastids.mention; }
	if (this.lastids.dm < lastids.dm) { this.lastids.dm = lastids.dm; }

	Mojo.Log.info('this.lastids after: %j', this.lastids);

	/*
		set the lastids for our SpazTwit object
	*/
	this.twit.setLastId(SPAZCORE_SECTION_HOME,    this.lastids.home);
	this.twit.setLastId(SPAZCORE_SECTION_REPLIES, this.lastids.mention);
	this.twit.setLastId(SPAZCORE_SECTION_DMS,     this.lastids.dm);
	
	Mojo.Log.info('Getting combined timeline');
	
	this.twit.getCombinedTimeline(
		{
			'friends_count':200,
			'replies_count':200,
			'dm_count':200
		},
		function(data) {
			
			Mojo.Log.info('BackgroundNotifier getCombinedTimeline success');
			
			var new_count = 0, new_mention_count = 0, new_dm_count = 0, previous_count = 0;
	
			previous_count = Spaz.getAppObj().master_timeline_model.items.length;
			
			var no_dupes = [];
			for (var i=0; i < data.length; i++) {
	
				new_count++;
				if (!data[i].SC_is_dm) { // set lastid if this is not a DM
					that.lastids.home = data[i].id;
					Mojo.Log.info('New lastid.home is %s', that.lastids.home);
				}
	
				if (data[i].SC_is_reply) {
					new_mention_count++;
					that.lastids.mention = data[i].id; // set lastid if this is mention
					Mojo.Log.info('New lastid.mention is %s', that.lastids.mention);
				} else if (data[i].SC_is_dm) {
					new_dm_count++;
					that.lastids.dm = data[i].id; // set lastid if this is DM
					Mojo.Log.info('New lastid.dm is %s', that.lastids.dm);
				}
			}
	
	
			that.counts.dm = that.counts.dm + parseInt(new_dm_count, 10);
	
			that.counts.mention = that.counts.mention + parseInt(new_mention_count, 10);
			
			that.counts.home = that.counts.home + parseInt((new_count - (new_mention_count + new_dm_count)), 10);

			Mojo.Log.info('new, @mention, dm: %s %s %s', new_count, new_mention_count, new_dm_count);
	
			Mojo.Log.info('that.counts.home: %s', that.counts.home);
			
			if (new_count > 0 && Spaz.getAppObj().prefs.get('notify-newmessages')) {
				Mojo.Log.info('DISPLAYING notification!!!!!!!');
				that.displayNotification();
			} else if (new_dm_count > 0 && Spaz.getAppObj().prefs.get('notify-dms')) {
				Mojo.Log.info('DISPLAYING notification!!!!!!!');
				that.displayNotification();
			} else if (new_mention_count > 0 && Spaz.getAppObj().prefs.get('notify-mentions')) {
				Mojo.Log.info('DISPLAYING notification!!!!!!!');
				that.displayNotification();
			} else {
				// Mojo.Log.info('CLOSING notification!!!!!!!');
				Mojo.Log.info('NOT DISPLAYING notification!!!!!!!');
				// that.closeNotification();
				that.saveState();
			}
	
		},
		function(errors) {
		    Mojo.Log.error('ERRORS: %j', errors);
		    Mojo.Log.error('Error loading new messages in BackgroundNotifier');
			var err_msg = $L("There was an error loading new messages");
		}
	);
	
};


BackgroundNotifier.prototype.getTotalCount = function() {
	var totalcount;
	totalcount = parseInt(this.counts.home, 10) + parseInt(this.counts.dm, 10) + parseInt(this.counts.mention, 10);
	Mojo.Log.info('getTotalCount: %s', totalcount);
	return totalcount;
};



BackgroundNotifier.prototype.showBanner = function(text, category, soundClass) {
	
	if (!soundClass) { soundClass = false; }
	
	category = category || 'misc';
	
	var launchArgs = {
		'fromstage':this.getStageName()
	};
	var bannerArgs = {
		'messageText':text
	};
	if (soundClass && App.prefs.get('sound-enabled')) {
		bannerArgs.soundClass = soundClass;
	}

	var appController = Mojo.Controller.getAppController();
	appController.showBanner(bannerArgs, launchArgs, category);
};


BackgroundNotifier.prototype.getStageName = function() {
	var stagename;
	
	if (window.name) {
		stagename = window.name;
	} else {
		stagename = SPAZ_MAIN_STAGENAME;
	}
	return stagename;
};



/**
 * @deprecated We don't write to the cached timeline anymore
 */
BackgroundNotifier.prototype.addItems = function(new_items) {
	
	Mojo.Log.info("addItems");
	
	// now we have all the existing items from the model
	var model_items = Spaz.getAppObj().master_timeline_model.items.clone();
	
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
	Spaz.getAppObj().master_timeline_model.items = model_items;
	
    this.saveTimelineCache();	
};


/**
 * @deprecated We don't use the cached timeline anymore
 */
BackgroundNotifier.prototype.itemExistsInModel = function(obj) {
	

	for (var i=0; i < Spaz.getAppObj().master_timeline_model.items.length; i++) {
		if (Spaz.getAppObj().master_timeline_model.items[i].id == obj.id) {
			Mojo.Log.info(obj.id +' exists in model');
			return true;
		}
	}
	Mojo.Log.info(obj.id +' does not exist in model');
	return false;
};


/**
 * @deprecated don't use the timeline cache anymore for speed
 */
BackgroundNotifier.prototype.loadTimelineCacheData = function() {
	var that = this;
	
	Mojo.Log.info('LOADTIMELINECACHEDATA BackgroundNotifier');
	
	Mojo.Timing.resume("timing_loadTimelineCache");
	
	var data = Spaz.getAppObj().cache.load('mytimelinecache');

	if (data !== null) {
		this.twit.setLastId(SPAZCORE_SECTION_HOME, 	  data[SPAZCORE_SECTION_HOME + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_REPLIES, data[SPAZCORE_SECTION_REPLIES + '_lastid']);
		this.twit.setLastId(SPAZCORE_SECTION_DMS,     data[SPAZCORE_SECTION_DMS     + '_lastid']);
		
		Mojo.Log.info('data[home]'+ data[SPAZCORE_SECTION_HOME + '_lastid']);
		Mojo.Log.info('data[replies]'+ data[SPAZCORE_SECTION_REPLIES + '_lastid']);
		Mojo.Log.info('data[dms]'+ data[SPAZCORE_SECTION_DMS     + '_lastid']);
		
		if (data['my_master_timeline_model_items']) {
			Spaz.getAppObj().master_timeline_model.items = data['my_master_timeline_model_items'];
		} else {
			Spaz.getAppObj().master_timeline_model.items = [];
		}		
	}

	Mojo.Timing.pause("timing_loadTimelineCache");
	
	Mojo.Log.info(Mojo.Timing.createTimingString("timing_", "Cache op times"));

	
};


/**
 * @deprecated We don't write to the cached timeline anymore
 */
BackgroundNotifier.prototype.saveTimelineCache = function() {
	
	Mojo.Log.info('SAVETIMELINECACHE');
	
	Mojo.Timing.resume("timing_saveTimelineCache");
	
	var cached_items = [];
	
	/*
		generate current counts, and create array to cache
	*/
	var num_dms = 0, num_replies = 0, num_statuses = 0;
	var max_dms =      TIMELINE_CACHE_MAXENTRIES_DM;
	var max_replies =  TIMELINE_CACHE_MAXENTRIES_REPLY;
	var max_statuses = TIMELINE_CACHE_MAXENTRIES;
	for (var i=0; i < Spaz.getAppObj().master_timeline_model.items.length; i++) {
		if (Spaz.getAppObj().master_timeline_model.items[i].data.SC_is_dm) {
			num_dms++;
			if (num_dms <= max_dms) {
				cached_items.push(Spaz.getAppObj().master_timeline_model.items[i]);
			}
		} else if (Spaz.getAppObj().master_timeline_model.items[i].data.SC_is_reply) {
			num_replies++;
			if (num_replies <= max_replies) {
				cached_items.push(Spaz.getAppObj().master_timeline_model.items[i]);
			}			
		} else {
			num_statuses++;
			if (num_statuses <= max_statuses) {
				cached_items.push(Spaz.getAppObj().master_timeline_model.items[i]);
			}
		}
	}
	
	
	Mojo.Log.info('Counts: DMs %s, Replies %s, Statuses %s', num_dms, num_replies, num_statuses);
	
	Mojo.Log.info('Length of master_timeline_model.items: '+Spaz.getAppObj().master_timeline_model.items.length);
	
	var twitdata = {};
	twitdata['version']                         = CACHE_VERSION;
	twitdata['my_master_timeline_model_items']  = cached_items;
	
	Mojo.Log.info('Length of twitdata[\'my_master_timeline_model_items\']: '+twitdata['my_master_timeline_model_items'].length);
	
	twitdata[SPAZCORE_SECTION_HOME + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_HOME);
	twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_REPLIES);
	twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = this.twit.getLastId(SPAZCORE_SECTION_DMS);

	Spaz.getAppObj().cache.save('mytimelinecache', twitdata, Spaz.getAppObj().userid);
	
	Mojo.Timing.pause('timing_saveTimelineCache');
	
	Mojo.Log.info(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	
};

