/**
 * events raised here:
 * 'search_timeline_refresh' 
 */

function SearchTwitterAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	if (args && args.searchterm) {
		this.passedSearch = args.searchterm;
	}
	if (args && args.lightweight) {
		/*
			we may be in a new stage, so need to init prefs if they don't exist
		*/
		
		this.lightweight = true;
	}
	
	if (args && args.saved_id > 0) {
		this.isSavedSearch = true;
		this.saved_id = args.saved_id;
	} else {
		this.isSavedSearch = false;
		this.saved_id = null;
	}
	
	/*
		this property will hold the setInterval return
	*/
	this.refresher = null;
	
	this.lastQuery = '';
}

SearchTwitterAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

SearchTwitterAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */

	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initTwit();
	
	this.trackStageActiveState();
	

	
	/*
		view and command menus
	*/
	if (App.username) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("Search & Explore"), command:'scroll-top', 'class':"palm-header left", width:320}				
					]
				}

			],
			/*
				we're assigning this to a value here so we can update it later
			*/
			cmdMenuItems: this.cmdMenuItems = [
				{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
				{},
				{label:$L('Save search'), icon:'favorite-outline', command:'save-search', shortcut:'S'},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
		});
		
		this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });	
	} else {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("Search & Explore"), command:'scroll-top', 'class':"palm-header left", width:320}				
					]
				}

			],
			cmdMenuItems: [
				{},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
			
		});
		
		this.initAppMenu();		
	}





	/*
		search textbox
	*/
	this.searchBoxAttr = {
		"hintText":	      'Enter search terms',
		"focusMode":      Mojo.Widget.focusSelectMode,
		"fieldName":'search-twitter',
		"enterSubmits": true,
		"requiresEnterKey": true,
		"changeOnKeyPress": true
	};
	this.searchBoxModel = {
		'value':     '',
		'disabled':  false
	};
	this.controller.setupWidget('search-twitter-textfield', this.searchBoxAttr, this.searchBoxModel);

	/*
		search button
	*/
	jQuery('#submit-search-button').bind(Mojo.Event.tap, function() {
		thisA.search.call(thisA, thisA.searchBoxModel.value, null, 1);
	});
	
	this.searchButtonAttributes = {
		"type": Mojo.Widget.activityButton
	};
	this.searchButtonModel = {
		"buttonLabel" : "Search",
		"buttonClass" : 'Primary'
	};	
	this.controller.setupWidget('submit-search-button', this.searchButtonAttributes, this.searchButtonModel);


	this.controller.setupWidget("search-timeline",
		this.timeline_attributes = {
			itemTemplate: 'timeline-entry',
			listTemplate: 'timeline-container',
			emptyTemplate: 'timeline-container-empty',
			swipeToDelete: false,
			reorderable: false,
			hasNoWidgets: true,
			formatters: {
				'data': function(value, model) {
					return thisA.renderItem(value);
				}
			}
		},
		this.timeline_model = {
			items : []
		}
	);	
	this.timeline_list = this.controller.get('search-timeline');


	// this.refresh();
	
	if (this.isSavedSearch) {
		this.fillStar(true);
	} else {
		this.fillStar(false);
	}
	
	/*
		more button
	*/
	jQuery('#more-search-button').bind(Mojo.Event.tap, function() {
		thisA.loadMore.call(thisA);
	});
	this.moreButtonAttributes = {};
	this.moreButtonModel = {
		"buttonLabel" : "More",
		"buttonClass" : 'Primary'
	};
	this.controller.setupWidget('more-search-button', this.moreButtonAttributes, this.moreButtonModel);
	
	this.listenForMetaTapScroll();
};




SearchTwitterAssistant.prototype.activate = function(event) {

	var thisA = this; // for closures

	
	if (event && event.searchterm) {
		this.passedSearch = event.searchterm;
	}
	
	
	if (this.passedSearch) {
		this.searchBoxModel.value = this.passedSearch.replace(/&quot;/gi, '"'); // convert the entities back into "'s
		this.controller.modelChanged(this.searchBoxModel);
		this.search(this.passedSearch);
		this.passedSearch = null; // eliminate this so it isn't used anymore
	}
	
	
	var tts = App.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#search-timeline', tts);
	
		
	
	jQuery(document).bind('search_timeline_refresh', function(e) {
		thisA.markAllAsRead();
		thisA.refresh();
	});
	
	this.listenForEnter('search-twitter-textfield', function() {
		thisA.controller.get('submit-search-button').mojo.activate();
		thisA.search(thisA.searchBoxModel.value, null, 1);
	});
	
	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('search-timeline');

		
};


SearchTwitterAssistant.prototype.deactivate = function(event) {
	jQuery(document).unbind('search_timeline_refresh');	
	
	Mojo.Log.error('DEACTIVATE');
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('search-timeline');
};


SearchTwitterAssistant.prototype.cleanup = function(event) {
	jQuery('#submit-search-button').unbind(Mojo.Event.tap);
	
	jQuery('#more-search-button').unbind(Mojo.Event.tap);
	
	this.stopListeningForEnter('search-twitter-textfield');
	
	this.stopTrackingStageActiveState();
	
};



SearchTwitterAssistant.prototype.search = function(e, type, page) {
	var thisA = this;
	var search_string;
	
	if (type && type.toLowerCase() == 'refresh') { // empty unless this is a refresh
		this.scrollToTop();
		this.markAllAsRead();
	} else if (type && type.toLowerCase() == 'loadmore') {
		this.markAllAsRead();
	} else {
		this.clear();		
	}
	
	if (sch.isString(e)) {
		search_string = e;
	} else if (e.value && sch.isString(e.value)) {
		search_string = e.value;
	}
	
	if (!page) {
		page = 1;
	}
	

	Mojo.Log.info("Searching for: %s", search_string);
	
	/*
		clear any existing results
	*/
	if (search_string !== this.lastQuery) {
		this.clear();
	}
	
	this.lastQuery = sch.fromHTMLSpecialChars(search_string);

	Mojo.Log.info('refresh()');

	if (thisA.isTopmostScene()) {
		thisA.markAllAsRead();
	}

	this.activateSpinner();
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);

	function getSearchTimeline(statusobj) {

		if ( statusobj.isInternetConnectionAvailable === true) {

			thisA.twit.search(
				thisA.lastQuery, // query
				null, // since_id
				100, // results_per_page
				page, // page
				null, // lang
				null, // , geocode
				function(data, searchinfo) { // onSuccess
					
					Mojo.Log.error('searchinfo: %j', searchinfo);
					Mojo.Log.error('data: %j', data);
					
					/*
						reverse the tweets for collection rendering (faster)
					*/
					var new_count = 0;
					var no_dupes  = [];
					if (sch.isArray(data)) {
						for (var i=0; i < data.length; i++) {
							if (!thisA.itemExistsInModel(data[i])) {
								new_count++;

								data[i].text = Spaz.makeItemsClickable(data[i].text);
								data[i].Spaz_is_new = true;

								no_dupes.push(data[i]);

								new_count++;
							}
						}
					}
					
					thisA.addItems(no_dupes);

					thisA.deactivateSpinner();

					/*
						show a banner if need be
					*/
					if (new_count > 0 && !thisA.isFullScreen && App.prefs.get('notify-searchresults')) {
						thisA.newSearchResultsBanner(new_count, thisA.lastQuery);
						// thisA.playAudioCue('newmsg');
					} else if (thisA.isFullScreen) {
						dump("I am not showing a banner! in "+thisA.controller.sceneElement.id);
					}

				},
				function(xhr, msg, exc) { // onFailure
					var err_msg = $L("There was an error loading the search results");
					thisA.displayErrorInfo(err_msg, null);
					thisA.deactivateSpinner();
				}
			);

		} else {
			thisA.showBanner('Not connected to Internet');
		}

	}

	/*
		only get data if we're connected
	*/
	this.checkInternetStatus( getSearchTimeline );

	

};


SearchTwitterAssistant.prototype.refresh = function(event) {
	var page = 1;
	
	if (event && sch.isNumber(event)) { page = event; }
	this.search(this.searchBoxModel.value, 'refresh', page);
};


SearchTwitterAssistant.prototype.loadMore = function(event) {
	if (this.search_more_page) {
		this.search_more_page++;
	} else {
		this.search_more_page = 2;
	}
	
	this.search(this.searchBoxModel.value, 'loadmore', this.search_more_page);
};



SearchTwitterAssistant.prototype.clear = function() {
	this.timeline_model.items = [];
	this.controller.modelChanged(this.timeline_model);
};


/*
	redefine addItems to work with list model
*/
SearchTwitterAssistant.prototype.addItems = function(new_items) {
	
	Mojo.Log.error("addItems");
	
	// now we have all the existing items from the model
	var model_items = this.timeline_model.items.clone();
	
	var model_item;
	for (var i=0; i < new_items.length; i++) {
		model_item = {
			'id':new_items[i].id,
			'data':sch.clone(new_items[i])
		};
		// add each item to the model
		model_items.push(model_item);
		
	}
	
	// sort, in reverse
	model_items.sort(function(a,b){
		return b.data.SC_created_at_unixtime - a.data.SC_created_at_unixtime; // newest first
	});
	
	// re-assign the cloned items back to the model object
	this.timeline_model.items = model_items;
	
	// this filters and updates the model
	this.controller.modelChanged(this.timeline_model);
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
};


SearchTwitterAssistant.prototype.renderItem = function(obj) {
    
    var html = '';

    Mojo.Timing.resume("timing_SearchTwitterAssistant.renderer");
	try {
		if (obj.SC_is_dm) {
			html = App.tpl.parseTemplate('dm', obj);
		} else {
			html = App.tpl.parseTemplate('tweet', obj);
		}
		Mojo.Timing.pause("timing_SearchTwitterAssistant.renderer");
		return html;
		
	} catch(err) {
		sch.error("There was an error rendering the object: "+sch.enJSON(obj));
		sch.error("Error:"+sch.enJSON(err));
		Mojo.Timing.pause("timing_SearchTwitterAssistant.renderer");
    	
		return '';
	}
    
};

SearchTwitterAssistant.prototype.itemExistsInModel = function(obj) {
	

	for (var i=0; i < this.timeline_model.items.length; i++) {
		if (this.timeline_model.items[i].id == obj.id) {
			Mojo.Log.info(obj.id +' exists in model');
			return true;
		}
	}
	Mojo.Log.info(obj.id +' does not exist in model');
	return false;
};



/**
 * loop through items in timeline_model and set Spaz_is_new = false, Spaz_is_read = true
 */
SearchTwitterAssistant.prototype.markAllAsRead = function() {
	
	Mojo.Log.error("markAllAsRead");
	
	Mojo.Timing.resume("timing_html_markAllAsRead");
	
	for (var i=0; i < this.timeline_model.items.length; i++) {
		this.timeline_model.items[i].data.Spaz_is_new = false;
		this.timeline_model.items[i].data.Spaz_is_read = true;
	}
	
	Mojo.Timing.pause("timing_html_markAllAsRead");
	
	Mojo.Log.error(Mojo.Timing.createTimingString("timing_html", "Updating HTML element times"));
	
	this.controller.modelChanged(this.timeline_model);
};


SearchTwitterAssistant.prototype.activateSpinner = function() {
	this.buttonWidget = this.controller.get('submit-search-button');
	this.buttonWidget.mojo.activate();
};

SearchTwitterAssistant.prototype.deactivateSpinner = function() {
	this.buttonWidget = this.controller.get('submit-search-button');
	this.buttonWidget.mojo.deactivate();
};

SearchTwitterAssistant.prototype.saveSearch = function(searchstr) {
	
	var thisA = this;

	jQuery(document).bind('create_saved_search_succeeded', {thisAssistant:this}, function(e, resp) {
		thisA.isSavedSearch = true;
		thisA.saved_id = resp.id;
		thisA.showBanner('Saved search '+searchstr, 'saved_search');
		thisA.fillStar(true);
		thisA.twit.getSavedSearches(); // this will force a refresh on any listeners
		jQuery(document).unbind('create_saved_search_succeeded');
	});
	
	this.twit.addSavedSearch(searchstr);
	
};


SearchTwitterAssistant.prototype.removeSearch = function(searchstr) {
	
	var thisA = this;

	jQuery(document).bind('destroy_saved_search_succeeded', {thisAssistant:this}, function(e, resp) {
		thisA.isSavedSearch = false;
		thisA.saved_id = null;
		thisA.showBanner('Removed saved search '+searchstr, 'saved_search');
		thisA.fillStar(false);
		thisA.twit.getSavedSearches(); // this will force a refresh on any listeners
		jQuery(document).unbind('destroy_saved_search_succeeded');
	});

	// alert(thisA.saved_id);
	this.twit.removeSavedSearch(thisA.saved_id);
	
};

SearchTwitterAssistant.prototype.fillStar = function(fill) {
	if (App.username && this.cmdMenuModel.items[2]) {
		if (fill) {
			this.cmdMenuModel.items[2].icon = 'favorite';
		} else {
			this.cmdMenuModel.items[2].icon = 'favorite-outline';
		}
		this.controller.modelChanged(this.cmdMenuModel);
	}
};

