function HelpAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}

HelpAssistant.prototype.setup = function(){
	
	this.initAppMenu({ 'items':[
		Mojo.Menu.editItem,
		{ label: $L('New Search Card'),	command: 'new-search-card' },
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

	this.controller.get( 'appname' ).innerHTML = _APP_Name;
	this.controller.get( 'appdetails' ).innerHTML = _APP_VersionNumber + " by " + _APP_PublisherName;
	
	var supportitems = [];
	var i = 0;
	if(typeof _APP_Publisher_URL !== "undefined" && _APP_Publisher_URL)
		supportitems[i++] = {text: _APP_PublisherName + '', detail:$L(_APP_Publisher_URL), Class:$L('img_web'),type:'web'};
	if(typeof _APP_Support_URL !== "undefined" && _APP_Support_URL)
		supportitems[i++] = {text: 'Spaz Support Website',detail:$L(_APP_Support_URL), Class:$L("img_web"),type:'web'};
	if(typeof _APP_Support_Email !== "undefined" && _APP_Support_Email)
		supportitems[i++] = {text: 'Email Support',detail:$L(_APP_Support_Email), Class:$L("img_email"),type:'email'};
	if(typeof _APP_Support_Phone !== "undefined" && _APP_Support_Phone)		            
		supportitems[i++] = {text: $L(_APP_Support_Phone),detail:$L(_APP_Support_Phone), Class:$L("img_phone"),type:'phone'};
	
	try {
		var helpitems = [];
		i = 0;
		for (j = 0; j < _APP_Help_Resource.length; j++) {
			dump('SETUP ' + _APP_Help_Resource[j].type);
			if (_APP_Help_Resource[j].type == 'web') 
				helpitems[i++] = {
					text: _APP_Help_Resource[j].label,
					detail: _APP_Help_Resource[j].url,
					Class: $L("img_web"),
					type: 'web'
				};
			else 
				if (_APP_Help_Resource[j].type == 'scene') 
					helpitems[i++] = {
						text: _APP_Help_Resource[j].label,
						detail: _APP_Help_Resource[j].sceneName,
						Class: $L("list_scene"),
						type: 'scene'
					};
		}
		if (_APP_Help_Resource.length > 0) {
			this.controller.setupWidget('AppHelp_list', {
				itemTemplate: 'help/listitem',
				listTemplate: 'help/listcontainer',
				swipeToDelete: false
			
			}, {
				listTitle: $L('Help'),
				items: helpitems
			});
		}
	}catch(e){Mojo.Log.error(e);}
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
		          target: 'http://' + event.item.detail
		      }
		  }
		});
	  }	  
	  else if(event.item.type == 'email'){
	  	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		    method:'open',
		    parameters:{ target: 'mailto:' + event.item.detail}
		});	
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
