function FriendsFollowersAssistant() {
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
FriendsFollowersAssistant.prototype.aboutToActivate = function(callback){
	callback.defer();
};
FriendsFollowersAssistant.prototype.setup = function() {
	var thisA = this;

    this.mode = 'friends';
    
	this.scroller = this.controller.getSceneScroller();
	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
	this.initTwit('DOM');

	this.setupCommonMenus({
		viewMenuItems: [
			{
			    toggleCmd:'friends-followers_friends',
				items:[
					{label: $L("Friends"),   command:'friends-followers_friends',   'width':160},
					{label: $L("Followers"), command:'friends-followers_followers', 'width':160}
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
				toggleCmd:'friends-followers',
				items: [
					{label:$L('My Timeline'), icon:'conversation', command:'filter-timeline-all', shortcut:'T', 'class':"palm-header left"},
					{label:'@',	icon:'at', command:'filter-timeline-replies'}, 
					{label:$L('DM'), icon: 'dms', secondaryIconPath:'', command:'filter-timeline-dms'},
					{label:$L('Favorites'), icon:'favorite', command:'favorites', shortcut:'F'},
					{label:$L('Friends and Followers'), icon:'friends-followers', command:'friends-followers', shortcut:'L'},
					{label:$L('Search'),    icon:'search', command:'search', shortcut:'S'}
				]
			},
			{}
		]
	});
	
	this.setCommand('friends-followers_friends', function(e) {
	    thisA.mode = 'friends';
	    thisA.resetState();
        thisA.refresh();
	});
	
	this.setCommand('friends-followers_followers', function(e) {
	    thisA.mode = 'followers';
	    thisA.resetState();
        thisA.refresh();
	});
		
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.setupInlineSpinner('activity-spinner-friends-followers');
	
	this.refreshOnActivate = true;
	
	
	this.controller.setupWidget("friends-followers-timeline",
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
	this.timeline_list = this.controller.get('friends-followers-timeline');
	
	/*
		more button
	*/
	jQuery('#more-friends-followers-button').bind(Mojo.Event.tap, function() {
		thisA.loadMore.call(thisA);
	});
	this.moreButtonAttributes = {};
	this.moreButtonModel = {
		"buttonLabel" : "More",
		"buttonClass" : 'Primary'
	};
	this.controller.setupWidget('more-friends-followers-button', this.moreButtonAttributes, this.moreButtonModel);
	
	this.listenForMetaTapScroll();
	
};

FriendsFollowersAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	// this.addPostPopup();


	var thisA = this; // for closures below
	
	var tts = App.prefs.get('timeline-text-size');
	this.setTimelineTextSize('#friends-followers-timeline', tts);
	
	
	/*
		Prepare for timeline entry taps
	*/
	this._handleTap = this.handleTap.bindAsEventListener(this);
	this.controller.listen('friends-followers-timeline', Mojo.Event.listTap, this._handleTap);
	

	/*
		start the friends-followers timeline 
	*/
	if (this.refreshOnActivate) {
		this.refresh();
		this.refreshOnActivate = false;
	}
	
	
	
};


FriendsFollowersAssistant.prototype.deactivate = function(event) {
	/*
		stop listening for timeline entry taps
	*/
    this.controller.stopListening('friends-followers-timeline', Mojo.Event.listTap, this._handleTap);
		
};

FriendsFollowersAssistant.prototype.cleanup = function(event) {
	jQuery('#more-friends-followers-button').unbind(Mojo.Event.tap);	
};


FriendsFollowersAssistant.prototype.getEntryElementByStatusId = function(id) {
	var el = jQuery('#friends-followers-timeline div.timeline-entry[data-status-id='+id+']', this.scroller).get(0);
	return el;
};


FriendsFollowersAssistant.prototype.refresh = function(event) {
	var thisA = this;
	
	var method_name = 'getFriendsList';
	
	var cursor = -1;
	if (event !== null && (sch.isNumber(event) || sch.isString(event))) {
		cursor = event;
	}
	
	Mojo.Log.error('CURSOR:%s', cursor);
	
	this.showInlineSpinner('activity-spinner-friends-followers', $L('Loading users…'));
	
	/*
		reset scrollstate to avoid white flash
	*/
	var scrollstate = this.scroller.mojo.getState();
	this.scroller.mojo.setState(scrollstate, false);
	
	if (this.mode === 'friends') {
	    method_name = 'getFriendsList';
	} else if (this.mode === 'followers') {
	    method_name = 'getFollowersList';
	} else {
	    Mojo.Log.error('Invalid mode:%s', this.mode);
	    return;
	}
	
	
	this.twit[method_name](
		'@'+App.username,
		cursor,
		function(data, cursor_obj) {
			
			/*
				if mode is wrong, don't add
			*/
			if ( (thisA.mode === 'friends' && method_name === 'getFollowersList') ) {
				thisA.hideInlineSpinner('activity-spinner-friends-followers');
				return;
			} else if ( (thisA.mode === 'followers' && method_name === 'getFriendsList') ) {
				thisA.hideInlineSpinner('activity-spinner-friends-followers');
				return;
			}
			
			if (sch.isArray(data)) {
			
                // data = data.reverse();
				var no_dupes = [];
			
				for (var i=0; i < data.length; i++) {
                    // Mojo.Log.error('data[i]: %s', data[i].id);
					/*
						only add if it doesn't already exist
					*/
					if (!thisA.itemExistsInModel(data[i])) {
						App.Tweets.saveUser(data[i]);
						no_dupes.push(data[i]);
					}
				
				};
			    
			    Mojo.Log.error('no_dupes.length:%s', no_dupes.length);
			    
				thisA.addItems(no_dupes);
			
			}
			
			if (cursor_obj && cursor_obj.next) {
			    thisA.friends_more_cursor = cursor_obj.next;
			}
			
			thisA.hideInlineSpinner('activity-spinner-friends-followers');
		},
		function(xhr, msg, exc) {
			Mojo.Log.error('EROROR in getFriends');
			Mojo.Log.error("%j , %j , %j", xhr, msg, exc);
			
			var err_msg = $L("There was an error retrieving users");
			thisA.displayErrorInfo(err_msg, null);

			/*
				Update relative dates
			*/
			thisA.hideInlineSpinner('activity-spinner-friends-followers');
		}
	);
	
};

FriendsFollowersAssistant.prototype.loadMore = function(event) {
    
    // if (this.timeline_model && this.timeline_model.items && this.timeline_model.items.length) {
    //     this.friends_more_cursor = this.timeline_model.items[this.timeline_model.items.length-1].id;
    // }
    Mojo.Log.error('this.friends_more_cursor: %s', this.friends_more_cursor);
    	
	this.refresh(this.friends_more_cursor);
};


/*
	redefine addItems to work with list model
*/
FriendsFollowersAssistant.prototype.addItems = function(new_items) {
	
	// now we have all the existing items from the model
	var model_items = this.timeline_model.items.clone();
	
	var model_item;
	for (var i=0; i < new_items.length; i++) {
		model_item = {
			'id':new_items[i].id,
			'created':new_items[i].SC_created_at_unixtime,
			'data':sch.clone(new_items[i])
		};
		// add each item to the model
		model_items.push(model_item);
	}
	
	// sort
    // model_items.sort(function(a,b){
    //     Mojo.Log.error('a.created %s, b.created %s', a.created, b.created);
    //     return a.created - b.created; // newest first
    // });
	
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


FriendsFollowersAssistant.prototype.renderItem = function(obj) {
    
    var html = '';

    Mojo.Timing.resume("timing_friends-followers-timeline.renderer");
	try {
		html = App.tpl.parseTemplate('follower_row', obj);
		Mojo.Timing.pause("timing_friends-followers-timeline.renderer");
		return html;
		
	} catch(err) {
		sch.error("There was an error rendering the object: "+sch.enJSON(obj));
		sch.error("Error:"+sch.enJSON(err));
		Mojo.Timing.pause("timing_friends-followers-timeline.renderer");
    	
		return '';
	}
    
};


FriendsFollowersAssistant.prototype.itemExistsInModel = function(obj) {
	
	for (var i=0; i < this.timeline_model.items.length; i++) {
		if (this.timeline_model.items[i].id == obj.id) {
			sch.error(obj.id +' exists in model');
			return true;
		}
	}
	sch.error(obj.id +' does not exist in model');
	return false;
};

FriendsFollowersAssistant.prototype.handleTap = function(event) {
    var userobj = event.item.data;
	Mojo.Controller.stageController.pushScene('user-detail', { 'userobj' : userobj });
};

FriendsFollowersAssistant.prototype.resetState = function() {
    this.timeline_model.items = [];
    this.controller.modelChanged(this.timeline_model);
    this.friends_more_cursor = -1;
};
