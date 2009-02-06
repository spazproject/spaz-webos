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
	// 		{label:$L('Dreadnaught'), command:'scroll-top'},
	// 		{}
	// 	],
	// 	cmdMenuItems: [{}]
	// });

	this.scroller = this.controller.getSceneScroller();
	
	
	/*
		Initialize the model
	*/
	this.model = {
		'username':'',
		'password':'',
		'search':''
	};
	
	this.spinnerModel = {
		'spinning':false
	}
	
	
	/**
	 * Panels that use jQuery (but listen with Luna)
	 */
	$('login-panel').hide();
	Luna.Event.listen($('show-login-button'), Luna.Event.tap, this.toggleLoginPanel.bind(this));

	$('search-panel').hide();
	Luna.Event.listen($('show-search-button'), Luna.Event.tap, this.toggleSearchPanel.bind(this));

	$('trends-panel').hide();
	Luna.Event.listen($('show-trends-button'), Luna.Event.tap, this.toggleTrendsPanel.bind(this));
	
	
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
		Search
	*/
	this.controller.setupWidget('search',
	    this.atts = {
	        hintText: 'enter search terms',
	        label: "search terms",
			enterSubmits: true,
			modelProperty:		'search',
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
			property: 'spinning',
		},
		this.spinnerModel
	);	
	
	/*
		Listen for taps on login button and status panel popup
	*/
	Luna.Event.listen($('login-button'), Luna.Event.tap, this.handleLogin.bind(this));
	Luna.Event.listen($('search-button'), Luna.Event.tap, this.handleSearch.bind(this));
	Luna.Event.listen($('status-panel'), Luna.Event.tap, this.hideStatusPanel.bind(this));
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		e.data.thisAssistant.hideInlineSpinner('#trends-list');
		
		var trendshtml = Luna.View.render({'collection':trends, template:'login/trend-item'});
		
		jQuery('#trends-list .trend-item').remove();
		jQuery('#trends-list').append(trendshtml);
		jQuery('#trends-list .trend-item').fadeIn(500);
	});
	
	
	
}



LoginAssistant.prototype.toggleLoginPanel = function(event) {

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

	if (jQuery('#trends-panel').is(':visible')) {
		jQuery('#trends-panel').slideUp('fast');
		jQuery('#show-trends-button').html('Current Trends &#x2192;')
									.removeClass('open')
									.addClass('closed');
	} else {
		sc.app.twit.getTrends();
		
		var thisA = this;
		jQuery('#trends-panel').slideDown('fast', function() {
			thisA.showInlineSpinner('#trends-list', 'Loading…');
		});
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
		this.showInlineSpinner('#spinner-container', 'Logging-in');

		
		/*
			now verify credentials against the Twitter API
		*/
		sc.app.twit.verifyCredentials(this.model.username, this.model.password);
		
	}
	
	
}


LoginAssistant.prototype.handleSearch = function(event) {
	if (this.model && this.model.search) {
		this.findAndSwap("search-twitter", {
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
	console.log("********* property Change *************");
}





LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
		// 
	console.log('getScenes()');
	console.dir(Luna.Controller.stageController.getScenes());
	console.log('activeScene()');
	console.dir(Luna.Controller.stageController.activeScene());
	console.log('topScene()');
	console.dir(Luna.Controller.stageController.topScene());


	var thisA = this;

	jQuery('.trend-item').live(Luna.Event.tap, function() {
		var term = jQuery(this).attr('data-searchterm');
		thisA.searchFor(term);
	});


	/*
		What to do if we succeed
		Note that we pass the assistant object as data into the closure
	*/				
	jQuery().bind('verify_credentials_succeeded', {'thisAssistant':this}, function(e) {
		sc.app.twit.setCredentials(e.data.thisAssistant.model.username, e.data.thisAssistant.model.password);
		sc.app.lastFriendsTimelineId = 1;
		
		e.data.thisAssistant.hideInlineSpinner('#spinner-container');
		
		/*
			@todo Save username and password as encrypted vals
		*/

		// Luna.Controller.stageController.swapScene("my-timeline", this);
		e.data.thisAssistant.findAndSwap("my-timeline", this);
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
	
	jQuery('.trend-item').die(Luna.Event.tap);
	
}

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
