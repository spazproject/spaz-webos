function LoginAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

LoginAssistant.prototype.setup = function() {
		
	/* this function is for setup tasks that have to happen when the scene is first created */
	
	/*
		Initialize the model
	*/
	this.model = {
		'username':'',
		'password':''
	};
	
	this.spinnerModel = {
		'spinning':false
	}
	
	
	/**
	 * Panels that use jQuery (but listen with Luna)
	 */
	$('login-panel').hide();
	Luna.Event.listen($('show-login-button'), 'luna-tap', this.toggleLoginPanel.bind(this));

	$('search-panel').hide();
	Luna.Event.listen($('show-search-button'), 'luna-tap', this.toggleSearchPanel.bind(this));

	$('trends-panel').hide();
	Luna.Event.listen($('show-trends-button'), 'luna-tap', this.toggleTrendsPanel.bind(this));
	
	
	/**
	 * Luna Widgets 
	 */
	
	/*
		Username
	*/
	this.controller.setupWidget('username',
		this.atts = {
			hintText: 'enter username',
			enterSubmits: true,
			modelProperty:'username', 
			changeOnKeyPress: true,
			focusMode:	Luna.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
	);
	
	/*
		Password
	*/
	this.controller.setupWidget('password',
	    this.atts = {
	        hintText: 'enter password',
	        label: "password",
			enterSubmits: true,
			modelProperty:		'password',
			changeOnKeyPress: true, 
			focusMode:		Luna.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
    );
	
	
	/*
		Spinner
	*/
	this.controller.setupWidget('activity-spinner', {
			property: 'spinning'
		},
		this.spinnerModel
	);	
	
	/*
		Listen for taps on login button and status panel popup
	*/
	Luna.Event.listen($('login-button'), 'luna-tap', this.handleLogin.bind(this));
	Luna.Event.listen($('status-panel'), 'luna-tap', this.hideStatusPanel.bind(this));
	
	
}



LoginAssistant.prototype.toggleLoginPanel = function(event) {
	
	/*
		We like animating with jQuery, but can't use it to grab Luna events
	*/
	if (jQuery('#login-panel').is(':visible')) {
		jQuery('#login-panel').slideUp('fast');
		jQuery('#show-login-button').html('Login &#x2192;')
									.removeClass('open')
									.addClass('closed');
	} else {
		jQuery('#login-panel').slideDown('fast');
		jQuery('#show-login-button').html('Login &#x2193;')
									.removeClass('closed')
									.addClass('open');
		
	}
}

LoginAssistant.prototype.toggleSearchPanel = function(event) {
	
	/*
		We like animating with jQuery, but can't use it to grab Luna events
	*/
	if (jQuery('#search-panel').is(':visible')) {
		jQuery('#search-panel').slideUp('fast');
		jQuery('#show-search-button').html('Search Twitter &#x2192;')
									.removeClass('open')
									.addClass('closed');
	} else {
		jQuery('#search-panel').slideDown('fast');
		jQuery('#show-search-button').html('Search Twitter &#x2193;')
									.removeClass('closed')
									.addClass('open');
		
	}
	
}
LoginAssistant.prototype.toggleTrendsPanel = function(event) {
	
	/*
		We like animating with jQuery, but can't use it to grab Luna events
	*/
	if (jQuery('#trends-panel').is(':visible')) {
		jQuery('#trends-panel').slideUp('fast');
		jQuery('#show-trends-button').html('Current Trends &#x2192;')
									.removeClass('open')
									.addClass('closed');
	} else {
		jQuery('#trends-panel').slideDown('fast');
		jQuery('#show-trends-button').html('Current Trends &#x2193;')
									.removeClass('closed')
									.addClass('open');
		
	}
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
		this.spinnerOn('Logging-in');

		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/				
		jQuery().one('verify_credentials_succeeded', {'thisAssistant':this}, function(e) {
			sc.app.twit.setCredentials(e.data.thisAssistant.model.username, e.data.thisAssistant.model.password);
			sc.app.lastFriendsTimelineId = 1;
			
			e.data.thisAssistant.spinnerOff('');
			
			/*
				@todo Save username and password as encrypted vals
			*/

			Luna.Controller.stageController.pushScene("my-timeline");
		});
		
		/*
			What to do if we fail
		*/
		jQuery().one('verify_credentials_failed', {'thisAssistant':this}, function(e) {
			
			
			/*
				If we return to this scene from another
				and fail the login, e.data.thisAssistant will not have
				its controller property. WHY?
			*/
			
			e.data.thisAssistant.spinnerOff('Login failed!');
		});
		
		
		/*
			now verify credentials against the Twitter API
		*/
		sc.app.twit.verifyCredentials(this.model.username, this.model.password);
		
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
	console.log("********* property Change *************");
}





LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
		// 
		// console.log('getScenes()');
		// console.dir(Luna.Controller.stageController.getScenes());
}


LoginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.model.username = '';
	this.model.password = '';
	this.controller.modelChanged( this.model );
	this.hideStatusPanel();
	
}

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
