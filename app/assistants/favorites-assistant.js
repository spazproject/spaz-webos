function FavoritesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
}
FavoritesAssistant.prototype.aboutToActivate = function(callback){
	callback.defer();
};
FavoritesAssistant.prototype.setup = function() {
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
	this.initTwit('DOM');

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items:[
					{label: $L("Favorites"), command:'scroll-top', 'class':"palm-header left", width:260},
					{label: $L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}
					
				]
			}

		],
		cmdMenuItems: [
			{},
			{
				/*
					So we don't get the hard-to-see disabled look on the selected button,
					we make the current toggle command "IGNORE", which will not trigger an action
				*/
				toggleCmd:'favorites',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'filter-timeline-all', shortcut:'T', 'class':"palm-header left"},
					{label:'@',	icon:'at', command:'filter-timeline-replies'}, 
					{label:$L('DM'), icon: 'dms', secondaryIconPath:'', command:'filter-timeline-dms'},
					{label:$L('Favorites'), iconPath:'images/theme/menu-icon-favorite.png', command:'favorites', shortcut:'F'},
					{label:$L('Friends and Followers'), iconPath:'images/theme/menu-icon-friends-followers.png', command:'friends-followers', shortcut:'L'},
					{label:$L('Search'),    icon:'search', command:'search', shortcut:'S'}
				]
			},
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
	this.timeline_list = this.controller.get('favorites-timeline');
	
	/*
		more button
	*/
	jQuery('#more-favs-button').bind(Mojo.Event.tap, function() {
		thisA.loadMore.call(thisA);
	});
	this.moreButtonAttributes = {};
	this.moreButtonModel = {
		"buttonLabel" : "More",
		"buttonClass" : 'Primary'
	};
	this.controller.setupWidget('more-favs-button', this.moreButtonAttributes, this.moreButtonModel);
	
};

FavoritesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// this.addPostPopup();


	var thisA = this; // for closures below
	
	var tts = App.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#favorites-timeline', tts);
	
	
	/*
		Prepare for timeline entry taps
	*/
	this.bindTimelineEntryTaps('favorites-timeline');
	
	this.bindScrollToRefresh();
	
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
	this.unbindTimelineEntryTaps('favorites-timeline');
	this.unbindScrollToRefresh();
		
};

FavoritesAssistant.prototype.cleanup = function(event) {
	jQuery('#more-favs-button').unbind(Mojo.Event.tap);	
};


FavoritesAssistant.prototype.getEntryElementByStatusId = function(id) {
	var el = jQuery('#favorites-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
};


FavoritesAssistant.prototype.refresh = function(event) {
	var thisA = this;
	
	var page = 0;
	if (event && sch.isNumber(event)) {
		page = event;
	}
	
	sc.helpers.markAllAsRead('#favorites-timeline div.timeline-entry');
	this.showInlineSpinner('activity-spinner-favorites', $L('Loading favorites…'));
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
	
	this.twit.getFavorites(
		page,
		null,
		function(data) {
			if (sch.isArray(data)) {
			
				data = data.reverse();
				var no_dupes = [];
			
				for (var i=0; i < data.length; i++) {
				
					/*
						only add if it doesn't already exist
					*/
					if (!thisA.itemExistsInModel(data[i])) {
					
						App.Tweets.save(data[i]);
						data[i].text = Spaz.makeItemsClickable(data[i].text);
						no_dupes.push(data[i]);
					}
				
				};
			
				thisA.addItems(no_dupes);
			
			}
			
			thisA.hideInlineSpinner('activity-spinner-favorites');
		},
		function(xhr, msg, exc) {
			Mojo.Log.error('EROROR in getFavorites');
			Mojo.Log.error("%j , %j , %j", xhr, msg, exc);
			
			var err_msg = $L("There was an error retrieving your favorites");
			thisA.displayErrorInfo(err_msg, null);

			/*
				Update relative dates
			*/
			thisA.hideInlineSpinner('activity-spinner-favorites');
		}
	);
	
};

FavoritesAssistant.prototype.loadMore = function(event) {
	if (this.faves_more_page) {
		this.faves_more_page++;
	} else {
		this.faves_more_page = 2;
	}
	
	this.refresh(this.faves_more_page);
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
			'data':sch.clone(new_items[i])
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
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
};


FavoritesAssistant.prototype.renderItem = function(obj) {
    
    var html = '';

    Mojo.Timing.resume("timing_favorites-timeline.renderer");
	try {
		if (obj.SC_is_dm) {
			html = App.tpl.parseTemplate('dm', obj);
		} else {
			html = App.tpl.parseTemplate('tweet', obj);
		}
		Mojo.Timing.pause("timing_favorites-timeline.renderer");
		return html;
		
	} catch(err) {
		sch.error("There was an error rendering the object: "+sch.enJSON(obj));
		sch.error("Error:"+sch.enJSON(err));
		Mojo.Timing.pause("timing_favorites-timeline.renderer");
    	
		return '';
	}
    
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
};