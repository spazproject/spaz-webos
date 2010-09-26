function DashboardAssistant(args) {

	this.default_args = {
		'template_data': {
			'title':'Dashboard Title',
			'message':'Dashboard Message',
			'count':99			
		},
		'fromstage':SPAZ_MAIN_STAGENAME,
		'template':'dashboard/item-info'
	};
	
	this.args = sch.defaults(this.default_args, args);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
        authType: SPAZCORE_AUTHTYPE_OAUTH,
        consumerKey: SPAZCORE_CONSUMERKEY_TWITTER,
        consumerSecret: SPAZCORE_CONSUMERSECRET_TWITTER,
        accessURL: 'http://twitter.com/oauth/access_token'
    });
	
};


DashboardAssistant.prototype.setup = function() {
	this.updateDashboard();
	
	var switchButton = this.controller.get("dashboardinfo"); 
	Mojo.Event.listen(switchButton, Mojo.Event.tap, this.launchMain.bindAsEventListener(this));

	var stageDocument = this.controller.stageController.document; 
	Mojo.Event.listen(stageDocument, Mojo.Event.stageActivate, 
		this.activateWindow.bindAsEventListener(this)); 
	Mojo.Event.listen(stageDocument, Mojo.Event.stageDeactivate,
		this.deactivateWindow.bindAsEventListener(this)); 
	
};

DashboardAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

};


DashboardAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DashboardAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


DashboardAssistant.prototype.updateDashboard = function(args) { 
	
	this.args = sch.defaults(this.default_args, args);
	
	Mojo.Log.error("updateDashboard Args: %j", args);
	
	/*
		Use render to convert the object and its properties
		along with a view file into a string containing HTML
	*/
	var renderedInfo = Mojo.View.render({object: this.args.template_data, template: this.args.template}); 
	var infoElement	 = this.controller.get('dashboardinfo'); 
	infoElement.update(renderedInfo); 
	
	// this.initTwit();
	// this.checkForUpdates();
}; 

DashboardAssistant.prototype.activateWindow = function() { 
	Mojo.Log.error("......... Dashboard Assistant - Activate Window"); 
}; 
DashboardAssistant.prototype.deactivateWindow = function() { 
	Mojo.Log.error("......... Dashboard Assistant - Deactivate Window"); 
};
DashboardAssistant.prototype.launchMain = function() { 
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		 method: 'launch', 
		 parameters: { 
			 id: Mojo.appInfo.id, 
			 params: {'fromstage':this.args.fromstage, 'action':'main_timeline', 'account':App.prefs.get('last_userid')} 
		 } 
	}); 
	this.controller.window.close(); 
}; 


// DashboardAssistant.prototype.initTwit = function() {
// 	var event_mode = 'jquery'; // default this to jquery because we have so much using it
// 	
// 	Mojo.Log.error('Loading users');
// 	var users = new SpazAccounts(Spaz.getAppObj().prefs);
// 	
// 	Mojo.Log.error('Loading twit');
// 	this.twit = new SpazTwit({
// 	    'event_mode':event_mode,
// 		'timeout':1000*60
// 	});
// 	this.twit.setSource(Spaz.getAppObj().prefs.get('twitter-source'));
// 	
// 	Mojo.Log.error('Loading auth');
// 	var auth;
// 	if ( (auth = Spaz.Prefs.getAuthObject()) ) {
// 	    Mojo.Log.error('AuthObject: %j', auth);
// 		this.twit.setCredentials(auth);
// 		if (Spaz.Prefs.getAccountType() === SPAZCORE_ACCOUNT_CUSTOM) {
// 		    this.twit.setBaseURL(Spaz.Prefs.getCustomAPIUrl());
// 		} else {
// 		    this.twit.setBaseURLByService(Spaz.Prefs.getAccountType());
// 		}
// 	} else {
//         Mojo.Log.error('NOT LOADING CREDENTIALS INTO TWIT');
// 	}
// };
// 
// 
// DashboardAssistant.prototype.checkForUpdates = function() {
// 	var that = this;
// 	
// 	Mojo.Log.error("setting counts");
// 	this.counts = {
// 		'home':0,
// 		'mention':0,
// 		'dm':0
// 	};
// 	
// 	Mojo.Log.error("setting last_ids");
// 	var last_ids = Mojo.Controller.getAppController().assistant.loadLastIDs();
// 	
// 	this.twit.setLastId(SPAZCORE_SECTION_HOME,    last_ids.home);
// 	this.twit.setLastId(SPAZCORE_SECTION_REPLIES, last_ids.mention);
// 	this.twit.setLastId(SPAZCORE_SECTION_DMS,     last_ids.dm);
// 	
// 	Mojo.Log.error("getting combined timeline");
// 	this.twit.getCombinedTimeline(
// 		{
// 			'friends_count':200,
// 			'replies_count':200,
// 			'dm_count':200
// 		},
// 		function(data) {
// 			
// 			Mojo.Log.error('BackgroundNotifier getCombinedTimeline success');
// 			
// 			var new_count = 0, new_mention_count = 0, new_dm_count = 0, previous_count = 0;
// 
// 			previous_count = Spaz.getAppObj().master_timeline_model.items.length;
// 			
// 			var no_dupes = [];
// 			for (var i=0; i < data.length; i++) {
// 
// 				new_count++;
// 
// 				if (data[i].SC_is_reply) {
// 					new_mention_count++;
// 				} else if (data[i].SC_is_dm) {
// 					new_dm_count++;
// 				}
// 			}
// 
// 
// 			that.counts.dm = parseInt(that.counts.dm, 10) + parseInt(new_dm_count, 10);
// 
// 			that.counts.mention  = parseInt(that.counts.mention, 10) + parseInt(new_mention_count, 10);
// 			
// 			Mojo.Log.error('new, @mention, dm: %s %s %s', new_count, new_mention_count, new_dm_count);
// 			
// 			that.counts.home = parseInt(that.counts.home, 10) + parseInt((new_count - (new_mention_count + new_dm_count)), 10);
// 
// 			Mojo.Log.error('that.counts.home: %s', that.counts.home);
// 			
// 			if (that.counts.home > 0 && Spaz.getAppObj().prefs.get('bgnotify-on-home')) {
// 				
// 				jQuery('div.dashboard-newitem span').text(that.counts.home);
// 				jQuery('div.dashboard-title').html($L('New messages'));
// 				jQuery('#dashboard-text').html('New home shit!');
// 				
// 			} else if (that.counts.dm > 0 && Spaz.getAppObj().prefs.get('bgnotify-on-dm')) {
// 			
// 				jQuery('div.dashboard-newitem span').text(that.counts.dm);
// 				jQuery('div.dashboard-title').html($L('New messages'));
// 				jQuery('#dashboard-text').html('New Direct Message');
// 				
// 			} else if (that.counts.mention > 0 && Spaz.getAppObj().prefs.get('bgnotify-on-mention')) {
// 		
// 				jQuery('div.dashboard-newitem span').text(that.counts.mention);
// 				jQuery('div.dashboard-title').html($L('New messages'));
// 				jQuery('#dashboard-text').html('New mention shit!');
// 			
// 			} else {
// 				that.controller.window.close();
// 			}
// 
// 		},
// 		function(errors) {
// 		    Mojo.Log.error('ERRORS: %j', errors);
// 		    Mojo.Log.error('Error loading new messages in BackgroundNotifier');
// 			var err_msg = $L("There was an error loading new messages");
// 			that.controller.window.close();
// 		}
// 	);
// };
