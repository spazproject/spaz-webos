/**
 * helpers for scene assistants in Spaz on Luna 
 */
var scene_helpers = {}

/**
 * This adds a number of  
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	
	/**
	 * opts is an object with key:val pairs, like so
	 * {
	 *	viewMenuLabel:'My Timeline';
	 *	switchMenuLabel:'View';
	 * } 
	 */
	assistant.setupCommonMenus = function(opts) {
		
		if (opts.viewMenuItems) {
			var viewMenuItems = opts.viewMenuItems;
		} else {
			var viewMenuItems = [{ items:
				[
					{label: $L(opts.viewMenuLabel), command:'scroll-top'},
					{label: $L('Show me'), iconPath:'images/theme/menu-icon-triangle-down.png', submenu:'filter-menu'}
				]
			}];
		}
		
		/*
			View menu at top of screen
		*/
		this.viewMenuModel = {
			label: $L(opts.viewMenuLabel), 
			items: viewMenuItems,
		};
		this.controller.setupWidget(Luna.Menu.viewMenu, undefined, this.viewMenuModel);
		
		


		/*
			Command menu at bottom of screen
		*/
		this.cmdMenuModel = {
			visible:true,
			items: [
				{label:$L('Compose'), icon:'compose', command:'compose', shortcut:'N'},
				{label:$L('Search'), icon:'search', command:'search', shortcut:'S'},
				{},
				{},
				{label:$L('Update'), icon:'sync', command:'refresh', shortcut:'R'}
			]
		};
		this.controller.setupWidget(Luna.Menu.commandMenu, undefined, this.cmdMenuModel);


		this.timelineFilterMenuModel = {
			items: [
					{label:$L('Show All Messages'),		secondaryIconPath:'', command:'home'}, 
					{label:$L('Replies and Direct Messages'),			secondaryIconPath:'', command:'replies-timeline'}, 
					{label:$L('Just Replies'),			secondaryIconPath:'', command:'replies-timeline'}, 
					{label:$L('Just Direct Messages'),	secondaryIconPath:'', command:'direct-messages'}, 
			]
		};

		// Set up submenu widget that was wired into the viewMenu above
		this.controller.setupWidget("filter-menu", undefined, this.timelineFilterMenuModel);


		/*
			Spinner
		*/
		this.spinnerModel = {
			'spinning':false
		}
		this.controller.setupWidget('spaz-activity-spinner', {
				property: 'spinning'
			},
			this.spinnerModel
		);
		
		// /*
		// 			Popup menu for SwitchView
		// 		*/
		// 		this.switchMenuModel = {
		// 			label: $L(opts.switchMenuLabel),
		// 			items: [
		// 					{label:'Home/Login',	 		secondaryIconPath:'', command:'home'}, 
		// 					{label:'Friends',	 			secondaryIconPath:'', command:'my-timeline'}, 
		// 	                {label:$L('Replies'),			secondaryIconPath:'images/tab-icon-replies.png', command:'replies-timeline'}, 
		// 	                {label:$L('Direct Messages'),	secondaryIconPath:'send', command:'direct-messages'}, 
		// 	                {label:$L('Search Twitter'),	secondaryIconPath:'search', command:'search-twitter'},
		// 	                {label:$L('Manage Followers'),	secondaryIconPath:'make-vip', command:'followers-following'}
		// 			]
		// 		};
		// 
		// 		// Set up submenu widget that was wired into the viewMenu above
		// 		this.controller.setupWidget("switch-menu", undefined, this.switchMenuModel);
	};




	// This is where commands from the viewMenu (and our submenu wired into it) are handled.
	// if you have a viewMenu with commands as we do, you need to define one of these in your assistant
	assistant.handleCommand = function(event){
		if (event.type == Luna.Event.command) {
			switch (event.command) {

				/*
					Switch View
				*/
				case 'home':
					Luna.Controller.stageController.swapScene("login", this);
					break;
				case 'my-timeline':
					Luna.Controller.stageController.swapScene("my-timeline", this);
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
					this.showPostPanel();
					break;

				/*
					Scroll to top
				*/
				case 'scroll-top':
					dump("Scroll to top");
					this.scroller.palm.revealElement(jQuery('#my-timeline>div.timeline-entry:first').get());
					break;
				/*
					Scroll to bottom
				*/
				case 'scroll-bottom':
					dump("Scroll to bottom");
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




	assistant.addPostPopup = function(event) {
		var itemhtml = Luna.View.render({object: null, template: 'shared/post-popup'});
		jQuery('#post-popup-container').html(itemhtml);
		Luna.Event.listen($('post-send-button'), 'luna-tap', this.sendPost.bind(this));
		Luna.Event.listen($('post-cancel-button'), 'luna-tap', this.hidePostPanel.bind(this));
	}


	assistant.removePostPopup = function(event) {
		Luna.Event.stopListening($('post-send-button'), 'luna-tap', this.sendPost); 
		Luna.Event.stopListening($('post-cancel-button'), 'luna-tap', this.sendPost);
	}


	assistant.sendPost = function(event) {
		this.spinnerOn();
		var status = jQuery('#post-panel-textarea').val();

		if (status.length > 0) {
			sc.app.twit.update(status, null, null);
			this.hidePostPanel(event);
		}
	}

	assistant.renderSuccessfulPost = function(event, data) {
		if (sch.isArray(data)) {
			data = data[0];
		}


		data.text = sch.autolink(data.text);
		data.text = sch.autolinkTwitter(data.text);
		console.dir(data);

		/*
			Render the new tweets as a collection (speed increase, I suspect)
		*/
		var itemhtml = Luna.View.render({object: data, template: 'shared/tweet'});

		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		jQuery('#my-timeline').prepend(itemhtml);
		this.spinnerOff();

	}
	assistant.reportFailedPost = function(event) {
		this.spinnerOff();
	}


	assistant.hidePostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel').fadeOut('fast');
	}
	assistant.showPostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel').fadeIn('fast');
		jQuery('#post-panel-textarea').focus();
	}
	

	/**
	 * turn the spinner on, and optionally set the message
	 * @param {string} message 
	 */
	assistant.spinnerOn = function(message) {
		this.spinnerModel.spinning = true;
		this.controller.modelChanged( this.spinnerModel );
	}

	/**
	 * Turns off the spinner. does NOT hide the status panel. Optionally sets message
	 * @param {string} message
	 */
	assistant.spinnerOff = function(message) {
		this.spinnerModel.spinning = false;
		this.controller.modelChanged( this.spinnerModel );
	}
	

	
}
