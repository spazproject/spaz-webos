function StartloginAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}

StartloginAssistant.prototype.setup = function() {

	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();

	// this.setupCommonMenus({
	// 	viewMenuItems: [
	// 		{
	// 			items: [
	// 				// {label:$L('Back'),        icon:'back', command:'back'},
	// 				{label:$L('Log-in'), command:'scroll-top'}
	// 			]
	// 		}
	// 	],
	// 	cmdMenuItems: [{ items:
	// 		[]
	// 	}]
	// });
	

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
	this.Users = new Users(sc.app.prefs);
	this.Users.load();
	
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
	
	
	/*
		Tap on list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listTap, function(e) {
		// sc.app.twit.setCredentials(e.item.username, e.item.password);
		sc.app.username = e.item.username;
		sc.app.password = e.item.password;
		
		sc.app.prefs.set('last_username', e.item.username);
				
		Mojo.Controller.stageController.pushScene('my-timeline');
	});
	
	/*
		add to list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listAdd, function(e) {
		// alert("This would show a popup for input of a username and password. When submitted, the popup would verify the credentials. If successful, it would be added to the list");
		
		thisA.controller.showDialog({
	          template: 'startlogin/new-account-dialog',
	          assistant: new NewAccountDialogAssistant(thisA),
	          preventCancel:false
	    });
	 
	});
	
	/*
		Change list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listChange, function(e) {
		dump("list change!");
	});
	
	/*
		delete from list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listDelete, function(e) {
		dump(thisA.accountsModel.items);
		thisA.accountsModel.items.splice(thisA.accountsModel.items.indexOf(e.item), 1);
		dump(thisA.accountsModel.items);
		thisA.Users.setAll(thisA.accountsModel.items);
	});
	
	/*
		Reorder list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listReorder, function(e) {
		thisA.accountsModel.items.splice(thisA.accountsModel.items.indexOf(e.item), 1);
		thisA.accountsModel.items.splice(e.toIndex, 0, e.item);
		thisA.Users.setAll(thisA.accountsModel.items);
	});
	
	
	
	this.controller.listen('goToMyTimelineCheckbox', Mojo.Event.propertyChange, function() {
		var state = thisA.model['always-go-to-my-timeline'];
		sc.app.prefs.set('always-go-to-my-timeline', state);
	});
	
	
}

StartloginAssistant.prototype.activate = function(event) {
	
	Mojo.Log.info("Logging from StartloginAssistant Activate");

	var thisA = this;
	
	/*
		don't use this anymore, but patching it over so it breaks stuff less
	*/
	this.model.username = 'foo';
	this.model.password = 'foo';

	this.model['always-go-to-my-timeline'] = sc.app.prefs.get('always-go-to-my-timeline');
	this.controller.modelChanged( this.model );

}


StartloginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.model.username = '';
	this.model.password = '';
	this.controller.modelChanged( this.model );

}

StartloginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


/**
 * set-up view stuff for the login, listen for jQuery events from SpazTwit, and 
 * start the process 
 */
StartloginAssistant.prototype.handleLogin = function(event) {

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


StartloginAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
}



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
		
		$('saveAccountButton').addEventListener(
							Mojo.Event.tap,
							this.handleVerifyPassword.bindAsEventListener(this)
						);
		
		this.newAccountModel = {
			'username':false,
			'password':false,
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
		
		
		
	},
	
	
	activate: function() {
		var thisA = this;
		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/				
		jQuery().bind('verify_credentials_succeeded', function(e) {
			jQuery('#new-account-errormsg').html('');
			thisA.deactivateSpinner();
			
			var newItem = {
							id:thisA.newAccountModel.username.toLowerCase(),
							username:thisA.newAccountModel.username.toLowerCase(),
							password:thisA.newAccountModel.password,
							type:'twitter'
						};
			thisA.sceneAssistant.accountsModel.items.push(newItem);
			thisA.sceneAssistant.Users.setAll(thisA.sceneAssistant.accountsModel.items);
			$('accountList').mojo.noticeAddedItems(thisA.sceneAssistant.accountsModel.items.length, [newItem]);
			thisA.widget.mojo.close();
		});

		/*
			What to do if we fail
		*/
		jQuery().bind('verify_credentials_failed', function(e) {


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
	},
	
	
	deactivate: function() {
		jQuery().unbind('verify_credentials_succeeded');
		jQuery().unbind('verify_credentials_failed');
		jQuery('#new-account-errormsg').html('');
	},
	
	
	cleanup: function(event) {
		/* this function should do any cleanup needed before the scene is destroyed as 
		   a result of being popped off the scene stack */
		
		$('saveAccountButton').removeEventListener(
							Mojo.Event.tap,
							this.handleVerifyPassword
						);
	},
	
	/**
	 * mainly this exists to initiate the login process if "enter" is hit inside the password field 
	 */
	passwordPropertyChangeListener : function(event) {
		// If the password field has focus and Enter is pressed then simulate tapping on "Sign In"
		if (event && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
			this.controller.get('saveAccountButton').mojo.activate();
			this.handleVerifyPassword.call(this);
			return;
		}
	},
	
	handleCancel: function() {
		this.widget.mojo.close();
	},
	
	handleVerifyPassword: function() {
		jQuery('#new-account-errormsg').html('');
		/*
			Turn on the spinner and set the message
		*/
		// this.sceneAssistant.showInlineSpinner('#new-account-spinner-container', 'Verifying credentials');
		
		/*
			now verify credentials against the Twitter API
		*/
		if (this.newAccountModel.username && this.newAccountModel.password) {
			sc.app.twit.verifyCredentials(this.newAccountModel.username.toLowerCase(), this.newAccountModel.password);
		} else {
			this.deactivateSpinner();
		}
		
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