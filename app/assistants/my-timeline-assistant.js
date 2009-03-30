/**
 * events raised here:
 * 'my_timeline_refresh' 
 */


function MyTimelineAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	if (argFromPusher && argFromPusher.firstload === true) {
		console.debug();
		this.clearTimelineHTMLCache();
	}
	
	
	/*
		this property will hold the setInterval return
	*/
	this.refresher = null;
}



MyTimelineAssistant.prototype.setup = function() {
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.initAppMenu();

	this.initTwit();


	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					{label: sc.app.username, command:'scroll-top'},
					{label: $L('Filter timeline'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
				]
			},
			{
				items: [
					{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
					{label:$L('Update'),   icon:'sync', command:'refresh', shortcut:'R'}					
				]
			}
			
		],
		cmdMenuItems: [{ items:
			[
				{},
				// {label:$L('Home'),        iconPath:'images/theme/menu-icon-home.png', command:'home', shortcut:'H'},
				{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T', disabled:true},
				{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
				{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'},
				// {label:$L('Followers'),   icon:'remove-vip', command:'followers', shortcut:'L'},
				{}
			]
		}]
	});

	this.scroller = this.controller.getSceneScroller();


	
	
	
	/* setup widgets here */
	
	
	
	
	/* add event handlers to listen to events from widgets */

	this.loadTimelineHTML();
	
	
	/*
		We use this to delay the request until activation
	*/
	this.loadOnActivate = true;
}



MyTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	this.addPostPopup();

	
	var thisA = this; // for closures
	
	/*
		Listen for error
	*/
	jQuery().bind('error_combined_timeline_data', { thisAssistant:this }, function(e, error_array) {
		dump('error_combined_timeline_data - response:');
		dump(error_array);
		// e.data.thisAssistant.spinnerOff();
		thisA.hideInlineSpinner('#my-timeline');
		thisA.startRefresher();

		var err_msg = $L("There were errors retrieving your combined timeline");
		thisA.displayErrorInfo(err_msg, error_array);
		
		// var error_info;
		// var error_html = '';
		// for (var i = 0; i < error_array.length; i++) {
		// 	error_info  = thisA.processAjaxError(error_obj);
		// 	if (error_html.length>0) {
		// 		error_html += '<hr>';
		// 	}
		// 	error_html += sc.app.tpl('error_info', error_info);
		// }
		// 
		// Mojo.Controller.errorDialog($L("There were errors retrieving your combined timeline")+error_html);
	});
	


	/*
		Get combined timeline data
	*/
	jQuery().bind('new_combined_timeline_data', { thisAssistant:this }, function(e, tweets) {
		
		/*
			If there are new tweets, process them
		*/
		if (tweets && tweets.length>0) {

			var rendertweets = tweets;
			
			Mojo.Timing.resume('my_timeline_render');
			jQuery.each( rendertweets, function() {
				
				
				
				/*
					save this tweet to Depot
				*/
				// sc.app.Tweets.save(this);
				
				
				/*
					check to see if this item exists
				*/
				if (!e.data.thisAssistant.getEntryElementByStatusId(this.id)) {
					
					this.text = makeItemsClickable(this.text);

					/*
						Render the tweet
					*/
					if (this.SC_is_dm) {
						var itemhtml = sc.app.tpl.parseTemplate('dm', this);
					} else {
						var itemhtml = sc.app.tpl.parseTemplate('tweet', this);
					}

					/*
						make jQuery obj
					*/
					var jqitem = jQuery(itemhtml);

					/*
						attach data object to item html
					*/
					jqitem.data('item', this);

					if (this.SC_is_reply) {
						jqitem.addClass('reply');
					}

					if (this.SC_is_dm) {
						jqitem.addClass('dm');
					}


					/*
						put item on timeline
					*/
					jQuery('#my-timeline', e.data.thisAssistant.scroller).prepend(jqitem);
				} else {
					dump('Tweet ('+this.id+') already is in timeline');
				}
				
			});
			Mojo.Timing.pause('my_timeline_render');
			Mojo.Log.info(Mojo.Timing.reportTiming("my_timeline_render", "my_timeline_render -- \n"));
			
			e.data.thisAssistant.scrollToNew();
			
		} else {
			dump("no new tweets");
		}

		/*
			remove extra items
		*/
		sch.removeExtraElements('#my-timeline>div.timeline-entry', 300);

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('div.timeline-entry>.status>.meta>.date', 'data-created_at');
		
		/*
			re-apply filtering
		*/
		e.data.thisAssistant.filterTimeline();
		
		var new_count = jQuery('#my-timeline>div.timeline-entry.new:visible').length;
		
		if (new_count > 0) {
			e.data.thisAssistant.newMsgBanner(new_count);
			e.data.thisAssistant.playAudioCue('newmsg');		
		}

		// e.data.thisAssistant.spinnerOff();
		e.data.thisAssistant.hideInlineSpinner('#my-timeline');
		e.data.thisAssistant.startRefresher();
		
		/*
			Save this in case we need to load from cache
		*/
		e.data.thisAssistant.saveTimelineHTML();
	});

	
	jQuery().bind('my_timeline_refresh', { thisAssistant:this }, function(e) {
		e.data.thisAssistant.refresh();
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
		var status_id = jQuery(this).attr('data-status-id');
		var isdm = false;
		var status_obj = null;
		
		dump("ISDM:"+jQuery(this).parent().parent().hasClass('dm'));
		
		if (jQuery(this).parent().parent().hasClass('dm')) {
			isdm = true;
			status_obj = sch.deJSON( jQuery(this).parent().parent().children('.entry-json').text() );
		}
		Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
	});
	
	// jQuery('a[href]', this.scroller).live(Mojo.Event.tap, function(e) {
	// 	e.preventDefault();
	// 	var href = jQuery(this).attr('href');
	// 	Mojo.Controller.stageController.pushScene('webview', {'url':href});
	// 	return false;
	// });
	
	
	// jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.dragStart, function(e) {
	// 	alert('dragStart!');
	// });
	// jQuery('div.timeline-entry', this.scroller).live(Mojo.Event.hold, function(e) {
	// 	alert('hold!');
	// });
	

	if (this.loadOnActivate) {
		/*
			Make request to Twitter
		*/
		this.getData();

		this.startRefresher();
		
		/*
			Disable this so we don't load on next activation
		*/
		this.loadOnActivate = false;
	}
	
}


MyTimelineAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.removePostPopup();
	
	jQuery().unbind('error_user_timeline_data');
	jQuery().unbind('new_combined_timeline_data');
	jQuery().unbind('update_succeeded');
	jQuery().unbind('update_failed');
	jQuery().unbind('my_timeline_refresh');
	
	jQuery('div.timeline-entry>.user', this.scroller).die(Mojo.Event.tap);
	jQuery('.username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('.hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('a[href]', this.scroller).die(Mojo.Event.tap);
	
	
}

MyTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.stopRefresher();
}


MyTimelineAssistant.prototype.loadTimelineHTML = function() {
	Mojo.Log.info('Timeline Caching disabled for now');
	// /*
	// 		load the cached html stack
	// 	*/
	// 	this.mojoDepot = new Mojo.Depot({
	// 		name:'SpazDepot',
	// 		replace:false
	// 	});
	// 	
	// 	this.mojoDepot.simpleGet('SpazMyTimelineHTMLCache_'+this.twit.getUsername(),
	// 		function(html) {
	// 			jQuery('#my-timeline').html(html);
	// 		},
	// 		function() { dump('HTML Cache load failed') }
	// 	);
	
};

MyTimelineAssistant.prototype.saveTimelineHTML = function() {
	Mojo.Log.info('Timeline Caching disabled for now');
	// /*
	// 	save the current html stack
	// */
	// var timeline_html = '';
	// 
	// jQuery('#my-timeline div.timeline-entry').show().each(function() {
	// 	if (this.outerHTML) {
	// 		timeline_html += this.outerHTML;
	// 	}
	// });
	// 
	// this.mojoDepot = new Mojo.Depot({
	// 	name:'SpazDepot',
	// 	replace:false
	// });
	// 
	// this.mojoDepot.simpleAdd('SpazMyTimelineHTMLCache_'+this.twit.getUsername(), timeline_html,
	// 	function() { dump('HTML Cache Saved') },
	// 	function() { dump('HTML Cache save failed') }
	// );
	
};

MyTimelineAssistant.prototype.clearTimelineHTMLCache = function() {
	Mojo.Log.info('Timeline Caching disabled for now');
	// this.mojoDepot = new Mojo.Depot({
	// 	name:'SpazDepot',
	// 	replace:false
	// });
	// 
	// this.mojoDepot.simpleAdd('SpazMyTimelineHTMLCache_'+this.twit.getUsername(), '',
	// 	function() { dump('HTML Cache Saved') },
	// 	function() { dump('HTML Cache save failed') }
	// );
}


// MyTimelineAssistant.prototype.initTwit = function() {
// };


MyTimelineAssistant.prototype.getEntryElementByStatusId = function(id) {
	
	var el = jQuery('#my-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	
	return el;
	
};




MyTimelineAssistant.prototype.getData = function() {
	sc.helpers.markAllAsRead('#my-timeline>div.timeline-entry');
	this.showInlineSpinner('#my-timeline', 'Looking for new tweets…');
	
	this.twit.getCombinedTimeline();
};


MyTimelineAssistant.prototype.refresh = function(e) {
	this.stopRefresher();
	this.getData();
};




MyTimelineAssistant.prototype.startRefresher = function() {
	dump('Starting refresher');
	/*
		Set up refresher
	*/
	
	this.stopRefresher(); // in case one is already running
	
	this.refresher = setInterval(function() {
			jQuery().trigger('my_timeline_refresh');
		}, sc.app.prefs.get('network-refreshinterval')
	);
}

MyTimelineAssistant.prototype.stopRefresher = function() {
	dump('Stopping refresher');
	/*
		Clear refresher
	*/
	clearInterval(this.refresher);
}
