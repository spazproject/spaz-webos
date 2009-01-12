function FriendsTimelineAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}


FriendsTimelineAssistant.prototype.sceneTweets = [];

FriendsTimelineAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */

	/*
		Command menu at bottom of screen
	*/
	this.cmdMenuModel = {
		visible:true,
		items: [
			{label:$L('Compose'), icon:'compose', command:'compose', shortcut:'N'},
			{},
			{label:$L('Scroll to top'), icon:'up', command:'scroll-top', shortcut:'U'},
			{label:$L('Scroll to bottom'), icon:'down', command:'scroll-bottom', shortcut:'D'},
			{label:$L('Update'), icon:'sync', command:'refresh', shortcut:'R'}
		]
	};
	
	/*
		View menu at top of screen
	*/
	this.viewMenuModel = {
		label: $L('Menu Demo'), 
		items: [
				{label: $L('Friends')}, {},
				{label: $L('SwitchView'), icon:'arrow', submenu:'switch-menu'}
		]
	};
	
	this.controller.setupWidget(Luna.Menu.commandMenu, undefined, this.cmdMenuModel);
	this.controller.setupWidget(Luna.Menu.viewMenu, undefined, this.viewMenuModel);



	/*
		Popup menu for SwitchView
	*/
	this.switchMenuModel = {
		label: $L('Views'),
		items: [
				{label:'Friends',	 			secondaryIconPath:'', command:'friends-timeline'}, 
                {label:$L('Replies'),			secondaryIconPath:'reply', command:'replies-timeline'}, 
                {label:$L('Direct Messages'),	secondaryIconPath:'send', command:'direct-messages'}, 
                {label:$L('Search Twitter'),	secondaryIconPath:'search', command:'search-twitter'},
                {label:$L('Manage Followers'),	secondaryIconPath:'make-vip', command:'followers-following'}
		]
	};
	
	// Set up submenu widget that was wired into the viewMenu above
	this.controller.setupWidget("switch-menu", undefined, this.switchMenuModel);


	/*
		list
	*/
	this.controller.setupWidget('friends-timeline',
		{
			itemTemplate: 'friends-timeline/tweet',
			renderLimit:  400,
			itemsCallback:this.itemsCallback.bind(this),
			reorderable:  false
		},
		{
			listTitle: $L('Friends')
		}
		
	);
	this.timelineListWidget = this.controller.get('friends-timeline');
	this.updateListWithNewItems = this.updateListWithNewItems.bind(this);


	this.scroller = this.controller.getSceneScroller();


	/*
		jQuery is used to listen to events from SpazTwit library
	*/
	jQuery().bind('new_friends_timeline_data', { thisAssistant:this }, function(e, tweets) {
			
			dump(sc.app);
			
			/*
				Unmark all current entries in timeline as new
			*/
			jQuery('#friends-timeline>div.timeline-entry').removeClass('new');

			/*
				If there are new tweets, process them
			*/
			if (tweets.length>0) {
				
				// dump(e.data.thisAssistant.scroller.palm.length());
				
				/*
					Mark the first tweet as the new "last id checked"
					Tweets come newest first, so get first array element
				*/
				sc.app.lastFriendsTimelineId = parseInt(tweets[0].id);

				jQuery.each( tweets, function() {
					this.text = sch.autolink(this.text);
					this.text = sch.autolinkTwitter(this.text);
					this.relative_time = sch.getRelativeTime(this.created_at);
				});
				
				/*
					Render the new tweets as a collection (speed increase, I suspect)
				*/
				var itemhtml = Luna.View.render({collection: tweets, template: 'friends-timeline/tweet'});
				
				/*
					prepend the rendered markup to the timeline, so it shows on top
				*/
				jQuery('#friends-timeline').prepend(itemhtml);
				
				e.data.thisAssistant.scroller.palm.revealElement(
					jQuery('#friends-timeline>div.timeline-entry.new:last').get()
				)
				
				/*
					concat the new tweets to the beginning of the existing list
				*/
				e.data.thisAssistant.sceneTweets = tweets+e.data.thisAssistant.sceneTweets;
			} else {
				Luna.log("no new tweets");
			}
			
		}
	);

	/*
		Make request to Twitter
	*/
	this.getData();
	

	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
}



FriendsTimelineAssistant.prototype.itemsCallback = function(listWidget, offset, count) {
	// We delay returning the items by .1 seconds in order to more accurately simulate 
	// data being returned from an async service request.
	// If the data is available immediately, it's fine to call 'updateItems' from within this function.
	this.updateListWithNewItems.delay(.1, listWidget, offset, this.sceneTweets.slice(offset, offset+count));
	//callback(offset, this.loremList.slice(offset, offset+count), this.loremList.length);

	// Java services using ActiveRecord may wish to know the window of 
	// currently loaded items, in order to perform certain optimizations:
	var range = this.timelineListWidget.palm.getLoadedItemRange();
	Luna.log($L("Current window: ") +range.offset+", +"+range.limit +'    '+$L("Requesting ") +offset+", +"+count);
	
}

FriendsTimelineAssistant.prototype.updateListWithNewItems = function(listWidget, offset, items) {
	// Give the item models to the list widget, and render them into the DOM.
	listWidget.palm.noticeUpdatedItems(offset, items);
	
	// This will do nothing when the list size hasn't actually changed, 
	// but is necessary when initially setting up the list.
	// listWidget.palm.setLength(this.sceneTweets.length);
	listWidget.palm.setLength(items);
},



// This is where commands from the viewMenu (and our submenu wired into it) are handled.
// if you have a viewMenu with commands as we do, you need to define one of these in your assistant
FriendsTimelineAssistant.prototype.handleCommand = function(event){
	if (event.type == Luna.Event.command) {
		switch (event.command) {
			
			/*
				Switch View
			*/
			case 'friends-timeline':
				this.getData();
				break;
			case 'replies-timeline':
				Luna.Controller.notYetImplemented();
				break;
			case 'direct-messages':
				Luna.Controller.notYetImplemented();
				break;
			case 'search-twitter':
				Luna.Controller.notYetImplemented();
				break;
			case 'followers-following':
				Luna.Controller.notYetImplemented();
				break;
				
			/*
				Compose a new message
			*/
			case 'compose':
				Luna.Controller.notYetImplemented();
				break;
			
			/*
				Scroll to top
			*/
			case 'scroll-top':
				dump("Scroll to bottom");
				this.scroller.palm.revealTop();
				break;
			/*
				Scroll to bottom
			*/
			case 'scroll-bottom':
				this.scroller.palm.revealBottom();
				break;
			
			/*
				This would refresh the current view
			*/
			case 'refresh':
				this.getData();
				break;
				
			
				
		}
	}
}


FriendsTimelineAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


FriendsTimelineAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FriendsTimelineAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


FriendsTimelineAssistant.prototype.getData = function() {
	sc.app.twit.getFriendsTimeline(sc.app.lastFriendsTimelineId, 50);
};

