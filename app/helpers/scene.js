/**
 * helpers for scene assistants in Spaz on Luna 
 */
var scene_helpers = {}

/**
 * This adds a number of  
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	assistant.setupCommonMenus = function() {
		/*
			Command menu at bottom of screen
		*/
		this.cmdMenuModel = {
			visible:true,
			items: [
				{label:$L('Compose'), icon:'compose', command:'compose', shortcut:'N'},
				{},
				{label:$L('Top'), 	 command:'scroll-top', shortcut:'U'},
				{label:$L('Bottom'), command:'scroll-bottom', shortcut:'D'},
				{label:$L('Update'), icon:'sync', command:'refresh', shortcut:'R'}
			]
		};

		/*
			View menu at top of screen
		*/
		this.viewMenuModel = {
			label: $L('My Timeline'), 
			items: [
					{label: $L('My Timeline')}, {},
					{label: $L('View'), iconPath:'images/tab-icon-replies.png', submenu:'switch-menu'}
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
					{label:'Home/Login',	 		secondaryIconPath:'', command:'home'}, 
					{label:'Friends',	 			secondaryIconPath:'', command:'my-timeline'}, 
	                {label:$L('Replies'),			secondaryIconPath:'images/tab-icon-replies.png', command:'replies-timeline'}, 
	                {label:$L('Direct Messages'),	secondaryIconPath:'send', command:'direct-messages'}, 
	                {label:$L('Search Twitter'),	secondaryIconPath:'search', command:'search-twitter'},
	                {label:$L('Manage Followers'),	secondaryIconPath:'make-vip', command:'followers-following'}
			]
		};

		// Set up submenu widget that was wired into the viewMenu above
		this.controller.setupWidget("switch-menu", undefined, this.switchMenuModel);
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




	assistant.addPopupPost = function(event) {
		var itemhtml = Luna.View.render({object: null, template: 'shared/post-popup'});
		jQuery('#post-popup-container').html(itemhtml);
		Luna.Event.listen($('post-send-button'), 'luna-tap', this.sendPost.bind(this));
		Luna.Event.listen($('post-cancel-button'), 'luna-tap', this.hidePostPanel.bind(this));
	}


	assistant.removePopupPost = function(event) {
		Luna.Event.stopListening($('post-send-button'), 'luna-tap', this.sendPost); 
		Luna.Event.stopListening($('post-cancel-button'), 'luna-tap', this.sendPost);
	}


	assistant.sendPost = function(event) {
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
		var itemhtml = Luna.View.render({object: data, template: 'my-timeline/tweet'});

		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		jQuery('#my-timeline').prepend(itemhtml);

	}
	assistant.reportFailedPost = function(event) {

	}


	assistant.hidePostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel').fadeOut('fast');
	}
	assistant.showPostPanel = function(event) {
		jQuery('#palm-dialog-box.post-panel').fadeIn('fast');
		jQuery('#post-panel-textarea').focus();
	}
	
	
	
	assistant.loadUserDetail = function(userid) {
		
	}
	
}
