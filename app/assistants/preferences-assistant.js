function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
};

PreferencesAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

PreferencesAssistant.prototype.setup = function() {
	
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu({ 'items':[
		Mojo.Menu.editItem,
		{ label: $L('New Search Card'),	command: 'new-search-card' },
		{ label: $L('Accounts...'), command:'accounts' },
		{ label: $L('About Spaz'),		command: 'appmenu-about' },
		{ label: $L('Help...'),			command:Mojo.Menu.helpCmd },
		{ label: $L('Donate...'),		command:'donate' }
	]});
	
	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("Preferences"), command:'scroll-top', 'class':"palm-header left", width:320}				
				]
			}

		]
	});
	
	
	/*
		note that these property keys MUST match a preference key
	*/
	this.model = {
		'app-theme':       App.prefs.get('app-theme'),
		'sound-enabled': 			App.prefs.get('sound-enabled'),
		'vibration-enabled': 		App.prefs.get('vibration-enabled'),
		'timeline-scrollonupdate': 	App.prefs.get('timeline-scrollonupdate'),
		'twitter-api-base-url': 	App.prefs.get('twitter-api-base-url'),
		'network-refresh-auto': 		App.prefs.get('network-refresh-auto'),
		'network-refresh-wake': 		App.prefs.get('network-refresh-wake'),
		'network-refreshinterval': 	App.prefs.get('network-refreshinterval'),
		'network-searchrefreshinterval': 	App.prefs.get('network-searchrefreshinterval'),
		'timeline-friends-getcount':App.prefs.get('timeline-friends-getcount'),
		'timeline-replies-getcount':App.prefs.get('timeline-replies-getcount'),
		'timeline-dm-getcount':     App.prefs.get('timeline-dm-getcount'),
		'timeline-text-size':       App.prefs.get('timeline-text-size'),
		'timeline-save-cache':           App.prefs.get('timeline-save-cache'),
		'image-uploader':           App.prefs.get('image-uploader'),
		'notify-newmessages':       App.prefs.get('notify-newmessages'),
		'notify-mentions':          App.prefs.get('notify-mentions'),
		'notify-dms':               App.prefs.get('notify-dms'),
		'notify-searchresults':     App.prefs.get('notify-searchresults'),
		'post-rt-cursor-position':  App.prefs.get('post-rt-cursor-position'),
		'post-send-on-enter':       App.prefs.get('post-send-on-enter'),
		'timeline-absolute-timestamps':  App.prefs.get('timeline-absolute-timestamps')
		
	};
	
	
	/*
		Setup checkboxes
	*/
	
	/*
		temporarily disabling sound and vibration prefs until we can sort out how to tell if sound is off
	*/
    this.controller.setupWidget("checkbox-sound-enabled",
        this.soundEnabledAtts = {
            fieldName: 'sound-enabled',
            modelProperty: 'sound-enabled',
            disabledProperty: 'sound-enabled_disabled'
        },
        this.model
    );
	/*
		temporarily disabling sound and vibration prefs until we can sort out how to tell if sound is off
	*/
    this.controller.setupWidget("checkbox-timeline-save-cache",
        this.soundEnabledAtts = {
            fieldName: 'timeline-save-cache',
            modelProperty: 'timeline-save-cache',
            disabledProperty: 'timeline-save-cache_disabled'
        },
        this.model
    );
	// this.controller.setupWidget("checkbox-vibration-enabled",
	// 	this.soundEnabledAtts = {
	// 		fieldName: 'vibration-enabled',
	// 		modelProperty: 'vibration-enabled',
	// 		disabledProperty: 'vibration-enabled_disabled'
	// 	},
	// 	this.model
	// );
	this.controller.setupWidget("checkbox-timeline-scrollonupdate",
		this.soundEnabledAtts = {
			fieldName: 'timeline-scrollonupdate',
			modelProperty: 'timeline-scrollonupdate',
			disabledProperty: 'timeline-scrollonupdate_disabled'
		},
		this.model
	);
	

	/*
		Notification preferences
	*/
	this.controller.setupWidget("checkbox-notify-newmessages",
		this.soundEnabledAtts = {
			fieldName: 'notify-newmessages',
			modelProperty: 'notify-newmessages',
			disabledProperty: 'notify-newmessages_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-notify-mentions",
		this.soundEnabledAtts = {
			fieldName: 'notify-mentions',
			modelProperty: 'notify-mentions',
			disabledProperty: 'notify-mentions_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-notify-dms",
		this.soundEnabledAtts = {
			fieldName: 'notify-dms',
			modelProperty: 'notify-dms',
			disabledProperty: 'notify-dms_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-notify-searchresults",
		this.soundEnabledAtts = {
			fieldName: 'notify-searchresults',
			modelProperty: 'notify-searchresults',
			disabledProperty: 'notify-searchresults_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-network-refresh-auto",
		this.soundEnabledAtts = {
			fieldName: 'network-refresh-auto',
			modelProperty: 'network-refresh-auto',
			disabledProperty: 'network-refresh-auto_disabled'
		},
		this.model
	);
	this.controller.setupWidget("checkbox-network-refresh-wake",
		this.soundEnabledAtts = {
			fieldName: 'network-refresh-wake',
			modelProperty: 'network-refresh-wake',
			disabledProperty: 'network-refresh-wake_disabled'
		},
		this.model
	);
	
	this.controller.setupWidget("checkbox-post-send-on-enter",
		this.soundEnabledAtts = {
			fieldName: 'post-send-on-enter',
			modelProperty: 'post-send-on-enter',
			disabledProperty: 'post-send-on-enter_disabled'
		},
		this.model
	);
	
	this.controller.setupWidget("checkbox-timeline-absolute-timestamps",
		this.soundEnabledAtts = {
			fieldName: 'timeline-absolute-timestamps',
			modelProperty: 'timeline-absolute-timestamps',
			disabledProperty: 'timeline-absolute-timestamps_disabled'
		},
		this.model
	);
	
	/*
		temporarily disabling sound and vibration prefs until we can sort out how to tell if sound is off
	*/
    this.controller.listen('checkbox-sound-enabled', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
    this.controller.listen('checkbox-timeline-save-cache', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-timeline-scrollonupdate', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-notify-newmessages', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-network-refresh-auto', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-network-refresh-wake', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-notify-mentions', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-notify-dms', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-notify-searchresults', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-post-send-on-enter', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('checkbox-timeline-absolute-timestamps', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));


	/*
		Setup refresh rate widgets	
	*/
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
	this.controller.listen('network-refreshinterval', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('network-searchrefreshinterval', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));


	/*
		setup initial load widgets
	*/
	this.controller.setupWidget('timeline-friends-getcount',
		{
			label: $L('Friends'),
			choices: this.validInitialLoads,
			modelProperty:'timeline-friends-getcount'
		},
		this.model
	);
	this.controller.setupWidget('timeline-replies-getcount',
		{
			label: $L('@Mentions'),
			choices: this.validInitialLoadsDmReply,
			modelProperty:'timeline-replies-getcount'
		},
		this.model
	);
	this.controller.setupWidget('timeline-dm-getcount',
		{
			label: $L('Direct Msgs'),
			choices: this.validInitialLoadsDmReply,
			modelProperty:'timeline-dm-getcount'
		},
		this.model
	);
	this.controller.listen('timeline-friends-getcount', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('timeline-replies-getcount', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	this.controller.listen('timeline-dm-getcount', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	
	
	this.controller.setupWidget('timeline-text-size',
		{
			label: $L('Timeline Text Size'),
			choices: this.validTimelineTextSizes,
			modelProperty:'timeline-text-size'
		},
		this.model
	);
	this.controller.listen('timeline-text-size', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));

	this.controller.setupWidget('app-theme',
		{
			label: $L('Theme'),
			choices: this.validAppThemes,
			modelProperty:'app-theme'
		},
		this.model
	);
	this.controller.listen('app-theme', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));


	this.controller.setupWidget('post-rt-cursor-position',
		{
			label: $L('RT/Q. Cursor Position'),
			choices: this.validRTCursorPositions,
			modelProperty:'post-rt-cursor-position'
		},
		this.model
	);
	this.controller.listen('post-rt-cursor-position', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));


	
	this.controller.setupWidget('image-uploader',
		{
			label: $L('service'),
			choices: this.validImageUploaders,
			modelProperty:'image-uploader'
		},
		this.model
	);
	this.controller.listen('image-uploader', Mojo.Event.propertyChange, this.saveSettings.bindAsEventListener(this));
	
	/*
		clear cache button
	*/
	Mojo.Event.listen(jQuery('#clear-cache-button')[0], Mojo.Event.tap, function(e) {
		thisA.clearTimelineCache();
	});


};



/**
 * saves the current values of the selectors
 */
PreferencesAssistant.prototype.saveSettings = function(event) {
	
	for (var key in this.model) {
		App.prefs.set(key, this.model[key]);
		if (this.onSave[key]) {
			this.onSave[key].call(this, event, this.model[key]);
		}
	}
};

/**
 * a hash of functions to call on save for certain prefs 
 */
PreferencesAssistant.prototype.onSave = {
	'network-refreshinterval' : function(e, val) {
		Spaz.getAppObj().bgnotifier.resetNotification();
	},
	'network-refresh-auto' : function(e, val) {
		val = !!val;
		if (val) { // if it's true now, it was false, so reset it to start over fresh
			Spaz.getAppObj().bgnotifier.resetNotification();
		} else { // otherwise turn it off
			Spaz.getAppObj().bgnotifier.unregisterNotification();
		}
	},
	'network-refresh-wake' : function(e, val) {
		Spaz.getAppObj().bgnotifier.resetNotification();
	},
	'app-theme' : function(e, val) {
		Mojo.Log.error('onSave for app-theme');
		Spaz.setTheme(val);
	}
};

//function declares & initializes our choice arrays
PreferencesAssistant.prototype.setupChoices = function(){
		
	// Options for list selector choices:
	this.validTimes = [
		{label:$L('Never'), value:0}, 
		{label:$L('5min'),  value:300000}, 
		{label:$L('10min'), value:600000},
		{label:$L('15min'), value:900000},
		{label:$L('30min'), value:1800000},
		{label:$L('1hr'),   value:3600000},
		{label:$L('2hr'),   value:7200000},
		{label:$L('4hr'),   value:14400000},
		{label:$L('8hr'),   value:28800000}
	];
	
	this.validInitialLoads = [
		{label:$L('2'), value:2},
		{label:$L('5'), value:5},
		{label:$L('10'), value:10},
		{label:$L('20'), value:20},
		{label:$L('40'), value:40},
		{label:$L('60'), value:60},
		{label:$L('100'), value:100},
		{label:$L('200'), value:200}
	];
	
	this.validInitialLoadsDmReply = [
		{label:$L('2'), value:2},
		{label:$L('5'), value:5},
		{label:$L('10'), value:10},
		{label:$L('20'), value:20},
		{label:$L('40'), value:40},
		{label:$L('60'), value:60},
		{label:$L('100'), value:100},
		{label:$L('200'), value:200}		
	];
	
	this.validTimelineTextSizes = [
		{label:$L('Tall'),  value:'tall'}, 
		{label:$L('Grande'),value:'grande'}, 
		{label:$L('Venti'), value:'venti'}		
	];
	
	this.validAppThemes = [];
	for(var tkey in AppThemes) {
		this.validAppThemes.push({label:tkey, value:tkey});
	}
	
	this.validRTCursorPositions = [
		{label:$L('Beginning'),  value:'beginning'}, 
		{label:$L('End'),value:'end'}
	];
	
	var image_uploader = new SpazImageUploader();
	this.validImageUploaders = [];
	for (var key in image_uploader.services) {
        var val = image_uploader.services[key];
		this.validImageUploaders.push({label:key,  value:key});
    }
};



PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	
	this.controller.stopListening('network-refreshinterval', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('network-searchrefreshinterval', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('timeline-friends-getcount', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('timeline-replies-getcount', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('timeline-dm-getcount', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('timeline-text-size', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('app-theme', Mojo.Event.propertyChange, this.saveSettings);


	Mojo.Event.stopListening(jQuery('#clear-cache-button')[0], Mojo.Event.tap, function(e) {
		thisA.clearTimelineCache();
	});
	
	/*
		temporarily disabling sound and vibration prefs until we can sort out how to tell if sound is off
	*/
    this.controller.stopListening('checkbox-sound-enabled', Mojo.Event.propertyChange, this.saveSettings);
    this.controller.stopListening('checkbox-timeline-save-cache', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-network-refresh-auto', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-network-refresh-wake', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-timeline-scrollonupdate', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-notify-newmessages', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-notify-mentions', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-notify-dms', Mojo.Event.propertyChange, this.saveSettings);
	this.controller.stopListening('checkbox-notify-searchresults', Mojo.Event.propertyChange, this.saveSettings);
	
};


PreferencesAssistant.prototype.considerForNotification = function(params){   
	Mojo.Log.error('NOTIFICATION RECEIVED in PreferencesAssistant:%j', params);
	
	return params;   
};
