function LoginAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
}

LoginAssistant.prototype.setup = function() {
		
	/* this function is for setup tasks that have to happen when the scene is first created */
	
	// this.setupCommonMenus({
	// 	viewMenuItems: [
	// 		{},
	// 		{label:$L('Spaz:Home'), command:'scroll-top'},
	// 		{}
	// 	],
	// 	cmdMenuItems: [{}]
	// });

	this.scroller = this.controller.getSceneScroller();
	
	
	/*
		Initialize the model
	*/
	var username = sc.app.prefs.get('username');
	var password = sc.app.prefs.get('password');

	// alert(username+":"+password)
	this.model = {
		'username':username,
		'password':password,
		'search':'',
		'always-go-to-my-timeline':sc.app.prefs.get('always-go-to-my-timeline')
	};
	
	this.spinnerModel = {
		'spinning':false
	}
	
	
	/**
	 * Panels that use jQuery (but listen with Mojo)
	 */
	$('login-panel').hide();
	Mojo.Event.listen($('show-login-button'), Mojo.Event.tap, this.toggleLoginPanel.bind(this));

	// $('search-panel').hide();
	Mojo.Event.listen($('show-search-button'), Mojo.Event.tap, this.toggleSearchPanel.bind(this));

	// $('trends-panel').hide();
	// Mojo.Event.listen($('show-trends-button'), Mojo.Event.tap, this.toggleTrendsPanel.bind(this));
	
	
	/**
	 * Mojo Widgets 
	 */
	
	/*
		Username
	*/
	this.controller.setupWidget('username',
		this.atts = {
			// hintText: 'enter username',
			enterSubmits: true,
			modelProperty:'username', 
			changeOnKeyPress: true,
			focusMode:	Mojo.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
	);
	
	/*
		Password
	*/
	this.controller.setupWidget('password',
	    this.atts = {
	        // hintText: 'enter password',
	        label: "password",
			enterSubmits: true,
			modelProperty:		'password',
			changeOnKeyPress: true, 
			focusMode:		Mojo.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
    );
	
	/*
		checkbox to go to my timeline
	*/
	this.controller.setupWidget("goToMyTimelineCheckbox",
		this.atts = {
			fieldName: 'always-go-to-my-timeline',
			modelProperty: 'always-go-to-my-timeline',
			disabledProperty: 'always-go-to-my-timeline_disabled'
		},
		this.model
	);

	
	
	/*
		Search
	*/
	this.controller.setupWidget('search',
	    this.atts = {
	        hintText: 'enter search terms',
	        label: "search terms",
			enterSubmits: true,
			modelProperty:		'search',
			changeOnKeyPress: true, 
			focusMode:		Mojo.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
    );
	
	
	/*
		Spinner
	*/
	this.controller.setupWidget('activity-spinner', {
			property: 'spinning',
		},
		this.spinnerModel
	);	
	
	/*
		Listen for taps on login button and status panel popup
	*/
	Mojo.Event.listen($('login-button'), Mojo.Event.tap, this.handleLogin.bind(this));
	Mojo.Event.listen($('search-button'), Mojo.Event.tap, this.handleSearch.bind(this));
	Mojo.Event.listen($('status-panel'), Mojo.Event.tap, this.hideStatusPanel.bind(this));
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		e.data.thisAssistant.hideInlineSpinner('#trends-list');
		
		var trendshtml = Mojo.View.render({'collection':trends, template:'login/trend-item'});
		
		jQuery('#trends-list .trend-item').remove();
		jQuery('#trends-list').append(trendshtml);
		jQuery('#trends-list .trend-item').fadeIn(500);
	});
	
	this.showInlineSpinner('#trends-list', 'Loading…');
	sc.app.twit.getTrends();
	
	
	var thisA = this;

	jQuery('#goToMyTimelineCheckbox', this.scroller).bind(Mojo.Event.tap, function() {
		var state = !thisA.model['always-go-to-my-timeline'];
		sc.app.prefs.set('always-go-to-my-timeline', state);
	});
	
	
}


LoginAssistant.prototype.togglePanel = function(panel_selector, button_selector, onOpen, onClose) {
	if (jQuery(panel_selector).is(':visible')) { // is open, we need to close
		
		jQuery(panel_selector).hide('blind', 'fast');
		jQuery(button_selector).removeClass('open').addClass('closed');
		if (onClose) { onClose(); }
		
	} else { // is closed, we need to open
		
		jQuery(panel_selector).show('blind', 'fast');
		jQuery(button_selector).removeClass('closed').addClass('open');
		if (onOpen) { onOpen(); }
		
	}
};


LoginAssistant.prototype.toggleLoginPanel = function(event) {
	this.togglePanel('#login-panel', '#show-login-button');
}
LoginAssistant.prototype.toggleSearchPanel = function(event) {
	this.togglePanel('#search-panel', '#show-search-button');
}
LoginAssistant.prototype.toggleTrendsPanel = function(event) {
	var thisA = this;		
	this.togglePanel('#trends-panel', '#show-trends-button', function() {
		thisA.showInlineSpinner('#trends-list', 'Loading…');
		sc.app.twit.getTrends();
	});
}



/**
 * set-up view stuff for the login, listen for jQuery events from SpazTwit, and 
 * start the process 
 */
LoginAssistant.prototype.handleLogin = function(event) {

	/**
	 * - Get username and password from text fields
	 * - initialize sc.app.twit
	 * - swap to my-timeline scene
	 * 	
	 */
	if (this.model && this.model.username && this.model.password) {
		
		/*
			Turn on the spinner and set the message
		*/
		this.showInlineSpinner('#spinner-container', 'Logging-in');

		
		/*
			now verify credentials against the Twitter API
		*/
		sc.app.twit.verifyCredentials(this.model.username, this.model.password);
		
	}
	
	
}


LoginAssistant.prototype.handleSearch = function(event) {
	if (this.model && this.model.search) {
		findAndSwapScene("search-twitter", {
			searchterm:this.model.search
		});
	}
}


/**
 * turn the spinner on, and optionally set the message
 * @param {string} message 
 */
LoginAssistant.prototype.spinnerOn = function(message) {
	if (message) {
		this.setSpinnerLabel(message);
	}
	
	this.showStatusPanel();
	
	this.spinnerModel.spinning = true;
	this.controller.modelChanged( this.spinnerModel );
}

/**
 * Turns off the spinner. does NOT hide the status panel. Optionally sets message
 * @param {string} message
 */
LoginAssistant.prototype.spinnerOff = function(message) {
	if (message) {
		this.setSpinnerLabel(message);
	}
	this.spinnerModel.spinning = false;
	this.controller.modelChanged( this.spinnerModel );
}

/**
 * @param {string} text
 */ 
LoginAssistant.prototype.setSpinnerLabel = function(text) {
	$('status-label').update(text);
}

/**
 * show the status panel 
 */
LoginAssistant.prototype.showStatusPanel = function() {
	if (!jQuery('#status-panel').is(':visible')) {
		jQuery('#status-panel').fadeIn(500);
	}
}

/**
 * hide the status panel 
 */
LoginAssistant.prototype.hideStatusPanel = function(event) {
	if (jQuery('#status-panel').is(':visible')) {
		jQuery('#status-panel').fadeOut(500);
	}
}

LoginAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
}





LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
		// 
	// dump('getScenes()');
	// dump(Mojo.Controller.stageController.getScenes());
	// dump('activeScene()');
	// dump(Mojo.Controller.stageController.activeScene());
	// dump('topScene()');
	// dump(Mojo.Controller.stageController.topScene());


	var thisA = this;

	jQuery('.trend-item').live(Mojo.Event.tap, function() {
		var term = jQuery(this).attr('data-searchterm');
		thisA.searchFor(term);
	});


	/*
		What to do if we succeed
		Note that we pass the assistant object as data into the closure
	*/				
	jQuery().bind('verify_credentials_succeeded', {'thisAssistant':this}, function(e) {
		sc.app.twit.setCredentials(e.data.thisAssistant.model.username, e.data.thisAssistant.model.password);

		sc.app.prefs.set('username', e.data.thisAssistant.model.username);
		sc.app.prefs.set('password', e.data.thisAssistant.model.password);
		
		
		sc.app.lastFriendsTimelineId = 1;
		
		e.data.thisAssistant.hideInlineSpinner('#spinner-container');
		
		/*
			@todo Save username and password as encrypted vals
		*/

		// Mojo.Controller.stageController.swapScene("my-timeline", this);
		findAndSwapScene("my-timeline", this);
	});
	
	/*
		What to do if we fail
	*/
	jQuery().bind('verify_credentials_failed', {'thisAssistant':this}, function(e) {
		
		
		/*
			If we return to this scene from another
			and fail the login, e.data.thisAssistant will not have
			its controller property. WHY?
		*/
		
		e.data.thisAssistant.stopInlineSpinner('#spinner-container', 'Login failed!');
	});
	


}


LoginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.model.username = '';
	this.model.password = '';
	this.controller.modelChanged( this.model );
	this.hideStatusPanel();
	
	jQuery().unbind('verify_credentials_succeeded');
	jQuery().unbind('verify_credentials_failed');
	
	jQuery('#goToMyTimelineCheckbox', this.scroller).unbind(Mojo.Event.tap);
	
	jQuery('.trend-item').die(Mojo.Event.tap);
	
}

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
