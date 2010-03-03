function StageAssistant () {
	Mojo.Log.info("Logging from StageAssistant Constructor");
	// sc.setDumpLevel(5);
	
}

StageAssistant.prototype.initialize = function() {
	
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
	sc.app.prefs = new SpazPrefs(default_preferences, null, {
		'timeline-maxentries': {
			'onGet': function(key, value){
				if (sc.app.prefs.get('timeline-friends-getcount') > value) {
					value = sc.app.prefs.get('timeline-friends-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (sc.app.prefs.get('timeline-friends-getcount') > value) {
					value = sc.app.prefs.get('timeline-friends-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		},
		'timeline-maxentries-dm': {
			'onGet': function(key, value){
				if (sc.app.prefs.get('timeline-dm-getcount') > value) {
					value = sc.app.prefs.get('timeline-dm-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (sc.app.prefs.get('timeline-dm-getcount') > value) {
					value = sc.app.prefs.get('timeline-dm-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		},
		'timeline-maxentries-reply': {
			'onGet': function(key, value){
				if (sc.app.prefs.get('timeline-replies-getcount') > value) {
					value = sc.app.prefs.get('timeline-replies-getcount');
				}
				sch.debug(key + ':' + value);
				return value;
			},
			'onSet': function(key, value){
				if (sc.app.prefs.get('timeline-replies-getcount') > value) {
					value = sc.app.prefs.get('timeline-replies-getcount');
				}
				sch.debug(key + ':' + value);
				return value;					
			}
		}
	});
	sc.app.prefs.load(); // this is sync on webOS, b/c loading from Mojo.Model.Cookie
	sc.app.twit = new scTwit(null, null, {
		'event_mode':'jquery'
	});

	sc.app.bgnotifier = new BackgroundNotifier();

};


StageAssistant.prototype.setup = function() {
	Mojo.Log.info("Logging from StageAssistant Setup");
	
	var thisSA = this;
	this.initialize();
	this.gotoMyTimeline();
};


StageAssistant.prototype.cleanup = function() {
	
	Mojo.Log.info("StageAssistant cleanup");
	
	var sc = null;
	
	/*
		try to clean up ALL jQuery listeners everywhere
	*/
	jQuery().unbind();
	jQuery().die();
};


StageAssistant.prototype.handleCommand = function(event){
	
	sch.error("StageAssistant handleCommand:"+event.command);
	
	var active_scene = this.controller.activeScene();
	
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			
			
			/*
				Navigation
			*/
			case 'accounts':
				Spaz.findAndSwapScene("startlogin", active_scene);
				break;
			case 'my-timeline':
				Spaz.findAndSwapScene("my-timeline", active_scene);
				break;
			case 'favorites':
				Spaz.findAndSwapScene("favorites", active_scene);
				break;
			case 'search':
				Spaz.findAndSwapScene("startsearch", active_scene);
				break;
			case 'followers':
				Spaz.findAndSwapScene("manage-followers", active_scene);
				break;
			case 'appmenu-about':
				Mojo.Controller.stageController.pushScene("about", active_scene);
				break;
			case Mojo.Menu.prefsCmd:
				Mojo.Controller.stageController.pushScene("preferences", active_scene);
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Controller.stageController.pushScene("help", active_scene);
				break;
		
			
			default:
				break;			
		}
		
	}
};



StageAssistant.prototype.gotoMyTimeline = function(stageController) {
		/*
			load users from prefs obj
		*/
		var users = new Users(sc.app.prefs);
		users.load();
		
		/*
			get last user
		*/
		if (sc.app.prefs.get('always-go-to-my-timeline')) {
			var last_userid = sc.app.prefs.get('last_userid');
			var last_user_obj = users.getUser(last_userid);
			if (last_user_obj !== false) {
				sch.error(last_user_obj);
				sc.app.username = last_user_obj.username;
				sc.app.password = last_user_obj.password;
				sc.app.type     = last_user_obj.type;
				sc.app.userid   = last_user_obj.id;
				this.controller.pushScene('my-timeline');
			} else {
				this.controller.pushScene('start');
			}
		} else {
			this.controller.pushScene('start');
		}

};
