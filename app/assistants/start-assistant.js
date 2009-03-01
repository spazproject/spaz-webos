function StartAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	if (argFromPusher && argFromPusher.firstload) {
		if (sc.app.prefs.get('always-go-to-my-timeline')) {
			Mojo.Controller.stageController.pushScene('my-timeline');	
		}
	}
	
	scene_helpers.addCommonSceneMethods(this);
}

StartAssistant.prototype.setup = function() {
		
	var thisA = this;
		
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();
	
	/*
		Initialize the model
	*/
	// alert(username+":"+password)
	this.model = {
		'username':false,
		'password':false,
		'search':'',
		'always-go-to-my-timeline':false
	};
	
	this.spinnerModel = {
		'spinning':false
	}
	
	
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
	        // hintText: 'enter search terms',
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
	Mojo.Event.listen($('start-login-button'), Mojo.Event.tap, this.showLogin.bind(this));
	Mojo.Event.listen($('start-search-button'), Mojo.Event.tap, this.showSearch.bind(this));
	Mojo.Event.listen($('back-search-button'), Mojo.Event.tap, this.showStart.bind(this));
	Mojo.Event.listen($('back-login-button'), Mojo.Event.tap, this.showStart.bind(this));
	
	
	
	Mojo.Event.listen($('login-button'), Mojo.Event.tap, this.handleLogin.bind(this));
	Mojo.Event.listen($('search-button'), Mojo.Event.tap, this.handleSearch.bind(this));
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		e.data.thisAssistant.hideInlineSpinner('#trends-list');
		
		/*
			some trends are wrapped in double-quotes, so we need to turn then into entities
		*/
		for (var k=0; k<trends.length; k++) {
			trends[k].searchterm = trends[k].searchterm.replace(/"/gi, '&quot;');
		}
		
		var trendshtml = Mojo.View.render({'collection':trends, template:'login/trend-item'});
		
		jQuery('#trends-list .trend-item').remove();
		jQuery('#trends-list').append(trendshtml);
		jQuery('#trends-list .trend-item').fadeIn(500);
	});
	
	this.showInlineSpinner('#trends-list', 'Loading…');
	sc.app.twit.getTrends();
	

	
	this.controller.listen('goToMyTimelineCheckbox', Mojo.Event.propertyChange, function() {
		var state = thisA.model['always-go-to-my-timeline'];
		sc.app.prefs.set('always-go-to-my-timeline', state);
	});
	
}



StartAssistant.prototype.activate = function(argFromPusher) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	this.model.username = sc.app.prefs.get('username');
	this.model.password = sc.app.prefs.get('password');
	this.model['always-go-to-my-timeline'] = sc.app.prefs.get('always-go-to-my-timeline');
	this.controller.modelChanged( this.model );
	 

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
		// findAndSwapScene("my-timeline", this);
		Mojo.Controller.stageController.pushScene('my-timeline');
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


StartAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.model.username = '';
	this.model.password = '';
	this.controller.modelChanged( this.model );
	// this.hideStatusPanel();
	
	jQuery().unbind('verify_credentials_succeeded');
	jQuery().unbind('verify_credentials_failed');
	
	
	jQuery('.trend-item').die(Mojo.Event.tap);
	
}

StartAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


StartAssistant.prototype.showSection = function(from, to) {
	jQuery(from).hide('drop', 'up', function() {
		jQuery(to).show('drop', 'down');
	});
}

StartAssistant.prototype.showLogin  = function() {
	this.showSection('#start-section', '#login-section');
	var thisA = this;
	jQuery().bind(Mojo.Event.back, function() {
		thisA.showStart();
		jQuery().unbind(Mojo.Event.back);
	});
};

StartAssistant.prototype.showSearch = function() {
	this.showSection('#start-section', '#search-section');
	var thisA = this;
	jQuery().bind(Mojo.Event.back, function() {
		thisA.showStart();
		jQuery().unbind(Mojo.Event.back);
	});
};

StartAssistant.prototype.showStart  = function() {
	if (jQuery('#search-section').is(':visible')) {
		this.showSection('#search-section', '#start-section');
	}
	if (jQuery('#login-section').is(':visible')) {
		this.showSection('#login-section', '#start-section');
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


StartAssistant.prototype.toggleLoginPanel = function(event) {
	this.togglePanel('#login-panel', '#show-login-button');
}
StartAssistant.prototype.toggleSearchPanel = function(event) {
	this.togglePanel('#search-panel', '#show-search-button');
}
StartAssistant.prototype.toggleTrendsPanel = function(event) {
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
StartAssistant.prototype.handleLogin = function(event) {

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


StartAssistant.prototype.handleSearch = function(event) {
	if (this.model && this.model.search) {
		Mojo.Controller.stageController.pushScene("search-twitter", {
			searchterm:this.model.search
		});
	}
}


StartAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
}






