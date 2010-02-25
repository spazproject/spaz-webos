function StartAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	Mojo.Log.info("Logging from StartAssistant Constructor");
	
	jQuery('#start-scene').hide();
	
	if (argFromPusher && argFromPusher.firstload) {
		if (sc.app.prefs.get('always-go-to-my-timeline')) {
			
			/*
				load users from prefs obj
			*/
			this.Users = new Users(sc.app.prefs);
			this.Users.load();
			
			/*
				get last user
			*/
			var last_userid = sc.app.prefs.get('last_userid');
			var last_user_obj = this.Users.getUser(last_userid);
			if (last_user_obj !== false) {
				dump(last_user_obj);
				sc.app.username = last_user_obj.username;
				sc.app.password = last_user_obj.password;
				sc.app.type     = last_user_obj.type;
				sc.app.userid   = last_user_obj.id;
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
	

}

StartAssistant.prototype.setup = function() {
	
	Mojo.Log.info("Logging from StartAssistant Setup");
		
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();
	
	Mojo.Event.listen(jQuery('#start-login-button')[0], Mojo.Event.tap, this.showLogin.bind(this));
	Mojo.Event.listen(jQuery('#start-search-button')[0], Mojo.Event.tap, this.showSearch.bind(this));
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

	jQuery('#app-version').text("v"+Mojo.appInfo.version);
	
	/*
		Get application news
	*/
	jQuery.get('http://funkatron.com/spaz-webos/appnews', function() {
		// don't actually do anything with this yet
	});

	
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
	
};


StartAssistant.prototype.refreshTrends = function() {
	this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	sc.app.twit.getTrends();
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
