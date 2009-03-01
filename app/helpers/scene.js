/**
 * helpers for scene assistants in Spaz on Mojo 
 */
var scene_helpers = {}

/**
 * This adds a number of common scene methods to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	
	assistant.initAppMenu = function(opts) {
		// the initial app/scene commands set into the class's appMenuModel for the beverage:
		this.appMenuAttr  = {
			omitDefaultItems: true
		};
		
		this.appMenuModel = {
			visible: true,
			
			items: [
				Mojo.Menu.editItem,
				{ label: $L('About Spaz'),		command: 'appmenu-about' },
				Mojo.Menu.helpItem,
				Mojo.Menu.prefsItem,
				{ label: $L('Log-in'),			command: 'appmenu-login' },
				{ label: $L('New Search Card'),	command: 'new-search-card' }
			]
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
				items: viewMenuItems,
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




		this.timelineFilterMenuModel = {
			items: [
					{label:$L('Show All Messages'),				secondaryIconPath:'', command:'filter-timeline-all'}, 
					{label:$L('Replies and Direct Messages'),	secondaryIconPath:'', command:'filter-timeline-replies-dm'}, 
					{label:$L('Just Replies'),					secondaryIconPath:'', command:'filter-timeline-replies'}, 
					{label:$L('Just Direct Messages'),			secondaryIconPath:'', command:'filter-timeline-dms'}, 
			]
		};

		// Set up submenu widget that was wired into the viewMenu above
		this.controller.setupWidget("filter-menu", undefined, this.timelineFilterMenuModel);

		
		/*
			Spinner
		*/
		
		/*
			This gets the sceneName before it's defined
		*/
		var spinner_id = this.scroller.id.replace(/mojo-scene-([a-z_-]+)-scene-scroller/gi, "$1")+'-spinner';
		
		this.spinnerModel = {
			'spinning':false
		}
		this.controller.setupWidget(spinner_id, {
				property: 'spinning'
			},
			this.spinnerModel
		);

	};


	assistant.createStage = function(sceneName, sceneArgs, stageName) {
		// "nocache:true" tells sysmanager to not use the card caching strategy on compose cards
		var params = {name: stageName, nocache: true };
		var callback = function(stageController) {
			stageController.pushScene(sceneName, sceneArgs, stageName);
		};
		Mojo.Controller.getAppController().createStageWithCallback(params, callback);
	};

	/**
	 *  
	 */
	assistant.handleCommand = function(event){
		if (event.type == Mojo.Event.command) {
			switch (event.command) {
				/*
					timeline filtering
				*/
				case 'filter-timeline-all':
				case 'filter-timeline-replies-dm':
				case 'filter-timeline-replies':
				case 'filter-timeline-dms':
					this.filterTimeline(event.command);
					break;
				
				/*
					Navigation
				*/
				case 'home':
					findAndSwapScene("login", this);
					break;
				case 'my-timeline':
					findAndSwapScene("my-timeline", this);
					break;
				case 'search':
					findAndSwapScene("search-twitter", this);
					break;
				case 'new-search-card':

					sc.app.new_search_card++;
					this.createStage('search-twitter', { 'lightweight':true }, 'stage-lightweight-search'+sc.app.new_search_card);

					// findAndSwapScene("search-twitter", this);
					break;
				case 'followers':
					findAndSwapScene("manage-followers", this);
					break;
				case 'preferences':
					findAndSwapScene("preferences", this);
					break;

				/*
					Compose a new message
				*/
				case 'compose':
					this.showPostPanel();
					break;

				/*
					Scroll to top
				*/
				case 'scroll-top':
					dump("Scroll to top");
					this.scrollToTop();
					break;
				/*
					Scroll to bottom
				*/
				case 'scroll-bottom':
					dump("Scroll to bottom");
					this.scrollToBottom();
					break;

				/*
					Scroll to first (last in list) new item
				*/
				case 'scroll-new':
					dump("Scroll to new");
					this.scrollToNew();
					break;

				
				/*
					back
				*/
				case 'back':
					Mojo.Controller.stageController.popScene();
					break;


				/*
					This would refresh the current view
				*/
				case 'refresh':
					this.refresh(); // need to have a "refresh" method defined for each scene asst
					break;

				case 'search-trends':
					Mojo.Controller.notYetImplemented();
					break;

			}
		}
	}
	
	
	/**
	 *  
	 */
	assistant.scrollToTop = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.scroller.mojo.revealElement(jQuery('.timeline>div.timeline-entry:first', this.scroller).get());
	};
	
	/**
	 *  
	 */
	assistant.scrollToBottom = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.scroller.mojo.revealBottom();
		
	};
	
	/**
	 *  
	 */
	assistant.scrollToNew = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.scroller.mojo.revealElement(jQuery('.timeline>div.timeline-entry.new:last', this.scroller).get());
		
	};


	/**
	 *  
	 */
	assistant.filterTimeline = function(command) {
		
		if (!command) {
			command = this.filterState;
		}
		
		switch (command) {
			case 'filter-timeline-all':
				jQuery('#my-timeline div.timeline-entry').show();
				break;
			case 'filter-timeline-replies-dm':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply, #my-timeline div.timeline-entry.dm').show();
				break;
			case 'filter-timeline-replies':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply').show();
				break;
			case 'filter-timeline-dms':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.dm').show();
				break;
			default:
				jQuery('#my-timeline div.timeline-entry').show();
		}
		
		this.filterState = command;	
	};
	
	

	/**
	 *  
	 */
	assistant.addPostPopup = function(event) {
		/*
			add a container within the current scene
		*/
		var scroll_el = this.controller.getSceneScroller();

		/*
			destroy any existing post popups
		*/
		jQuery('#post-popup-container').remove();
		
		jQuery(scroll_el).append("<div id='post-popup-container'></div>");
		
		var itemhtml = Mojo.View.render({object: null, template: 'shared/post-popup'});
		jQuery('#post-popup-container', scroll_el).html(itemhtml);
		
		Mojo.Event.listen($('post-send-button'), Mojo.Event.tap, this.sendPost.bind(this));
		Mojo.Event.listen($('post-cancel-button'), Mojo.Event.tap, this.cancelPost.bind(this));

		
		/*
			if update succeeds
		*/
		jQuery().bind('update_succeeded', { thisAssistant:this }, function(e, data) {
			e.data.thisAssistant.renderSuccessfulPost(e, data);
		});

		/*
			if update fails
		*/
		jQuery().bind('update_failed', { thisAssistant:this }, function(e, data) {
			e.data.thisAssistant.reportFailedPost();
		});
		
		
		// var thisA = this; // use for closures below
		// 		
		// jQuery('#post-panel-textarea').bind('keyup',   function(e) {
		// 	thisA._updateCharCount();
		// });
		// jQuery('#post-panel-textarea').bind('keydown', function(e) {
		// 	thisA._updateCharCount();
		// });
		// jQuery('#post-panel-textarea').bind('blur',    function(e) {
		// 	thisA._updateCharCount();
		// });
		// jQuery('#post-panel-textarea').bind('focus',   function(e) {
		// 	thisA._updateCharCount();
		// });
		// 		
		// jQuery('#post-panel-irt-dismiss').bind(Mojo.Event.tap, function(e) {
		// 	thisA.clearPostIRT();
		// });
		
		
	}
	
	
	assistant.initTwit = function() {
		var username = sc.app.prefs.get('username');
		var password = sc.app.prefs.get('password');

		this.twit = new scTwit();

		if (username && password) {
			this.twit.setCredentials(username, password);
		}
	};
	


	/**
	 *  
	 */
	assistant.removePostPopup = function(event) {
		Mojo.Event.stopListening($('post-send-button'), Mojo.Event.tap, this.sendPost); 
		Mojo.Event.stopListening($('post-cancel-button'), Mojo.Event.tap, this.cancelPost);
		
		jQuery('#post-panel-textarea').unbind('keyup');
		jQuery('#post-panel-textarea').unbind('keydown');
		jQuery('#post-panel-textarea').unbind('blur');
		jQuery('#post-panel-textarea').unbind('focus');
		
		jQuery('#post-panel-irt-dismiss').unbind(Mojo.Event.tap);
		
		jQuery().unbind('update_succeeded');
		jQuery().unbind('update_failed');
		/*
			add a container within the current scene
		*/
		var scroll_el = this.controller.getSceneScroller();

		/*
			destroy any existing post popups
		*/
		jQuery('#post-popup-container', scroll_el).remove();
	}


	/**
	 * this hides and clears the post panel
	 */
	assistant.cancelPost = function() {
		this.hidePostPanel();
		this.clearPostPanel();
	};


	/**
	 *  
	 */
	assistant.hidePostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel', this.controller.getSceneScroller()).fadeOut('fast');
		
	}

	assistant.clearPostPanel = function() {
		this.clearPostIRT();
		jQuery('#post-panel-textarea', this.controller.getSceneScroller()).val('');
		this._updateCharCount();
	};

	/**
	 *  
	 */
	assistant.showPostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel', this.controller.getSceneScroller()).fadeIn('fast');
		jQuery('#post-panel-textarea', this.controller.getSceneScroller()).focus();
	}
	
	/**
	 * @private 
	 */
	assistant._updateCharCount = function() {
		var charcount = (140 - jQuery('#post-panel-textarea', this.controller.getSceneScroller()).val().length);
		jQuery('#post-panel-counter-number', this.controller.getSceneScroller()).text(charcount.toString());
		if (charcount < 0) {
			jQuery('#post-panel-counter', this.controller.getSceneScroller()).addClass('over-limit');
			/*
				disable post send button
			*/
			//post-send-button
		} else {
			jQuery('#post-panel-counter', this.controller.getSceneScroller()).removeClass('over-limit');
			/*
				enable post send button
			*/
		}
	};



	/**
	 *  
	 */
	assistant.sendPost = function(event) {
		// this.spinnerOn();
		this.showInlineSpinner('#post-panel-spinner-container', "Posting…");
		var status = jQuery('#post-panel-textarea').val();

		if (status.length > 0) {
			
			var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'));
			
			if (in_reply_to > 0) {
				sc.app.twit.update(status, null, in_reply_to);
			} else {
				sc.app.twit.update(status, null, null);
			}
			
		}
	}
	
	

	/**
	 *  
	 */
	assistant.renderSuccessfulPost = function(event, data) {
		if (sch.isArray(data)) {
			data = data[0];
		}

		data.text = makeItemsClickable(data.text);
		dump(data);

		var itemhtml = Mojo.View.render({object: data, template: 'shared/tweet'});
		


		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		if (jQuery('#my-timeline').length == 1) {
			jQuery('#my-timeline').prepend(itemhtml);
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
		this.filterTimeline();

		this.playAudioCue('send');
		
		this.hideInlineSpinner('#post-panel-spinner-container');			
		this.hidePostPanel(event);
		this.clearPostPanel(event);
		// this.controller.showAlertDialog({
		//     title: $L("Posting success"),
		//     message: $L("Twitter got your post. wikked!"),
		//     choices:[
		//          {label:$L("OK"), value:"ok", type:'dismiss'}    
		//     ]
		// });
		
		// this.spinnerOff();


	}
	
	
	/**
	 *  
	 */
	assistant.reportFailedPost = function(event) {
		this.hideInlineSpinner('#post-panel-spinner-container');			
		this.hidePostPanel(event);
		this.clearPostPanel(event);
		Mojo.Controller.errorDialog("Twitter never told us if your post was successful. Maybe it was, maybe it wasn't!");
	}
	
	
	/**
	 *  
	 */
	assistant.prepMessage = function() {
		this.showPostPanel();
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
		eb.val('');
		eb[0].setSelectionRange(0, 0);
		
		this._updateCharCount();

	};

	
	/**
	 *  
	 */
	assistant.prepRetweet = function(entryobj) {
		this.showPostPanel();
		var text = entryobj.SC_text_raw;
		var screenname = entryobj.user.screen_name;

		var rtstr = 'RT @' + screenname + ': '+text+'';

		if (rtstr.length > 140) {
			rtstr = rtstr.substr(0,139)+'…';
		}

	    var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
		eb.focus();
		eb.val(rtstr);
		eb[0].setSelectionRange(eb.val().length, eb.val().length);
		
		this._updateCharCount();

	};

	/**
	 *  
	 */
	assistant.prepDirectMessage = function(username) {
		this.showPostPanel();
	    var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();
	    if (username) {
	        eb.val('d ' + username + ' ...');
	        eb[0].setSelectionRange(eb.val().length - 3, eb.val().length)
	    } else {
	        eb.val('d username');
	        eb[0].setSelectionRange(2, eb.val().length);
	    }
	
		this._updateCharCount();

	};



	/**
	 *  
	 */
	assistant.prepPhotoPost = function(url) {
	    
		this.showPostPanel();
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();
	    if (url) {
	        eb.val(url + ' desc');
	        eb[0].setSelectionRange(eb.val().length - 4, eb.val().length);
	        return true;
	    } else {
	        return false;
	    }
	
		this._updateCharCount();

	}



	/**
	 *  
	 */
	assistant.prepReply = function(username, status_id) {
		this.showPostPanel();
	
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();

	    if (username) {
	        var newText = '@' + username + ' ';

	        if (eb.val() != '') {
	            eb.val(newText + eb.val());
	            eb[0].setSelectionRange(eb.val().length, eb.val().length);
	        } else {
	            eb.val('@' + username + ' ...');
	            eb[0].setSelectionRange(eb.val().length - 3, eb.val().length);
	        }
	    } else {
	        var newText = '@';
	        if (eb.val() != '') {
	            eb.val(newText + ' ' + eb.val());
	        } else {
	            eb.val('@');
	        }
	        eb[0].setSelectionRange(newText.length, newText.length);
	    }
		
		if (status_id) {
			// get the status text
			this.setPostIRT(status_id, this.statusobj)
		} else {
			
		}
		
		this._updateCharCount();
	};



	/**
	 *  
	 */
	assistant.setPostIRT = function(status_id, statusobj) {
		if (statusobj && statusobj.SC_text_raw) {
			var status_text = statusobj.SC_text_raw;
		} else {
			var status_text = 'status #'+status_id;
		}
		
		// update the GUI stuff
		jQuery('#post-panel-irt-message', this.controller.getSceneScroller())
			.html(status_text)
			.attr('data-status-id', status_id);
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideDown('fast');
	};
	

	/**
	 *  
	 */
	assistant.clearPostIRT = function() {
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideUp('fast');
		jQuery('#post-panel-irt-message').html('').attr('data-status-id', '0');
	};



	/**
	 * 
	 */
	assistant.searchFor = function(terms) {
		// findAndSwapScene("search-twitter", {
		Mojo.Controller.stageController.pushScene("search-twitter", {
			'searchterm': terms
		});
	}



	/**
	 * turn the spinner on, and optionally set the message
	 * @param {string} message 
	 */
	assistant.spinnerOn = function(message) {

		var thisA = this;
		jQuery('div.spaz-activity-spinner', this.controller.getSceneScroller()).html('Loading').fadeIn('fast', function() {
			thisA.spinnerModel.spinning = true;
			thisA.controller.modelChanged( thisA.spinnerModel );
		});
		
	}

	/**
	 * Turns off the spinner. does NOT hide the status panel. Optionally sets message
	 * @param {string} message
	 */
	assistant.spinnerOff = function(message) {
		var thisA = this;
		jQuery('div.spaz-activity-spinner', this.controller.getSceneScroller()).html('Loading').fadeOut('fast', function() {
			thisA.spinnerModel.spinning = false;
			thisA.controller.modelChanged( thisA.spinnerModel );
		});
	}
	
	
	/**
	 *  destroys and existing spinners and creates a new one, showing it
	 */
	assistant.showInlineSpinner = function(container, message) {
		/*
			remove any existing
		*/
		jQuery('.progress-panel', container).remove(); 
		
		var html = '<div class="progress-panel" style="display:none"> \
			<img src="images/theme/loading.gif" class="progress-panel-spinner" /> \
			<span class="progress-panel-label">'+message+'</span> \
		</div>'
		jQuery(container).prepend(html);
		jQuery('.progress-panel', container).show('blind', 'fast');
		// jQuery('.progress-panel', container).fadeIn('fast');
		
	};

	/**
	 *  stops, but does not remove, the spinner
	 */
	assistant.stopInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel-spinner', container).hide('blind', 'fast');
		jQuery('.progress-panel-label', container).html(message);
	};


	/**
	 *  starts an existing spinner
	 */
	assistant.startInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel', container).show('blind', 'fast');
		jQuery('.progress-panel-label', container).html(message);
	};


	/**
	 *  hides and DESTROYS an existing spinner
	 */
	assistant.hideInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel', container).hide('blind', 'fast', function() {
			jQuery(this).remove();
		});
		
	};
	
	
	
	assistant.newMsgBanner = function(count) {
				
		var launchArgs = {
			'from':'newMessagesBanner'
		};
		
		var category = 'newMessages';
		
		var appController = Mojo.Controller.getAppController();

		appController.showBanner("There are "+count+" new messages", launchArgs, category);
	}
	
	
	
	
	assistant.showNotification = function(msg) {
		
		// var kDashboardStageName = 'spaz-dashboard'
		// 
		// var appController = Mojo.Controller.getAppController();
		// this.controller.commitChanges();
		// appController.showBanner(msg, {banner: msg});
		// var stageController = Mojo.Controller.getAppController().getStageController(kDashboardStageName);
		// if (stageController) {
		// 	stageController.delegateToSceneAssistant("update", msg, new Date());
		// } else {
		// 	this.notificationCreatedHandler = this.notificationCreated.bind(this, msg);
		// 	Mojo.Controller.getAppController().createStageWithCallback({name: kDashboardStageName, lightweight: true}, 
		// 		this.notificationCreatedHandler, "dashboard");			
		// }
	};
	
	// assistant.notificationCreated = function(text, stageController) {
	// 	stageController.pushScene('dashboard', text, new Date())
	// };
	
	
	
	
	assistant._initSound = function() {

		var makeCue = function(clip) {
			var cue = new Audio();
			cue.src = clip;
			cue.autoplay = false;
			
			return cue;
		};
		
		this.audioCues = {
			'newmsg':  makeCue('sounds/New.mp3'),
			'send':    makeCue('sounds/CSnd.mp3'),
			'receive': makeCue('sounds/CRcv.mp3'),
			'startup': makeCue('sounds/On.mp3'),
			'shutdown':makeCue('sounds/Off.mp3'),
			'wilhelm': makeCue('sounds/wilhelm.mp3')
		};


	}
	
	
	
	assistant.playAudioCue = function(clip) {

		if (!this.audioCues) {
			this._initSound();
		};

		switch(clip) {
			case 'newmsg':
				this.audioCues.newmsg.play();
				break;

			case 'send':
				this.audioCues.send.play();
				break;

			case 'receive':
				this.audioCues.receive.play();
				break;

			case 'startup':
				this.audioCues.startup.play();
				break;

			case 'shutdown':
				this.audioCues.shutdown.play();
				break;

			case 'wilhelm':
				this.audioCues.wilhelm.play();
				break;
		};
	};
	
}



/************************************
 * global scene helper functions
 ************************************/

/**
 * This helper looks through the array of scenes and looks for an existing instance of 
 * the given targetScene. If one exists, we pop all scenes before it to return to it. Otherwise
 * we swap to a new instance of the scene
 * 
 * @param {string} targetScene the scene name
 * @param {many} returnValue a return value passed to the pop or swap call
 */
var findAndSwapScene = function(targetScene, returnValue) {
	/*
		initialize
	*/
	var scene_exists = false;
	
	/*
		get an array of existing scenes
	*/
	var scenes = Mojo.Controller.stageController.getScenes();
	

	for (var k=0; k<scenes.length; k++) {
		if (scenes[k].sceneName == targetScene) { // this scene already exists, so popScenesTo it
			scene_exists = true;
		}
	}
	
	if (scene_exists) {
		Mojo.Controller.stageController.popScenesTo(targetScene, returnValue);
	} else {
		Mojo.Controller.stageController.swapScene(targetScene, returnValue);
	}
};


/**
 * converts various items in a timeline entry's text into clickables
 * @param {string} str
 * @return {string}
 */
var makeItemsClickable = function(str) {
	
	str = sch.autolink(str);
	str = sch.autolinkTwitterScreenname(str, '<span class="username clickable" data-user-screen_name="#username#">@#username#</span>');
	str = sch.autolinkTwitterHashtag(str, '<span class="hashtag clickable" data-hashtag="#hashtag#">##hashtag#</span>');
	
	return str;
};




