/**
 * helpers for scene assistants in Spaz on Luna 
 */
var scene_helpers = {}

/**
 * This adds a number of common scene methods to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	/**
	 * We might move this outside of the "assistant.XXX" namespace 
	 */
	assistant.findAndSwap = function(targetScene, returnValue) {
		/*
			initialize
		*/
		var scene_exists = false;
		
		/*
			get an array of existing scenes
		*/
		var scenes = Luna.Controller.stageController.getScenes();
		

		for (var k=0; k<scenes.length; k++) {
			if (scenes[k].sceneName == targetScene) { // this scene already exists, so popScenesTo it
				scene_exists = true;
			}
		}
		
		if (scene_exists) {
			Luna.Controller.stageController.popScenesTo(targetScene, returnValue);
		} else {
			Luna.Controller.stageController.swapScene(targetScene, returnValue);
		}
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
		
		if (opts.viewMenuItems) {
			var viewMenuItems = opts.viewMenuItems;
		} else {
			var viewMenuItems = [
				{
					items: [
						{label: $L(opts.viewMenuLabel), command:'scroll-top'},
						{label: $L('Filter timeline'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'},
					]
				},
				{
					items: [
						{label:$L('Compose'),  icon:'compose', command:'compose', shortcut:'N'},
						{label:$L('Update'),   icon:'sync', command:'refresh', shortcut:'R'}					
					]
				}
			];
		}
		
		/*
			View menu at top of screen
		*/
		this.viewMenuModel = {
			label: $L('viewmenu'), 
			items: viewMenuItems,
		};
		this.controller.setupWidget(Luna.Menu.viewMenu, undefined, this.viewMenuModel);
		
		




		if (opts.cmdMenuItems) {
			var cmdMenuItems = opts.cmdMenuItems;
		} else {
			var cmdMenuItems = [{ items:
				[
					{},
					{label:$L('Home'),        command:'home', shortcut:'H'},
					{label:$L('My Timeline'), icon:'conversation', command:'my-timeline', shortcut:'T'},
					{label:$L('Search'),      icon:'search', command:'search', shortcut:'S'},
					{label:$L('Followers'),   command:'followers', shortcut:'L'},
					{}
				]
			}]
		}


		/*
			Command menu at bottom of screen
		*/
		this.cmdMenuModel = {
			visible:true,
			items: cmdMenuItems
		};
		
		
		
		this.controller.setupWidget(Luna.Menu.commandMenu, undefined, this.cmdMenuModel);


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
		var spinner_id = this.scroller.id.replace(/luna-scene-([a-z_-]+)-scene-scroller/gi, "$1")+'-spinner';
		
		this.spinnerModel = {
			'spinning':false
		}
		this.controller.setupWidget(spinner_id, {
				property: 'spinning'
			},
			this.spinnerModel
		);

	};




	/**
	 *  
	 */
	assistant.handleCommand = function(event){
		if (event.type == Luna.Event.command) {
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
					// console.log('is child window:'+Luna.Controller.StageController.isChildWindow(this));
					this.findAndSwap("login", this);
					break;
				case 'my-timeline':
					// console.log('is child window:'+Luna.Controller.StageController.isChildWindow(this));
					this.findAndSwap("my-timeline", this);
					break;
				case 'search':
					// console.log('is child window:'+Luna.Controller.StageController.isChildWindow(this));
					this.findAndSwap("search-twitter", this);
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
					Luna.Controller.stageController.popScene();
					break;


				/*
					This would refresh the current view
				*/
				case 'refresh':
					this.refresh(); // need to have a "refresh" method defined for each scene asst
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
		this.scroller.palm.revealElement(jQuery('.timeline>div.timeline-entry:first', this.scroller).get());
	};
	
	/**
	 *  
	 */
	assistant.scrollToBottom = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.scroller.palm.revealBottom();
		
	};
	
	/**
	 *  
	 */
	assistant.scrollToNew = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.scroller.palm.revealElement(jQuery('.timeline>div.timeline-entry.new:last', this.scroller).get());
		
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
		
		var itemhtml = Luna.View.render({object: null, template: 'shared/post-popup'});
		jQuery('#post-popup-container', scroll_el).html(itemhtml);
		
		Luna.Event.listen($('post-send-button'), Luna.Event.tap, this.sendPost.bind(this));
		Luna.Event.listen($('post-cancel-button'), Luna.Event.tap, this.cancelPost.bind(this));

		
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
		// jQuery('#post-panel-irt-dismiss').bind(Luna.Event.tap, function(e) {
		// 	thisA.clearPostIRT();
		// });
		
		
	}


	/**
	 *  
	 */
	assistant.removePostPopup = function(event) {
		Luna.Event.stopListening($('post-send-button'), Luna.Event.tap, this.sendPost); 
		Luna.Event.stopListening($('post-cancel-button'), Luna.Event.tap, this.cancelPost);
		
		jQuery('#post-panel-textarea').unbind('keyup');
		jQuery('#post-panel-textarea').unbind('keydown');
		jQuery('#post-panel-textarea').unbind('blur');
		jQuery('#post-panel-textarea').unbind('focus');
		
		jQuery('#post-panel-irt-dismiss').unbind(Luna.Event.tap);
		
		
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
		this.spinnerOn();
		var status = jQuery('#post-panel-textarea').val();

		if (status.length > 0) {
			
			var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'));
			
			if (in_reply_to > 0) {
				sc.app.twit.update(status, null, in_reply_to);
			} else {
				sc.app.twit.update(status, null, null);
			}
			
			this.hidePostPanel(event);
			this.clearPostPanel(event);
			
		}
	}
	
	

	/**
	 *  
	 */
	assistant.renderSuccessfulPost = function(event, data) {
		if (sch.isArray(data)) {
			data = data[0];
		}

		data.text = sch.autolink(data.text);
		data.text = sch.autolinkTwitter(data.text);
		console.dir(data);

		var itemhtml = Luna.View.render({object: data, template: 'shared/tweet'});

		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		jQuery('#my-timeline').prepend(itemhtml);
		this.spinnerOff();

	}
	
	
	/**
	 *  
	 */
	assistant.reportFailedPost = function(event) {
		this.spinnerOff();
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
		this.findAndSwap("search-twitter", {
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
	 *  
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
		jQuery('.progress-panel', container).slideDown('fast');
		// jQuery('.progress-panel', container).fadeIn('fast');
		
	};

	/**
	 *  
	 */
	assistant.stopInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel-spinner', container).fadeOut('fast');
		jQuery('.progress-panel-label', container).html(message);
	};


	/**
	 *  
	 */
	assistant.startInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel-spinner', container).fadeIn('fast');
		jQuery('.progress-panel-label', container).html(message);
	};


	/**
	 *  
	 */
	assistant.hideInlineSpinner = function(container, message) {
		// jQuery('.progress-panel', container).fadeOut('fast');
		jQuery('.progress-panel', container).slideUp('fast', function() {
			jQuery(this).remove();
		});
		
	};
	
	

	
}
