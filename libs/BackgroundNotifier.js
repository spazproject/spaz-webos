

/**
 * @class a background notifier 
 */
var BackgroundNotifier = function() {
	this.init();	
};

/**
 * @type string 
 */
BackgroundNotifier.prototype.template = 'dashboard/bg-notify-info.html';

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
BackgroundNotifier.prototype.interval = 15*60; // 15 minutes

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
	this.notifyOnHome = this.prefs.get('bgnotify-on-home');

	this.twit = new scTwit(null, null, {
		'event_mode':'jquery'
	});

	var last_userid = this.prefs.get('last_userid');
	var last_user_obj = this.Users.getUser(last_userid);
	if (last_user_obj) {
		sch.debug(last_user_obj);
		this.username = last_user_obj.username;
		this.password = last_user_obj.password;
		this.type     = last_user_obj.type;
		this.userid   = last_user_obj.id;
		if (this.type === SPAZCORE_SERVICE_CUSTOM) {
			var api_url = users.getMeta(this.userid, 'api-url');
			this.twit.setBaseURL(api_url);
		} else {
			this.twit.setBaseURLByService(this.type);				
		}
		this.twit.setCredentials(this.username, userobj.password);
	} else {
		sch.error("Tried to load last_user_obj, but failed.");
	}
	
	this.loadState();
	this.registerNotification();
};

/**
 * loads data from the cookie into counts and lastids 
 */
BackgroundNotifier.prototype.loadState = function() {
	if (!this.mojoCookie) {
		this.mojoCookie = new Mojo.Model.Cookie('SPAZ_WEBOS_BGNOTIFIER_DATA');
	}

	var loaded_data = this.mojoCookie.get();
	
	this.counts  = loaded_data.counts;
	this.lastids = loaded_data.lastids;
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
 * registers a repeating call to look for new data and notify 
 */
BackgroundNotifier.prototype.registerNotification = function() {};


/**
 *  
 */
BackgroundNotifier.prototype.displayNotification = function(templateArgs) {
	var appController = Mojo.Controller.getAppController(); 
	var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME); 

	// if (dashboardStageController) { 
	// 	dashboardStageController.delegateToSceneAssistant("updateDashboard", title, message, count, fromstage); 
	// } else {
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
	// } 
};

BackgroundNotifier.prototype.checkForNewData = function() {
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
BackgroundNotifier.prototype.getDMs = function() {};

/**
 * get the mentions timeline and check for new data  
 */
BackgroundNotifier.prototype.getMentions = function() {};

/**
 * get the home timeline and check for new data  
 */
BackgroundNotifier.prototype.getHomeTimeline = function() {};

