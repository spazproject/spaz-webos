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
	if (sc.app.username && sc.app.password) {
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
				{label:$L('Save search'), iconPath:'images/theme/menu-icon-favorite-outline.png', command:'save-search', shortcut:'S'},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
		});
		
		this.initAppMenu({ 'items':loggedin_appmenu_items });	
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
		thisA.search.call(thisA, thisA.searchBoxModel.value);
	});
	
	this.searchButtonAttributes = {
		"type": Mojo.Widget.activityButton
	};
	this.searchButtonModel = {
		"buttonLabel" : "Search",
		"buttonClass" : 'Primary'
	};
	
	this.controller.setupWidget('submit-search-button', this.searchButtonAttributes, this.searchButtonModel);

	// this.refresh();
	
	if (this.isSavedSearch) {
		this.fillStar(true);
	} else {
		this.fillStar(false);
	}

};




SearchTwitterAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	if (event && event.searchterm) {
		this.passedSearch = event.searchterm;
	}
	
	
	if (this.passedSearch) {
		this.searchBoxModel.value = this.passedSearch.replace(/&quot;/gi, '"'); // convert the entities back into "'s
		this.controller.modelChanged(this.searchBoxModel);
		this.search(this.passedSearch);
		this.passedSearch = null; // eliminate this so it isn't used anymore
	}
	
	
	var thisA = this; // for closures below
	
	var tts = sc.app.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#search-timeline', tts);
	
	
	jQuery().bind('error_search_timeline_data', { thisAssistant:this }, function(e, error_obj) {
		
		var error_msg = $L("There was an error retrieving search results");
		thisA.displayErrorInfo(error_msg, error_obj);
		
		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#search-timeline>div.timeline-entry .meta>.date', 'data-created_at');
		e.data.thisAssistant.deactivateSpinner();
		e.data.thisAssistant.startRefresher();
	});
	
	jQuery().bind('new_search_timeline_data', { thisAssistant:this }, function(e, data) {
		
		/*
			Check to see if the returned query matches what we are using. If not, ignore.
		*/

		/*
			reverse the tweets for collection rendering (faster)
		*/
		var rendertweets = data[0];
		var searchinfo   = data[1];
		var new_count = 0;
		if (rendertweets && rendertweets.length > 0) {
			jQuery.each( rendertweets, function() {

				if (!thisA.getEntryElementByStatusId(this.id)) {
					new_count++;
					this.text = Spaz.makeItemsClickable(this.text);

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
						save this tweet to Depot
					*/
					sc.app.Tweets.save(this);


					/*
						put item on timeline
					*/
					jQuery('#search-timeline').prepend(jqitem);
				}
			});

			sch.removeExtraElements('#search-timeline>div.timeline-entry', sc.app.prefs.get('timeline-maxentries'));
			
		}

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#search-timeline>div.timeline-entry .meta>.date', 'data-created_at');
		e.data.thisAssistant.deactivateSpinner();
		e.data.thisAssistant.startRefresher();
		
		/*
			show a banner if need be
		*/
		// alert(new_count);
		// alert(thisA.isFullScreen);
		// alert(sc.app.prefs.get('notify-searchresults'));
		if (new_count > 0 && !thisA.isFullScreen && sc.app.prefs.get('notify-searchresults')) {
			thisA.newSearchResultsBanner(new_count, e.data.thisAssistant.lastQuery);
			// thisA.playAudioCue('newmsg');
		} else if (thisA.isFullScreen) {
			dump("I am not showing a banner! in "+thisA.controller.sceneElement.id);
		}
		
	});
	
	
	jQuery().bind('search_timeline_refresh', { thisAssistant:this }, function(e) {
		sch.markAllAsRead('#search-timeline>div.timeline-entry');
		e.data.thisAssistant.refresh();
	});
	
	jQuery('#search-timeline div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var jqtarget = jQuery(e.target);

		e.stopImmediatePropagation();
		
		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			var userid = jQuery(this).attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;
			
		} else if (jqtarget.is('.username.clickable')) {
			var userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;
			
		} else if (jqtarget.is('.hashtag.clickable')) {
			var hashtag = jqtarget.attr('data-hashtag');
			thisA.searchFor('#'+hashtag);
			return;
			
		} else if (jqtarget.is('div.timeline-entry .meta')) {
			var status_id = jqtarget.attr('data-status-id');
			var isdm = false;
			var status_obj = null;

			if (jqtarget.parent().parent().hasClass('dm')) {
				isdm = true;
			}

			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
			
		} else if (jqtarget.is('div.timeline-entry a[href]')) {
			return;

		} else {
			var status_id = jQuery(this).attr('data-status-id');
			var isdm = false;
			var status_obj = null;

			if (jQuery(this).hasClass('dm')) {
				isdm = true;
			}
			
			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
		}
	});
	
	
	this.listenForEnter('search-twitter-textfield', function() {
		this.controller.get('submit-search-button').mojo.activate();
		this.search(this.searchBoxModel.value);
	});

		
};


SearchTwitterAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	jQuery().unbind('new_search_timeline_data');
	jQuery().unbind('error_search_timeline_data');
	jQuery().unbind('search_timeline_refresh');	
	jQuery('#search-timeline div.timeline-entry', this.scroller).die(Mojo.Event.tap);
};


SearchTwitterAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */

	jQuery('#submit-search-button').unbind(Mojo.Event.tap);
	
	this.stopListeningForEnter('search-twitter-textfield');
	
	this.stopTrackingStageActiveState();
	
};



SearchTwitterAssistant.prototype.search = function(e, type) {
	dump("search called");
	
	if (type && type.toLowerCase() !== 'refresh') { // empty unless this is a refresh
		this.clear();
	} else {
		sch.markAllAsRead('#search-timeline>div.timeline-entry');
		dump('Marked all as read in #search-timeline>div.timeline-entry');
	}
		
	if (sch.isString(e)) {
		dump("Searching for:", e);
		
		/*
			clear any existing results
		*/
		if (e !== this.lastQuery) {
			this.clear();
		}
		
		this.lastQuery = sch.fromHTMLSpecialChars(e);
		this.twit.search(this.lastQuery);


		
		this.activateSpinner();
		
	} else if (e.value) {
		this.lastQuery = e.value;
		this.twit.search(e.value);		

		/*
			clear any existing results
		*/
		if (e.value !== this.lastQuery) {
			this.clear();
		}


		this.activateSpinner();
		
		// jQuery('#submit-search-button').hide();
	}
};


SearchTwitterAssistant.prototype.refresh = function() {
	dump('Stopping refresher');
	this.stopRefresher();
	this.search(this.searchBoxModel.value, 'refresh');
};

SearchTwitterAssistant.prototype.clear = function() {
	jQuery('#search-timeline').empty();
	dump('Emptied #search-timeline');
};


SearchTwitterAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	this.stopRefresher(); // in case one is already running
	
	var time = sc.app.prefs.get('network-searchrefreshinterval');
	
	if (time > 0) {
		this.refresher = setInterval(
			function() {
				jQuery().trigger('search_timeline_refresh');
			},
			time
		);
	} else {
		this.refresher = null;
	}
};

SearchTwitterAssistant.prototype.stopRefresher = function() {
	dump('Stopping refresher');
	/*
		Clear refresher
	*/
	clearInterval(this.refresher);
};

SearchTwitterAssistant.prototype.getEntryElementByStatusId = function(id) {	
	var el = jQuery('#search-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
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

	jQuery().bind('create_saved_search_succeeded', {thisAssistant:this}, function(e, resp) {
		thisA.isSavedSearch = true;
		thisA.saved_id = resp.id;
		thisA.showBanner('Saved search '+searchstr, 'saved_search');
		thisA.fillStar(true);
		thisA.twit.getSavedSearches(); // this will force a refresh on any listeners
		jQuery().unbind('create_saved_search_succeeded');
	});
	
	this.twit.addSavedSearch(searchstr);
	
};


SearchTwitterAssistant.prototype.removeSearch = function(searchstr) {
	
	var thisA = this;

	jQuery().bind('destroy_saved_search_succeeded', {thisAssistant:this}, function(e, resp) {
		thisA.isSavedSearch = false;
		thisA.saved_id = null;
		thisA.showBanner('Removed saved search '+searchstr, 'saved_search');
		thisA.fillStar(false);
		thisA.twit.getSavedSearches(); // this will force a refresh on any listeners
		jQuery().unbind('destroy_saved_search_succeeded');
	});

	// alert(thisA.saved_id);
	this.twit.removeSavedSearch(thisA.saved_id);
	
};

SearchTwitterAssistant.prototype.fillStar = function(fill) {
	if (fill) {
		this.cmdMenuModel.items[2].iconPath = 'images/theme/menu-icon-favorite.png';
	} else {
		this.cmdMenuModel.items[2].iconPath = 'images/theme/menu-icon-favorite-outline.png';
	}
	this.controller.modelChanged(this.cmdMenuModel);
};

