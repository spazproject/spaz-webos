/************************************
 * global scene helper functions
 ************************************/

/**
 * This helper looks through the array of scenes and looks for an existing instance of 
 * the given targetScene. If one exists, we pop all scenes before it to return to it. Otherwise
 * we swap to a new instance of the scene
 * 
 * @param {string} targetScene the scene name
 * @param {many} returnValue a return value passed to the pop or swap call
 */
var findAndSwapScene = function(targetScene, returnValue) {
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


/**
 * converts various items in a timeline entry's text into clickables
 * @param {string} str
 * @return {string}
 */
var makeItemsClickable = function(str) {
	
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
var sendEmail = function(opts) {
	
	
	function makeRecipientObj(address, type) {
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
			recipients.push( makeRecipientObj(to_addresses[i], 'to') );
		};                                                  
	}                                                       
	                                                        
	if (cc_addresses) {                                     
		for (var i=0; i < cc_addresses.length; i++) {       
			recipients.push( makeRecipientObj(cc_addresses[i], 'cc') );
		};                                                  
	}                                                       
	                                                        
	if (bcc_addresses) {                                    
		for (var i=0; i < bcc_addresses.length; i++) {      
			recipients.push( makeRecipientObj(bcc_addresses[i], 'bcc') );
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