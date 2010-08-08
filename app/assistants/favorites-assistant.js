function FavoritesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}
FavoritesAssistant.prototype.aboutToActivate = function(callback){
	callback.defer();
};
FavoritesAssistant.prototype.setup = function() {

	this.scroller = this.controller.getSceneScroller();
	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
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
			{},
			{
				toggleCmd:'refresh',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
					{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'refresh', shortcut:'F', 'class':"palm-header left"},
					{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'}
				]
			},
			{},
			{},
			{}
		]
	});
	
	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.setupInlineSpinner('activity-spinner-favorites');
	
	this.refreshOnActivate = true;
	
	
	this.controller.setupWidget("favorites-timeline",
        this.timeline_attributes = {
            itemTemplate: 'timeline-entry',
            listTemplate: 'timeline-container',
            swipeToDelete: false,
            reorderable: false,
            hasNoWidgets: true
        },
        this.timeline_model = {
            items : [
                {id:0, html:'some html'}
            ]
        }
    );

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
	// maps list taps to item taps
	this.handleTimelineTap = this.handleTimelineTap.bindAsEventListener(this);
	this.controller.listen('favorites-timeline', Mojo.Event.listTap, this.handleTimelineTap);

	/*
		start the favs timeline 
	*/
	if (this.refreshOnActivate) {
		this.refresh();
		this.refreshOnActivate = false;
	}
	

	
};


FavoritesAssistant.prototype.deactivate = function(event) {
	/*
		stop listening for timeline entry taps
	*/
	this.unbindTimelineEntryTaps('#favorites-timeline');
	
	this.controller.stopListening('favorites-timeline', Mojo.Event.listTap, this.handleTimelineTap);
	
};

FavoritesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


FavoritesAssistant.prototype.handleTimelineTap = function(e) {
	jQuery('#favorites-timeline [data-status-id="'+e.item.id+'"]').trigger(Mojo.Event.tap);
};


FavoritesAssistant.prototype.getEntryElementByStatusId = function(id) {
	var el = jQuery('#favorites-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
};


FavoritesAssistant.prototype.refresh = function(event) {
	var thisA = this;
	
	sc.helpers.markAllAsRead('#favorites-timeline div.timeline-entry');
	this.showInlineSpinner('activity-spinner-favorites', 'Loading favorite tweets…');
	this.twit.getFavorites(
		null,
		null,
		function(data) {
			data = data.reverse();
			var no_dupes = [];
			
			for (var i=0; i < data.length; i++) {
				
				/*
					only add if it doesn't already exist
				*/
				if (!thisA.itemExistsInModel(data[i])) {
					
					sc.app.Tweets.save(data[i]);
					data[i].text = Spaz.makeItemsClickable(data[i].text);
					no_dupes.push(data[i]);
				}
				
			};
			
			thisA.addItems(no_dupes);
			sc.helpers.markAllAsRead('#favorites-timeline div.timeline-entry'); // favs are never "new"
			sc.helpers.updateRelativeTimes('#favorites-timeline div.timeline-entry span.date', 'data-created_at');
			thisA.hideInlineSpinner('activity-spinner-favorites');
		},
		function(xhr, msg, exc) {
			var err_msg = $L("There was an error retrieving your favorites");
			thisA.displayErrorInfo(err_msg, null);

			/*
				Update relative dates
			*/
			sch.updateRelativeTimes('#favorites-timeline>div.timeline-entry .meta>.date', 'data-created_at');
			thisA.hideInlineSpinner('activity-spinner-favorites');
		}
	);
	
};


/*
	redefine addItems to work with list model
*/
FavoritesAssistant.prototype.addItems = function(new_items) {
	
	// now we have all the existing items from the model
	var model_items = this.timeline_model.items.clone();
	
	var model_item;
	for (var i=0; i < new_items.length; i++) {
		model_item = {
			'id':new_items[i].id,
			'html':sc.app.tpl.parseTemplate('tweet', new_items[i])
		};
		// add each item to the model
		model_items.push(model_item);
		
	}
	
	// sort, in reverse
	model_items.sort(function(a,b){
		return b.id - a.id; // newest first
	});
	
	// re-assign the cloned items back to the model object
	this.timeline_model.items = model_items;
	
	// tell the controller it's changed to update list widget
	this.controller.modelChanged(this.timeline_model);
};

FavoritesAssistant.prototype.itemExistsInModel = function(obj) {
	
	for (var i=0; i < this.timeline_model.items.length; i++) {
		if (this.timeline_model.items[i].id == obj.id) {
			sch.error(obj.id +' exists in model');
			return true;
		}
	}
	sch.error(obj.id +' does not exist in model');
	return false;
};

/**
 * oh my god this is probably deadly for performance 
 */
FavoritesAssistant.prototype.markAllAsRead = function() {
	for (var i=0; i < this.timeline_model.items.length; i++) {
		var new_element = jQuery(this.timeline_model.items[i].html).removeClass('new').get(0);
		if (new_element) {
			this.timeline_model.items[i].html = new_element.outerHTML;
		}
	}
	this.controller.modelChanged(this.timeline_model);
}