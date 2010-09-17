
const SPAZ_DASHBOARD_STAGENAME = 'dashboard';
const SPAZ_MAIN_STAGENAME      = 'main';
const SPAZ_STAGEASSISTANTNAME = 'StageAssistant';
const SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME = 'bgnotifier';

const SPAZ_DONATION_URL = 'http://getspaz.com/donate';



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
        accessURL: 'http://twitter.com/oauth/access_token'
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
	
	
	// this.App.bgnotifier = new BackgroundNotifier();

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


AppAssistant.prototype.handleLaunch = function(launchParams) {
	
	var cardStageProxy = this.controller.getStageProxy(SPAZ_MAIN_STAGENAME);
	var cardStageController = this.controller.getStageController(SPAZ_MAIN_STAGENAME);
	Mojo.Log.error('cardStageController:');
	Mojo.Log.error(cardStageController);
	var appController = Mojo.Controller.getAppController();
	var dashboardStage = this.controller.getStageProxy(SPAZ_DASHBOARD_STAGENAME);
	
	Mojo.Log.info("Logging from AppAssistant handleLaunch");

	Mojo.Log.info("Launch Parameters: %j", launchParams);
	
	Spaz.closeDashboard();
	
	

	// /**
	//  * opens the main app stage. embedded here for closure's sake
	//  */
	// var that = this;
	// function openMainStage() {
	// 	// this.App.bgnotifier.stop();
	// 	if (!cardStageController) {
	// 		
	// 		that.initialize();
	// 		
	// 		Mojo.Log.error('NO CARDSTAGECONTROLLER EXISTS');
	// 		Mojo.Log.error('FIRSTLOAD ----------------------');
	// 		var pushStart = function(stageController) {
	// 			that.mapObjectsToNewStage(stageController);
	// 			that.gotoMyTimeline(stageController);
	// 		};
	// 		var stageArguments = {
	// 			"name": SPAZ_MAIN_STAGENAME,
	// 			"assistantName":"StageAssistant"
	// 		};
	// 		Mojo.Log.error('Creating stage');
	// 		that.controller.createStageWithCallback(stageArguments, pushStart.bind(that), "card");
	// 		
	// 	} else {
	// 		Mojo.Log.error("cardStageController Exists -----------------------");
	// 		if (!window.sc) {
	// 			that.mapObjectsToNewStage(cardStageController);
	// 		}
	// 		Mojo.Log.error('Focusing stage controller window');
	// 		cardStageController.window.focus();
	// 	}
	// }

	/*
		if there are no launchparams, open the main stage as normal
	*/
	if (!launchParams) {
		Mojo.Log.info('No launchParams - OPENING MAIN STAGE');
		// openMainStage();
	}
	
	if (launchParams) {
		Mojo.Log.info("launchParams: %j", launchParams);
		
		/*
			for compatibility with Bad Kitty and Twee APIs
		*/
		if (launchParams.tweet) {
			launchParams.action = 'prepPost';
			launchParams.msg = launchParams.tweet;
		}
		
		switch(launchParams.action) {
			
			case 'prepPost':
				
				// 'account': DEFAULT is last used
				// 'msg':
				// 'irt':
				break;
			
			case 'searchUsers':
				break;
				
			case 'searchStatuses':
				
				break;
				
			case 'searchMessages':
				
				break;
				
			case 'user':
				
				// load a particular Twitter user profile
				// param service:twitter|identica
				
				break;
			
			case 'post':
				/*
					this is NYI
				*/
				if (launchParams.actionopts) {
					var msg = launchParams.actionopts.msg || '';
					var irt = launchParams.actionopts.irt || -1;
				}
				// make the user choose an account to post from, and then
				// do something here to open a posting window with a prefilled form
								
				break;
			case 'bgcheck': 
				
				/*
					right now bgchecking is buggy. the pref should always
					be false, unless the user hacks their prefs up
				*/
				if (this.App.prefs.get('bgnotify-enabled')) {
					Mojo.Log.error('RUNNING BG CHECK');
					that.initialize();
					this.App.bgnotifier.start();
					break;
				} // else we drop through to default
				
			default:
				Mojo.Log.error('default action - OPENING MAIN STAGE');
				openMainStage();
		}
		
		if (launchParams.fromstage) {
			Mojo.Log.error("fromstage:", launchParams.fromstage);
			if (launchParams.fromstage === SPAZ_MAIN_STAGENAME) {
				PalmSystem.activate();
			} else {
				var stageController = this.controller.getStageController(launchParams.fromstage);
				if (stageController) {
					stageController.window.focus();
				}			
			}
		}
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
	
	var mainStageController = Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME);
	
	Mojo.Log.info("Launch Parameters: %j", launchParams);

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
					'text':launchParams.msg
				});
				break;

			/**
			 * {
			 *   action:"user",
			 *   userid:"funkatron"
			 * }
			 */
			case 'user':
				// appAssistant.loadAccount(launchParams.account||null);
				stageController.pushScene('user-detail', '@'+launchParams.userid);
				break;
			
			/**
			 * {
			 *   action:"search",
			 *   query:"spaz source:spaz"
			 * }
			 */			
			case 'search':
				stageController.pushScene('search-twitter', {
					'searchterm':launchParams.query
				});
				break;

			/**
			 * {
			 *   action:"status",
			 *   userid:24426249322
			 * }
			 */
			case 'status':
				stageController.pushScene('message-detail', launchParams.statusid);
				break;
				
			
			default:
				stageController.pushScene('start', launchParams.query);
				break;
			
		}
	};
	
	
	/*
		we go ahead and re-activate the existing stage, or make a new main stage
	*/
	if (mainStageController) {
		if (mainStageController.topScene() && mainStageController.topScene().sceneName == "start")
			stageCallback(mainStageController);
		else
			phonebookStageController.window.focus(); 
	} else {
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
				Mojo.Controller.stageController.popScene();
				break;


			case 'search-trends':
				Mojo.Controller.notYetImplemented();
				break;
				
			case 'donate':
				var sr = new Mojo.Service.Request("palm://com.palm.applicationManager", {
				  method: "open",
				  parameters:  {
				      id: 'com.palm.app.browser',
				      params: {
				          target: SPAZ_DONATION_URL
				      }
				  }
				});
				
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



