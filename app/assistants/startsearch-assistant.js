function StartsearchAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}

StartsearchAssistant.prototype.setup = function() {

	this.scroller = this.controller.getSceneScroller();

	/*
		initialize the .twit object on the assistant
	*/
	this.initTwit();

	var thisA = this;

	if (sc.app.username && sc.app.password) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label: $L('Search & Explore'), command:'scroll-top', width:320}
					]
				}

			],
			cmdMenuItems: [
				{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
				{
					toggleCmd:'IGNORE',
					items: [
						{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
						{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
						{label:$L('Search'),      icon:'search', command:'IGNORE', shortcut:'S', 'class':"palm-depressed selected"}
					]
				},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
		});
		
		this.initAppMenu({ 'items':loggedin_appmenu_items });
		
	} else {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label: $L('Search & Explore'), command:'scroll-top', width:320}
					]
				}

			]
			
		});	
		
		this.initAppMenu();
		
	};

	
	
	/*
		Initialize the model
	*/
	// alert(username+":"+password)
	this.model = {
		'search':''
	};
	
	
	
	
	/*
		Search
	*/
	this.controller.setupWidget('search',
	    this.atts = {
	        hintText: 'enter search terms',
			enterSubmits: true,
			requiresEnterKey: true,
			modelProperty:		'search',
			changeOnKeyPress: true, 
			focusMode:		Mojo.Widget.focusSelectMode,
			multiline:		false
		},
		this.model
    );
	this.listenForEnter('search', function() {
		this.handleSearch.call(this);
	});
	
	
	/*
		Setup reload trends button
	*/
	this.reloadTrendsButtonAttributes = {
		type: Mojo.Widget.activityButton
	};
	this.reloadTrendsButtonModel = {
		buttonLabel : "Update Trends",
		buttonClass: 'Primary'
	};
	this.controller.setupWidget('reload-trends-button', this.reloadTrendsButtonAttributes, this.reloadTrendsButtonModel);
	Mojo.Event.listen(jQuery('#reload-trends-button')[0], Mojo.Event.tap, function() {
		thisA.refreshTrends();
	});


	/*
		Setup reload saved searches button
	*/
	if (sc.app.username && sc.app.password) {
		this.reloadSearchesButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.reloadSearchesButtonModel = {
			buttonLabel : "Update Saved Searches",
			buttonClass: 'Primary'
		};
				
		this.controller.setupWidget('reload-searches-button', this.reloadSearchesButtonAttributes, this.reloadSearchesButtonModel);
		Mojo.Event.listen(jQuery('#reload-searches-button')[0], Mojo.Event.tap, function() {
			thisA.refreshSearches();
		});
		jQuery('#saved-searches-container').show();
	}



	
	/*
		Setup search submit button
	*/	
	Mojo.Event.listen(jQuery('#search-button')[0], Mojo.Event.tap, this.handleSearch.bind(this));
	
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		thisA.deactivateTrendsSpinner();
		
		/*
			some trends are wrapped in double-quotes, so we need to turn then into entities
		*/
		for (var k=0; k<trends.length; k++) {
			trends[k].searchterm = trends[k].searchterm.replace(/"/gi, '&quot;');
		}
		
		var trendshtml = Mojo.View.render({'collection':trends, template:'startsearch/trend-item'});
		
		jQuery('#trends-list .trend-item').remove();
		jQuery('#trends-list').append(trendshtml);
		jQuery('#trends-list .trend-item').fadeIn(500);
	});
	
	
	/*
		listen for saved searches data updates
	*/
	jQuery().bind('new_saved_searches_data', {thisAssistant:this}, function(e, searches) {
		thisA.deactivateSavedSearchesSpinner();
		
		/*
			some trends are wrapped in double-quotes, so we need to turn then into entities
		*/
		for (var k=0; k<searches.length; k++) {
			console.log(searches[k]);
			searches[k].query = searches[k].query.replace(/"/gi, '&quot;');
		}
		
		var searcheshtml = Mojo.View.render({'collection':searches, template:'startsearch/savedsearch-item'});
		
		jQuery('#searches-list .search-item').remove();
		jQuery('#searches-list').append(searcheshtml);
		jQuery('#searches-list .search-item').fadeIn(500);
	});
	
	
	/*
		initial load of trends and searches
	*/
	this.refreshTrends();
	this.refreshSearches();
	

	
	
};

StartsearchAssistant.prototype.activate = function(event) {
	
	Mojo.Log.info("Logging from StartsearchAssistant Activate");

	var thisA = this;

	/*
		set-up taps on trends and search list items
	*/
	jQuery('.trend-item, .search-item').live(Mojo.Event.tap, function() {
		var term = jQuery(this).attr('data-searchterm');
		var saved_id = parseInt(jQuery(this).attr('data-savedsearch-id'), 10);
		thisA.searchFor(term, 'lightweight', saved_id);
	});
	
	
	jQuery("#search-accordion").tabs("#search-accordion div.pane", { 
	    tabs: 'table',  
	    effect: 'slide',
	    // here is a callback function that is called before the tab is clicked 
		onBeforeClick: function(tabIndex) {
			var tabs = this.getTabs();
			var activeTab = this.getCurrentTab();
			if (tabs.eq(tabIndex) == activeTab) {
				this.current = null;
				this.getCurrentPane().removeClass(opts.current).slideUp("fast");
			}
		},

	    onClick: function(tabIndex) {
			jQuery('#search-accordion .arrow_button')
					.removeClass('palm-arrow-expanded')
					.addClass('palm-arrow-closed');

			var tabs = this.getTabs();
			var newtab = tabs.eq(tabIndex);
			newtab.find('.arrow_button')
					.removeClass('palm-arrow-closed')
					.addClass('palm-arrow-expanded');
	    }
	});

	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('#public-timeline');

	/*
		set up the public timeline
	*/
	this.pubtl   = new SpazTimeline({
		'timeline_container_selector' :'#public-timeline',
		'entry_relative_time_selector':'span.date',
		
		'success_event':'new_public_timeline_data',
		'failure_event':'error_public_timeline_data',
		'event_target' :document,
		
		'refresh_time':sc.app.prefs.get('network-searchrefreshinterval'),
		'max_items':50,

		'request_data': function() {
			var pubTwit = new SpazTwit();
			pubTwit.getPublicTimeline();
		},
		'data_success': function(e, data) {
			for (var i=0; i < data.length; i++) {
				data[i].text = Spaz.makeItemsClickable(data[i].text);
			};
			
			thisA.pubtl.addItems(data);
			sc.helpers.updateRelativeTimes('#public-timeline div.timeline-entry span.date', 'data-created_at');
		},
		'data_failure': function(e, data) {
			
		},
		'renderer': function(obj) {
			return sc.app.tpl.parseTemplate('tweet', obj);
			
		}
	});
	
	/*
		start the public timeline 
	*/
	this.pubtl.start();

	
};


StartsearchAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	/*
		stop listening to trend-item taps
	*/
	jQuery('.trend-item, .search-item').die(Mojo.Event.tap);
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('#public-timeline');
	
	/*
		unbind and stop refresher for public timeline
	*/
	this.pubtl.cleanup();
};


StartsearchAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	this.stopListeningForEnter('search');
	
	Mojo.Event.stopListening(jQuery('#reload-trends-button')[0], Mojo.Event.tap, function() {
		thisA.refreshTrends();
	});
	Mojo.Event.stopListening(jQuery('#search-button')[0], Mojo.Event.tap, this.handleSearch);
	jQuery().unbind('new_trends_data');
	jQuery().unbind('new_saved_searches_data');
};


StartsearchAssistant.prototype.refreshTrends = function() {
	// this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	sc.app.twit.getTrends();
};

StartsearchAssistant.prototype.refreshSearches = function() {
	// this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	this.twit.getSavedSearches();
};


StartsearchAssistant.prototype.handleSearch = function(event) {
	if (this.model && this.model.search) {
		this.searchFor(this.model.search, 'lightweight');
	}
};


StartsearchAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
};

StartsearchAssistant.prototype.activateSpinner = function() {
	var buttonWidget = jQuery('reload-trends-button').get(0);
	buttonWidget.mojo.activate();
};

StartsearchAssistant.prototype.deactivateTrendsSpinner = function() {
	dump("Deactivating spinner reload-trends-button");
	var buttonWidget = jQuery('#reload-trends-button').get(0);
	buttonWidget.mojo.deactivate();
	dump("Deactivated spinner reload-trends-button");
	
};


StartsearchAssistant.prototype.deactivateSavedSearchesSpinner = function() {
	dump("Deactivating spinner reload-searches-button");
	var buttonWidget = jQuery('#reload-searches-button').get(0);
	buttonWidget.mojo.deactivate();
	dump("Deactivated spinner reload-searches-button");
	
};

StartsearchAssistant.prototype.refresh = function(e) {
	this.pubtl.start();
};



