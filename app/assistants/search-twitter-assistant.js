/**
 * events raised here:
 * 'search_twitter_refresh' 
 */

function SearchTwitterAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
	
	if (args && args.searchterm) {
		this.passedSearch = args.searchterm;
	}
	if (args && args.lightweight) {
		
		
		/*
			we may be in a new stage, so need to init prefs if they don't exist
		*/
		this.initPrefs();
		
		this.lightweight = true;
		

	}
	
	/*
		this property will hold the setInterval return
	*/
	this.refresher = null;
}


SearchTwitterAssistant.prototype.initPrefs = function() {
	/*
		load our prefs
		default_preferences is from default_preferences.js, loaded in index.html
	*/
	if (!sc.app.prefs) {
		
		/*
			We can't go to the login screen until the 
			prefs have fully loaded
		*/
		var thisSA = this;
		jQuery().bind('spazprefs_loaded', function() {

			var username = sc.app.prefs.get('username');
			var password = sc.app.prefs.get('password');

			if (!sc.app.twit) {
				sc.app.twit = new scTwit();

				if (username && password) {
					sc.app.twit.setCredentials(username, password);
				}
			}		

		});
		
		sc.app.prefs = new scPrefs(default_preferences);
		sc.app.prefs.load();
	}
};


SearchTwitterAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */

	var thisA = this;	
	
	this.initTwit();
	
	this.initAppMenu();
	
	if (this.lightweight) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label:$L('Search Twitter'), command:'scroll-top', 'class':"palm-header left"},
						// {label: $L('Show me'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
					]
				},
				{
					items: [
						{label:$L('Trends'),   iconPath:'images/theme/menu-icon-trends.png', command:'search-trends', shortcut:'R'},
					]
				}
			]
		});
		
	} else {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label:$L('Search Twitter'), command:'scroll-top', 'class':"palm-header left"},
						// {label: $L('Show me'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
					]
				},
				{
					items: [
						{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
						{label:$L('Trends'),   iconPath:'images/theme/menu-icon-trends.png', command:'search-trends', shortcut:'R'},
						{label:$L('New Search'), icon:'new', command:'new-search-card', shortcut:'S'}					
					]
				}
			],
			cmdMenuItems: [{ items:
				[
					{},
					// {label:$L('Home'),        iconPath:'images/theme/menu-icon-home.png', command:'home', shortcut:'H'},
					{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
					{label:$L('Search'),      icon:'search', command:'search', shortcut:'S', disabled:true},
					{label:$L('Followers'),   icon:'remove-vip', command:'followers', shortcut:'L'},
					{}
				]
			}]
		});
		
	}

	this.scroller = this.controller.getSceneScroller();
	
	
	
	this.searchBoxAttr = {
		"hintText":	      'Enter search terms…',
		"focusMode":      Mojo.Widget.focusSelectMode,
		"fieldName":'search-twitter'
	};
	this.searchBoxModel = {
		'value':     null,
		'disabled':  false
	}
	this.controller.setupWidget('search-twitter-textfield', this.searchBoxAttr, this.searchBoxModel);

	Mojo.Event.listenForFocusChanges($('search-twitter-textfield'),this.searchboxFocusChange.bind(this));

	jQuery('#submit-search-button').bind(Mojo.Event.tap, function() {
		thisA.search.call(thisA, thisA.searchBoxModel.value);
	});

}




SearchTwitterAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	if (event && event.searchterm) {
		this.passedSearch = event.searchterm;
	}
	
	
	if (this.passedSearch) {
		this.searchBoxModel.value = this.passedSearch;
		this.controller.modelChanged(this.searchBoxModel);
		this.search(this.passedSearch);
		this.passedSearch = null; // eliminate this so it isn't used anymore
	}
	
	this.addPostPopup();
	
	
	var thisA = this; // for closures below
	
	jQuery().bind('new_search_timeline_data', { thisAssistant:this }, function(e, tweets) {

		/*
			reverse the tweets for collection rendering (faster)
		*/
		var rendertweets = tweets;

		jQuery.each( rendertweets, function() {
			this.text = makeItemsClickable(this.text);
			
			// var itemhtml = Mojo.View.render({object: this, template: 'search-twitter/search-item'});
			var itemhtml = sc.app.tpl.parseTemplate('search-item', this);
			
			/*
				make jQuery obj
			*/
			var jqitem = jQuery(itemhtml);
			
			/*
				attach data object to item html
			*/
			jqitem.data('item', this);
			
			/*
				put item on timeline
			*/
			jQuery('#search-timeline').prepend(jqitem);
		});


		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#search-timeline>div.timeline-entry>.status>.meta>.date', 'data-created_at');
		// e.data.thisAssistant.spinnerOff();
		e.data.thisAssistant.hideInlineSpinner('#search-timeline');
		e.data.thisAssistant.startRefresher();
		
	});
	
	/*
		listen for clicks on user avatars
	*/
	jQuery('div.timeline-entry>.user', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	jQuery('.username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});

	jQuery('.hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-status-id');
		Mojo.Controller.stageController.pushScene('message-detail', statusid);
	});
	
	jQuery('#search-twitter-textfield', this.scroller).bind('focus', function(e) {
		jQuery('#submit-search-button').fadeIn('fast');
	});

	jQuery('#search-twitter-textfield', this.scroller).bind('blur', function(e) {
		jQuery('#submit-search-button').fadeOut('fast');
	});
	
	
	jQuery().bind('search_twitter_refresh', { thisAssistant:this }, function(e) {
		e.data.thisAssistant.refresh();
	});
	
	
	this.startRefresher();

}


SearchTwitterAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	Mojo.Event.stopListening($('submit-search-button'), Mojo.Event.tap, this.search);	
	
	jQuery().unbind('new_search_timeline_data');
	
	jQuery('div.timeline-entry>.user', this.scroller).die(Mojo.Event.tap);
	jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	
	this.removePostPopup();
}

SearchTwitterAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}



SearchTwitterAssistant.prototype.search = function(e) {
	dump("search called");
	
		
	if (sch.isString(e)) {
		dump(e);
		this.twit.search(e);
		/*
			clear any existing results
		*/
		jQuery('#search-timeline').empty();

		// this.spinnerOn();
		this.showInlineSpinner('#search-timeline', 'Looking for results…');
		
	} else if (e.value) {
		// dump(e);
		this.twit.search(e.value);		
		/*
			clear any existing results
		*/
		jQuery('#search-timeline').empty();

		// this.spinnerOn();
		this.showInlineSpinner('#search-timeline', 'Looking for results…');
		
		jQuery('#submit-search-button').hide();
	}
}


SearchTwitterAssistant.prototype.refresh = function() {
	this.stopRefresher();
	this.search(this.searchBoxModel.value);
};




SearchTwitterAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	
	this.refresher = setInterval(function() {
			jQuery().trigger('search_twitter_refresh');
		}, sc.app.prefs.get('network-refreshinterval')
	);
	// this.refresher = setInterval(this.refresh.call(this), 5000)
}

SearchTwitterAssistant.prototype.stopRefresher = function() {
	dump('Stopping refresher');
	/*
		Clear refresher
	*/
	clearInterval(this.refresher);
}

SearchTwitterAssistant.prototype.searchboxFocusChange = function(el) {
	if (el) { // focusIN -- something gained focus
		jQuery('#submit-search-button').show('blind');
	} else { // focusOut -- blur
		jQuery('#submit-search-button').hide('blind');
	}
};
