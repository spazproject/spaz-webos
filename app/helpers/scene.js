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

		var default_items = [
			Mojo.Menu.editItem,
			{ label: $L('New Search Card'),	command: 'new-search-card' },
			{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
			{ label: $L('About Spaz'),		command: 'appmenu-about' },
			{ label: $L('Help...'),			command:Mojo.Menu.helpCmd }
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
		var params = {name: stageName, assistantName:'StageLightweightSearchAssistant', nocache: true };
		var callback = function(stageController) {
			stageController.pushScene(sceneName, sceneArgs, stageName);
		};
		Mojo.Controller.getAppController().createStageWithCallback(params, callback);
	};

	/**
	 *  
	 */
	assistant.handleCommand = function(event){
		
		dump(event.command);
		
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
				case 'favorites':
					findAndSwapScene("favorites", this);
					break;
				case 'search':
					findAndSwapScene("search-twitter", this);
					break;
				case 'new-search-card':

					sc.app.new_search_card++;
					this.createStage('search-twitter', { 'lightweight':true }, sc.app.search_card_prefix+sc.app.new_search_card);

					// findAndSwapScene("search-twitter", this);
					break;
				case 'followers':
					findAndSwapScene("manage-followers", this);
					break;

				case 'appmenu-about':
					Mojo.Controller.stageController.pushScene("about", this);
					break;
				case Mojo.Menu.prefsCmd:
					Mojo.Controller.stageController.pushScene("preferences", this);
					break;
				case Mojo.Menu.helpCmd:
					Mojo.Controller.stageController.pushScene("help", this);
					// findAndSwapScene("preferences", this);
					break;
				case 'update-location':
					this.showLocationPanel();
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
		dump('Scrolling to top');
		jQuery(this.scroller).scrollTo( {'top':0,'left':0}, { axis:'y', duration:0 } );
	};
	
	/**
	 *  
	 */
	assistant.scrollToBottom = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		dump('Scrolling to bottom');
		jQuery(this.scroller).scrollTo( jQuery(this.scroller).height(), { axis:'y', duration:0 } );
	};
	
	/**
	 *  
	 */
	assistant.scrollToNew = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		var num_new   = jQuery('.timeline>div.timeline-entry.new:visible', this.scroller).length;
		var first_new = jQuery('.timeline>div.timeline-entry.new:visible:last', this.scroller).get(0);
		
		if (first_new) {
			dump('Scrolling to first new item');
			if (num_new == 1) { // if only one new, just scroll to the top
				this.scrollToTop();
			} else {
				jQuery(this.scroller).scrollTo(first_new, { axis:'y', duration:0, offset:{top:-100} });				
			}
		} else {
			dump('No new items to scroll to');
		}
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

		alert('DEPRECATED');

		
	}
	
	
	assistant.initTwit = function() {
		// var username = sc.app.prefs.get('username');
		// var password = sc.app.prefs.get('password');

		this.twit = new scTwit();
		this.twit.setSource(sc.app.prefs.get('twitter-source'));

		if (sc.app.username && sc.app.password) {
			// alert('seetting credentials for '+sc.app.username);
			this.twit.setCredentials(sc.app.username, sc.app.password);
		} else {
			// alert('NOT seetting credentials for!');
		}
	};
	


	/**
	 *  
	 */
	assistant.removePostPopup = function(event) {
		
		alert('DEPRECATED');
		
	}


	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/location-popup',
	          assistant: new LocationDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	assistant.showPostPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/post-popup',
	          assistant: new PostDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	
	/**
	 *  
	 */
	assistant.prepMessage = function() {
		this.showPostPanel();
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
		eb.val('');
		eb[0].setSelectionRange(0, 0);
		
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
		
		// this._updateCharCount();

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
	
		// this._updateCharCount();

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
	
		// this._updateCharCount();

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
		
		// this._updateCharCount();
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
	assistant.searchFor = function(terms, scenetype) {

		var lightweight = false;
		if (scenetype === 'lightweight') {
			lightweight = true;
		}
		
		/*
			if username and pass aren't set, use lightweight version
		*/
		if (!(sc.app.username && sc.app.password)) {
			lightweight = true;
		}
			
		Mojo.Controller.stageController.pushScene("search-twitter", {
			'searchterm': terms,
			'lightweight': lightweight
		});
	}



	// /**
	//  *  destroys and existing spinners and creates a new one, showing it
	//  */
	// assistant.showInlineSpinner = function(container, message, nofadein) {
	// 	dump('showing!'+"\n"+container+"\n"+message+"\n"+nofadein);
	// 	
	// 	/*
	// 		remove any existing
	// 	*/
	// 	jQuery(container).empty();
	// 	// jQuery('.inline-spinner', container).remove(); 
	// 	
	// 	var html = '<div class="inline-spinner" style="display:none">'+
	// 		'<img src="images/theme/loading.gif" class="inline-spinner-spinner" />'+
	// 		'<span class="inline-spinner-label">'+message+'</span>'+
	// 	'</div>';
	// 	jQuery(container).html(html);
	// 	if (!nofadein) {
	// 		jQuery('.inline-spinner', container).show('blind', 'fast');
	// 	} else {
	// 		jQuery('.inline-spinner', container).show();
	// 	}
	// 	
	// 	dump("SPINNER CONTAINER HTML (start):"+jQuery(container).get(0).outerHTML);
	// 	// jQuery('.inline-spinner', container).fadeIn('fast');
	// 	
	// };
	
	
	assistant.setupInlineSpinner = function(id) {
		// alert('setup:'+id);
		this.controller.setupWidget(id, {spinnerSize: Mojo.Widget.spinnerSmall}, {});
	};
	
	assistant.showInlineSpinner = function(id, message) {
		// alert('showing!'+"\n"+id+"\n"+message);

		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		$(id).mojo.start();
		
		dump("SPINNER CONTAINER HTML (start):"+jQuery('#'+id+'-container').get(0).outerHTML);
	};
	
	


	/**
	 *  stops, but does not remove, the spinner
	 */
	assistant.stopInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id).get(0).mojo.stop();
	};


	/**
	 *  starts an existing spinner
	 */
	assistant.startInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		jQuery('#'+id).get(0).mojo.start();
	};


	/**
	 *  hides and DESTROYS an existing spinner
	 */
	// assistant.hideInlineSpinner = function(container, message, nofadeout) {
	// 	dump('hiding!'+"\n"+container+"\n"+message+"\n"+nofadeout);
	// 	
	// 	if (!nofadeout) {
	// 		jQuery('.inline-spinner', container).hide('blind', 'fast', function() {
	// 			jQuery(container).empty();
	// 		});
	// 	} else {
	// 		jQuery(container).empty();
	// 	}
	// 	
	// };
	assistant.hideInlineSpinner = function(id) {
		jQuery('#'+id).get(0).mojo.stop();
		jQuery('#'+id+'-container').hide();
	}
	

	/**
	 *  immediately DESTROYS an existing spinner
	 */
	assistant.clearInlineSpinner = function(container) {
		dump("clearing inline spinner");
		jQuery(container).empty();		
	};
	
	
	
	
	assistant.activateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(button);
		buttonWidget.mojo.activate();
	}

	assistant.deactivateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(button);
		buttonWidget.mojo.deactivate();
	}
	
	
	
	
	assistant.newMsgBanner = function(count) {
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var category = 'newMessages';
		var appController = Mojo.Controller.getAppController();

		appController.showBanner("There are "+count+" new messages", launchArgs, category);
	}



	assistant.newSearchResultsBanner = function(count, query) {				
		var category = 'newSearchResults_'+query;
		var appController = Mojo.Controller.getAppController();
		var stageController = appController.getActiveStageController();
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		appController.showBanner(count+" new results for '"+query+"'", launchArgs, category);
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



	assistant.processAjaxError = function(errobj) {		

		var human_msg, twiterr_req, twiterr_msg;
		
		switch(errobj.msg) {
			case 'timeout':
				
				human_msg = $L('The request timed out – server did not respond in time');
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
					twiterr_req = twiterr.request;
					twiterr_msg = twiterr.error;
				} catch (e) {
					dump('Tried to decode JSON from responseText, but failed');
					dump(e.name + ":" + e.message);
				}
				
				break;
				
			case 'notmodified':
			
				human_msg = $L('Not modified');
				
				break;
				
			case 'parsererror':
				
				human_msg = $L('Error parsing XML returned by request');
				
				break;
			
			default:
			
				human_msg = $L('Ajax Error');
				break;
		}
		
		if (errobj.xhr) {
			var error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText':	errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			}
		} else {
			var error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText':	errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			}
			
		}

		return error_processed;
		
	};
	
	
	assistant.displayErrorInfo = function(msg, errors, template) {
		
		var error_info;
		var error_html = '';
		
		dump(errors);
		
		if (!sch.isArray(errors)) {
			var err = errors;
			errors = [errors];
		}
		
		dump(errors);
		
		if (!template) {
			template = 'error_info';
		} 

		
		if ( errors ) {
			for (var i = 0; i < errors.length; i++) {
				error_info  = this.processAjaxError(errors[i]);
				if (error_html.length>0) {
					error_html += '<hr>';
				}
				error_html += sc.app.tpl.parseTemplate(template, error_info);
			}
		}
				
		Mojo.Controller.errorDialog(msg+"<br>\n"+error_html);
		
	}


	assistant.clearTimelineCache = function(callback) {
		var thisA = this;
		
		// Mojo.Log.info('Timeline Caching disabled for now');
		var cacheDepot = new Mojo.Depot({
			name:'SpazDepotTimelineCache',
			replace:false
		});
		
		var users = sc.app.prefs.get('users');
		
		for (var i=0; i<users.length; i++) {
			var username = users[i].username;
			cacheDepot.simpleAdd(username, {},
				function() { 
					// thisA.showAlert('Cache cleared');
					dump('Cache '+username+' cleared');
				},
				function() { 
					// Mojo.Controller.errorDialog('Cache clearing FAILED');
					dump('Cache '+username+' clear failed');
				}
			);
		}
		
	}
	
	
	
	
	/**
	 * A helper to easily display JS alert()-style popups
	 * @param {string} msg  required 
	 * @param {string} title  optional 
	 * @param {function} ok_cb  callback like function(value) where value is value assigned to OK button. Optional
	 */
	assistant.showAlert = function(msg, title, ok_cb) {

		var opts = {};

		if (title) { opts['title'] = title };
		if (ok_cb) { opts['onChoose'] = okcb }

		this.controller.showAlertDialog({
			onChoose: function(value) {this.outputDisplay.innerHTML = $L("Alert result = ") + value;},
			title: $L("Filet Mignon"),
			message: $L("How would you like your steak done?"),
			choices:[
				{label:$L('Rare'), value:"refresh", type:'affirmative'},  
				{label:$L("Medium"), value:"don't refresh"},
				{label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
				{label:$L("Nevermind"), value:"maybe refresh", type:'dismiss'}    
			]
		});
	};
	
	
	
	assistant.getStageName = function() {
		if (window.name) {
			var stagename = window.name;
		} else {
			var stagename = 'main';
		}
		return stagename;
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

		this._setNotFullScreen = function(event) {
			this.isFullScreen = false;//send notifications
		};
		this._setFullScreen = function(event) {
			this.isFullScreen = true; //dont send notifications
		};

		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen.bind(this));
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen.bind(this));
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
	
	str = sch.autolink(str, null, null, 20);
	str = sch.autolinkTwitterScreenname(str, '<span class="username clickable" data-user-screen_name="#username#">@#username#</span>');
	str = sch.autolinkTwitterHashtag(str, '<span class="hashtag clickable" data-hashtag="#hashtag#">##hashtag#</span>');

	
	return str;
};

var dump = sc.helpers.dump;















/*
	Small controller class used for the new account dialog
*/
var PostDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		this.postButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.postButtonModel = {
			buttonLabel : "Post",
			buttonClass: 'Primary'
		};
		
		this.controller.setupWidget('post-send-button', this.postButtonAttributes, this.postButtonModel);

		
	},
	
	activate: function() {
		var thisA = this;
		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/				

		Mojo.Event.listen($('post-send-button'), Mojo.Event.tap, this.sendPost.bind(this));
		// Mojo.Event.listen($('post-cancel-button'), Mojo.Event.tap, this.cancelPost.bind(this));

		jQuery('#post-panel-username').text(sc.app.username);

		
		/*
			if update succeeds
		*/
		jQuery().bind('update_succeeded', { thisAssistant:this }, function(e, data) {
			e.data.thisAssistant.renderSuccessfulPost(e, data);
		});

		/*
			if update fails
		*/
		jQuery().bind('update_failed', { thisAssistant:this }, function(e, error_obj) {
			e.data.thisAssistant.reportFailedPost(error_obj);
		});
		
		

				
		jQuery('#post-panel-textarea').bind('keyup',   function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('keydown', function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('blur',    function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('focus',   function(e) {
			thisA._updateCharCount();
		});
				
		jQuery('#post-panel-irt-dismiss').bind(Mojo.Event.tap, function(e) {
			thisA.clearPostIRT();
		});


	},
	
	
	deactivate: function() {
		Mojo.Event.stopListening($('post-send-button'), Mojo.Event.tap, this.sendPost); 
		// Mojo.Event.stopListening($('post-cancel-button'), Mojo.Event.tap, this.cancelPost);
		
		jQuery('#post-panel-textarea').unbind('keyup');
		jQuery('#post-panel-textarea').unbind('keydown');
		jQuery('#post-panel-textarea').unbind('blur');
		jQuery('#post-panel-textarea').unbind('focus');
		
		jQuery('#post-panel-irt-dismiss').unbind(Mojo.Event.tap);
		
		jQuery().unbind('update_succeeded');
		jQuery().unbind('update_failed');
		
	},
	
	
	
	
	/**
	 * @private 
	 */
	_updateCharCount: function() {
		var thisA = this;
		
		if (thisA._updateCharCountTimeout) {
			clearTimeout(thisA._updateCharCountTimeout);
		}

		function _updateCharCountNow() {
			var charcount = (140 - jQuery('#post-panel-textarea', thisA.controller.getSceneScroller()).val().length);
			jQuery('#post-panel-counter-number', thisA.controller.getSceneScroller()).text(charcount.toString());
			if (charcount < 0) {
				jQuery('#post-panel-counter', thisA.controller.getSceneScroller()).addClass('over-limit');
				/*
					disable post send button
				*/
				jQuery('#post-send-button', thisA.controller.getSceneScroller()).attr('disabled', 'disabled');
			} else {
				jQuery('#post-panel-counter', thisA.controller.getSceneScroller()).removeClass('over-limit');
				/*
					enable post send button
				*/
				jQuery('#post-send-button', thisA.controller.getSceneScroller()).attr('disabled', '');
			}	
		};
		
		this._updateCharCountTimeout = setTimeout(_updateCharCountNow, 300);
		
		
	},
	
	
	
	clearPostPanel: function() {
		this.clearPostIRT();
		jQuery('#post-panel-textarea', this.controller.getSceneScroller()).val('');
		this._updateCharCount();
	},


	clearPostIRT: function() {
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideUp('fast');
		jQuery('#post-panel-irt-message').html('').attr('data-status-id', '0');
	},


	/**
	 *  
	 */
	sendPost: function(event) {
		var status = jQuery('#post-panel-textarea').val();

		if (status.length > 0) {
			
			var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'));
			
			if (in_reply_to > 0) {
				this.sceneAssistant.twit.update(status, null, in_reply_to);
			} else {
				this.sceneAssistant.twit.update(status, null, null);
			}
			
		}
	},
	
	

	/**
	 *  
	 */
	renderSuccessfulPost: function(event, data) {
		if (sch.isArray(data)) {
			data = data[0];
		}

		data.text = makeItemsClickable(data.text);
		
		/*
			save this tweet to Depot
		*/
		sc.app.Tweets.save(data);
		
		dump(data);

		var itemhtml = sc.app.tpl.parseTemplate('tweet', data);
		


		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		if (jQuery('#my-timeline').length == 1) {
			jQuery('#my-timeline').prepend(itemhtml);
		}
			
		


		/*
			remove extra items
		*/
		// sch.removeExtraElements('#my-timeline>div.timeline-entry', sc.app.prefs.get('timeline-maxentries'));
		
		sch.removeExtraElements('#my-timeline>div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
		sch.removeExtraElements('#my-timeline>div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
		sch.removeExtraElements('#my-timeline>div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));
		

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('div.timeline-entry .meta>.date', 'data-created_at');
		
		/*
			re-apply filtering
		*/
		this.sceneAssistant.filterTimeline();

		this.sceneAssistant.playAudioCue('send');
		
		this.deactivateSpinner();
		
				
		this.hidePostPanel(event);
		// this.clearPostPanel(event);

	},
	
	
	/**
	 *  
	 */
	reportFailedPost: function(error_obj) {
		this.deactivateSpinner();

		// this.clearPostPanel(event);
		
		var err_msg = $L("There was a problem posting your status");
		this.sceneAssistant.displayErrorInfo(err_msg, error_obj);
		this.hidePostPanel(event);
	},
	
	hidePostPanel: function() {
		this.widget.mojo.close();
	},
	
	deactivateSpinner: function() {
		this.buttonWidget = this.controller.get('post-send-button');
		this.buttonWidget.mojo.deactivate();
	}
	
	
	
});






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
			"hintText":	      'Enter new location',
			"focusMode":      Mojo.Widget.focusSelectMode,
			"fieldName": 	  'update-location-textfield',
			"changeOnKeyPress": true
		};
		this.locationBoxModel = {
			'value':     '',
			'disabled':  false
		}
		this.controller.setupWidget('update-location-textfield', this.locationBoxAttr, this.locationBoxModel);
		
		
	},
	
	activate: function() {
		var thisA = this;
		Mojo.Event.listen($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.listen($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	deactivate: function() {
		var thisA = this;
		Mojo.Event.stopListening($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.stopListening($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	getLocation: function() {
		
		jQuery().bind('location_retrieved_success', function(geoloc, data) {
			alert(geoloc);
		});
		jQuery().bind('location_retrieved_failure', function(errorcode) {
			alert(errorcode);
		});
		
		var thisA = this;
		// thisA.activateButtonSpinner('get-location-button');


		var on_success = function(data) { // onsuccess
			dump(data);
			thisA.locationBoxModel.value = data.latitude.toString() + ',' + data.longitude.toString();
			thisA.controller.modelChanged(thisA.locationBoxModel);
			thisA.controller.get('get-location-button').mojo.deactivate();
		};
		var on_error = function(data) { // onerror
			dump(data);
			thisA.controller.get('get-location-button').mojo.deactivate();
		};
		
		var loc = new Mojo.Service.Request('palm://com.palm.location', {
				method:"getCurrentPosition",
				parameters:{
					'accuracy':     1,
					'responseTime': 1,
					'maximumAge':  30 // seconds
				},
				'onSuccess':on_success,
				'onFailure':on_error
			}
		);
		
		// sch.getCurrentLocation(
		// 	function() { // onsuccess
		// 		this.locationBoxModel.value = this.locationBoxModel;
		// 		this.controller.modelChanged(this.locationBoxModel);
		// 		thisA.deactivateButtonSpinner('get-location-button');
		// 	},
		// 	function() { // onerror
		// 		// no error message yet
		// 		thisA.deactivateButtonSpinner('get-location-button');
		// 	}
		// );
	},
	
	updateLocation: function() {
		var thisA = this;
		
	}
	
});