function HelpAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Mojo.Controller.getAppController().assistant.App;
}
HelpAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};
HelpAssistant.prototype.setup = function(){
	
	this.initAppMenu({ 'items':[
		Mojo.Menu.editItem,
		{ label: $L('New Search Card'), command: 'new-search-card' },
		{ label: $L('Accounts...'), command:'accounts' },
		{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
		{ label: $L('About Spaz'),		command: 'appmenu-about' }
	]});
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("Help"), command:'scroll-top', 'class':"palm-header left", width:320}
				]
			}

		],
		cmdMenuItems: []
		
	});

	this.controller.setupWidget(Mojo.Menu.appMenu, this.attributes = {
		omitDefaultItems: true
		}, this.model = {
		visible: false
	
		}
	);

	this.controller.get( 'appname' ).innerHTML = Mojo.appInfo.title;
	this.controller.get( 'appdetails' ).innerHTML = Mojo.appInfo.version + " by " + Mojo.appInfo.vendor;
	
	var supportitems = [];
	var i = 0;
	if(typeof Mojo.appInfo.vendorurl !== "undefined" && Mojo.appInfo.vendorurl)
		supportitems[i++] = {text: Mojo.appInfo.vendor + '', detail:Mojo.appInfo.vendorurl, Class:$L('img_web'),type:'web'};
	if(typeof Mojo.appInfo.support.url !== "undefined" && Mojo.appInfo.support.url)
		supportitems[i++] = {text: 'Spaz Support Website',detail:Mojo.appInfo.support.url, Class:$L("img_web"),type:'web'};
	if(typeof Mojo.appInfo.support.email !== "undefined" && Mojo.appInfo.support.email)
		supportitems[i++] = {text: 'Email Support',detail:Mojo.appInfo.support.email.address,subject:$L(Mojo.appInfo.support.email.subject), Class:$L("img_email"),type:'email'};
	
	this.controller.setupWidget('AppSupport_list', 
					{
						itemTemplate:'help/listitem', 
						listTemplate:'help/listcontainer',
						swipeToDelete: false
						
					},
					{
						listTitle: $L('Support'),
						items : supportitems
					 }
	  );
	Mojo.Event.listen(this.controller.get('AppHelp_list'),Mojo.Event.listTap,this.handleListTap.bind(this));
	Mojo.Event.listen(this.controller.get('AppSupport_list'),Mojo.Event.listTap,this.handleListTap.bind(this));
	this.controller.get( 'copywrite' ).innerHTML = _APP_Copyright;
	
};
HelpAssistant.prototype.handleListTap = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	if(event.item.type == 'web'){
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
		  method: "open",
		  parameters:  {
			  id: 'com.palm.app.browser',
			  params: {
				  target: event.item.detail
			  }
		  }
		});
	}	  
	else if(event.item.type == 'email'){
		this.controller.serviceRequest(
			"palm://com.palm.applicationManager", {
				method: 'open',
				parameters: {
					id: "com.palm.app.email",
					params: {
						summary: event.item.subject,
						recipients: [{
							type:"email",
							role:1,
							value:event.item.detail,
							contactDisplay:"Spaz WebOS Support"
						}]
					}
				}
			}
		);

	}
	else if(event.item.type == 'phone'){
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method:'open',
			parameters: {
			   target: "tel://" + event.item.detail
			   }
			}); 
	  }
	  else if(event.item.type == 'scene'){
		this.controller.stageController.pushScene(event.item.detail);	
	  }
};
HelpAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


HelpAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HelpAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	Mojo.Event.stopListening(this.controller.get('AppHelp_list'),Mojo.Event.listTap,this.handleListTap);
	Mojo.Event.stopListening(this.controller.get('AppSupport_list'),Mojo.Event.listTap,this.handleListTap);
	
};
