
const SPAZ_DASHBOARD_STAGENAME = 'dashboard';
const SPAZ_MAIN_STAGENAME      = 'main';
const SPAZ_STAGEASSISTANTNAME = 'StageAssistant';
const SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME = 'bgnotifier';

const SPAZ_DONATION_URL = 'http://getspaz.com/donate';

const TIMELINE_CACHE_MAXENTRIES =      100;
const TIMELINE_CACHE_MAXENTRIES_DM =    30;
const TIMELINE_CACHE_MAXENTRIES_REPLY = 30;

const CACHE_VERSION = 3;  // we increment this when we change how the cache works	




var LOGGEDIN_APPMENU_ITEMS = [
	Mojo.Menu.editItem,
	{ label: $L('Update Location'),	command: 'update-location' },
	//{ label: $L('New Search Card'),	command: 'new-search-card' },
	{ label: $L('Accounts'), 	command:'accounts' },
	{ label: $L('Preferences'),	command:Mojo.Menu.prefsCmd },
	{ label: $L('About Spaz'),		command: 'appmenu-about' },
	{ label: $L('Donate'),		command:'donate' },
	{ label: $L('Help'),			command:Mojo.Menu.helpCmd }
	
];


var RELATIVE_TIME_LABELS = {
	'now':'now',
	'seconds':'s',
	'minute':'m',
	'minutes':'m',
	'hour':'hr',
	'hours':'hr',
	'day':'d',
	'days':'d'	
};

function AppAssistant(appController) {
	
	Mojo.Log.info("Logging from AppAssistant Constructor");
	
	this.initialize();
	
}

/**
 * container for global app-available stuff. We map this to "spaz_app"
 */
AppAssistant.prototype.App = {};


AppAssistant.prototype.initialize = function() {

	var that = this;
	
	Mojo.Log.info('INITIALIZING EVERYTHING');

	SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
        authType: SPAZCORE_AUTHTYPE_OAUTH,
        consumerKey: SPAZCORE_CONSUMERKEY_TWITTER,
        consumerSecret: SPAZCORE_CONSUMERSECRET_TWITTER,
        accessURL: 'https://twitter.com/oauth/access_token'
    });
	
	/*
		Remap JSON parser because JSON2.js one was causing probs with unicode
	*/
	sc.helpers.deJSON = function(str) {
		try {
			var obj = JSON.parse(str);
			return obj;
		} catch(e) {
			Mojo.Log.error('There was a problem decoding the JSON string');
			Mojo.Log.error('Here is the JSON string: '+str);
			return null;
		}

	};
	sc.helpers.enJSON = function(obj) {
		var json = JSON.stringify(obj);
		return json;
	};

	sch.info = Mojo.Log.info;
	sch.dump = Mojo.Log.info;
	sch.warn = Mojo.Log.warn;
	sch.error = Mojo.Log.error;


	this.App.search_cards = [];
	this.App.new_search_card = 0;
	this.App.search_card_prefix = "searchcard_";

	this.App.username = null;
	this.App.prefs = null;
	
	this.App.accounts = null;


	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	this.App.prefs = new SpazPrefs(default_preferences, null, {
		'timeline-maxentries': {
			'onGet': function(key, value){
				if (that.App.prefs.get('timeline-friends-getcount') > value) {
					value = that.App.prefs.get('timeline-friends-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (that.App.prefs.get('timeline-friends-getcount') > value) {
					value = that.App.prefs.get('timeline-friends-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		},
		'timeline-maxentries-dm': {
			'onGet': function(key, value){
				if (that.App.prefs.get('timeline-dm-getcount') > value) {
					value = that.App.prefs.get('timeline-dm-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (that.App.prefs.get('timeline-dm-getcount') > value) {
					value = that.App.prefs.get('timeline-dm-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		},
		'timeline-maxentries-reply': {
			'onGet': function(key, value){
				if (that.App.prefs.get('timeline-replies-getcount') > value) {
					value = that.App.prefs.get('timeline-replies-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (that.App.prefs.get('timeline-replies-getcount') > value) {
					value = that.App.prefs.get('timeline-replies-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		}
	});
	this.App.prefs.load(); // this is sync on webOS, b/c loading from Mojo.Model.Cookie
	
	/*
		load app accounts
	*/
	this.App.accounts = new SpazAccounts(this.App.prefs);
	
	this.App.twit = new SpazTwit(null, null, {
		'event_mode':'jquery'
	});
	
	/*
		model for saving Tweets to Depot. We replace on every start to make sure we don't go over-budget
	*/
	this.App.Tweets = new Tweets({
		'replace':false,
		'prefs_obj':this.App.prefs
	});
	
	this.App.master_timeline_model = {
	    items : []
	};
	
	if (!this.App.cache) {
		this.App.cache = new TempCache({
			'appObj':this.App
		});
	}
	
	
	this.App.versionCookie = new VersionCookie(this.App.prefs);
	this.App.versionCookie.init();
	
};


// 
// AppAssistant.prototype.cleanup = function() {
// 	Mojo.Log.info('Logging from AppAssistant.cleanup');
// 	Mojo.Log.info('Shutting down app');
// 	// if (!this.weAreHeadless) {
// 	// 	Mojo.Log.info('We are NOT headless -- registering next notification');
// 	// 	this.App.bgnotifier.registerNextNotification();
// 	// }
// };


AppAssistant.prototype.loadAccount = function(account_id) {
	
	if (!account_id) {
		account_id = this.App.prefs.get('last_userid');
	}
	
	/*
		load users from prefs obj
	*/
	this.Users = new SpazAccounts(this.App.prefs);
	this.Users.load();
	
	var account = this.Users.get(account_id);
	if (account !== false) {
		dump(account);
		this.App.username = account.username;
		this.App.type     = account.type;
		this.App.userid   = account.id;
	} else {
		dump("Tried to load account, but failed.");
	}
	
};


/**
 * @param {object} launchParams launch parameters passed to app
 * @param {string} launchParams.action the action to take. (prepPost|user|search|status)
 * @param {string} [launchParams.account] an account hash. If not passed, the last logged-in user account is used
 * @param {string} [launchParams.msg] message to insert into the posting form for the "prepPost" action (action:prepPost)
 * @param {string} [launchParams.userid] userid (integer or string) to pass to "user" action (action:user)
 * @param {string} [launchParams.query] a valid search query for the twitter API (action:search)
 * @param {string} [launchParams.statusid] a status id for a message (action:status)
 * 
 */
AppAssistant.prototype.handleLaunch = function(launchParams) {
	var appAssistant = this;
	
	/*
	   initialize bgnotifier
	*/
	this.App.bgnotifier = new BackgroundNotifier(true);
	
	/*
		load up the timelineCache before going further
	*/
	
	
	var mainStageController = Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME);

	Mojo.Log.error("Launch Parameters: %j", launchParams);
	
	/*
		for compatibility with Bad Kitty and Twee APIs
	*/
	if (launchParams.tweet) {
		launchParams.action = 'prepPost';
		launchParams.msg = launchParams.tweet;
	}
	if (launchParams.user) {
		launchParams.action = 'user';
		launchParams.userid = launchParams.user;
	}

	var stageCallback = function(stageController) {
		Mojo.Log.error('RUNNING stageCallback');

		switch(launchParams.action) {

			/**
			 * {
			 *   action:"prepPost",
			 *   msg:"Some Text",
			 *   account:"ACCOUNT_HASH" // optional
			 * }
			 */
			case 'prepPost':
			case 'post':
				appAssistant.loadAccount(launchParams.account||null);
				stageController.pushScene('post', {
					'text':launchParams.msg,
					'xapp':true
				});
				stageController.activate();
				break;

			/**
			 * {
			 *   action:"user",
			 *   userid:"funkatron"
			 * }
			 */
			case 'user':
				appAssistant.loadAccount(launchParams.account||null);
				stageController.pushScene('user-detail', '@'+launchParams.userid);
				stageController.activate();
				break;

			/**
			 * {
			 *   action:"search",
			 *   query:"spaz source:spaz"
			 * }
			 */			
			case 'search':
				stageController.pushScene('search-twitter', {
					'searchterm':decodeURIComponent(launchParams.query)
				});
				stageController.activate();
				break;

			/**
			 * {
			 *   action:"status",
			 *   statusid:24426249322
			 * }
			 */
			case 'status':
				stageController.pushScene('message-detail', launchParams.statusid);
				stageController.activate();
				break;

			case 'main_timeline':
				Mojo.Log.info('main_timeline action');

				// reset state of bgnotifier so counts are back to 0
				appAssistant.App.bgnotifier.resetState();
				appAssistant.App.bgnotifier.registerNextNotification();

				appAssistant.loadAccount(launchParams.account||null);
				
				Spaz.findAndSwapScene('my-timeline', { 'mark_cache_as_read':false }, stageController);
				
				stageController.activate();
				break;				
			case "tweetNowPlaying":
				if(launchParams.returnValue === true){
					var tweet = "#NowPlaying " + launchParams.nowPlaying.title
					if(launchParams.nowPlaying.artist !== ""){
						tweet += " by " + launchParams.nowPlaying.artist;
					}
					if (tweet.length > 112){
						tweet = tweet.truncate(112, ' [...]');//truncate is a prototype function
					}
					
					var suffix = " on @Koto_Player, via @Spaz";
					stageController.sendEventToCommanders({'type':Mojo.Event.command, 'command':'addTextToPost', text: tweet + suffix});
				} else {
					//Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME).activeScene().showBanner("Not Playing Anything");
					//banner error?
					Mojo.Log.error("not playing anything");
				}
				break;
			case 'bgcheck':
				Mojo.Log.error('BGCHECK action');
				Mojo.Log.error('sendToNotificationChain refresh');
				// Mojo.Controller.getAppController().sendToNotificationChain({"event":"refresh"});
				stageController.sendEventToCommanders({'type':Mojo.Event.command, 'command':'refresh'});
				appAssistant.App.bgnotifier.registerNextNotification();
				break;

			default:
				Mojo.Log.info('default handleLaunch action');
				
				// reset state of bgnotifier so counts are back to 0
				appAssistant.App.bgnotifier.resetState();
				appAssistant.App.bgnotifier.registerNextNotification();
				
				appAssistant.loadAccount(launchParams.account||null);
				
				var topscene = stageController.topScene();
				
				// check need to upgrade
				var to_upgrade = Spaz.Prefs.findOldTwitterAccounts();
				if (to_upgrade.length > 0) {
					
					stageController.pushScene('startlogin');
					stageController.activate();

				} else {

					if (topscene) {
						stageController.activate(); // just activate
					} else if (appAssistant.App.prefs.get('always-go-to-my-timeline') && appAssistant.App.username) {
						stageController.pushScene('my-timeline');
						stageController.activate();
					} else {
						stageController.pushScene('start');
						stageController.activate();
					}
				
				}
				break;
				
				

		}
	};


	/*
		we go ahead and re-activate the existing stage, or make a new main stage
	*/
	if (mainStageController) {
		if (mainStageController.topScene()) {
			stageCallback(mainStageController);
		}
	} else {

		/*
			bgcheck action -- if called when we don't have a stage already, just run in bg
		*/
		if (launchParams.action && launchParams.action == 'bgcheck') {
			Mojo.Log.error('BGCHECK action --- no mainStageController');
		
			appAssistant.App.bgnotifier.init(function() {
				appAssistant.App.bgnotifier.checkForNewData();
			});
		
			return;
		}

		Mojo.Controller.getAppController()
			.createStageWithCallback(
				{
					name: SPAZ_MAIN_STAGENAME,
					assistantName:SPAZ_STAGEASSISTANTNAME
				},
				stageCallback
			);
	}


};




/**
 *  
 */
AppAssistant.prototype.handleCommand = function(event){
	
	sch.debug(event.command);
	
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			/*
				back
			*/
			case 'back':
				// we pass returnFromPop so we can do something different in Acivate, if needed
				Mojo.Controller.stageController.popScene({'returnFromPop':true});
				break;


			case 'search-trends':
				Mojo.Controller.notYetImplemented();
				break;
				
			case 'donate':
				Spaz.getActiveSceneAssistant().showDonationPopup(true);
				
				break;

		}
	}
};



AppAssistant.prototype.openChildWindow = function() {
	this.stageController = this.appController.getStageController('lightWeight');
		
	if (this.stageController){
		// app window is open, give it focus
		this.stageController.activate();
	} else{
		// otherwise create the app window
		this.appController.createStageWithCallback({name: 'lightWeight', lightweight: true}, this.pushTheScene.bind(this));		
	}

};


/**
 * Because the app assistant doesn't share a window object with the stages, 
 * we need to map the sc. namespace to the stageController.window 
 */
AppAssistant.prototype.mapObjectsToNewStage = function(stageController) {
	stageController.window.sc = sc; // map spazcore namespace
	// stageController.window.jQuery = jQuery; // map jQuery
	/*
		re-map setInterval to the stageController's window.setInterval,
		as Mojo unsets it when we make a noWindow app.
	*/
	window.setInterval = stageController.window.setInterval;
};



AppAssistant.prototype.saveLastIDs = function(home, mention, dm) {
	var data = { 'home':home, 'mention':mention, 'dm':dm };
	
	Mojo.Log.error("AppAssistant: Saving last ids to prefs: %j", data);
	
	this.App.prefs.set('cache_lastids', sch.enJSON(data));
	
	Mojo.Log.error("AppAssistant: confirmed cache_lastids:%j", this.App.prefs.get('cache_lastids'));
};


AppAssistant.prototype.loadLastIDs = function() {
	var data = sch.deJSON(this.App.prefs.get('cache_lastids'));
	
	Mojo.Log.error("AppAssistant: Loading last ids from prefs: %j", data);
	
	if (!data || !data.home) {
		this.resetLastIDs();
		return sch.deJSON(this.App.prefs.get('cache_lastids'));
	}
	
	return data;
};


AppAssistant.prototype.resetLastIDs = function() {
	Mojo.Log.error("AppAssistant: resetLastIDs");
	this.saveLastIDs(1,1,1);
};



AppAssistant.prototype.loadTimelineCache = function(onLoad) {
	
	if (!this.App.cache) {
		this.App.cache = new TempCache({
			'appObj':this.App
		});
	}
	
	Mojo.Log.info('LOADTIMELINECACHE');
	
	Mojo.Timing.resume("timing_loadTimelineCache");
	var thisA = this;

	function _onLoad(e) {
		if (onLoad) {
			onLoad(e);
		}
		Mojo.Timing.pause("timing_loadTimelineCache");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}

	if (!this.App.cache.exists()) {
		Mojo.Log.error('CACHE DOES NOT EXIST in AppAssistant');
		this.App.cache.loadFromDB(_onLoad);
	} else {
		_onLoad();
	}	
};




AppAssistant.prototype.saveTimelineCache = function(twitobj) {
	
	sch.error('SAVETIMELINECACHE');
	
	Mojo.Timing.resume("timing_saveTimelineCache");
	
	var cached_items = [];
	
	if (this.App.prefs.get('timeline-save-cache')) {
		/*
			generate current counts, and create array to cache
		*/
		var num_dms = 0, num_replies = 0, num_statuses = 0;
		var max_dms      = TIMELINE_CACHE_MAXENTRIES_DM;
		var max_replies  = TIMELINE_CACHE_MAXENTRIES_REPLY;
		var max_statuses = TIMELINE_CACHE_MAXENTRIES;
	
		for (var i=0; i < this.App.master_timeline_model.items.length; i++) {
			if (this.App.master_timeline_model.items[i].data.SC_is_dm) {
				num_dms++;
				if (num_dms <= max_dms) {
					cached_items.push(this.App.master_timeline_model.items[i]);
				}
			} else if (this.App.master_timeline_model.items[i].data.SC_is_reply) {
				num_replies++;
				if (num_replies <= max_replies) {
					cached_items.push(this.App.master_timeline_model.items[i]);
				}			
			} else {
				num_statuses++;
				if (num_statuses <= max_statuses) {
					cached_items.push(this.App.master_timeline_model.items[i]);
				}
			}
		}
	
	
		Mojo.Log.info('Counts: DMs %s, Replies %s, Statuses %s', num_dms, num_replies, num_statuses);
	
		Mojo.Log.info('Length of master_timeline_model.items: '+this.App.master_timeline_model.items.length);
	}
	
	var twitdata = {};
	twitdata['version']                         = CACHE_VERSION;
	twitdata['my_master_timeline_model_items']  = cached_items;
	
	Mojo.Log.info('Length of twitdata[\'my_master_timeline_model_items\']: '+twitdata['my_master_timeline_model_items'].length);
	

	if (twitobj) {

		twitdata[SPAZCORE_SECTION_HOME + '_lastid']    = twitobj.getLastId(SPAZCORE_SECTION_HOME);
		twitdata[SPAZCORE_SECTION_REPLIES + '_lastid'] = twitobj.getLastId(SPAZCORE_SECTION_REPLIES);
		twitdata[SPAZCORE_SECTION_DMS     + '_lastid'] = twitobj.getLastId(SPAZCORE_SECTION_DMS);
	
		/*
			write out the lastIDs to a cookie, so we can use this data in
			the bgnotifier without loading the whole cache
		*/
		this.saveLastIDs(
			twitobj.getLastId(SPAZCORE_SECTION_HOME),
			twitobj.getLastId(SPAZCORE_SECTION_REPLIES),
			twitobj.getLastId(SPAZCORE_SECTION_DMS)
		);
	}

	this.App.cache.save('mytimelinecache', twitdata, this.App.userid);
	
	Mojo.Timing.pause('timing_saveTimelineCache');
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));	
};




AppAssistant.prototype.considerForNotification = function(params){   
	Mojo.Log.error('NOTIFICATION RECEIVED in AppAssistant:%j ', params);

	var mytimeline_scene;

	if (params) {
	    switch(params.event) {
			
			case "temp_cache_cleared":
				// reset the state of the my-timeline scene
				mytimeline_scene = Spaz.getSceneFromStack('my-timeline');
				if (mytimeline_scene) {
					mytimeline_scene.assistant.resetTwitState();
				}
				params.event = null;
				
				break;
				
			case "blocked_user":
				var blocked_userid = params.blocked_userid;
				
				// remove all messages from this user from my-timeline
				function iterator(obj) {
					if (!obj.data.SC_is_dm) {
						if (obj.data.user.id == blocked_userid) {
							Mojo.Log.error("obj.data.user.id == %s, rejecting", blocked_userid);
							return true;
						}
					}
				}
				
				// remove from master timeline model
				this.App.master_timeline_model.items = _.reject(this.App.master_timeline_model.items, iterator);

				// remove from scene's current model
				mytimeline_scene = Spaz.getSceneFromStack('my-timeline');
				if (mytimeline_scene) {
					mytimeline_scene.assistant.timeline_model.items = _.reject(mytimeline_scene.assistant.timeline_model.items, iterator);					
					mytimeline_scene.modelChanged(mytimeline_scene.assistant.timeline_model);
				}
				
				params.event = null;
				params.blocked_userid = null;
				
				break;
    	}
	}
	
	return params;   
};