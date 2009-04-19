function StartAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	Mojo.Log.info("Logging from StartAssistant Constructor");
	
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
			var last_user = sc.app.prefs.get('last_username');
			var last_user_obj = this.Users.getUser(last_user);
			if (last_user_obj !== false) {
				sc.app.username = last_user_obj.username;
				sc.app.password = last_user_obj.password;
				Mojo.Controller.stageController.pushScene('my-timeline');
			} else {
				dump("Tried to load last_user_object, but failed.");
			}
			
			
		}
	}
	
	scene_helpers.addCommonSceneMethods(this);
}

StartAssistant.prototype.setup = function() {
	
	Mojo.Log.info("Logging from StartAssistant Setup");
		
	var thisA = this;

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
			itemTemplate: 'start/user-list-entry',
			listTemplate: 'start/user-list-container',
			dividerTemplate:'start/user-list-separator',
			addItemLabel: $L('Add account…'),
			swipeToDelete: true,
			autoconfirmDelete: false,
			reorderable: true
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
	          template: 'start/new-account-dialog',
	          assistant: new NewAccountDialogAssistant(thisA),
	          preventCancel:false
	    });
	 
	});
	
	/*
		Change list
	*/
    Mojo.Event.listen($('accountList'), Mojo.Event.listChange, function(e) {
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
	// this.controller.setupWidget('activity-spinner', {
	// 		property: 'spinning',
	// 	},
	// 	this.spinnerModel
	// );	
	
	/*
		Listen for taps on login button and status panel popup
	*/
	Mojo.Event.listen($('start-login-button'), Mojo.Event.tap, this.showLogin.bind(this));
	Mojo.Event.listen($('start-search-button'), Mojo.Event.tap, this.showSearch.bind(this));
	Mojo.Event.listen($('back-search-button'), Mojo.Event.tap, this.showStart.bind(this));
	Mojo.Event.listen($('back-login-button'), Mojo.Event.tap, this.showStart.bind(this));
	Mojo.Event.listen($('reload-trends-button'), Mojo.Event.tap, function() {
		thisA.refreshTrends();
	});
	
	this.controller.listen('goToMyTimelineCheckbox', Mojo.Event.propertyChange, function() {
		var state = thisA.model['always-go-to-my-timeline'];
		sc.app.prefs.set('always-go-to-my-timeline', state);
	});
	Mojo.Event.listen($('search-button'), Mojo.Event.tap, this.handleSearch.bind(this));
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		thisA.hideInlineSpinner('#trends-spinner-container');
		
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
	
	this.refreshTrends();
	

	

	
}



StartAssistant.prototype.activate = function(argFromPusher) {
	
	Mojo.Log.info("Logging from StartAssistant Activate");
	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	/*
		don't use this anymore, but patching it over so it breaks stuff less
	*/
	this.model.username = 'foo';
	this.model.password = 'foo';

	this.model['always-go-to-my-timeline'] = sc.app.prefs.get('always-go-to-my-timeline');
	this.controller.modelChanged( this.model );
	 

	var thisA = this;

	jQuery('.trend-item').live(Mojo.Event.tap, function() {
		var term = jQuery(this).attr('data-searchterm');
		thisA.searchFor(term, 'lightweight');
	});

	jQuery('#app-version').text("v"+Mojo.appInfo.version);

	
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


StartAssistant.prototype.refreshTrends = function() {
	this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	sc.app.twit.getTrends();
};


StartAssistant.prototype.showLogin = function() { 
	this.showSection('start-section', 'login-section');
}; 

StartAssistant.prototype.showSection = function(from, to) { 
	$(from).hide();
	$(to).show(); 
}

StartAssistant.prototype.showSearch = function() {
	this.showSection('start-section', 'search-section');
	var thisA = this;
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


StartAssistant.prototype.toggleLoginPanel = function(event) {
	this.togglePanel('#login-panel', '#show-login-button');
}
StartAssistant.prototype.toggleSearchPanel = function(event) {
	this.togglePanel('#search-panel', '#show-search-button');
}
StartAssistant.prototype.toggleTrendsPanel = function(event) {
	var thisA = this;		
	this.togglePanel('#trends-panel', '#show-trends-button', function() {
		thisA.showInlineSpinner('#trends-spinner-container', 'Loading…');
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
		this.searchFor(this.model.search, 'lightweight');
	}
}


StartAssistant.prototype.propertyChanged = function(event) {
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
		$('cancelSaveAccountButton').addEventListener(
							Mojo.Event.tap,
							this.handleCancel.bindAsEventListener(this)
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
				modelProperty:		'password',
				changeOnKeyPress: true, 
				focusMode:		Mojo.Widget.focusSelectMode,
				multiline:		false
			},
			this.newAccountModel
		    );
		
	},
	
	
	activate: function() {
		var thisA = this;
		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/				
		jQuery().bind('verify_credentials_succeeded', function(e) {
			thisA.sceneAssistant.hideInlineSpinner('#new-account-spinner-container');
			
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

			thisA.sceneAssistant.stopInlineSpinner('#new-account-spinner-container', 'Verification failed!');
		});
	},
	
	
	deactivate: function() {
		jQuery().unbind('verify_credentials_succeeded');
		jQuery().unbind('verify_credentials_failed');
	},
	
	
	
	
	
	handleCancel: function() {
		this.widget.mojo.close();
	},
	
	handleVerifyPassword: function() {
		/*
			Turn on the spinner and set the message
		*/
		this.sceneAssistant.showInlineSpinner('#new-account-spinner-container', 'Verifying credentials');
		
		/*
			now verify credentials against the Twitter API
		*/
		sc.app.twit.verifyCredentials(this.newAccountModel.username.toLowerCase(), this.newAccountModel.password);
	}
	
	
});