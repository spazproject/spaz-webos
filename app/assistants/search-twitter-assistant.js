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
	
	sc = Mojo.Controller.getAppController().assistant.sc;
	
	if (args && args.searchterm) {
		this.passedSearch = args.searchterm;
	}
	if (args && args.lightweight) {
		/*
			we may be in a new stage, so need to init prefs if they don't exist
		*/
		
		this.lightweight = true;
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
	
	this.initTwit();
	
	this.initAppMenu();
	
	this.trackStageActiveState();
	
	if (this.lightweight) {
		this.setupCommonMenus({
			cmdMenuItems: [
				{},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
			
		});
	} else {
		this.setupCommonMenus({
			cmdMenuItems: [
				{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
				{
					toggleCmd:'IGNORE',
					items: [
						{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
						{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
						{label:$L('Search'),      icon:'search', command:'IGNORE', shortcut:'S', 'class':"palm-depressed selected"},
					]
				},
				{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
			]
		});
	}

	this.scroller = this.controller.getSceneScroller();
	
	
	
	this.searchBoxAttr = {
		"hintText":	      'Enter search terms',
		"focusMode":      Mojo.Widget.focusSelectMode,
		"fieldName":'search-twitter',
		"changeOnKeyPress": true
	};
	this.searchBoxModel = {
		'value':     '',
		'disabled':  false
	}
	this.controller.setupWidget('search-twitter-textfield', this.searchBoxAttr, this.searchBoxModel);

	Mojo.Event.listenForFocusChanges($('search-twitter-textfield'), this.searchboxFocusChange.bind(this));

	jQuery('#submit-search-button').bind(Mojo.Event.tap, function() {
		thisA.search.call(thisA, thisA.searchBoxModel.value);
	});
	
	this.searchButtonAttributes = {
		type: Mojo.Widget.activityButton
	};
	this.searchButtonModel = {
		buttonLabel : "Search",
		buttonClass: 'Primary'
	};
	
	this.controller.setupWidget('submit-search-button', this.searchButtonAttributes, this.searchButtonModel);

	// this.refresh();

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
	
	// this.addPostPopup();
	
	
	var thisA = this; // for closures below
	
	jQuery().bind('error_search_timeline_data', { thisAssistant:this }, function(e, error_obj) {
		// error_obj.url
		// error_obj.xhr
		// error_obj.msg
		
		var error_msg = $L("There was an error retrieving search results");
		thisA.displayErrorInfo(error_msg, error_obj);
		
		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#search-timeline>div.timeline-entry .meta>.date', 'data-created_at');
		// e.data.thisAssistant.hideInlineSpinner('#search-spinner-container');
		e.data.thisAssistant.deactivateSpinner();
		e.data.thisAssistant.startRefresher();
	});
	
	jQuery().bind('new_search_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		/*
			Check to see if the returned query matches what we are using. If not, ignore.
		*/

		/*
			reverse the tweets for collection rendering (faster)
		*/
		var rendertweets = tweets;
		var new_count = 0;
		jQuery.each( rendertweets, function() {
			
			if (!thisA.getEntryElementByStatusId(this.id)) {
				new_count++;
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

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('#search-timeline>div.timeline-entry .meta>.date', 'data-created_at');
		// e.data.thisAssistant.hideInlineSpinner('#search-spinner-container');
		e.data.thisAssistant.deactivateSpinner();
		e.data.thisAssistant.startRefresher();
		
		if (new_count > 0 && !thisA.isFullScreen) {
			thisA.newSearchResultsBanner(new_count, e.data.thisAssistant.lastQuery);
			thisA.playAudioCue('newmsg');
		} else if (thisA.isFullScreen) {
			dump("I am not showing a banner! in "+thisA.controller.sceneElement.id);
		}
		
	});
	
	
	jQuery().bind('search_timeline_refresh', { thisAssistant:this }, function(e) {
		sch.markAllAsRead('#search-timeline>div.timeline-entry');
		e.data.thisAssistant.refresh();
	});
	
	jQuery().bind('search_twitter_refresh', { thisAssistant:this }, function(e) {
		e.data.thisAssistant.startRefresher();
	});



	jQuery('#search-timeline div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var jqtarget = jQuery(e.target);

		e.stopImmediatePropagation();
		
		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			var userid = jQuery(this).attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
			return;
			
		} else if (jqtarget.is('.username.clickable')) {
			var userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
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
	
	
	// /*
	// 	listen for clicks on user avatars
	// */
	// jQuery('div.timeline-entry>.user', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var userid = jQuery(this).attr('data-user-screen_name');
	// 	Mojo.Controller.stageController.pushScene('user-detail', userid);
	// 	e.stopImmediatePropagation();
	// });
	// 
	// jQuery('.username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var userid = jQuery(this).attr('data-user-screen_name');
	// 	Mojo.Controller.stageController.pushScene('user-detail', userid);
	// 	e.stopImmediatePropagation();
	// });
	// 
	// jQuery('.hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var hashtag = jQuery(this).attr('data-hashtag');
	// 	
	// 	if (thisA.lightweight) {
	// 		var scene_type = 'lightweight';
	// 	};
	// 	
	// 	thisA.searchFor('#'+hashtag, scene_type);
	// 	e.stopImmediatePropagation();
	// });
	// 
	// jQuery('div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var statusid = jQuery(this).attr('data-status-id');
	// 	Mojo.Controller.stageController.pushScene('message-detail', statusid);
	// 	e.stopImmediatePropagation();
	// });
	// 
	// jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	var jqtarget = jQuery(e.target);		
	// 	if (!jqtarget.is('div.timeline-entry .text') && !jqtarget.is('div.timeline-entry')) {
	// 		return;
	// 	}
	// 	var statusid = jQuery(this).attr('data-status-id');
	// 	Mojo.Controller.stageController.pushScene('message-detail', statusid);
	// });

		
}


SearchTwitterAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	Mojo.Event.stopListening($('submit-search-button'), Mojo.Event.tap, this.search);	
	
	jQuery().unbind('new_search_timeline_data');
	jQuery().unbind('error_search_timeline_data');
	
	// jQuery('div.timeline-entry>.user', this.scroller).die(Mojo.Event.tap);
	// jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	// jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	// jQuery('div.timeline-entry a[href]', this.scroller).die(Mojo.Event.tap);
	jQuery('#search-timeline div.timeline-entry', this.scroller).die(Mojo.Event.tap);

	
	// this.removePostPopup();
}

SearchTwitterAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	jQuery().unbind('search_timeline_refresh');
}



SearchTwitterAssistant.prototype.search = function(e, type) {
	dump("search called");
	
	if (type && type.toLowerCase() !== 'refresh') { // empty unless this is a refresh
		jQuery('#search-timeline').empty();
		dump('Emptied #search-timeline');
	} else {
		sch.markAllAsRead('#search-timeline>div.timeline-entry');
		dump('Marked all as read in #search-timeline>div.timeline-entry');
	}
		
	if (sch.isString(e)) {
		dump("Searching for:", e);
		this.lastQuery = e;
		this.twit.search(e);
		/*
			clear any existing results
		*/
		
		this.activateSpinner();
		
	} else if (e.value) {
		this.lastQuery = e.value;
		this.twit.search(e.value);		
		/*
			clear any existing results
		*/

		this.activateSpinner();
		
		// jQuery('#submit-search-button').hide();
	}
}


SearchTwitterAssistant.prototype.refresh = function() {
	dump('Stopping refresher');
	this.stopRefresher();
	this.search(this.searchBoxModel.value, 'refresh');
};




SearchTwitterAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	this.stopRefresher(); // in case one is already running
	
	var time = sc.app.prefs.get('network-searchrefreshinterval');
	
	if (time > 0) {
		this.refresher = setInterval(function() {
				jQuery().trigger('search_timeline_refresh');
			}, time
		)
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

SearchTwitterAssistant.prototype.searchboxFocusChange = function(el) {
	if (el) { // focusIN -- something gained focus
		// jQuery('#submit-search-button').show('blind');
	} else { // focusOut -- blur
		// jQuery('#submit-search-button').hide('blind');
	}
};

SearchTwitterAssistant.prototype.getEntryElementByStatusId = function(id) {
	
	var el = jQuery('#search-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	
	return el;
	
};

SearchTwitterAssistant.prototype.activateSpinner = function() {
	this.buttonWidget = this.controller.get('submit-search-button');
	this.buttonWidget.mojo.activate();
}

SearchTwitterAssistant.prototype.deactivateSpinner = function() {
	this.buttonWidget = this.controller.get('submit-search-button');
	this.buttonWidget.mojo.deactivate();
}



