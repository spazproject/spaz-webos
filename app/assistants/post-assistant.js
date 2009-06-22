function PostAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	if (args) {
		this.args = args;
	}
}

PostAssistant.prototype.setup = function() {	
	this.buttonAttributes = {
		type: Mojo.Widget.activityButton
	};
	this.postButtonModel = {
		buttonLabel : "Post",
		buttonClass: 'primary'
	};
	this.shortenTextButtonModel = {
		buttonLabel : "Shorten text",
		buttonClass: 'secondary'
	};
	this.shortenURLsButtonModel = {
		buttonLabel : "Shorten URLs",
		buttonClass: 'secondary'
	};
	this.postTextFieldModel = {
		value:'',
		disabled:false
	};
	
	this.controller.setupWidget('post-send-button',         this.buttonAttributes, this.postButtonModel);
	this.controller.setupWidget('post-shorten-text-button', this.buttonAttributes, this.shortenTextButtonModel);
	this.controller.setupWidget('post-shorten-urls-button', this.buttonAttributes, this.shortenURLsButtonModel);
	this.controller.setupWidget('post-textfield', {
			'multiline':true,
			'enterSubmits':false,
			'autoFocus':true,
			'changeOnKeyPress':true
		},
	this.postTextFieldModel);
	

};

PostAssistant.prototype.activate = function(event) {
	var thisA = this;
	
	
	this.postTextField = $('post-textfield');
	
	
	if (this.args) {
		
		if (this.args.text) { this.postTextField.mojo.setText(this.args.text); }
		
		if (this.args.type) { /*type is ignored for now*/ }
		
		/*this.postTextField.mojo.setCursorPosition(this.args.select_start, this.args.select_start+this.args.select_length);*/
		
		if (this.args.irt_status_id) {
			this.setPostIRT(this.args.irt_status_id, this.args.irt_status);
		}

	}
	
	
	
	Mojo.Event.listen($('post-send-button'), Mojo.Event.tap, this.sendPost.bind(this));
	Mojo.Event.listen($('post-shorten-text-button'), Mojo.Event.tap, this.shortenText.bind(this));
	Mojo.Event.listen($('post-shorten-urls-button'), Mojo.Event.tap, this.shortenURLs.bind(this));

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

			
	jQuery('#post-textfield').bind('keyup',   function(e) {
		thisA._updateCharCount();
	});
	jQuery('#post-textfield').bind('keydown', function(e) {
		thisA._updateCharCount();
	});
	jQuery('#post-textfield').bind('blur',    function(e) {
		thisA._updateCharCount();
	});
	jQuery('#post-textfield').bind('focus',   function(e) {
		thisA._updateCharCount();
	});
			
	jQuery('#post-panel-irt-dismiss').bind(Mojo.Event.tap, function(e) {
		thisA.clearPostIRT();
	});


};


PostAssistant.prototype.deactivate = function(event) {
	Mojo.Event.stopListening($('post-send-button'), Mojo.Event.tap, this.sendPost); 
			
	jQuery('#post-textfield').unbind('keyup');
	jQuery('#post-textfield').unbind('keydown');
	jQuery('#post-textfield').unbind('blur');
	jQuery('#post-textfield').unbind('focus');
	
	jQuery('#post-panel-irt-dismiss').unbind(Mojo.Event.tap);
	
	jQuery().unbind('update_succeeded');
	jQuery().unbind('update_failed');
};

PostAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};


/**
 * @private 
 */
PostAssistant.prototype._updateCharCount = function() {
	var thisA = this;
	
	if (thisA._updateCharCountTimeout) {
		clearTimeout(thisA._updateCharCountTimeout);
	}

	function _updateCharCountNow() {
		var numchars  = document.getElementById('post-textfield').value.length;
		var charcount = 140 - numchars;
		document.getElementById('post-panel-counter-number').innerHTML = charcount.toString();
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
	}
	
	this._updateCharCountTimeout = setTimeout(_updateCharCountNow, 500);
	
	
};


PostAssistant.prototype.setPostIRT = function(status_id, statusobj) {
	var status_text = '';
	if (statusobj && statusobj.SC_text_raw) {
		status_text = statusobj.SC_text_raw;
	} else {
		status_text = 'status #'+status_id;
	}
	
	// update the GUI stuff
	jQuery('#post-panel-irt-message', this.controller.getSceneScroller())
		.html(status_text)
		.attr('data-status-id', status_id);
	jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideDown('fast');
};


PostAssistant.prototype.clearPostPanel = function() {
	this.clearPostIRT();
	jQuery('#post-textfield', this.controller.getSceneScroller()).val('');
	this._updateCharCount();
};


PostAssistant.prototype.clearPostIRT = function() {
	jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideUp('fast');
	jQuery('#post-panel-irt-message').html('').attr('data-status-id', '0');
};



PostAssistant.prototype.shortenText = function(event) {};
PostAssistant.prototype.shortenURLs = function(event) {};


/**
 *  
 */
PostAssistant.prototype.sendPost = function(event) {
	var status = jQuery('#post-').val();

	if (status.length > 0) {
		var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'), 10);
		
		if (in_reply_to > 0) {
			this.sceneAssistant.twit.update(status, null, in_reply_to);
		} else {
			this.sceneAssistant.twit.update(status, null, null);
		}
		
	}
};



/**
 *  
 */
PostAssistant.prototype.renderSuccessfulPost = function(event, data) {
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
	// sch.removeExtraElements('#my-timeline div.timeline-entry', sc.app.prefs.get('timeline-maxentries'));
	
	sch.removeExtraElements('#my-timeline div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
	sch.removeExtraElements('#my-timeline div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));
	

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

};


/**
 *  
 */
PostAssistant.prototype.reportFailedPost = function(error_obj) {
	this.deactivateSpinner();

	var err_msg = $L("There was a problem posting your status");
	this.sceneAssistant.displayErrorInfo(err_msg, error_obj);
	this.hidePostPanel(event);
};

PostAssistant.prototype.hidePostPanel = function() {
	this.widget.mojo.close();
};

PostAssistant.prototype.deactivateSpinner = function() {
	this.buttonWidget = this.controller.get('post-send-button');
	this.buttonWidget.mojo.deactivate();
};


