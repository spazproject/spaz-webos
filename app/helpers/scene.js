/**
 * helpers for scene assistants in Spaz on Mojo 
 */
var scene_helpers = {};


/**
 * This adds a number of common scene methods mixins-style to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	
	assistant.initAppMenu = function(opts) {

		var default_items = [
			Mojo.Menu.editItem,
			{ label: $L('New Search Card'), command: 'new-search-card' },
			{ label: $L('Preferences'), command:Mojo.Menu.prefsCmd },
			{ label: $L('About Spaz'),		command: 'appmenu-about' },
			{ label: $L('Donate'),		command:'donate' },
			{ label: $L('Help'),			command:Mojo.Menu.helpCmd }
		];

		if (!opts) {
			opts = {
				'items':default_items
			};
		} else if (!opts.items) {
			opts.items = default_items;
		}
		
		// the initial app/scene commands set into the class's appMenuModel for the beverage:
		this.appMenuAttr  = {
			omitDefaultItems: true
		};
		
		this.appMenuModel = {
			visible: true,
			items: opts.items
		};

		// good to go, set up the almighty Application Menu:
		this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
	};
	

	/**
	 * opts is an object with key:val pairs, like so
	 * {
	 *	viewMenuLabel:'My Timeline';
	 *	switchMenuLabel:'View';
	 * } 
	 */
	assistant.setupCommonMenus = function(opts) {
		
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		
		/*
			View menu at top of screen
		*/
		if (opts.viewMenuItems) {
			var viewMenuItems = opts.viewMenuItems;
			this.viewMenuModel = {
				label: $L('viewmenu'), 
				items: viewMenuItems
			};
			this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.viewMenuModel);
		}
		

		/*
			Command menu at bottom of screen
		*/
		if (opts.cmdMenuItems) {
			var cmdMenuItems = opts.cmdMenuItems;
			this.cmdMenuModel = {
				visible:true,
				items: cmdMenuItems
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
		}

	};


	assistant.createStage = function(sceneName, sceneArgs, stageName) {
		// "nocache:true" tells sysmanager to not use the card caching strategy on compose cards
		var params = {name: stageName, assistantName:'StageAssistant'};
		var callback = function(stageController) {
			stageController.pushScene(sceneName, sceneArgs, stageName);
		};
		Mojo.Controller.getAppController().createStageWithCallback(params, callback);
	};

	/**
	 * these are all sceneAssistant-specific calls. More are in Stage and App assistants
	 */
	assistant.handleCommand = function(event){
		
		sch.debug(event.command);
		if (event.type == Mojo.Event.forward) {			
			if (this.controller.sceneName != "post") {
				this.prepMessage();
			} else {
				Mojo.Log.info("We're in a post scene; ignoring forward gesture");
			}
		}
		if (event.type == Mojo.Event.command) {

			if (this._commands[event.command]) {
				Mojo.Log.error('calling event.command: %j', event.command);
				Mojo.Log.error('calling event.command handler: %s', this._commands[event.command]);
				this._commands[event.command].call(this, event);
			} else {
				Mojo.Log.error('No event.command handler found: %j', event.command);
			}
					
		}
	};
	
		
	assistant.setCommand = function(label, func) {
		this._commands[label] = func;
	};

	assistant.removeCommand = function(label) {
		this._commands[label] = null;
	};
	
	
	
	/**
	 * handler for all filter commands on my-timeline 
	 */
	assistant.filterCommandHandler = function(e) {
		var sceneobject = this.controller.stageController.activeScene();
		var scenename = sceneobject.sceneName;
		
		sch.debug('scenename:'+scenename);
		
		/*
			if we're in my-timeline, we do things differently
		*/
		if (scenename.indexOf('my-timeline') != -1) {
			this.controller.prepareTransition(Mojo.Transition.crossFade).run();
			this.filterTimeline(e.command, true);
		} else {
			// push to my-timeline with a param to set a filter
			Spaz.findAndSwapScene('my-timeline', {'filter': e.command});

		}
	};
	
	/**
	 * all our default commands
	 * @variable 
	 */
	assistant._commands = {

		/**
		 * my-timeline view filtering handlers 
		 */
		'filter-timeline-all' : function(e) {
			this.filterCommandHandler(e);
		},
		'filter-timeline-replies-dm' : function(e) {
			this.filterCommandHandler(e);
		},
		'filter-timeline-replies' : function(e) {
			this.filterCommandHandler(e);
		},
		'filter-timeline-dms' : function(e) {
			this.filterCommandHandler(e);
		},

		'new-search-card':function(e) {

			App.new_search_card++;
			this.createStage(
				'search-twitter',
				{'lightweight':'false'},
				App.search_card_prefix+App.new_search_card
			);
		},
			
		'update-location':function(e) {
			this.showLocationPanel();
		},

		/*
			Compose a new message
		*/
		'compose':function(e) {
			this.prepMessage();
		},

		/*
			Scroll to top
		*/
		'toggle-accounts-panel': function(e) {
			if(this.controller.get('panel').hasClassName("sliding")){
				this.controller.get('panel').removeClassName('sliding');
				return;
			}
			this.controller.get('panel').addClassName('sliding');
		},

		'scroll-top':function(e) {
			dump("Scroll to top");
			this.scrollToTop();
		},

		/*
			Scroll to bottom
		*/
		'scroll-bottom': function(e) {
			dump("Scroll to bottom");
			this.scrollToBottom();			
		},

		/*
			Scroll to first (last in list) new item
		*/
		'scroll-new':function(e) {
			dump("Scroll to new");
			this.scrollToNew();
		},
		
		/*
			This would refresh the current view
		*/
		'refresh': function(e) {
			if (this.refresh) {
				Mojo.Log.error('`this.refresh`; calling');
				this.refresh(e, 'refresh'); // need to have a "refresh" method defined for each scene asst
			} else {
				Mojo.Log.error('`this.refresh` DNE; ignoring');
			}
			
		},			
		
		/*
			This is only in the search-twitter-assistant scene
		*/
		'save-search':function(e) {
			if (this.isSavedSearch === false) {
				this.saveSearch(this.searchBoxModel.value);
			} else {
				this.removeSearch(this.searchBoxModel.value);
			}			
		},
		
		//Post scene stuff
		"sendPost": function(e){
			this.sendPost();
		},
		"attachImage": function(e){
			this.attachImage();
		},
		"shortenText": function(e){
			this.shortenText();
		},
		"shortenURLs": function(e){
			this.shortenURLs();
		},
		"getKotoData": function(e){
			this.getKotoData();		
		},
		"addTextToPost": function(e){
			this.addTextToPost(e.text);
		}
	};
	
	
	/**
	 *	
	 */
	assistant.scrollToTop = function() {
		if (!this.controller) {
			return;
		}
		
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.topContainer = this.scroller.down();
		dump('Scrolling to top');
		this.scroller.mojo.scrollTo(0,0, false);
	};
	
	/**
	 *	
	 */
	assistant.scrollToBottom = function() {
		this.scroller.mojo.revealBottom();
	};
	
	/**
	 *	
	 */
	assistant.scrollToNew = function() {
		
		var firstnew = -1;
		if (this.timeline_model && this.timeline_model.items && this.timeline_list) {
			
			for (var i=0; i < this.timeline_model.items.length; i++) {
				if (this.timeline_model.items[i].data.Spaz_is_new === true) {
					firstnew = i;
				}
			}
			
			if (firstnew >= 0 && (firstnew < this.timeline_model.items.length-1) ) {
				Mojo.Log.error('Revealing item:' + firstnew);
				this.timeline_list.mojo.revealItem(firstnew, true);
			} else {
				Mojo.Log.error('Not scrolling');
			}
			
		} else {
			Mojo.Log.error('Cannot scroll to new -- this.timeline_model not defined!');
			Mojo.Log.error('this.timeline_model: %j', this.timeline_model);
			Mojo.Log.error('this.timeline_list: %j', this.timeline_list);
		}
		
	};

	
	
	/**
	 * Binds listeners for scrolling
	 */
	assistant.bindScrollToRefresh = function() {
		var thisA = this;
		
		Mojo.Log.info('BINDING');
				
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.releaseText = this.controller.get("releaseText");
		jQuery(this.releaseText).html($L("Release to Refresh"));
		this.scrolling = this.scrolling.bind(this);
		this.releaseScroll = this.releaseScroll.bind(this);
		this._handleScrollStarting = this.handleScrollStarting.bindAsEventListener(this);
		this.controller.listen(this.scroller, Mojo.Event.scrollStarting, this._handleScrollStarting);
	};
	
	
	/**
	 * Unbinds listeners for scrolling
	 */
	assistant.unbindScrollToRefresh = function() {
		Mojo.Log.info('UNBINDING');
		this.controller.stopListening(this.scroller, Mojo.Event.scrollStarting, this._handleScrollStarting);
	};
	
	
	assistant.handleScrollStarting = function(e) {
		Mojo.Event.listen(this.scroller, Mojo.Event.dragging, this.scrolling);
		var scrollY = this.scroller.mojo.getScrollPosition().top;
		if(scrollY >= 0) {
			this.releaseText.show();
		}else {
			this.releaseText.hide();		
		}
		
	};
	
	assistant.scrolling = function(event) {
		var scrollY = this.scroller.mojo.getScrollPosition().top;
		if(scrollY >= 65) {
			// don't make the user hold for 50ms -- just makes it harder to pull off. #twss
			
			this._releaseScroll = this.releaseScroll.bindAsEventListener();
			
			this.controller.listen(this.scroller, "mouseup", this._releaseScroll);
		};
	};
	assistant.releaseScroll = function(event) {
		var scrollY = this.scroller.mojo.getScrollPosition().top;
		
		this.releaseText.hide();
		if(scrollY <= 20) {
			//webOS did the thing that doesn't let you hold the list past the regular scroll limit :(
			//Don't refresh because it's possible that it wasn't the user's intention to refresh...
			// reset the message
		}
		
	   // otherwise it's a valid refresh
		else {
			Mojo.Controller.stageController.sendEventToCommanders({
				'type':Mojo.Event.command,
				'command':'refresh'
			});		   
		}

		// whether it's a real refresh or not, remove the listeners
		this.controller.stopListening(this.scroller, Mojo.Event.dragging, this.scrolling);
		this.controller.stopListening(this.scroller, "mouseup", this.releaseScroll);
	};
	
	
	
	assistant.setTimelineTextSize = function(tl_id, size) {
		size = size.toLowerCase();
		
		var sizes = ['tall', 'grande', 'venti'];
		
		var tl = jQuery(tl_id);
		
		for (var i=0; i < sizes.length; i++) {
			tl.removeClass(sizes[i]);
		};
		tl.addClass(size);
	};
	
	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
			  template: 'shared/location-popup',
			  assistant: new LocationDialogAssistant(this),
			  preventCancel:false
		});
	};	
	

	/**
	 *	
	 */
	assistant.addPostPopup = function(event) {

		// alert('DEPRECATED');

		
	};
	
	
	assistant.initTwit = function(event_mode) {
		// var username = App.prefs.get('username');
		// var password = App.prefs.get('password');
		
		event_mode = event_mode || 'jquery'; // default this to jquery because we have so much using it
		
		var users = new SpazAccounts(App.prefs);
		
		this.twit = new SpazTwit({
			'event_mode':event_mode,
			'timeout':1000*60
		});
		this.twit.setSource(App.prefs.get('twitter-source'));
		
		
		var auth;
		if ( (auth = Spaz.Prefs.getAuthObject()) ) {
			this.twit.setCredentials(auth);
			if (Spaz.Prefs.getAccountType() === SPAZCORE_ACCOUNT_CUSTOM) {
				this.twit.setBaseURL(Spaz.Prefs.getCustomAPIUrl());
			} else {
				this.twit.setBaseURLByService(Spaz.Prefs.getAccountType());
			}
		} else {
			// alert('NOT seetting credentials for!');
		}
	};
	

	

	
	
	
	
	
	
	
	
	
	
	
	/**
	 *	
	 */
	assistant.removePostPopup = function(event) {
		
		// alert('DEPRECATED');
		
	};


	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
			  template: 'shared/location-popup',
			  assistant: new LocationDialogAssistant(this),
			  preventCancel:false
		});
	};
	
	assistant.showPostPanel = function(opts) {
		
		opts = sch.defaults({
			'text'		   : '',
			'type'		   : null,
			'select_start' : 0,
			'select_length': 0,
			'irt_status'   : null,
			'irt_status_id': 0,
			'dm_irt_text'  : null,
			'dm_recipient' : null
			
		}, opts);
		
		Mojo.Controller.stageController.pushScene("post", opts);
		
	};
	
	
	/**
	 *	
	 */
	assistant.prepMessage = function() {
		this.showPostPanel({
			'text'		   : '',
			'type'		   : null,
			'select_start' : 0,
			'select_length': 0
		});
	};


	/**
	 *	
	 */
	assistant.retweet = function(entryobj) {
		var that = this;
		this.twit.retweet(
			entryobj.id,
			function(data){
				that.showBanner($L('Retweet succeeded'));
			},
			function(xhr, msg, exc){
				that.showBanner($L('Retweet failed!'));
			}
		);
	};


	
	/**
	 *	
	 */
	assistant.prepRetweet = function(entryobj) {
		var text = entryobj.SC_text_raw;
		var screenname = entryobj.user.screen_name;

		text = 'RT @' + screenname + ': '+text+'';
		
		this.showPostPanel({
			'text'		   : text,
			'type'		   : 'rt',
			'select_start' : text.length,
			'select_length': text.length
		});
	};

	/**
	 *	
	 */
	assistant.prepQuote = function(entryobj) {
		var text = entryobj.SC_text_raw;
		var screenname = entryobj.user.screen_name;

		text = text+' /via @' + screenname;
		
		this.showPostPanel({
			'text'		   : text,
			'type'		   : 'quote',
			'select_start' : text.length,
			'select_length': text.length
		});
	};


	/**
	 *	
	 */
	assistant.facebookTweet = function(tweetobj) {
		
		var message = "From @"+tweetobj.user.screen_name + ": "+tweetobj.SC_text_raw;

		var appids = [
			'com.palm.app.facebook.beta',
			'com.palm.app.facebook'
		];

		var index = 0;
		
		var that = this;
		
		
		function post() {
			
			if (index < appids.length) {
				
				Mojo.Log.info('Trying to post with appid %s', appids[index]);
				
				that.controller.serviceRequest("palm://com.palm.applicationManager", {
					method:		 'launch',
					parameters:	 {
						id: appids[index],
						params: { status: message }
					},
					onFailure: function() {
						Mojo.Log.info('Failed to post with appid %s', appids[index]);
						index++; // go to next appid
						post(); // retry
					}
				});			
				
			} else {
				Mojo.Log.info('Failed to post to Facebook');
				that.showAlert($L('Facebook app not installed'), $L('Could not post'));
			}
			
		}
		
		// start!
		post();
		
		
	};

	/**
	 *	
	 */
	assistant.emailTweet = function(tweetobj) {
		
		var message = '';
		
		message = ""
			+ "From @"+tweetobj.user.screen_name + ":<br><br>"
			+ sch.autolink(tweetobj.SC_text_raw) + "<br><br>"
			+ sch.autolink("Shared from Spaz http://getspaz.com")+"\n\n";
		
		Spaz.sendEmail({
		  msg: message,
		  subject: "A tweet by @"+tweetobj.user.screen_name+" shared from Spaz",
		  controller: this.controller
		});
	};


	/**
	 *	
	 */
	assistant.SMSTweet = function(tweetobj) {
		
		var message = '';
		
		message = ""
			+ "From @"+tweetobj.user.screen_name+":\n"
			+ tweetobj.SC_text_raw+"\n\n"
			+ "Shared from Spaz http://getspaz.com\n\n";
		
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method:'launch',
			parameters:{
				id:"com.palm.app.messaging",
				params:{
					'messageText':message
				}
			}
		});
	};

	/**
	 *	
	 */
	assistant.prepDirectMessage = function(username, irt_text) {
		
		var text = '';
		
		this.showPostPanel({
			'text'		   : text,
			'type'		   : 'dm',
			'dm_irt_text'  : irt_text,
			'dm_recipient' : username
		});

	};



	/**
	 *	
	 */
	assistant.prepPhotoPost = function(url) {
		
		if (!url) {
			return false;
		}
	
		var text = url + ' ';
		
		this.showPostPanel({
			'text'		   : text,
			'type'		   : 'photo',
			'select_start' : url.length+1,
			'select_length': text.length
		});
		
		return true;	
	};



	/**
	 *	
	 */
	assistant.prepReply = function(username, status_id, statusobj) {
		var text = '@', screenname = null, unique_usernames = [];

		Mojo.Log.error('username: %j', username);
		
		if (sch.isArray(username)) {
						
			username = username.join(' @');
		}

		if (username) {
			text += username + ' ';
		}
	
		this.showPostPanel({
			'text'		   : text,
			'type'		   : 'reply',
			'select_start' : text.length,
			'select_length': text.length,
			'irt_status'   : statusobj,
			'irt_status_id': status_id
		});
	
	};

	/**
	 *	
	 */
	assistant.deleteStatus = function(id) {
		var that = this;
		this.twit.destroy(
			id,
			function(data){
				that.showBanner($L('Deleted status'));
				App.Tweets.remove(id);
				jQuery('div.timeline-entry[data-status-id="'+id+'"]').remove();
			},
			function(xhr, msg, exc){
				Mojo.Log.error("Error deleting status: '%s', '%s'", xhr.responseText, msg);
				that.showBanner($L('Deleting status failed!'));
			}
		);
		
	};
	
	/**
	 *	
	 */
	assistant.deleteDirectMessage = function(id) {
		var that = this;
		this.twit.destroyDirectMessage(
			id,
			function(data){
				that.showBanner($L('Deleted direct message'));
				App.Tweets.remove(id, true);
				jQuery('div.timeline-entry.dm[data-status-id="'+id+'"]').remove();
			},
			function(xhr, msg, exc){
				Mojo.Log.error("Error deleting dm: '%s', '%s'", xhr.responseText, msg);
				that.showBanner($L('Deleting direct message failed!'));
			}
		);
		
	};


	/**
	 * 
	 */
	assistant.searchFor = function(terms, scenetype, saved_id) {
		
		if (!saved_id) {
			saved_id = null;
		} else {
			// saved_id = parseInt(saved_id, 10);
		}
		
		var lightweight = false;
		if (scenetype === 'lightweight') {
			lightweight = true;
		}
		
		/*
			if username and pass aren't set, use lightweight version
		*/
		if (!(App.username)) {
			lightweight = true;
		}
			
		Mojo.Controller.stageController.pushScene("search-twitter", {
			'searchterm': terms,
			'lightweight': lightweight,
			'saved_id': saved_id
		});
	};



	
	assistant.setupInlineSpinner = function(id) {
		// alert('setup:'+id);
		this.controller.setupWidget(id, {spinnerSize: Mojo.Widget.spinnerSmall}, {});
	};
	
	assistant.showInlineSpinner = function(id, message) {
		// alert('showing!'+"\n"+id+"\n"+message);

		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		jQuery('#'+id)[0].mojo.start();
		
		dump("SPINNER CONTAINER HTML (start):"+jQuery('#'+id+'-container').get(0).outerHTML);
	};
	
	


	/**
	 *	stops, but does not remove, the spinner
	 */
	assistant.stopInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id).get(0).mojo.stop();
	};


	/**
	 *	starts an existing spinner
	 */
	assistant.startInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		jQuery('#'+id).get(0).mojo.start();
	};

	/**
	 * stops and hides a spinner 
	 */
	assistant.hideInlineSpinner = function(id) {
		Mojo.Log.error('hideInlineSpinner %s', id);
		if (jQuery('#'+id).get(0)) {
			jQuery('#'+id).get(0).mojo.stop();
		}
		jQuery('#'+id+'-container').hide();
	};
	

	/**
	 *	immediately DESTROYS an existing spinner
	 */
	assistant.clearInlineSpinner = function(container) {
		dump("clearing inline spinner");
		jQuery(container).empty();		
	};
	
	
	
	
	assistant.activateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(id);
		buttonWidget.mojo.activate();
	};

	assistant.deactivateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(id);
		buttonWidget.mojo.deactivate();
	};
	
	
	/**
	 * helper to easily show banners 
	 * 
	 * @param {string} soundClass default false (no sound). (alerts|notifications|vibrate)
	 */
	assistant.showBanner = function(text, category, soundClass) {
		
		if (!soundClass) { soundClass = false; }
		
		category = category || 'misc';
		
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var bannerArgs = {
			'messageText':text
		};
		if (soundClass && App.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = soundClass;
		}

		var appController = Mojo.Controller.getAppController();
		appController.showBanner(bannerArgs, launchArgs, category);
	};

	
	/**
	 * creates a new dashboard notification for new message counts
	 * @param {Integer} count
	 * @param {String} category newMessages (default), newMentions or newDirectMessages
	 */
	assistant.newMsgBanner = function(count, category) {
		
		var title, msg;
		
		if (!category) {
			category = 'newMessages';
		}
		
		switch(category) {
			case 'newMessages':
				title = $L('New Message(s)');
				msg	  = $L("You have #{count} new message(s)").interpolate({count:count});
				break;
			case 'newMentions':
				title = $L('New @Mention(s)');
				msg	  = $L("You have #{count} new mention(s)").interpolate({count:count});
				break;
			case 'newDirectMessages':
				title = $L('New Direct Message(s)');
				msg	  = $L("You have #{count} new direct message(s)").interpolate({count:count});
				break;
		}
		
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		
		var bannerArgs = {
			'messageText':msg
		};
		
		if (App.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = 'notification';
		}
		
		var appController = Mojo.Controller.getAppController();
		
		appController.showBanner(bannerArgs, launchArgs, category);
		this.showDashboard(title, bannerArgs.messageText, count, this.getStageName());
	};


	/**
	 * creates a new dashboard notification for new search result counts
	 * @param {Integer} count
	 * @param {String} query the search query
	 */
	assistant.newSearchResultsBanner = function(count, query) {				
		var category = 'newSearchResults_'+query;
		var appController = Mojo.Controller.getAppController();
		var stageController = appController.getActiveStageController();
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		
		var bannerArgs = {
			'messageText':$L("#{count} new result(s) for '#{query}'").interpolate({'count':count, 'query':query})
		};

		if (App.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = 'notification';
		}
		
		appController.showBanner(bannerArgs, launchArgs, category);
		this.showDashboard($L('New Search Results'), bannerArgs.messageText, count, this.getStageName());
		
	};
	
	
	/**
	 * generalized method to show a dashboard notification 
	 */
	assistant.showDashboard	  = function(title, message, count, fromstage) {
		
		var sceneArgs;

		/*
			if title is a string, then we're getting the 4-param args. otherwise we assume
			there is only one arg and it's the sceneArgs
		*/
		if (sch.isString(title)) {
			sceneArgs = {
				'template_data':{
					'title': title,
					'message': message,
					'count': count
				},
				'fromstage':fromstage
			};
		} else {
			sceneArgs = title;
		}

		var appController = Mojo.Controller.getAppController(); 
		var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME); 

		if (dashboardStageController) { 
			dashboardStageController.delegateToSceneAssistant("updateDashboard", {
				'template_data': {
					'title':title,
					'message':message,
					'count':count
				},
				'fromstage':fromstage
			}); 
		} else {
			var pushDashboard = function(stageController){
				stageController.pushScene('dashboard', sceneArgs); 
			}; 
			appController.createStageWithCallback({
					'name':SPAZ_DASHBOARD_STAGENAME,
					'lightweight':false
				},
				pushDashboard,
				'dashboard'
			); 
		} 
	};
	
	
	
	assistant.showNotification = function(msg) {
		
	};
	
	
	
	assistant._initSound = function() {

		var makeCue = function(clip) {
			var cue = new Audio();
			if (cue.palm) {
				cue.mojo.audioClass = "media";
			}
			cue.src = clip;
			cue.autoplay = false;
			return cue;
		};
		
		this.audioCues = {
			'newmsg':  makeCue(Mojo.appPath + 'sounds/New.mp3'),
			'send':	   makeCue(Mojo.appPath + 'sounds/CSnd.mp3'),
			'receive': makeCue(Mojo.appPath + 'sounds/CRcv.mp3'),
			'startup': makeCue(Mojo.appPath + 'sounds/On.mp3'),
			'shutdown':makeCue(Mojo.appPath + 'sounds/Off.mp3'),
			'wilhelm': makeCue(Mojo.appPath + 'sounds/wilhelm.mp3')
		};


	};
	
	
	
	assistant.playAudioCue = function(clip) {
		
		dump('trying to play '+clip);
		
		if (!this.audioCues) {
			this._initSound();
		};

		try {
			this.audioCues[clip].play();
		} catch (err) {
			this.showDialogBox('error', err);
		}

	};



	assistant.processAjaxError = function(errobj) {		

		var human_msg, twiterr_req, twiterr_msg, error_processed;
		
		Mojo.Log.error("assistant.processAjaxError = function(errobj): %j", errobj);
		
		switch(errobj.msg) {
			case 'timeout':
				
				human_msg = $L('The request timed out – server did not respond');
				break;
				
			case 'error':
				
				if (errobj.xhr.status == 400) {
					human_msg = $L('Request limit exceeded');
				} else if (errobj.xhr.status == 401) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 403) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 404) {
					human_msg = $L('The requested URL doesn\'t exist');
				} else if (errobj.xhr.status == 500) {
					human_msg = $L('There was an error on the server');
				} else if (errobj.xhr.status == 502) {
					human_msg = $L('Servers are down or being upgraded');
				} else if (errobj.xhr.status == 503) {
					human_msg = $L('Servers are overloaded');
				} else {
					human_msg = $L('Unknown error');
				}
				
				try {
					var twiterr = sch.deJSON(errobj.xhr.responseText);
					twiterr_req = sch.stripTags(twiterr.request);
					twiterr_msg = sch.stripTags(twiterr.error);
					twiterr_msg = sch.stripTags(twiterr.error);
				} catch (e) {
					Mojo.Log.error('Tried to decode JSON from responseText, but failed');
					Mojo.Log.error(e.name + ":" + e.message);
				}
				
				break;
				
			case 'notmodified':
			
				human_msg = $L('Not modified');
				
				break;
				
			case 'parsererror':
				
				human_msg = $L('Error parsing XML returned by request');
				
				break;
			
			default:
			
				human_msg = $L('An error of some sort occurred while talking to the server');
				break;
		}
		
		if (errobj.xhr && errobj.xhr.readyState > 3) {
			error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText': errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	twiterr_msg||human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			};
		} else {
			error_processed = {
				'status':		'',
				'statusText':	'',
				'responseText': '',
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	twiterr_msg||human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			};
			
		}

		return error_processed;
		
	};
	
	
	/**
	 * Check to see if we are connected to the Internet 
	 */
	assistant.checkInternetStatus = function(on_success, on_failure) {
		this.controller.serviceRequest('palm://com.palm.connectionmanager', {
			method: 'getstatus',
			parameters: {},
			onSuccess: on_success,
			onFailure: on_failure
		});
	};

	
	
	
	assistant.displayErrorInfo = function(msg, errors, template) {
		Mojo.Log.error('assistant.displayErrorInfo');
		Mojo.Log.error('msg: %s', msg);
		Mojo.Log.error('errors: %j', errors);
		Mojo.Log.error('template: %s', template);
		
		
		var error_info;
		var error_str = '';
		
		errors = errors || null;
		
		if (errors && !sch.isArray(errors)) {
			var err = errors;
			errors = [errors];
		}
		
		if (!template) {
			// template = 'error_info_text';
			template = 'error_info';
		} 

		
		error_str += msg + "\n";
		
		if ( errors ) {
			for (var i = 0; i < errors.length; i++) {
				error_info	= this.processAjaxError(errors[i]);
				error_str += App.tpl.parseTemplate(template, error_info);
			}
		}

		var dialog_widget = Mojo.Controller.errorDialog(error_str);
		
	};

	
	assistant.clearTimelineCache = function(callback) {
		this.cacheDepot = App.cache.clear();
		App.Tweets.reset();
		this.showAlert($L('Boom'), $L('Cache Cleared'));
	};
	
	
	
	assistant.handleTimelineListTap = function(e) {
		var thisA = this;	
		
		var listitem = e.item;
		var userid, status_id, isdm, status_obj;
		var event_target;

		/*
			remap if we have an originalEvent
		*/
		if (e.originalEvent) {
			Mojo.Log.info('originalEvent target: %s', e.originalEvent.target.outerHTML);
			event_target = e.originalEvent.target;
		} else {
			event_target = e.target;
		}
		
		Mojo.Log.error('Mojo.Event.tap received from live listener');
		Mojo.Log.info('Mojo.Event.tap target element: %s', event_target.outerHTML);
		Mojo.Log.info('Mojo.Event.tap target item: %j', listitem);
		
		/*
			Check to see if a hold already fired. If so, don't do *anything*
		*/
		if (event_target.holdFired) {
			event_target.holdFired = false;
			return;
		}
		
		var jqtarget = jQuery(event_target);

		status_obj = sch.clone(listitem.data);

		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			Mojo.Log.info('tap on .user or .user img, pushing user-detail');
			userid = jQuery(this).attr('data-user-id');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
			return;

		} else if (jqtarget.is('.username.clickable')) {
			Mojo.Log.info('tap on username.clickable, pushing user-detail');
			userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;

		} else if (jqtarget.is('.hashtag.clickable')) {
			Mojo.Log.info('tap on hashtag, searching');
			hashtag = jqtarget.attr('data-hashtag');
			thisA.searchFor('#'+hashtag);
			return;

		} else if (jqtarget.is('div.timeline-entry a[href]')) {
			Mojo.Log.info('tap on a[href], ignoring');
		
			/*
				this will cause a double tap, so ignore
			*/			
			return;

			 
		} else if (jqtarget.is('div.timeline-entry .meta')) {
			Mojo.Log.info('tap on .meta, ignoring');
			/*
				this will cause a double tap, so ignore
			*/
			return;

		} else {
			Mojo.Log.error('HOLD');
			
			Mojo.Log.error('status_obj: %j', status_obj);
			this._lastClickedStatusObj = status_obj;

			/*
				build the menu items
			*/
			var menu_items = [], screen_names = [];
			if (status_obj.SC_is_dm) {
				menu_items = [
					{label: $L('Details'), command: 'details'},
					{label: $L('Reply to DM'), command: 'reply-dm'}
				];
			} else {
				menu_items = [
					{label: $L('Details'), command: 'details'},
					{label: $L('@reply'), command: 'reply'}
				];
				if (sch.extractScreenNames(status_obj.SC_text_raw).length > 0) {
					menu_items.push({
						label: $L('@reply to all'),
						command: 'reply-all'
					});
				}
				if (!status_obj.user['protected']) {					
					menu_items.push({label: $L('Share'), command: 'share'});
				}
			}
			
			
			this.controller.popupSubmenu({
				onChoose: function(cmd) {
					
					var username, status_id, is_dm, screen_names = [];
					var status_obj = thisA._lastClickedStatusObj;
					
					Mojo.Log.info("onChoose cmd: %s", cmd);
					
					if (status_obj.SC_is_dm) {
						username  = status_obj.sender.screen_name;
						status_id = status_obj.id;
						is_dm	  = true;
						
						
					} else {
						username  = status_obj.user.screen_name;
						status_id = status_obj.id;
						is_dm	  = false;
						screen_names = sch.extractScreenNames(status_obj.SC_text_raw, [username, Spaz.Prefs.getUsername()]);
						screen_names.unshift(username);
					}
					Mojo.Log.info("Status Obj: %s", username);
					Mojo.Log.info("Status Obj: %s", status_id);
					Mojo.Log.info("Status Obj: %s", is_dm);


					switch (cmd) {
						case 'details':
							Mojo.Log.info('Pushing message detail scene');
							Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':is_dm});

							break;
						case 'share':
							thisA.showShareMenu(e, status_obj);
							break;
						case 'reply':
							thisA.prepReply(username, status_id, status_obj);
							break;
						case 'reply-all':
							thisA.prepReply(screen_names, status_id, status_obj);
							break;
						case 'reply-dm':
							thisA.prepDirectMessage('@'+username, status_obj.text);
							break;
						case 'retweet':
							thisA.retweet(status_obj);
							break;
						case 'RT':
							thisA.prepRetweet(status_obj);
							break;
						case 'quote':
							thisA.prepQuote(status_obj);
							break;
						case 'email':
							thisA.emailTweet(status_obj);
							break;
						case 'sms':
							thisA.SMSTweet(status_obj);
							break;								
						case 'facebook':
							thisA.facebookTweet(status_obj);
							break;

						default:
							return;
					};

				},
				placeNear: event_target,
				items: menu_items
			});
		}

	};
	
	
	assistant.showShareMenu = function(e, status_obj) {
		var thisA = this;
		
		var items;
		
		if (!status_obj.SC_is_dm) {
			items = [
				{label: $L('ReTweet'), command: 'retweet'},
				{label: $L('RT @…'), command:	'RT'},
				{label: $L('Quote'), command:	'quote'},
				{label: $L('Email'), command:	'email'},
				{label: $L('SMS/IM'), command:	'sms'},
				{label: $L('Facebook'), command:  'facebook'}
			];
		} else {
			items = [
				{label: $L('Email'), command:	'email'}
			];			
		}
		
		this.controller.popupSubmenu({
			onChoose: function(cmd) {

				switch (cmd) {
					case 'retweet':
						thisA.retweet(status_obj);
						break;
					case 'RT':
						thisA.prepRetweet(status_obj);
						break;
					case 'quote':
						thisA.prepQuote(status_obj);
						break;
					case 'email':
						thisA.emailTweet(status_obj);
						break;
					case 'sms':
						thisA.SMSTweet(status_obj);
						break;
					case 'facebook':
						thisA.facebookTweet(status_obj);
						break;
					default:
						return;
				}
			},
			placeNear: e.target,
			items: items
		});
	};
	
	
	/**
	 * Binds jQuery listeners for timeline entry taps contained in the passed selector. Uses .live()
	 */
	assistant.bindTimelineEntryTaps = function(tl_id) {
		var thisA = this;
		var userid;
		
		sch.debug('BINDING');
		
		this._handleTimelineListTap = this.handleTimelineListTap.bindAsEventListener(this);
		this.controller.listen(tl_id, Mojo.Event.listTap, this._handleTimelineListTap);
		
	};
	
	
	

	
	
	/**
	 * Unbinds jQuery listeners for timeline entry taps contained in the passed selector. Uses .die()
	 */
	assistant.unbindTimelineEntryTaps = function(tl_id) {
		Mojo.Log.info('UNBINDING');
		this.controller.stopListening(tl_id, Mojo.Event.listTap, this._handleTimelineListTap);
	};
	
	
	
	/**
	 * This helps us set up listening for the Enter key in a textbox
	 * 
	 * the callback function's 'this' references the assistant 
	 * 
	 * make sure to call stopListeningForEnter when done with the
	 * correct ID so the listener is unbound
	 * 
	 * @param {string} id
	 * @param {function} callback
	 */
	assistant.listenForEnter = function (id, callback){
		Mojo.Event.listen(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter.bind(this, callback),
			true
		);
	};
	assistant._listenerForEnter = function(callback, event) {
		sch.debug("DUMPING EVENT");
		sch.debug(event);
		sch.debug(event.originalEvent);
		sch.debug("DUMPING CALLBACK");
		sch.debug(callback);
		if (event && event.originalEvent && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
			sch.debug("CALLING CALLBACK");
			callback.call(this);
			return;
		}
	};
	
	/**
	 * removes the listener set up by listenForEnter
	 * 
	 * @param {string} id
	 */
	assistant.stopListeningForEnter = function(id) {
		Mojo.Event.stopListening(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter
		);
	};
	
	
	/**
	 * A helper to easily display JS alert()-style popups
	 * @param {string} msg	required 
	 * @param {string} title  optional 
	 * @param {function} [ok_cb] callback like function(value) where value is value assigned to OK button. Optional
	 * @param {array} [choices] an array of choice objects. Ex: {label:$L('Okay'), value:"okay", type:'dismiss'}
	 */
	assistant.showAlert = function(msg, title, ok_cb, choices) {
		
		var default_choices = [
			{label:$L('Okay'), value:"okay", type:'dismiss'}
		];
		
		title	 = title   || 'Alert';
		msg		 = msg	   || '';
		var onChoose = ok_cb   || function(choice) {
			return true;
		};
		choices	 = choices || default_choices;
		
		this.controller.showAlertDialog({
			'onChoose':onChoose,
			'title':   title,
			'message': msg,
			'choices': choices
		});
	};
	
	
	
	assistant.getStageName = function() {
		var stagename;
		if (window.name) {
			stagename = window.name;
		} else {
			stagename = SPAZ_MAIN_STAGENAME;
		}
		return stagename;
	};

	/**
	* returns the AppController 
	*/
	assistant.getAppController = function() {
		return Mojo.Controller.getAppController();
	};

	/**
	* returns the AppAssistant 
	*/
	assistant.getAppAssistant = function() {
		return Mojo.Controller.getAppController().assistant;
	};


	assistant.showBetaWarningAlert = function(force) {
		if (!force) { force = false; }
		if (Mojo.appInfo.id.indexOf('spaz-beta') === -1) {
			return; // don't bother -- this is not a beta
		}
		
		ran_once = Spaz.getAppObj().prefs.get('runonce_betawarning') || 0;
		
		if (!ran_once || force) {
			this.showAlert(
				$L('This is a BETA version of Spaz. It has bugs. It may not operate properly. It may insult you or your family. BE AWARE.'),
				$L('Beta Warning'),
				function(choice) {
					Spaz.getAppObj().prefs.set('runonce_betawarning', 1);
				}
			);
		}
	};


	/**
	 *	
	 */
	assistant.isTopmostScene = function() {
		// console.log(this.controller);
		
		
		var topmost	 = this.controller.stageController.topScene();

		// console.log(topmost);
		
		var is_topmost = (topmost === this.controller);
		
		sch.debug('is_topmost:'+is_topmost);
		
		return is_topmost;
	};


	assistant.openInBrowser = function(url) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
		  method: "open",
		  parameters:  {
			  id: 'com.palm.app.browser',
			  params: {
				  target: url
			  }
		  }
		});
	};
	
	
	assistant.trackStageActiveState = function() {
		this.isFullScreen = true;
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen.bind(this));
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen.bind(this));
	};

	assistant.stopTrackingStageActiveState = function() {
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen);
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen);
	};

	assistant._setNotFullScreen = function(event) {
		// alert('_setNotFullScreen');
		// alert('this.lastQuery:'+this.lastQuery);
		this.isFullScreen = false; // send notifications
	};
	assistant._setFullScreen = function(event) {
		// alert('_setFullScreen');
		// alert('this.lastQuery:'+this.lastQuery);
		this.isFullScreen = true;  // dont send notifications
		Spaz.closeDashboard();
	};
	
	assistant.listenForMetaTapScroll = function() {
		this.controller.listen(this.controller.sceneElement, "mousedown", handleMeta.bindAsEventListener(this));
		this.controller.listen(this.controller.sceneElement, "mouseup", handleMeta.bindAsEventListener(this));
		this.controller.listen(this.controller.sceneElement, Mojo.Event.flick, handleScroll.bindAsEventListener(this));		 
		function handleMeta(event){
			this.metaKey = event.metaKey;
		}
		function handleScroll(event){
			if(this.metaKey == true){
				if(event.velocity.y > 0){
					this.scrollToTop();
				}
				else if(event.velocity.y < 0){
					this.scrollToBottom();
				}
			}
		}
	};
	
	


	assistant.showFirstRunPopup = function() {
	    
	    if (Spaz.getAppObj().shownFirstRunPopup) { // only run once in a session
	        return;
	    }
	    
	    
		// first run
		if (Spaz.getAppObj().versionCookie.isFirst) {
		    Spaz.getAppObj().shownFirstRunPopup = true;
			this.showAlert(
				$L("Remember to visit help.getspaz.com to get help and make suggestions.\n\nThanks for supporting open source software!"),
				$L("Thanks for trying Spaz!"),
				function(value) {
					switch(value) {
						case "help":
							this.openInBrowser('http://getspaz.com/webos/whatsnew');
							return true;
						case "cl":
							this.openInBrowser('http://help.getspaz.com');
							return true;
						default:
							return true;
					}
				}, [
					{label:$L('Visit help.getspaz.com'), value:"help", type:'affirmative'},
					{label:$L('View Changelog'), value:"cl", type:'affirmative'},
					{label:$L('Continue'), value:"ok", type:'dismiss'}
				]
			);
		}
	};



	assistant.showNewVersionPopup = function() {
	    
	    if (Spaz.getAppObj().shownNewVersionPopup) { // only run once in a session
	        return;
	    }
	    
		// new version
 		if (Spaz.getAppObj().versionCookie.isNew && !Spaz.getAppObj().versionCookie.isFirst) {
            Spaz.getAppObj().shownNewVersionPopup = true;
			this.showAlert(
				$L("You're running a new version of Spaz. Read the Changelog to find out what's new."),
				$L("New Version"),
				function(value) {
					switch(value) {
						case "www":
							this.openInBrowser('http://getspaz.com/webos/whatsnew');
							return true;
						default:
							return true;
					}
				}, [
					{label:$L('View Changelog'), value:"www", type:'affirmative'},
					{label:$L('Continue'), value:"ok", type:'dismiss'}
				]
			);
		}
	};


	
	assistant.showFollowSpazPopup = function() {
	    
	    if (Spaz.getAppObj().shownFollowSpazPopup) { // only run once in a session
	        return;
	    }
	    
		// first run
		if (Spaz.getAppObj().versionCookie.isFirst) {
		    Spaz.getAppObj().shownFollowSpazPopup = true;
			this.showAlert(
				$L("To keep up with new info, make sure to follow @Spaz"),
				$L("Follow @Spaz"),
				function(value) {
					switch(value) {
						case "follow":
							Mojo.Controller.stageController.pushScene('user-detail', '@spaz');
							return true;
						default:
							return true;
					}
				}, [
					{label:$L('Go to @spaz\'s profile'), value:"follow", type:'affirmative'},
					{label:$L('Continue'), value:"ok", type:'dismiss'}
				]
			);
		}
	};
	
	
	
	assistant.showDonationPopup = function(force) {
		
		if (Spaz.getAppObj().showbDonationPopup) { // only run once in a session
		    return;
		}
		
		if (Mojo.appInfo.id == 'com.funkatron.app.spaz-sped') { // don't show this if they paid for the Special Ed.
		    return;
		}
		
		var runs = Spaz.getAppObj().versionCookie.runs;
		
		// bug them at certain run counts
		if ( ([10,100,250,500,1000].indexOf(runs) !== -1 ) || force === true) {
		    Spaz.getAppObj().showbDonationPopup = true;
			this.showAlert(
				$L("Spaz is free, open-source software, and relies on donations to support the work we do."),
				$L("Help Support Spaz"),
				function(value) {
					switch(value) {
						case "swag":
							this.openInBrowser('http://getspaz.com/swag');
							return true;
						case "specialed":
							this.openInBrowser('http://getspaz.com/webos/special-ed');
							return true;
						case "donate":
							this.openInBrowser('http://getspaz.com/donate');
							return true;
						default:
							return true;
					}
				}, [
					{label:$L('Buy t-shirts and buttons'), value:"swag", type:'affirmative'},
					{label:$L('Buy the Spaz Special Edition'), value:"specialed", type:'affirmative'},
					{label:$L('Make a donation'), value:"donate", type:'affirmative'},
					{label:$L('I hate you, Spaz'), value:"ok", type:'negative'}
				]
			);
		}
		
		
	};
	
	
};








/*
	Small controller class used for the update location account dialog
*/
var LocationDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		/*
			update button
		*/
		this.updateButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.updateButtonModel = {
			buttonLabel : "Update Location",
			buttonClass: 'primary'
		};
		this.controller.setupWidget('update-location-button', this.updateButtonAttributes, this.updateButtonModel);
		


		/*
			get location button
		*/
		this.getLocationButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.getLocationButtonModel = {
			buttonLabel : "Get Location",
			buttonClass: 'secondary'
		};
		this.controller.setupWidget('get-location-button', this.getLocationButtonAttributes, this.getLocationButtonModel);
		
		

		
		/*
			location text field
		*/
		this.locationBoxAttr = {
			"hintText":		  'Enter new location',
			"focusMode":	  Mojo.Widget.focusSelectMode,
			"fieldName":	  'update-location-textfield',
			"changeOnKeyPress": true,
			"maxLength":	  30,
			"autoReplace":	  false
		};
		this.locationBoxModel = {
			'value':	 '',
			'disabled':	 false
		};
		this.controller.setupWidget('update-location-textfield', this.locationBoxAttr, this.locationBoxModel);
		
		
	},
	
	activate: function() {
		var thisA = this;
		Mojo.Event.listen(jQuery('#update-location-button')[0], Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.listen(jQuery('#get-location-button')[0], Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	deactivate: function() {
		var thisA = this;
		Mojo.Event.stopListening(jQuery('#update-location-button')[0], Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.stopListening(jQuery('#get-location-button')[0], Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	getLocation: function() {
	
		var thisA = this;

		var on_success = function(data) { // onsuccess
			dump(data);
			var lat_str = data.latitude.toPrecision(10).toString();
			var lon_str = data.longitude.toPrecision(10).toString();
			thisA.locationBoxModel.value = lat_str + ',' + lon_str;
			thisA.controller.modelChanged(thisA.locationBoxModel);
			thisA.controller.get('get-location-button').mojo.deactivate();
		};
		var on_error = function(data) { // onerror
			dump(data);
			thisA.controller.get('get-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Could not get current location. You may need to accept terms and conditions in <strong>Location Services</strong>'));
		};
		
		var loc = new Mojo.Service.Request('palm://com.palm.location', {
				method:"getCurrentPosition",
				parameters:{
					'accuracy':		1,
					'responseTime': 1,
					'maximumAge':  60 // seconds
				},
				'onSuccess':on_success,
				'onFailure':on_error
			}
		);
	},
	
	updateLocation: function() {
		var thisA = this;
		
		jQuery(document).bind('update_location_succeeded', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-message').html($L('Location updated on Twitter'));
			thisA.widget.mojo.close();
		});
		jQuery(document).bind('update_location_failed', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Updating location on Twitter failed or timed-out'));
		});
		
		this.sceneAssistant.twit.updateLocation(this.locationBoxModel.value);
	}
	
});
