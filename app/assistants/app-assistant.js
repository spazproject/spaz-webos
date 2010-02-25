
const SPAZ_DASHBOARD_STAGENAME = 'dashboard';
const SPAZ_MAIN_STAGENAME      = 'main';
const SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME = 'bgnotifier';

var loggedin_appmenu_items = [
	Mojo.Menu.editItem,
	{ label: $L('Update Location...'),	command: 'update-location' },
	{ label: $L('New Search Card'),	command: 'new-search-card' },
	{ label: $L('Accounts...'), command:'accounts' },
	{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
	{ label: $L('About Spaz'),		command: 'appmenu-about' },
	{ label: $L('Help...'),			command:Mojo.Menu.helpCmd }
];


function AppAssistant(appController) {
	
	Mojo.Log.info("Logging from AppAssistant Constructor");
	
}



AppAssistant.prototype.initialize = function() {
	sch.error('INITIALIZING EVERYTHING');
	
	/*
		Remap JSON parser because JSON2.js one was causing probs with unicode
	*/
	sc.helpers.deJSON = function(str) {
		try {
			var obj = JSON.parse(str);
			return obj;
		} catch(e) {
			sch.error('There was a problem decoding the JSON string');
			sch.error('Here is the JSON string: '+str);
			return null;
		}

	};
	sc.helpers.enJSON = function(obj) {
		var json = JSON.stringify(obj);
		return json;
	};

	sc.info = Mojo.Log.info;
	sc.warn = Mojo.Log.warn;
	sc.error = Mojo.Log.error;

	/*
		model for saving Tweets to Depot. We replace on every start to make sure we don't go over-budget
	*/
	sc.app.Tweets = new Tweets(false);

	sc.app.search_cards = [];
	sc.app.new_search_card = 0;
	sc.app.search_card_prefix = "searchcard_";

	sc.app.username = null;
	sc.app.password = null;

	sc.app.prefs = null;


	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	sc.app.prefs = new SpazPrefs(default_preferences);
	sc.app.prefs.load(); // this is sync on webOS, b/c loading from Mojo.Model.Cookie
	sc.app.twit = new scTwit(null, null, {
		'event_mode':'jquery'
	});

	sc.app.bgnotifier = new BackgroundNotifier();

};

// 
// AppAssistant.prototype.cleanup = function() {
// 	Mojo.Log.info('Logging from AppAssistant.cleanup');
// 	Mojo.Log.info('Shutting down app');
// 	// if (!this.weAreHeadless) {
// 	// 	Mojo.Log.info('We are NOT headless -- registering next notification');
// 	// 	sc.app.bgnotifier.registerNextNotification();
// 	// }
// };



AppAssistant.prototype.handleLaunch = function(launchParams) {
	
	var cardStageProxy = this.controller.getStageProxy(SPAZ_MAIN_STAGENAME);
	var cardStageController = this.controller.getStageController(SPAZ_MAIN_STAGENAME);
	var appController = Mojo.Controller.getAppController();
	var dashboardStage = this.controller.getStageProxy(SPAZ_DASHBOARD_STAGENAME);
	
	Mojo.Log.info("Logging from AppAssistant handleLaunch");
	var thisA = this;

	Mojo.Log.info("Launch Parameters:");
	Mojo.Log.info(sch.enJSON(launchParams));
	
	Spaz.closeDashboard();

	/**
	 * opens the main app stage. embedded here for closure's sake
	 */
	var that = this;
	function openMainStage() {
		// sc.app.bgnotifier.stop();
		if (!cardStageController) {
			
			that.initialize();
			
			sch.error('NO CARDSTAGECONTROLLER EXISTS');
			sch.error('FIRSTLOAD ----------------------');
			var pushStart = function(stageController) {
				that.mapSpazcoreNamespace(stageController);
				that.gotoMyTimeline(stageController);
			};
			var stageArguments = {
				"name": SPAZ_MAIN_STAGENAME,
				"assistantName":"StageAssistant"
			};
			sch.error('Creating stage');
			that.controller.createStageWithCallback(stageArguments, pushStart.bind(that), "card");
			
		} else {
			sch.error("cardStageController Exists -----------------------");
			if (!window.sc) {
				that.mapSpazcoreNamespace(cardStageController);
			}
			sch.error('Focusing stage controller window');
			cardStageController.window.focus();
		}
	}

	/*
		if there are no launchparams, open the main stage as normal
	*/
	if (!launchParams) {
		sch.error('No launchParams - OPENING MAIN STAGE');
		openMainStage();
	}
	
	if (launchParams) {
		if (launchParams.action) {
			sch.error("action:", launchParams.action);
			switch(launchParams.action) {
			
				case 'post':
					/*
						this is NYI
					*/
					// if (launchParams.actionopts) {
					// 	var msg = launchParams.actionopts.msg || '';
					// 	var irt = launchParams.actionopts.irt || -1;
					// }
					// // make the user choose an account to post from, and then
					// // do something here to open a posting window with a prefilled form
					// 				
					// break;
				case 'bgcheck': 
					
					/*
						right now bgchecking is buggy. the pref should always
						be false, unless the user hacks their prefs up
					*/
					if (sc.app.prefs.get('bgnotify-enabled')) {
						sch.error('RUNNING BG CHECK');
						that.initialize();
						sc.app.bgnotifier.start();
						break;
					} // else we drop through to default
					
				default:
					sch.error('default action - OPENING MAIN STAGE');
					openMainStage();
			}
		} else if (launchParams.fromstage) {
			sch.error("fromstage:", launchParams.fromstage);
			switch(launchParams.fromstage) {
				
				
				default:
					sch.error('OPENING MAIN STAGE');
					openMainStage();
			}		
		}
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

		}
	}
};



/**
 * Because the app assistant doesn't share a window object with the stages, 
 * we need to map the sc. namespace to the stageController.window 
 */
AppAssistant.prototype.mapSpazcoreNamespace = function(stageController) {
	stageController.window.sc = sc; // map spazcore namespace
	window.setIntercval = stageController.window.setInterval;
};


AppAssistant.prototype.gotoMyTimeline = function(stageController) {
		/*
			load users from prefs obj
		*/
		var users = new Users(sc.app.prefs);
		users.load();
		
		/*
			get last user
		*/
		var last_userid = sc.app.prefs.get('last_userid');
		var last_user_obj = users.getUser(last_userid);
		if (last_user_obj !== false) {
			dump(last_user_obj);
			sc.app.username = last_user_obj.username;
			sc.app.password = last_user_obj.password;
			sc.app.type     = last_user_obj.type;
			sc.app.userid   = last_user_obj.id;
			stageController.pushScene('my-timeline');
		} else {
			dump("Tried to load last_user_object, but failed.");
		}

};
