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
 * This helper looks through the array of scenes and looks for an existing instance of 
 * the given targetScene. If one exists, we pop all scenes before it to return to it. Otherwise
 * we swap to a new instance of the scene
 * 
 * @param {string} targetScene the scene name
 * @param {many} returnValue a return value passed to the pop or swap call
 */
Spaz.findAndSwapScene = function(targetScene, returnValue) {
	/*
		initialize
	*/
	var scene_exists = false;
	
	/*
		get an array of existing scenes
	*/
	var scenes = Mojo.Controller.stageController.getScenes();
	

	for (var k=0; k<scenes.length; k++) {
		if (scenes[k].sceneName == targetScene) { // this scene already exists, so popScenesTo it
			scene_exists = true;
		}
	}
	
	if (scene_exists) {
		Mojo.Controller.stageController.popScenesTo(targetScene, returnValue);
	} else {
		Mojo.Controller.stageController.swapScene(targetScene, returnValue);
	}
};



Spaz.popAllAndPushScene = function(targetScene, returnValue) {
	Mojo.Controller.stageController.popScenesTo();
	Mojo.Controller.stageController.pushScene(targetScene, returnValue);
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
 * 	account:{integer, optional},
 * 	attachments:{array of file paths, optional},
 * 	subject:{string, optional},
 * 	msg:{string, optional},
 * 	to:{array of email addresses},
 * 	cc:{array of email addresses},
 *  bcc:{array of email addresses}
 * }
 * 
 * @param {object} opts
 *  
 */
Spaz.sendEmail = function(opts) {
	
	
	function makeRecipientObj(address, type, contactDisplay) {
		var to_role  = 1;
		var cc_role  = 2;
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
	
	var to_addresses  = opts.to  || null;
	var cc_addresses  = opts.cc  || null;
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
	
	var account     = opts.account     || null; // an integer or null
	var attachments = opts.attachments || null; // an array or null
	var summary     = opts.subject     || null; // a string or null
	var text        = opts.msg         || null; // a string or null
	
	
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
  usernameObj.value = sc.app.username;
  
  var passwordObj = {};
  passwordObj.key = apis[options.api].passwordFieldName;
  passwordObj.value = sc.app.password;
  
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

