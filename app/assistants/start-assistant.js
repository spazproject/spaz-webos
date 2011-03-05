function StartAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	Mojo.Log.info("Logging from StartAssistant Constructor");
	
	jQuery('#start-scene').hide();
	
	if (argFromPusher && argFromPusher.firstload) {
		if (App.prefs.get('always-go-to-my-timeline')) {
			
			/*
				load users from prefs obj
			*/
			this.Users = new SpazAccounts(App.prefs);
			this.Users.load();
			
			/*
				get last user
			*/
			var last_userid = App.prefs.get('last_userid');
			var last_user_obj = this.Users.get(last_userid);
			if (last_user_obj !== false) {
				dump(last_user_obj);
				App.username = last_user_obj.username;
				App.type     = last_user_obj.type;
				App.userid   = last_user_obj.id;
				Mojo.Controller.stageController.pushScene('my-timeline');
			} else {
				dump("Tried to load last_user_object, but failed.");
			}
			
			
		} else {
			
			jQuery('#start-scene').show();
			
		}
		
	} else {
		
		jQuery('#start-scene').show();
		
	}
	
	
	
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	

}
StartAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};
StartAssistant.prototype.setup = function() {
	
	Mojo.Log.info("Logging from StartAssistant Setup");
		
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();
	
	this.buttonAttributes = {};
	this.loginButtonModel = {
		buttonLabel : $L("Log-in to your account"),
		buttonClass: 'primary'
	};
	this.searchButtonModel = {
		buttonLabel : $L("Explore"),
		buttonClass: 'secondary'
	};
	this.helpButtonModel = {
		buttonLabel : $L("Get Help"),
		buttonClass: 'secondary'
	};
	this.controller.setupWidget('start-login-button',	this.buttonAttributes, this.loginButtonModel);
	this.controller.setupWidget('start-search-button',	this.buttonAttributes, this.searchButtonModel);
	this.controller.setupWidget('start-help-button',	this.buttonAttributes, this.helpButtonModel);
	
	
	Mojo.Event.listen(jQuery('#start-login-button')[0], Mojo.Event.tap, this.showLogin.bind(this));
	Mojo.Event.listen(jQuery('#start-search-button')[0], Mojo.Event.tap, this.showSearch.bind(this));
	Mojo.Event.listen(jQuery('#start-help-button')[0], Mojo.Event.tap, this.showHelp.bind(this));
	
	
	this.showFirstRunPopup();
};



StartAssistant.prototype.activate = function(argFromPusher) {
	var thisA = this;

	/*
		We may still be hidden if we went directly to an account's timeline, so 
		make sure to .show() just in case
	*/
	jQuery('#start-scene').show();
	
	Mojo.Log.info("Logging from StartAssistant Activate");
	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	jQuery('#app-title').text(Mojo.appInfo.title);
	jQuery('#app-version').text("v"+Mojo.appInfo.version);
	
	/*
		Get application news
	*/
	jQuery.ajax({
		'url':'http://funkatron.com/spaz-webos/appnews?'+Mojo.Controller.appInfo.version,
		'type':'GET',
		beforeSend:function(xhr) {
			var spaz_info = Mojo.Controller.appInfo.title.replace(/\s/, '-') + '/' + Mojo.Controller.appInfo.version;
			sch.debug('spaz_info:' + spaz_info);
			xhr.setRequestHeader('X-Spaz-Info', spaz_info);
		},
		complete:function(){}
	});

	this.showBetaWarningAlert();
};


StartAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	
};

StartAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(jQuery('#start-login-button')[0], Mojo.Event.tap, this.showLogin);
	Mojo.Event.stopListening(jQuery('#start-search-button')[0], Mojo.Event.tap, this.showSearch);
	Mojo.Event.stopListening(jQuery('#start-help-button')[0], Mojo.Event.tap, this.showHelp);
	
};


StartAssistant.prototype.refreshTrends = function() {
	this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	App.twit.getTrends();
};


StartAssistant.prototype.showLogin = function() { 
	Mojo.Controller.stageController.pushScene('startlogin');
}; 

StartAssistant.prototype.showSection = function(from, to) { 
	$(from).hide();
	$(to).show(); 
};

StartAssistant.prototype.showSearch = function() {
	Mojo.Controller.stageController.pushScene('startsearch');
};

StartAssistant.prototype.showHelp = function() {
	Mojo.Controller.stageController.pushScene("help");
};

StartAssistant.prototype.showStart  = function() {
	if (jQuery('#search-section').is(':visible')) {
		this.showSection('search-section', 'start-section');
	}
	if (jQuery('#login-section').is(':visible')) {
		this.showSection('login-section', 'start-section');
	}
};




StartAssistant.prototype.togglePanel = function(panel_selector, button_selector, onOpen, onClose) {
	if (jQuery(panel_selector).is(':visible')) { // is open, we need to close
		
		jQuery(panel_selector).fadeOut('fast');
		jQuery(button_selector).removeClass('open').addClass('closed');
		if (onClose) { onClose(); }
		
	} else { // is closed, we need to open
		
		jQuery(panel_selector).fadeIn('fast');
		jQuery(button_selector).removeClass('closed').addClass('open');
		if (onOpen) { onOpen(); }
		
	}
};
