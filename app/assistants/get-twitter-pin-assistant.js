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

GetTwitterPinAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

GetTwitterPinAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.model = {
	    pin: null
	};
	
	/*
		load users from prefs obj
	*/
	this.Users = new SpazAccounts(App.prefs);
	this.Users.load();
	
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	this.controller.setupWidget(Mojo.Menu.commandMenu,
	    this.commandMenuAttributes = {
	        spacerHeight: 0,
	        menuClass: 'no-fade'
	    },
	    this.commandMenuModel = {
	        visible: true,
	        items: [
	            {},
	            {label: "Help", command: "do-help"}
	        ]
	    });
	
	this._commands['do-help'] = function(event) {
	    this.controller.showAlertDialog({
            title: $L("Twitter PIN Authentication"),
            message: $L("To use your Twitter account with Spaz, first log in, then tap \"Authorize app\". You will be presented with a 7 digit PIN number that you must re-type to confirm."),
            choices: [
                {label: $L("Okay")}
            ]
        });
	};
	
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
	
	this.controller.setupWidget('pinWebViewSpinner', this.pinWebViewSpinnerAttributes = {
	    spinnerSize: "large"
	}, this.pinWebViewSpinnerModel = {
	    spinning: true
	});
	
	this.controller.setupWidget('pinWebView', {});
	
	/* add event handlers to listen to events from widgets */
	this.controller.listen('verifyPin', Mojo.Event.tap, this.handleVerifyPin.bind(this));
	
	this.controller.listen('pinWebView', Mojo.Event.webViewTitleUrlChanged, this.handlePageChange.bind(this));
	this.controller.listen('pinWebView', Mojo.Event.webViewLoadStarted, this.handleLoadStart.bind(this));
	this.controller.listen('pinWebView', Mojo.Event.webViewLoadStopped, this.handleLoadStop.bind(this));
	this.controller.listen('pinWebView', Mojo.Event.webViewLoadFailed, this.handleLoadFailed.bind(this));
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
			this.controller.get('pinWebView').mojo.openURL(url+"&force_login=true");
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
      
    this._toggleVerifyPinActivity(false);
    
    if (pin && this.oauth) {
        this._toggleVerifyPinActivity(true);
        
        this.oauth.setVerifier(pin);
        this.oauth.fetchAccessToken(function(data) {
            Mojo.Log.error("%j", data);
    
			var qvars = Spaz.getQueryVars(data.text);
			var auth_pickle = qvars.screen_name+':'+qvars.oauth_token+':'+qvars.oauth_token_secret;
			
			var newaccid = that.Users.generateID(qvars.screen_name, SPAZCORE_SERVICE_TWITTER);
            
			var newItem = {
				id:       newaccid,
				username: qvars.screen_name.toLowerCase(),
				auth:     auth_pickle,
				type:     SPAZCORE_SERVICE_TWITTER
			};
			
			if (that.editing_acc_id) { // edit existing
				//EDIT ACCOUNT
			} else { // add new
			    //ADD NEW ACCOUNT
			    var accounts = that.Users.getAll();
			    accounts.push(newItem);
			    
			    App.accounts.setAll(accounts);
				App.accounts.setMeta(newaccid, 'twitter-api-base-url', null);
				App.accounts.setMeta(newaccid, 'twitter_dm_access', true);
                that.Users.setAll(accounts);
                
                App.username = newItem.username;
        		App.auth     = newItem.auth;
        		App.type     = newItem.type;
        		App.userid	 = newItem.id;

        		sch.debug('App.username:' + App.username);
        		sch.debug('App.auth:'     + App.auth);  
        		sch.debug('App.type:'     + App.type);   
        		sch.debug('App.userid:'	 + App.userid);

        		App.prefs.set('last_userid', App.userid);
			}
			
            that._toggleVerifyPinActivity(false);
            
            
            // MOVE FORWARD
            Spaz.popAllAndPushScene(that.nextscene, that.nextsceneargs);
            
        },
        function(data) {
            that.model.pin = "";
            that.controller.modelChanged(that.model);
            
            that._toggleVerifyPinActivity(false);
            that.controller.get('inputDrawer').mojo.setOpenState(false);
            
            that.gotoNewPinUrl();
            
            Mojo.Controller.errorDialog("Invalid PIN, please reauthorize Spaz and try again");
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

GetTwitterPinAssistant.prototype.handleLoadStart = function(event) {
    this.controller.get('pinWebViewScrim').show();
};

GetTwitterPinAssistant.prototype.handleLoadStop = function(event) {
    this.controller.get('pinWebViewScrim').hide();
};

GetTwitterPinAssistant.prototype.handleLoadFailed = function(event) {
    this.controller.get('pinWebViewScrim').hide();
    
    //1000 - load cancelled, want to ignore this.
    if (event.errorCode == 1000) {
        return false;
    }
    
    Mojo.Log.error("Error Loading Page: " + event.errorCode + " :: " + event.message);
    
    var that = this;
    
    this.controller.showAlertDialog({
        onChoose: function(value) {
            that.controller.stageController.popScene();
            that.controller.stageController.popScene();
        },
        title: $L("Error"),
        message: $L("Error connecting to Twitter to authenticate, check your internet connection! \"" + event.errorCode + " :: " + event.message + "\""),
        choices: [
            {label:$L("Okay")}
        ]
    });
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