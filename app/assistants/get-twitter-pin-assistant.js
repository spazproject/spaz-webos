function GetTwitterPinAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	// default next scene is my-timeline
	this.nextscene = 'my-timeline';
	this.nextsceneargs = {};
	
	if (args) {
		
		if (args.nextscene) {
			this.nextscene = args.nextscene;
		}
		
		if (args.nextsceneargs) {
			this.nextsceneargs = args.nextsceneargs;
		}
		
	}
}

GetTwitterPinAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.model = {
	    pin: null
	};
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	this.controller.setupWidget('inputDrawer', this.inputDrawerAttributes = {
	    
	}, this.inputDrawerModel = {
	    open: false
	});
	
	this.controller.setupWidget('pin', this.pinAttributes = {
	    label: "pin",
		enterSubmits: true,
		requiresEnterKey: true,
		modelProperty: 'pin',
		changeOnKeyPress: true, 
		focusMode: Mojo.Widget.focusSelectMode,
		multiline: false
	}, this.model);
	
	this.controller.setupWidget('verifyPin', this.verifyPinAttributes = {
	    type: Mojo.Widget.activityButton
	}, this.verifyPinModel = {
		buttonLabel: "Verify and Save Pin",
		buttonClass: 'Primary'
	});
	
	this.controller.setupWidget('pinWebView', {});
	
	/* add event handlers to listen to events from widgets */
	this.controller.listen('verifyPin', Mojo.Event.tap, this.handleVerifyPin.bind(this));
	
	this.controller.listen('pinWebView', Mojo.Event.webViewTitleUrlChanged, this.handlePageChange.bind(this));
};

GetTwitterPinAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	this.gotoNewPinUrl();
};

GetTwitterPinAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

GetTwitterPinAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

GetTwitterPinAssistant.prototype.gotoNewPinUrl = function() {
    this.oauth = OAuth({
		'consumerKey':SPAZCORE_CONSUMERKEY_TWITTER,
		'consumerSecret':SPAZCORE_CONSUMERSECRET_TWITTER,
		'requestTokenUrl':'https://twitter.com/oauth/request_token',
		'authorizationUrl':'https://twitter.com/oauth/authorize',
		'accessTokenUrl':'https://twitter.com/oauth/access_token'
	});
	
	this.oauth.fetchRequestToken(function(url) {
			//sch.openInBrowser(url, 'authorize');
			this.controller.get('pinWebView').mojo.openURL(url);
		}.bind(this),
		function(data) {
			//AppUtils.showBanner($L('Problem getting Request Token from Twitter'));
		}.bind(this)
	);
};

GetTwitterPinAssistant.prototype.handleVerifyPin = function(event) {
    //Verify Pin Here
    var that = this
      , pin = this.model.pin;
    
    if (pin && this.oauth) {
        this._toggleVerifyPinActivity(true);
        
        this.oauth.setVerifier(pin);
        this.oauth.fetchAccessToken(function(data) {
            Mojo.Log.error("%j", data);
    
			var qvars = Spaz.getQueryVars(data.text);
			var auth_pickle = qvars.screen_name+':'+qvars.oauth_token+':'+qvars.oauth_token_secret;
			
			if (that.editing_acc_id) { // edit existing
				//EDIT ACCOUNT
			} else { // add new
			    //ADD NEW ACCOUNT
			    Mojo.Log.info("ADD NEW ACCOUNT HERE");
			}
			
            that._toggleVerifyPinActivity(false);
            
            
            // MOVE FORWARD
            
            
        },
        function(data) {
            that.model.pin = "";
            that.controller.modelChanged(that.model);
            
            that.gotoNewPinUrl();
            
            that._toggleVerifyPinActivity(false);
        });
    }
};

GetTwitterPinAssistant.prototype.handlePageChange = function(event) {
    var re = /twitter\.com\/oauth\/authorize$/i;
    
    if( event.url.match(re) ) {
        this.controller.get('inputDrawer').mojo.setOpenState(true);
        this.controller.get('pin').mojo.focus();
    }
};

GetTwitterPinAssistant.prototype._toggleVerifyPinActivity = function(state) {
    if (state) {
        this.verifyPinModel.disabled = true;
        this.controller.get('verifyPin').mojo.activate();
    } else {
        this.verifyPinModel.disabled = false;
        this.controller.get('verifyPin').mojo.deactivate();
    }
    
    this.controller.modelChanged(this.verifyPinModel);
};