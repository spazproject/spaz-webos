/************************************
 * global scene helper functions
 ************************************/

/**
 * use the Spaz. namespace just to keep from cluttering too much 
 */
if(typeof Spaz === "undefined") {
	Spaz = {};
}

/**
 * grabs the "App" container object and returns it. We use this container
 * to store globally-used properties
 */
Spaz.getAppObj = function() {
	var App = Mojo.Controller.getAppController().assistant.App;
	return App;
};


Spaz.getActiveSceneAssistant = function() {
	return Spaz.getStageController().activeScene().assistant;
};


Spaz.getStageController = function() {

	var appC = Mojo.Controller.getAppController();
	var stageC = appC.getActiveStageController();
	return stageC;
};

/**
 * This helper looks through the array of scenes and looks for an existing instance of 
 * the given targetScene. If one exists, we pop all scenes before it to return to it. Otherwise
 * we swap to a new instance of the scene
 * 
 * @param {string} targetScene the scene name
 * @param {many} returnValue a return value passed to the pop or swap call
 */
Spaz.findAndSwapScene = function(targetScene, returnValue, stageController) {
	
	if (!stageController) {
		stageController = Mojo.Controller.stageController;
	}
	if (!stageController) {
		stageController = Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME);
	}
	
	/*
		initialize
	*/
	var scene_exists = false;
	
	/*
		get an array of existing scenes
	*/
	var scenes	 = stageController.getScenes();
	
	var topscene = stageController.topScene();
	
	
	if (topscene && topscene.sceneName && targetScene == topscene.sceneName) {
		Mojo.Log.info('We are already on the scene %s', targetScene);
		return;
	}

	for (var k=0; k<scenes.length; k++) {
		if (scenes[k].sceneName == targetScene) { // this scene already exists, so popScenesTo it
			scene_exists = true;
		}
	}
	
	if (scene_exists) {
		stageController.popScenesTo({name: targetScene, transition: Mojo.Transition.crossFade}, returnValue);
	} else {
		stageController.swapScene({name: targetScene, transition: Mojo.Transition.crossFade}, returnValue);
	}
};



Spaz.popAllAndPushScene = function(targetScene, returnValue) {
	Mojo.Controller.stageController.popScenesTo(null, null);
	Mojo.Controller.stageController.pushScene(targetScene, returnValue);
};


/**
 * @param {String} targetScene the name of the scene we're looking for 
 * @returns {Object|Boolean} the scene object, or false if not found
 */
Spaz.getSceneFromStack = function(targetScene) {
	var stageController = Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME);
	
	if (stageController) {
		var scenes	 = stageController.getScenes();
		for (var k=0; k<scenes.length; k++) {
			if (scenes[k].sceneName == targetScene) {
				return scenes[k];
			}
		}
	}
	return false;
};




/**
 * converts various items in a timeline entry's text into clickables
 * @param {string} str
 * @return {string}
 */
Spaz.makeItemsClickable = function(str) {
	
	str = sch.autolink(str, null, null, 20);
	str = sch.autolinkTwitterScreenname(str, '<span class="username clickable" data-user-screen_name="#username#">@#username#</span>');
	str = sch.autolinkTwitterHashtag(str, '<span class="hashtag clickable" data-hashtag="#hashtag#">##hashtag#</span>');

	
	return str;
};

/**
 * preps an email and opens the compose email scene in the email app
 * 
 * the opts object passed should be of a format like:
 * {
 *	account:{integer, optional},
 *	attachments:{array of file paths, optional},
 *	subject:{string, optional},
 *	msg:{string, optional},
 *	to:{array of email addresses},
 *	cc:{array of email addresses},
 *	bcc:{array of email addresses}
 * }
 * 
 * @param {object} opts
 *	
 */
Spaz.sendEmail = function(opts) {
	
	
	function makeRecipientObj(address, type, contactDisplay) {
		var to_role	 = 1;
		var cc_role	 = 2;
		var bcc_role = 3;
		
		var role = null;
		
		switch(type) {
			case 'to':
				role = to_role;
				break;
			case 'cc':
				role = cc_role;
				break;
			case 'bcc':
				role = bcc_role;
				break;
			default:
				role = to_role;
		}
		
		var re_obj = {
			'contactDisplay': contactDisplay,
			'role' :role,
			'value':address,
			'type' :'email'
		};
		
		return re_obj;
	};
	
	var to_addresses  = opts.to	 || null;
	var cc_addresses  = opts.cc	 || null;
	var bcc_addresses = opts.bcc || null;
	
	var recipients = [];
	
	if (to_addresses) {
		for (var i=0; i < to_addresses.length; i++) {
			recipients.push( makeRecipientObj(to_addresses[i].address, 'to', to_addresses[i].name) );
		};													
	}														
															
	if (cc_addresses) {										
		for (i=0; i < cc_addresses.length; i++) {		
			recipients.push( makeRecipientObj(cc_addresses[i].address, 'cc', cc_addresses[i].name) );
		};													
	}														
															
	if (bcc_addresses) {									
		for (i=0; i < bcc_addresses.length; i++) {		
			recipients.push( makeRecipientObj(bcc_addresses[i].address, 'bcc', bcc_addresses[i].name) );
		};
	}
	
	var account		= opts.account	   || null; // an integer or null
	var attachments = opts.attachments || null; // an array or null
	var summary		= opts.subject	   || null; // a string or null
	var text		= opts.msg		   || null; // a string or null
	
	
	var email_params = {
		'account':account,
		'attachments':attachments,
		'recipients':recipients,
		'summary':summary,
		'text':text
	};
	
	
	var email_srvc = opts.controller.serviceRequest(
		'palm://com.palm.applicationManager',
		{
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: email_params
			}
		}
	);
};

Spaz.postToService = function(options) {
  var defaultOptions = {
	api: "twitpic",
	fileName: "",
	message: "",
	controller: null
  };
  
  for(var opt in defaultOptions) {
	if(!options[opt])
	  options[opt] = defaultOptions[opt];
  }
  
  if(!options.controller)
	throw "Without a controller no service request possible";
  
  var apis = {
	twitpic: {
	  url: "http://twitpic.com/api/uploadAndPost",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabelName: "media"
	},
	yfrog: {
	  url: "",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabel: "media"
	},
	twitgoo: {
	  url: "",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabelName: "media"
	},
	pikchur: {
	  url: "",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabel: "media"
	},
	tweetphoto: {
	  url: "",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabelName: "media"
	},
	"pic.gd": {
	  url: "",
	  usernameFieldName: "username",
	  passwordFieldName: "password",
	  messageFieldName: "message",
	  fileLabel: "media"
	}
  };
  
  var usernameObj = {};
  usernameObj.key = apis[options.api].usernameFieldName;
  usernameObj.value = Spaz.getAppObj().username;
  
  var passwordObj = {};
  passwordObj.key = apis[options.api].passwordFieldName;
  passwordObj.value = Spaz.getAppObj().password;
  
  var messageObj = {};
  messageObj.key = apis[options.api].messageFieldName;
  messageObj.value = options.message;
  
  var postParams = [usernameObj, passwordObj, messageObj];
  
  options.controller.serviceRequest('palm://com.palm.downloadmanager/', {
	method: 'upload',
	parameters: {
	  fileName: options.fileName,
	  fileLabel: apis[options.api].fileLabelName,
	  url: apis[options.api].url,
	  contentType: 'img',
	  postParameters: postParams
	},
	onSuccess : function (resp){
	  Mojo.Log.info('Successfully uploading message');
	},
	onFailure : function (e){
	  Mojo.Log.info('Failed uploading image');
	}.bind(this)
  });
};



Spaz.closeDashboard = function(name) {
	name = name || SPAZ_DASHBOARD_STAGENAME;
	
	Mojo.Controller.getAppController().closeStage(name);
};


Spaz.setTheme = function(theme) {
	// Mojo.Log.error('AppThemes: %j', AppThemes);
	// Mojo.Log.error('theme: %s', theme);
	// Mojo.Log.error('AppThemes[theme]: %j', AppThemes[theme]);

	if (AppThemes && AppThemes[theme]) {
		
		if (AppThemes[theme].palmtheme == 'dark') {
			jQuery('body').addClass('palm-dark');
		} else {
			jQuery('body').removeClass('palm-dark');
		}
		
		jQuery('link[title="apptheme"]').attr('href', 'stylesheets/'+AppThemes[theme].stylesheet);
	}
};



Spaz.getFancyTime = function(time_value, labels, use_dateparse) {

	if (sc.helpers.iswebOS() && App.prefs.get('timeline-absolute-timestamps')) {

		if (use_dateparse === true) {
			parsed_date = new Date.parse(time_value);
		} else {
			parsed_date = new Date(time_value);
		}
		
		var now = new Date();
		var delta = parseInt( (now.getTime() - parsed_date.getTime()) / 1000, 10);
		
		if(delta < (24*60*60)) {
			return Mojo.Format.formatDate(parsed_date, {time: 'short'});
		} else {
			return Mojo.Format.formatDate(parsed_date, 'short');
		}

	} else {
	
		return sch.getRelativeTime(time_value, labels, use_dateparse);
		
	}
};

Spaz.getQueryVars = function(qstring) {
	var qvars = [];
	var qvars_tmp = qstring.split('&');
	for (var i = 0; i < qvars_tmp.length; i++) {;
		var y = qvars_tmp[i].split('=');
		qvars[y[0]] = decodeURIComponent(y[1]);
	};
	return qvars;
};


/*
	Namespace for prefs helpers
*/
Spaz.Prefs = {};


/**
 * retrieves the username for the current account 
 */
Spaz.Prefs.getUsername = function(acc_id) {
		
	if (!acc_id) {
		acc_id = Spaz.Prefs.getCurrentAccountId();
	}

	if (acc_id) {
		var accobj = Spaz.getAppObj().accounts.get(acc_id);
		return !!accobj ? accobj.username : null;
	} else {
		return null;
	}

};

/**
 * DEPRECATED; calls Spaz.Prefs.getAuthKey
 */
Spaz.Prefs.getPassword = function(acc_id) {
	sch.error('Spaz.Prefs.getPassword is deprecated; use Spaz.Prefs.getAuthKey');
	return Spaz.Prefs.getAuthKey(acc_id);
};

/**
 * Returns the current account's auth key 
 */
Spaz.Prefs.getAuthKey = function(acc_id) {
	if (!acc_id) {
		acc_id = Spaz.Prefs.getCurrentAccountId();
	}

	sch.debug('getAuthKey acc_id:'+acc_id);
	if (acc_id) {
		var accobj = Spaz.getAppObj().accounts.get(acc_id);
		return !!accobj ? accobj.auth : null;
	} else {
		return null;
	}	
};

/**
 * Returns a SpazAuth object based on the current user's type and auth key 
 */
Spaz.Prefs.getAuthObject = function(acc_id) {
	var authkey = Spaz.Prefs.getAuthKey(acc_id);
	Mojo.Log.error('getAuthObject authkey: %s', authkey);
	
	if (authkey) {
		var auth = new SpazAuth(Spaz.Prefs.getAccountType(acc_id));
		Mojo.Log.error('Spaz.Prefs.getAccountType(): %s', Spaz.Prefs.getAccountType(acc_id));
		Mojo.Log.error('auth: %j', auth);
		auth.load(authkey);
		return auth;
	} else {
		return null;
	}
};

/**
 * Returns the current account's type, or that of the passed id
 */
Spaz.Prefs.getAccountType = function(acc_id) {
	if (!acc_id) {
		acc_id = Spaz.Prefs.getCurrentAccountId();
	}

	if (acc_id) {
		var accobj = Spaz.getAppObj().accounts.get(acc_id);
		return !!accobj ? accobj.type : null;
	} else {
		return null;
	}

};


/**
 * Retrieves the custom API url for the current account, or the account with the passed id
 */
Spaz.Prefs.getCustomAPIUrl = function(acc_id) {
	if (!acc_id) {
		acc_id = Spaz.Prefs.getCurrentAccountId();
	}
	
	var custom_api_url = Spaz.getAppObj().accounts.getMeta(acc_id, 'twitter-api-base-url');
	if (!custom_api_url) {
		// used to be called api-url, so try that
		custom_api_url = Spaz.getAppObj().accounts.getMeta(acc_id, 'api-url');
	}
	return custom_api_url;
};


/**
 * Returns the current account object
 */
Spaz.Prefs.getCurrentAccount = function() {
	var currentAccountId = Spaz.Prefs.getCurrentAccountId();
	if (currentAccountId) {
		return Spaz.getAppObj().accounts.get(currentAccountId);
	} else {
		return null;
	}

};


Spaz.Prefs.getCurrentAccountId = function() {
	if (Spaz.getAppObj().userid) {
		return Spaz.getAppObj().userid;
	} else {
		return Spaz.getAppObj().prefs.get('last_userid');
	}
	
};



Spaz.Prefs.findOldTwitterAccounts = function() {
	var users = new SpazAccounts(Spaz.getAppObj().prefs);
	users.load();
	var accts = users.getAll();
	var to_upgrade = [];
	for (var i=0; i < accts.length; i++) {
		// Mojo.Log.error("accts[i]: %j", accts[i]);
		if ( accts[i].type === SPAZCORE_ACCOUNT_TWITTER 
			&& (!users.getMeta(accts[i].id, 'twitter_dm_access') && !users.twitter_dm_access) ) {
			to_upgrade.push(accts[i].username+'@'+SPAZCORE_ACCOUNT_TWITTER);
		}
	}
	return to_upgrade;
};



/*
	We don't namespace these because they're just so darn simple
*/

/*
	map sc.helpers.dump() to dump() for extra succinctness
*/
var dump = sc.helpers.dump;


var profile = function() {
	if (console && console.profile)
		console.profile();	
};

var profileEnd = function() {
	if (console && console.profileEnd)
		console.profileEnd();
};

