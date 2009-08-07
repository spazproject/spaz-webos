function FavoritesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}

FavoritesAssistant.prototype.setup = function() {

	this.scroller = this.controller.getSceneScroller();
	this.initAppMenu({ 'items':loggedin_appmenu_items });
	this.initTwit('DOM');

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("Favorites"), command:'scroll-top', 'class':"palm-header left", width:320}				
				]
			}

		],
		cmdMenuItems: [
			{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
			{
				toggleCmd:'IGNORE',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
					{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'IGNORE', shortcut:'F', 'class':"palm-header left"},
					{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'}
				]
			},
			{label:$L('Refresh'),   icon:'sync', command:'refresh', shortcut:'R'}					
		]
	});
	
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.setupInlineSpinner('activity-spinner-favorites');
	
	this.refreshOnActivate = true;
};

FavoritesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// this.addPostPopup();


	var thisA = this; // for closures below
	
	var tts = sc.app.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#favorites-timeline', tts);
	
	

	
	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('#favorites-timeline');

	/*
		set up the public timeline
	*/
	this.favtl   = new SpazTimeline({
		'timeline_container_selector' :'#favorites-timeline',
		'entry_relative_time_selector':'span.date',
		
		'success_event':'new_favorites_timeline_data',
		'failure_event':'error_favorites_timeline_data',
		'event_target' :document,
		
		'refresh_time':1000*3600,
		'max_items':50,

		'request_data': function() {
			sc.helpers.markAllAsRead('#favorites-timeline div.timeline-entry');
			thisA.showInlineSpinner('activity-spinner-favorites', 'Loading favorite tweets…');
			thisA.twit.getFavorites();
		},
		'data_success': function(e, data) {
			var data = data.reverse();
			var no_dupes = [];
			
			for (var i=0; i < data.length; i++) {
				
				/*
					only add if it doesn't already exist
				*/
				if (jQuery('#favorites-timeline div.timeline-entry[data-status-id='+data[i].id+']').length<1) {
					
					sc.app.Tweets.save(data[i]);
					data[i].text = Spaz.makeItemsClickable(data[i].text);
					no_dupes.push(data[i]);
				}
				
			};
			
			thisA.favtl.addItems(no_dupes);
			sc.helpers.markAllAsRead('#favorites-timeline div.timeline-entry'); // favs are never "new"
			sc.helpers.updateRelativeTimes('#favorites-timeline div.timeline-entry span.date', 'data-created_at');
			thisA.hideInlineSpinner('activity-spinner-favorites');
		},
		'data_failure': function(e, error_obj) {
			// error_obj.url
			// error_obj.xhr
			// error_obj.msg

			var err_msg = $L("There was an error retrieving your favorites");
			thisA.displayErrorInfo(err_msg, error_obj);

			/*
				Update relative dates
			*/
			sch.updateRelativeTimes('#favorites-timeline>div.timeline-entry .meta>.date', 'data-created_at');
			thisA.hideInlineSpinner('activity-spinner-favorites');
		},
		'renderer': function(obj) {
			return sc.app.tpl.parseTemplate('tweet', obj);
			
		}
	});
	
	/*
		start the favs timeline 
	*/
	if (this.refreshOnActivate) {
		this.favtl.start();
		this.refreshOnActivate = false;
	}
	

	
};


FavoritesAssistant.prototype.deactivate = function(event) {
	
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('#public-timeline');
	
	/*
		unbind and stop refresher for public timeline
	*/
	this.favtl.cleanup();
	
	
};

FavoritesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

FavoritesAssistant.prototype.getEntryElementByStatusId = function(id) {
	var el = jQuery('#favorites-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
};


FavoritesAssistant.prototype.refresh = function(event) {
	this.favtl.refresh();
};

// FavoritesAssistant.prototype.getData = function() {
// 	sc.helpers.markAllAsRead('#favorites-timeline>div.timeline-entry');
// 	this.showInlineSpinner('activity-spinner-favorites', 'Loading favorite tweets…');
// 	
// 	this.twit.getFavorites();
// };