function DashboardAssistant(args) {

	this.default_args = {
		'template_data': {
			'title':'Dashboard Title',
			'message':'Dashboard Message',
			'count':99			
		},
		'fromstage':SPAZ_MAIN_STAGENAME,
		'template':'dashboard/item-info'
	};
	
	this.args = sch.defaults(this.default_args, args);
	
	Mojo.Log.info('DashboardAssistant args: %j', args);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
        authType: SPAZCORE_AUTHTYPE_OAUTH,
        consumerKey: SPAZCORE_CONSUMERKEY_TWITTER,
        consumerSecret: SPAZCORE_CONSUMERSECRET_TWITTER,
        accessURL: 'https://twitter.com/oauth/access_token'
    });
	
}


DashboardAssistant.prototype.setup = function() {
	this.updateDashboard();
	
	var switchButton = this.controller.get("dashboardinfo"); 
	Mojo.Event.listen(switchButton, Mojo.Event.tap, this.launchMain.bindAsEventListener(this));

	var stageDocument = this.controller.stageController.document; 
	Mojo.Event.listen(stageDocument, Mojo.Event.stageActivate, 
		this.activateWindow.bindAsEventListener(this)); 
	Mojo.Event.listen(stageDocument, Mojo.Event.stageDeactivate,
		this.deactivateWindow.bindAsEventListener(this)); 
	
};

DashboardAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

};


DashboardAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DashboardAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


DashboardAssistant.prototype.updateDashboard = function(args) { 
	
	this.args = sch.defaults(this.default_args, args);
	
	Mojo.Log.error("updateDashboard Args: %j", args);
	
	/*
		Use render to convert the object and its properties
		along with a view file into a string containing HTML
	*/
	var renderedInfo = Mojo.View.render({object: this.args.template_data, template: this.args.template}); 
	var infoElement	 = this.controller.get('dashboardinfo'); 
	infoElement.update(renderedInfo); 
	
	/*
		Flash the LED, if it's enabled in system settings
	*/
	this.controller.stageController.indicateNewContent(true);
	
}; 

DashboardAssistant.prototype.activateWindow = function() { 
	Mojo.Log.error("......... Dashboard Assistant - Activate Window"); 
}; 
DashboardAssistant.prototype.deactivateWindow = function() { 
	Mojo.Log.error("......... Dashboard Assistant - Deactivate Window"); 
};
DashboardAssistant.prototype.launchMain = function() { 
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		 method: 'launch', 
		 parameters: { 
			 id: Mojo.appInfo.id, 
			 params: {'fromstage':this.args.fromstage, 'action':'main_timeline', 'account':App.prefs.get('last_userid')} 
		 } 
	}); 
	this.controller.window.close(); 
}; 
