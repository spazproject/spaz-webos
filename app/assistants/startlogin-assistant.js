function StartloginAssistant(args) {
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

StartloginAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

StartloginAssistant.prototype.setup = function() {

	var thisA = this;

	Mojo.Log.info('StartloginAssistant setup!');
	Mojo.Log.info('App.prefs', App.prefs);

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("Log-in"), command:'scroll-top', 'class':"palm-header left", width:320}				
				]
			}

		]
	});

	/*
		Initialize the model
	*/
	// alert(username+":"+password)
	this.model = {
		'username':false,
		'password':false,
		'always-go-to-my-timeline':false
	};
	
	
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
		load users from prefs obj
	*/
	this.Users = new SpazAccounts(App.prefs);
	this.Users.load();
	
	// sch.error(this.Users);
	
	this.controller.setupWidget("accountList",
		this.accountsAtts = {
			itemTemplate: 'startlogin/user-list-entry',
			listTemplate: 'startlogin/user-list-container',
			dividerTemplate:'startlogin/user-list-separator',
			addItemLabel: $L('Add account…'),
			swipeToDelete: true,
			autoconfirmDelete: false,
			reorderable: false
		},
		this.accountsModel = {
			listTitle: $L('Accounts'),
			items : this.Users.getAll()
		}
	);
	
	// sch.error(this.accountsModel.items);
	
	
	/*
		Tap on list
	*/
    Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listTap, function(e) {
	
		sch.debug('CLICKED ON ITEM');
		sch.debug(sch.enJSON(e.item));
	
		App.username = e.item.username;
		App.auth		= e.item.auth;
		App.type     = e.item.type;
		App.userid	= e.item.id;
		
		sch.debug('App.username:' + App.username);
		sch.debug('App.auth:'     + App.auth);  
		sch.debug('App.type:'     + App.type);   
		sch.debug('App.userid:'	 + App.userid);
		
		App.prefs.set('last_userid', App.userid);

		// Mojo.Log.error('nextscene: %s', thisA.nextscene);
		// Mojo.Log.error('nextsceneargs: %s', thisA.nextsceneargs);
		Spaz.popAllAndPushScene(thisA.nextscene, thisA.nextsceneargs);
	});
	
	/*
		add to list
	*/
    Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listAdd, function(e) {
		// alert("This would show a popup for input of a username and password. When submitted, the popup would verify the credentials. If successful, it would be added to the list");
		
        thisA.controller.showDialog({
                     template: 'startlogin/new-account-dialog',
                     assistant: new NewAccountDialogAssistant(thisA),
                     preventCancel:false
               });
	    
	    //Mojo.Controller.stageController.pushScene('new-account', {});
	 
	});
	
	/*
		Change list
	*/
    Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listChange, function(e) {
		dump("list change!");
	});
	
	/*
		delete from list
	*/
    Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listDelete, function(e) {
		dump(thisA.accountsModel.items);
		thisA.accountsModel.items.splice(thisA.accountsModel.items.indexOf(e.item), 1);
		dump(thisA.accountsModel.items);
		thisA.Users.setAll(thisA.accountsModel.items);
	});
	
	/*
		Reorder list
	*/
    Mojo.Event.listen(jQuery('#accountList')[0], Mojo.Event.listReorder, function(e) {
		thisA.accountsModel.items.splice(thisA.accountsModel.items.indexOf(e.item), 1);
		thisA.accountsModel.items.splice(e.toIndex, 0, e.item);
		thisA.Users.setAll(thisA.accountsModel.items);
	});
	
	
	
	this.controller.listen('goToMyTimelineCheckbox', Mojo.Event.propertyChange, function() {
		var state = thisA.model['always-go-to-my-timeline'];
		App.prefs.set('always-go-to-my-timeline', state);
	});
	
	
};

StartloginAssistant.prototype.activate = function(event) {
	
	Mojo.Log.info("Logging from StartloginAssistant Activate");

	var thisA = this;
	
	/*
		don't use this anymore, but patching it over so it breaks stuff less
	*/
	this.model.username = 'foo';
	this.model.password = 'foo';

	this.model['always-go-to-my-timeline'] = App.prefs.get('always-go-to-my-timeline');
	this.controller.modelChanged( this.model );
	
	
	this.checkForOldAccounts();

};


StartloginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.model.username = '';
	this.model.password = '';
	this.controller.modelChanged( this.model );

};

StartloginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


/**
 * set-up view stuff for the login, listen for jQuery events from SpazTwit, and 
 * start the process 
 */
StartloginAssistant.prototype.handleLogin = function(event) {

	/**
	 * - Get username and password from text fields
	 * - initialize App.twit
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
		App.twit.verifyCredentials(this.model.username, this.model.password);
		
	}
	
	
};


StartloginAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
};



StartloginAssistant.prototype.checkForOldAccounts = function() {
	/**
	 * check twitter accounts 
	 */
	var to_upgrade = Spaz.Prefs.findOldTwitterAccounts();
	if (to_upgrade.length > 0) {
		this.showAlert(
			"To continue accessing direct messages, you should delete and re-create the following accounts:\n"+to_upgrade.join(",\n"),
			"Action Required",
			function(choice) {
				switch(choice) {
					case 'more_info':
						this.openInBrowser('http://j.mp/spazwebosshitsandwich');
						break;
					default:
						break;
				}
				return true;
			},
			[
				{label:$L('More info'), value:"more_info", type:'affirmative'},
				{label:$L('Okay'), value:"okay", type:'dismiss'}
			]
		);
	}
};


/*
	Small controller class used for the new account dialog
*/
var NewAccountDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		jQuery('#saveAccountButton')[0].addEventListener(
			Mojo.Event.tap,
			this.handleVerifyPassword.bindAsEventListener(this)
		);
        jQuery('#getPin')[0].addEventListener(
			Mojo.Event.tap,
			this.handleTwitterPin.bindAsEventListener(this)
		);
		
		this.newAccountModel = {
			'username':false,
			'password':false,
			'type':SPAZCORE_SERVICE_TWITTER,
			'twitter-api-base-url':'http://'
		};


		/*
			Username
		*/
		this.controller.setupWidget('new-username',
			this.atts = {
				// hintText: 'enter username',
				enterSubmits: true,
				modelProperty:'username', 
				changeOnKeyPress: true,
				focusMode:	Mojo.Widget.focusSelectMode,
				multiline:		false,
				textReplacement: false,
				autoCapitalization: false
			},
			this.newAccountModel
		);

		/*
			Password
		*/
		this.controller.setupWidget('new-password',
		    this.atts = {
		        // hintText: 'enter password',
		        label: "password",
				enterSubmits: true,
				requiresEnterKey: true,
				modelProperty:		'password',
				changeOnKeyPress: true, 
				focusMode:		Mojo.Widget.focusSelectMode,
				multiline:		false
			},
			this.newAccountModel
		    );
		
		
		this.verifyButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.verifyButtonModel = {
			buttonLabel : "Verify and Save Account",
			buttonClass: 'Primary'
		};
		
		this.controller.setupWidget('saveAccountButton', this.verifyButtonAttributes, this.verifyButtonModel);
		
		
		this.controller.setupWidget('type',
			{
				label: $L('Type'),
				choices: [
					{label:$L('Twitter'), value:SPAZCORE_SERVICE_TWITTER}, 
					{label:$L('Identi.ca'), value:SPAZCORE_SERVICE_IDENTICA},
					{label:$L('StatusNet/Custom'), value:SPAZCORE_SERVICE_CUSTOM}
				],
				modelProperty:'type'
			},
			this.newAccountModel
		);
        
		this.typePropertyChangeListener();

		/*
			API URL
		*/
		this.controller.setupWidget('twitter-api-base-url',
			this.atts = {
				// hintText: 'enter username',
				enterSubmits: true,
				modelProperty:'twitter-api-base-url', 
				changeOnKeyPress: true,
				focusMode:	Mojo.Widget.focusSelectMode,
				multiline:		false,
				textReplacement: false,
				autoCapitalization: false
			},
			this.newAccountModel
		);
		
		this.controller.setupWidget('getPin', this.getPinAttributes = {
		    
		}, this.getPinModel = {
		    buttonLabel: "Log In and Get Pin",
		    buttonClass: "Primary"
		});

		
		this.controller.setupWidget('saveAccountButton', this.verifyButtonAttributes, this.verifyButtonModel);
		
		
	},
	
	
	activate: function() {
		var thisA = this;

		jQuery('#twitter-api-base-url-row').hide();

		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/
		jQuery(document).bind('verify_credentials_succeeded', function(e) {
			jQuery('#new-account-errormsg').html('');
			thisA.deactivateSpinner();
			
			var newItem = {
				id:thisA.sceneAssistant.Users.generateID(thisA.newAccountModel.username, thisA.newAccountModel.type),
				username:thisA.newAccountModel.username.toLowerCase(),
				password:thisA.newAccountModel.password,
				type:thisA.newAccountModel.type.toLowerCase(),
				twitter_dm_access:true
			};
			thisA.sceneAssistant.accountsModel.items.push(newItem);
			thisA.sceneAssistant.Users.setAll(thisA.sceneAssistant.accountsModel.items);			
			thisA.sceneAssistant.Users.setMeta(newItem.id, 'twitter-api-base-url', thisA.newAccountModel['twitter-api-base-url']);
			thisA.sceneAssistant.Users.setMeta(newItem.id, 'twitter_dm_access', true);
			
			jQuery('#accountList')[0].mojo.noticeAddedItems(thisA.sceneAssistant.accountsModel.items.length, [newItem]);
			thisA.widget.mojo.close();
		});

		/*
			What to do if we fail
		*/
		jQuery(document).bind('verify_credentials_failed', function(e) {
			/*
				If we return to this scene from another
				and fail the login, e.data.thisAssistant will not have
				its controller property. WHY?
			*/
			jQuery('#new-account-errormsg').text($L('Verification failed!'));
			thisA.deactivateSpinner();
		});
		
		/*
			Listen for enter on new-password
		*/
		Mojo.Event.listen(this.controller.get('new-password'),
			Mojo.Event.propertyChange,
			this.passwordPropertyChangeListener.bindAsEventListener(this),
			true
		);
		
		Mojo.Event.listen(this.controller.get('type'),
			Mojo.Event.propertyChange,
			this.typePropertyChangeListener.bindAsEventListener(this),
			true
		);
		
		Mojo.Event.listen(this.controller.get('getPin'),
		    Mojo.Event.tap,
		    this.handleTwitterPin.bindAsEventListener(this),
		    true
		);
	},
	
	
	deactivate: function() {
		jQuery(document).unbind('verify_credentials_succeeded');
		jQuery(document).unbind('verify_credentials_failed');
		jQuery('#new-account-errormsg').html('');
		Mojo.Event.stopListening(this.controller.get('new-password'),
			Mojo.Event.propertyChange,
			this.passwordPropertyChangeListener
		);
		Mojo.Event.stopListening(this.controller.get('type'),
			Mojo.Event.propertyChange,
			this.typePropertyChangeListener,
			true
		);
		Mojo.Event.stopListening(this.controller.get('getPin'),
		    Mojo.Event.tap,
		    this.handleTwitterPin,
		    true
		);
		
	},
	
	
	cleanup: function(event) {
		/* this function should do any cleanup needed before the scene is destroyed as 
		   a result of being popped off the scene stack */
		
		jQuery('#saveAccountButton')[0].removeEventListener(
							Mojo.Event.tap,
							this.handleVerifyPassword
						);
	},
	
	/**
	 * mainly this exists to initiate the login process if "enter" is hit inside the password field 
	 */
	passwordPropertyChangeListener : function(event) {
		// If the password field has focus and Enter is pressed then simulate tapping on "Sign In"
		if (event && event.originalEvent && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
			this.controller.get('saveAccountButton').mojo.activate();
			this.handleVerifyPassword.call(this);
			return;
		}
	},
	
	
	typePropertyChangeListener : function(event) {
		if (this.newAccountModel.type === SPAZCORE_SERVICE_CUSTOM) {
			jQuery('#twitter-api-base-url-row').show();
			jQuery('#type-row').removeClass('last');
		} else {
			jQuery('#twitter-api-base-url-row').hide();
			jQuery('#type-row').addClass('last');
		}
		
		if (this.newAccountModel.type === SPAZCORE_SERVICE_TWITTER) {
		    jQuery('#twitter-get-pin-row').show();
		    jQuery('#user-row').hide();
		    jQuery('#password-row').hide();
	    } else {
	        jQuery('#twitter-get-pin-row').hide();
		    jQuery('#user-row').show();
		    jQuery('#password-row').show();
	    }
	},
	
	
	handleCancel: function() {
		this.widget.mojo.close();
	},
	
	handleVerifyPassword: function() {
		
		var that = this;
		
		jQuery('#new-account-errormsg').html('');
		/*
			Turn on the spinner and set the message
		*/
		// this.sceneAssistant.showInlineSpinner('#new-account-spinner-container', 'Verifying credentials');
		// sch.error("new account:");
		// sch.error(this.newAccountModel.username);
		
		/*
			now verify credentials against the Twitter API
		*/
		if (this.newAccountModel.username && this.newAccountModel.password) {
			if (this.newAccountModel.type !== SPAZCORE_SERVICE_CUSTOM) {
				App.twit.setBaseURLByService(this.newAccountModel.type);
			} else {
				App.twit.setBaseURL(this.newAccountModel['twitter-api-base-url']);
			}
			
			
			// Mojo.Log.error(this.newAccountModel.type);
			
			var auth  = new SpazAuth(this.newAccountModel.type);
			
			sch.error('authorizing…');
			
			auth.authorize(
				this.newAccountModel.username,
				this.newAccountModel.password,
				function(result) {
					if (result) {

						var auth_pickle = auth.save();

						// sch.error('auth_pickle:');
						// sch.error(auth_pickle);

						jQuery('#new-account-errormsg').html('');
						that.deactivateSpinner();

						var newaccid = that.sceneAssistant.Users.generateID(that.newAccountModel.username, that.newAccountModel.type);

						var newItem = {
							id:newaccid,
							username:that.newAccountModel.username.toLowerCase(),
							auth:auth_pickle,
							type:that.newAccountModel.type,
							twitter_dm_access:true
						};
						// the list model
						that.sceneAssistant.accountsModel.items.push(newItem);
						
						// the accounts model
						App.accounts.setAll(that.sceneAssistant.accountsModel.items);
						App.accounts.setMeta(newaccid, 'twitter-api-base-url', that.newAccountModel['twitter-api-base-url']);
						App.accounts.setMeta(newaccid, 'twitter_dm_access', true);
						// Mojo.Log.error('twitter_dm_access: %s', App.accounts.getMeta(newaccid, 'twitter_dm_access'));

						jQuery('#accountList')[0].mojo.noticeAddedItems(that.sceneAssistant.accountsModel.items.length, [newItem]);
						that.widget.mojo.close();

					} else {					
						jQuery('#new-account-errormsg').text($L('Verification failed!'));
						that.deactivateSpinner();
					}
				}
			);
		}
	},
	
	handleTwitterPin: function(event) {
	    Mojo.Log.info("handling twitter pin");
	    Mojo.Controller.stageController.pushScene('get-twitter-pin', {
	        nextscene: this.sceneAssistant.nextscene,
	        nextsceneargs: this.sceneAssistant.nextsceneargs
	    });
	    
	    event.preventDefault();
	    return false;
	},
	
	activateSpinner: function() {
		this.buttonWidget = this.controller.get('saveAccountButton');
		this.buttonWidget.mojo.activate();
	},
	
	deactivateSpinner: function() {
		this.buttonWidget = this.controller.get('saveAccountButton');
		this.buttonWidget.mojo.deactivate();
	}
	
	
});