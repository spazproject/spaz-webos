function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
}

PreferencesAssistant.prototype.setup = function() {
	
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('Preferences'), command:'scroll-top'}
				]
			}
		],
		cmdMenuItems: [{ items:
			[]
		}]
	});


	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	this.model = {
		'sound-enabled': 			sc.app.prefs.get('sound-enabled'),
		'timeline-scrollonupdate': 	sc.app.prefs.get('timeline-scrollonupdate'),
		'twitter-api-base-url': 	sc.app.prefs.get('twitter-api-base-url'),
		'network-refreshinterval': 	sc.app.prefs.get('network-refreshinterval'),
		'network-searchrefreshinterval': 	sc.app.prefs.get('network-searchrefreshinterval'),
	}

	
	
	this.controller.setupWidget("checkbox-sound-enabled",
		this.soundEnabledAtts = {
			fieldName: 'sound-enabled',
			modelProperty: 'sound-enabled',
			disabledProperty: 'sound-enabled_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-timeline-scrollonupdate",
		this.soundEnabledAtts = {
			fieldName: 'timeline-scrollonupdate',
			modelProperty: 'timeline-scrollonupdate',
			disabledProperty: 'timeline-scrollonupdate_disabled'
		},
		this.model
	);
	

	
	// Setup models for the selector widgets:	
	this.setupChoices();

	this.controller.setupWidget('network-refreshinterval',
		{
			label: $L('My Timeline'),
			choices: this.validTimes,
			modelProperty:'network-refreshinterval'
		},
		this.model
	);
	this.controller.setupWidget('network-searchrefreshinterval',
		{
			label: $L('Search'),
			choices: this.validTimes,
			modelProperty:'network-searchrefreshinterval'
		},
		this.model
	);
	

	

	
	
	
	/* add event handlers to listen to events from widgets */
	this.controller.listen('network-refreshinterval', Mojo.Event.propertyChange, this.selectorChanged.bindAsEventListener(this));
	this.controller.listen('network-searchrefreshinterval', Mojo.Event.propertyChange, this.selectorChanged.bindAsEventListener(this));

	
	Mojo.Event.listen($('clear-cache-button'), Mojo.Event.tap, function(e) {
		thisA.clearTimelineCache();
	});


	
	this.controller.listen('checkbox-sound-enabled', Mojo.Event.propertyChange, function() {
		var state = thisA.model['sound-enabled'];
		sc.app.prefs.set('sound-enabled', state);
	});
	this.controller.listen('checkbox-timeline-scrollonupdate', Mojo.Event.propertyChange, function() {
		var state = thisA.model['timeline-scrollonupdate'];
		sc.app.prefs.set('timeline-scrollonupdate', state);
	});
	
	
}



//displays the current state of various selectors
PreferencesAssistant.prototype.selectorChanged = function(event) {
		sc.app.prefs.set('network-refreshinterval',       this.model['network-refreshinterval']);
		sc.app.prefs.set('network-searchrefreshinterval', this.model['network-searchrefreshinterval']);
}

//function declares & initializes our choice arrays
PreferencesAssistant.prototype.setupChoices = function(){
		
	// Options for list selector choices:
	this.validTimes = [
		{label:$L('Never'), value:0}, 
		{label:$L('5min'),  value:300000}, 
		{label:$L('10min'), value:600000},
		{label:$L('15min'), value:900000},
		{label:$L('30min'), value:1800000},
		{label:$L('1hr'),   value:3600000}
	];
	
}



PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
