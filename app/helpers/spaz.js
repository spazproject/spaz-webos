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
		for (var i=0; i < cc_addresses.length; i++) {       
			recipients.push( makeRecipientObj(cc_addresses[i].address, 'cc', cc_addresses[i].name) );
		};                                                  
	}                                                       
	                                                        
	if (bcc_addresses) {                                    
		for (var i=0; i < bcc_addresses.length; i++) {      
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



Spaz.closeDashboard = function(name) {
	var name = name || SPAZ_DASHBOARD_STAGENAME;
	
	Mojo.Controller.getAppController().closeStage(name);
};


// 
// /**
//  * Initialize a temporary property we use to store 
//  * cache data that only lives for the duration of the
//  * application run
//  */
// Spaz.initTempCache = function() {
// 	window.spaztmpcache = {};
// };
// 
// 
// Spaz.tempCacheExists = function() {
// 	return window.spaztmpcache;
// };
// 
// 
// /**
//  * Init the temp cache for a particular user 
//  */
// Spaz.initTempCacheUser = function(idkey) {
// 	
// 	if (!idkey) {
// 		idkey = sc.app.userid;
// 	}
// 	
// 	if (!window.spaztmpcache) {
// 		Spaz.initTempCache();
// 	}
// 	if (!window.spaztmpcache[idkey]) {
// 		window.spaztmpcache[idkey] = {};
// 	}
// 
// };
// 
// 
// /**
//  * save a key:val pair to a idkey's temp cache
//  */
// Spaz.saveTempCache = function(key, val, idkey) {
// 	
// 	if (!idkey) {
// 		idkey = sc.app.userid;
// 	}
// 	
// 	
// 	if (!window.spaztmpcache) {
// 		Spaz.initTempCache();
// 	}
// 	if (!window.spaztmpcache[idkey]) {
// 		Spaz.initTempCacheUser(idkey);
// 	}
// 	
// 	window.spaztmpcache[idkey][key] = val;
// };
// 
// /**
//  * save a key:val pair to a idkey's temp cache
//  */
// Spaz.loadTempCache = function(key, idkey) {
// 	
// 	if (!idkey) {
// 		idkey = sc.app.userid;
// 	}
// 	
// 	if (!window.spaztmpcache) {
// 		Spaz.initTempCache();
// 		return null;
// 	}
// 	if (!window.spaztmpcache[idkey]) {
// 		Spaz.initTempCacheUser(idkey);
// 		return null;
// 	}
// 
// 	
// 	if (window.spaztmpcache[idkey][key]) {
// 		return window.spaztmpcache[idkey][key];
// 	}
// 	
// 	return null;
// };
// 
// 
// Spaz.saveTempCacheToDB = function() {
// 	
// 	function success(tx, rs) {
// 		sch.error("SUCCESS SAVING TEMP CACHE");
// 		sch.error(rs);
// 		sch.triggerCustomEvent('temp_cache_save_db_success', document);
// 	}
// 	function failure(tx, err) {
// 		sch.error("ERROR SAVING TEMP CACHE");
// 		sch.error(err);
// 		sch.triggerCustomEvent('temp_cache_save_db_failure', document);
// 	}
// 	
// 	var json_cache = JSON.stringify(window.spaztmpcache);
// 	sch.error(json_cache);
// 	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
// 	var sql_table = "CREATE TABLE IF NOT EXISTS tempcache (key, value)";
// 	var sql_clean = "DELETE FROM tempcache";
// 	var sql_insert= "INSERT INTO tempcache (key, value) VALUES(?,?)";
// 	SpazTempCache.transaction( (function (tx) { 
// 	   tx.executeSql(sql_table, []);
// 	   tx.executeSql(sql_clean, []);
// 	   tx.executeSql(sql_insert, ['json_cache', json_cache], success, failure);
// 	}));
// 	
// };
// 
// Spaz.loadTempCacheFromDB = function() {
// 	
// 	function success(tx, rs) {
// 		sch.error("SUCCESS LOADING TEMP CACHE");
// 		var json_cache = rs.rows.item(0).value;
// 		sch.error(json_cache);
// 		window.spaztmpcache = sch.deJSON(json_cache);
// 		sch.error(window.spaztmpcache);
// 		sch.triggerCustomEvent('temp_cache_load_db_success', document, window.spaztmpcache);
// 	}
// 	function failure(tx, err) {
// 		sch.error("ERROR LOADING TEMP CACHE");
// 		sch.error(err);
// 		sch.triggerCustomEvent('temp_cache_load_db_failure', document, err);
// 	}
// 	
// 	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
// 	var sql_select    = "SELECT value FROM tempcache WHERE key = ?";
// 	SpazTempCache.transaction( (function (tx) { 
// 	   tx.executeSql(sql_select, ['json_cache'], success, failure);
// 	}));
// 	
// };
// 





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

