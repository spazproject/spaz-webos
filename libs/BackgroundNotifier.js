

/**
 * @class a background notifier 
 */
var BackgroundNotifier = function() {
	this.init();
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
BackgroundNotifier.prototype.notifyOnHome = true;

/**
 * @type integer
 */
BackgroundNotifier.prototype.interval = '00:05:00'; // 5 minutes

/**
 * an object to store counts to display to the user 
 */
BackgroundNotifier.prototype.counts = {
	'dm':0,
	'mention':0,
	'home':0
};

/**
 * an object to store the last id checked for each timeline 
 */
BackgroundNotifier.prototype.lastids = {
	'dm':0,
	'mention':0,
	'home':0
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
 * @type Mojo.Model.Cookie 
 */
BackgroundNotifier.prototype.mojoCookie = null;


/**
 * initializes everything 
 */
BackgroundNotifier.prototype.init = function() {
	
	this.prefs = new SpazPrefs(default_preferences);
	this.prefs.load();

	this.Users = new Users(this.prefs);
	this.Users.load();

	this.notifyOnDM = this.prefs.get('bgnotify-on-dm');
	this.notifyOnMention = this.prefs.get('bgnotify-on-mention');
	// this.notifyOnHome = this.prefs.get('bgnotify-on-home');
	this.notifyOnHome = true;

	this.twit = new scTwit(null, null);

	var last_userid = this.prefs.get('last_userid');
	var last_user_obj = this.Users.getUser(last_userid);
	if (last_user_obj) {
		sch.debug(last_user_obj);
		sc.app.username = last_user_obj.username;
		sc.app.password = last_user_obj.password;
		sc.app.type     = last_user_obj.type;
		sc.app.userid   = last_user_obj.id;

		if (sc.app.type === SPAZCORE_SERVICE_CUSTOM) {
			var api_url = users.getMeta(sc.app.userid, 'api-url');
			this.twit.setBaseURL(api_url);
		} else {
			this.twit.setBaseURLByService(sc.app.type);				
		}
		this.twit.setCredentials(sc.app.username, sc.app.password);
	} else {
		sch.error("Tried to load last_user_obj, but failed.");
	}
	
	this.loadState();
};

BackgroundNotifier.prototype.start = function() {
	sch.error("BG NOTIFICATION DATA CHECK");
	this.checkForNewData();
};

BackgroundNotifier.prototype.skip = function() {
	sch.error("SKIPPING BG NOTIFICATION DATA CHECK");
	this.registerNextNotification();
};

BackgroundNotifier.prototype.stop = function() {
	sch.error("STOPPING BG NOTIFICATION DATA CHECK");
	this.unregisterNotification();
	this.resetState();
};


/**
 * loads data from the cookie into counts and lastids 
 */
BackgroundNotifier.prototype.loadState = function() {
	if (!this.mojoCookie) {
		this.mojoCookie = new Mojo.Model.Cookie('SPAZ_WEBOS_BGNOTIFIER_DATA');
	}

	var loaded_data = this.mojoCookie.get();
	
	if (loaded_data) {
		if (loaded_data.counts) {
			this.counts  = loaded_data.counts;
		}

		if (loaded_data.lastids) {
			this.lastids = loaded_data.lastids;
		}
	}
	
	this.loadTimelineCacheData();
};

/**
 * saves data from counts and lastids into the cookie
 */
BackgroundNotifier.prototype.saveState = function() {
	if (!this.mojoCookie) {
		this.mojoCookie = new Mojo.Model.Cookie('SPAZ_WEBOS_BGNOTIFIER_DATA');
	}
	
	this.mojoCookie.put({
		'counts'  : this.counts,
		'lastids' : this.lastids
	});
};

BackgroundNotifier.prototype.resetState = function() {
	if (!this.mojoCookie) {
		this.mojoCookie = new Mojo.Model.Cookie('SPAZ_WEBOS_BGNOTIFIER_DATA');
	}
	
	this.counts = {
		'dm':0,
		'mention':0,
		'home':0
	};

	this.lastids = {
		'dm':0,
		'mention':0,
		'home':0
	};
	
	this.mojoCookie.put({
		'counts'  : this.counts,
		'lastids' : this.lastids
	});
};


/**
 * registers a repeating call to look for new data and notify 
 */
BackgroundNotifier.prototype.registerNextNotification = function() {
	var wakeupSuccess = function(response) {
	    sch.error("Alarm Set Success: " + response.returnValue);
	    wakeupTaskId = sch.enJSON(response.taskId);
	};

	var wakeupFailure = function(response) {
	    sch.error("Alarm Set Failure: " + response.returnValue + "-" + response.errorText);
	};

	Mojo.Log.info('this.interval:'+this.interval);

	this.wakeupRequest = new Mojo.Service.Request('palm://com.palm.power/timeout', {
	    method: 'set',
	    parameters: {
	        'key': 'com.funkatron.app.spaz.bgcheck',
	        'in': this.interval,
	        'wakeup': sc.app.prefs.get('bgnotify-wakeoncheck'),
	        'uri': 'palm://com.palm.applicationManager/open',
	        'params': {
	            'id': 'com.funkatron.app.spaz',
	            'params': {
	                'action': 'bgcheck'
	            }
	        }
	    },
	    onSuccess: wakeupSuccess,
	    onFailure: wakeupFailure
	});
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
			sch.error("Alarm Clear Success: " + response.returnValue);
		},
	    onFailure: function(response) {
			sch.error("Alarm Clear FAILURE: " + response.returnValue);
		}
	});
};

/**
 * @param {object} template_data
 */
BackgroundNotifier.prototype.displayNotification = function() {
	
	var template_data = {
		'title'      : "New Messages",
		'count_dm'   : this.counts.dm,
		'message_dm' : 'DMs',
		'count_mention'   : this.counts.mention,
		'message_mention' : '@s',
		'count_home'   : this.counts.home,
		'message_home' : 'msgs',
		'count_total'  : this.getTotalCount()
	};
	
	
	sch.error('Displaying Notification');
	sch.error('template_data:');
	Mojo.Log.info(template_data);
	
	var appController = Mojo.Controller.getAppController(); 
	var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME); 

	var sceneArgs = {
		'template_data':template_data,
		'fromstage':SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME,
		'template':this.template
	};

	sch.error('sceneArgs:');
	sch.error(sceneArgs);

	if (dashboardStageController) { 
		sch.error('DELEGATING TO dashboardStageController');
		dashboardStageController.delegateToSceneAssistant("updateDashboard", sceneArgs); 
	} else {
		sch.error('Making new dashboardStageController');
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

/**
 * Check for updates 
 */
BackgroundNotifier.prototype.checkForNewData = function() {
	this.registerNextNotification();
	
	
	
	
	if (this.notifyOnDM) {
		this.getDMs();
	}
	
	if (this.notifyOnMention) {
		this.getMentions();
	}
	
	if (this.notifyOnHome) {
		this.getHomeTimeline();		
	}
	
};

/**
 * get the DMs timeline and check for new data 
 */
BackgroundNotifier.prototype.getDMs = function() {
	var that = this;
	
	sch.error('getting DMs');
	sch.error('DMs lastid:'+this.lastids.dm);
	
	/*
		@TODO need to add callback handling for this twit method
	*/
	var request = new Ajax.Request('https://api.twitter.com/1/direct_messages.json', {
		requestHeaders:{
			"Authorization": "Basic " + sch.Base64.encode(sc.app.username+":"+sc.app.password)
		},
		parameters: {since_id: this.lastids.dm||1},
		method: 'get',
		evalJSON: 'false',
		onSuccess: function(xhr) {
			var count = 0, lastid = 0, messages = [];
			// sch.error('Response from DM request:');
			// sch.error(xhr.responseText);
			data = sch.deJSON(xhr.responseText);

			sch.error('that.lastids.dm:'+that.lastids.dm);

			/*
				sanity check
			*/
			for (var i=0; i < data.length; i++) {
				if (data[i].id > that.lastids.dm) {
					count  = messages.push(data[i]);
				}
			};
			
			sch.error('New DM count:'+count);
			
			if (count > 0) {
				that.counts.dm += count;
				lastid = messages[count-1].id;
				that.lastids.dm = lastid;
			}

			if (that.counts.dm > 0) {
				that.displayNotification();
			}

			sch.error('Total DM Count:'+that.counts.dm);
			that.saveState();
		},
		onComplete: function(xhr) {
			that.saveState();
		}
	 });
	
	
};

/**
 * get the mentions timeline and check for new data  
 */
BackgroundNotifier.prototype.getMentions = function() {
	var that = this;
	
	sch.error('getting Mentions');
	sch.error('Mentions lastid:'+this.lastids.mention);

	var request = new Ajax.Request('https://api.twitter.com/1/statuses/mentions.json', {
		requestHeaders:{
			"Authorization": "Basic " + sch.Base64.encode(sc.app.username+":"+sc.app.password)
		},
		parameters: {since_id: this.lastids.mention||1},
		method: 'get',
		evalJSON: 'false',
		onSuccess: function(xhr) {
			var count = 0, lastid = 0, messages = [];
			// sch.error('Response from mention request:');
			// sch.error(xhr.responseText);
			data = sch.deJSON(xhr.responseText);

			sch.error('that.lastids.mention:'+that.lastids.mention);

			/*
				sanity check
			*/
			for (var i=0; i < data.length; i++) {
				if (data[i].id > that.lastids.mention) {
					count = messages.push(data[i]);
				}
			};

			sch.error('new Mentions count:'+count);
			
			if (count > 0) {
				that.counts.mention += count;
				sch.error('mention counts:'+that.counts.mention);
				sch.error(messages);
				lastid = parseInt(messages[count-1].id, 10);
				sch.error('lastid:'+lastid);
				that.lastids.mention = lastid;
				sch.error('mention lastid:'+lastid);
			}

			if (that.counts.mention > 0) {
				that.displayNotification();
			}
			
			sch.error('Total Mention Count:'+that.counts.mention);
		},
		onComplete: function(xhr) {
			that.saveState();
		}
		
	 });



	
};

/**
 * get the home timeline and check for new data  
 */
BackgroundNotifier.prototype.getHomeTimeline = function() {
	var that = this;
	
	sch.error('getting HomeTimeline');

	var request = new Ajax.Request('https://api.twitter.com/1/statuses/home_timeline.json', {
		requestHeaders:{
			"Authorization": "Basic " + sch.Base64.encode(sc.app.username+":"+sc.app.password)
		},
		parameters: {since_id: this.lastids.home||1},
		method: 'get',
		evalJSON: 'false',
		onSuccess: function(xhr) {
			var count = 0, lastid = 0, messages = [];
			// sch.error('Response from home request:');
			// sch.error(xhr.responseText);
			data = sch.deJSON(xhr.responseText);

			sch.error('that.lastids.home:'+that.lastids.home);

			/*
				sanity check
			*/
			for (var i=0; i < data.length; i++) {
				if (data[i].id > that.lastids.home) {
					count = messages.push(data[i]);
				}
			};
					
			sch.error('new Home count:'+count);
			
			if (count > 0) {
				that.counts.home += count;
				sch.error('home counts:'+that.counts.home);
				lastid = parseInt(messages[count-1].id, 10);
				sch.error('lastid:'+lastid);
				that.lastids.home = lastid;
				sch.error('home lastid:'+lastid);
			}
			
			if (that.counts.home > 0) {
				that.displayNotification();
			}
			sch.error('Total Home Count:'+that.counts.home);
		},
		onComplete: function(xhr) {
			that.saveState();
		}
	 });

};



BackgroundNotifier.prototype.showBanner = function(msg) {
	var category = category || 'misc';

	var launchArgs = {
		'fromstage':this.getStageName()
	};

	var bannerArgs = {
		'messageText':msg
	};

	if (sc.app.prefs.get('sound-enabled')) {
		bannerArgs.soundClass = 'alerts';
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


BackgroundNotifier.prototype.getTotalCount = function() {
	return this.counts.dm + this.counts.mention + this.counts.home;
};


BackgroundNotifier.prototype.loadTimelineCacheData = function() {
	var that = this;
	
	this._loadTimelineCache = function() {
		sch.error(sch.enJSON(window.spaztmpcache));
		
		var data = TempCache.load('mytimelinecache');
		
		

		if (data !== null) {
			sch.error('Setting lastids from TimelineCache');
			that.lastids.home    = data[SPAZCORE_SECTION_HOME + '_lastid'];
			that.lastids.mention = data[SPAZCORE_SECTION_REPLIES + '_lastid'];
			that.lastids.dm      = data[SPAZCORE_SECTION_DMS     + '_lastid'];
		}
		sch.error("that.lastids.home:"+that.lastids.home);
		sch.error("that.lastids.mention:"+that.lastids.mention);
		sch.error("that.lastids.dm:"+that.lastids.dm);
		sch.unlisten(document, 'temp_cache_load_db_success', this._loadTimelineCache);		
	};

	
	if (!TempCache.exists()) {
		sch.error('TEMPCACHE DOES NOT EXIST');
		sch.listen(document, 'temp_cache_load_db_success', this._loadTimelineCache);
		TempCache.loadFromDB();
	}
	
};
