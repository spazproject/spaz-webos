function PostAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	if (args) {
		this.args = args;
	}
	
	sch.error(this.args);
	
	this.returningFromFilePicker = false;
	
	scene_helpers.addCommonSceneMethods(this);
}

PostAssistant.prototype.setup = function() {
	
	var thisA = this;
	
	this.initTwit();
	
	this.initAppMenu({ 'items':loggedin_appmenu_items });
	
	this.postMode = 'normal'; // 'normal' or 'email'
	
	this.postTextField = jQuery('#post-textfield')[0];
	
	this.Users = new Users(sc.app.prefs);
	
	this.model = {
		'attachment':null,
		'attachment_icon':null
	};
	
	this.buttonAttributes = {
		type: Mojo.Widget.activityButton
	};
	this.postButtonModel = {
		buttonLabel : "Send",
		buttonClass: 'primary'
	};
	this.attachImageButtonModel = {
		buttonLabel : "Attach Image",
		buttonClass: 'secondary'
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
	this.controller.setupWidget('attach-image-button',      {}, this.attachImageButtonModel);
	this.controller.setupWidget('post-shorten-text-button', this.buttonAttributes, this.shortenTextButtonModel);
	this.controller.setupWidget('post-shorten-urls-button', this.buttonAttributes, this.shortenURLsButtonModel);
	this.controller.setupWidget('post-textfield', {
			'multiline':true,
			'enterSubmits':sc.app.prefs.get('post-send-on-enter'),
			'autoFocus':true,
			'changeOnKeyPress':true
			
		},
	this.postTextFieldModel);
	
	

	
	
	
	this.imageUploaderEmailModel = {
		'image-uploader-email':''
	};
	this.controller.setupWidget('image-uploader-email',
	    {
			// hintText: $L('posting email'),
			enterSubmits: false,
			requiresEnterKey: false,
			modelProperty:		'image-uploader-email',
			changeOnKeyPress: true, 
			focusMode:		Mojo.Widget.focusSelectMode,
			multiline:		false
		},
		this.imageUploaderEmailModel
	);
	
	
	/*
		init photo emailer
	*/
	this.SPM = new SpazPhotoMailer();
	var emailers = this.SPM.getAPILabels();
	this.validImageEmailers = [];
	for (var i=0; i < emailers.length; i++) {
		this.validImageEmailers.push({label:$L(emailers[i]),  value:emailers[i]});
	};

	/*
		init photo uploader
	*/
	this.SFU = new SpazFileUploader();
	var uploaders = this.SFU.getAPILabels();
	this.validImageUploaders = [];
	for (var i=0; i < uploaders.length; i++) {
		this.validImageUploaders.push({label:$L(uploaders[i]),  value:uploaders[i]});
	};
	
	this.imageUploaderModel = {
		'image-uploader':sc.app.prefs.get('image-uploader')
	};
	
	this.controller.setupWidget('image-uploader',
		{
			label: $L('Image host'),
			choices: this.validImageUploaders,
			modelProperty:'image-uploader'
		},
		this.imageUploaderModel
	);
	
	
	jQuery('#post-buttons-image').hide();
	jQuery('#post-panel-attachment').hide();
	
	
	

	
	
	/*
		Bind listeners for UI stuff 
	*/
	Mojo.Event.listen(jQuery('#post-send-button')[0], Mojo.Event.tap, this.sendPost.bindAsEventListener(this));
	Mojo.Event.listen(jQuery('#attach-image-button')[0], Mojo.Event.tap, this.attachImage.bindAsEventListener(this));
	Mojo.Event.listen(jQuery('#post-shorten-text-button')[0], Mojo.Event.tap, this.shortenText.bindAsEventListener(this));
	Mojo.Event.listen(jQuery('#post-shorten-urls-button')[0], Mojo.Event.tap, this.shortenURLs.bindAsEventListener(this));
	this.listenForEnter('post-textfield', function() {
		if (sc.app.prefs.get('post-send-on-enter')) {
			this.controller.get('post-send-button').mojo.activate();
			this.sendPost();
		}
	});
	Mojo.Event.listen(jQuery('#image-uploader')[0], Mojo.Event.propertyChange, this.changeImageUploader.bindAsEventListener(this));	
	Mojo.Event.listen(jQuery('#image-uploader-email')[0], Mojo.Event.propertyChange, this.setImageUploaderEmail.bindAsEventListener(this));	



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


	/*
		Listen for file upload events
	*/
	Mojo.Event.listen(document, sc.events.fileUploadStart, thisA.onUploadStart.bindAsEventListener(thisA));
	Mojo.Event.listen(document, sc.events.fileUploadSuccess, thisA.onUploadSuccess.bindAsEventListener(thisA));
	Mojo.Event.listen(document, sc.events.fileUploadFailure, thisA.onUploadFailure.bindAsEventListener(thisA));

	
	Mojo.Event.listen(jQuery('#post-textfield')[0], Mojo.Event.propertyChange, this._updateCharCount.bindAsEventListener(this));	
	

	jQuery('#post-panel-irt-dismiss').bind(Mojo.Event.tap, function(e) {
		thisA.clearPostIRT();
	});
	
	

};

PostAssistant.prototype.activate = function(args) {

	var thisA = this;
	
	/*
		Tweetphoto is no longer valid, so we need to change that
	*/
	if (this.imageUploaderModel['image-uploader'] == 'tweetphoto') {
		this.imageUploaderModel['image-uploader'] = 'yfrog';
		sc.app.prefs.set('image-uploader', 'yfrog');
		this.showAlert(
			$L('Tweetphoto is no longer supported by Spaz, so I\'ve changed your image hosting preference to yfrog. You can pick a different service under the App menu in Preferences.'),
			$L('Change in image hosting service')
		);
	}
	

	if (this.args) {
		
		if (this.args.text) { this.postTextField.mojo.setText(this.args.text); }
		
		if (this.args.type) {
			/*
				set cursor position
			*/
			switch(this.args.type) {
				case 'quote':
					this.postTextField.mojo.setCursorPosition(0,0);
					break;
					if (sc.app.prefs.get('post-rt-cursor-position') == 'beginning') {
						this.postTextField.mojo.setCursorPosition(0,0);
					}					
				case 'rt':
					if (sc.app.prefs.get('post-rt-cursor-position') == 'beginning') {
						this.postTextField.mojo.setCursorPosition(0,0);
					}
					break;
				default:
					break;
			}
		}
		
		/*this.postTextField.mojo.setCursorPosition(this.args.select_start, this.args.select_start+this.args.select_length);*/
		
		if (this.args.irt_status_id) {
			this.setPostIRT(this.args.irt_status_id, this.args.irt_status);
		}

	}
	

	if (this.returningFromFilePicker === true) {
		this.onReturnFromFilePicker();
		this.returningFromFilePicker = false;
	}
	
	
	

	jQuery('#post-panel-username').text(sc.app.username);
	

	
	
	thisA._updateCharCount();


};


PostAssistant.prototype.deactivate = function(event) {

	

};

PostAssistant.prototype.cleanup = function(event) {
	
	var thisA = this;
	
	Mojo.Event.stopListening(jQuery('#post-send-button')[0], Mojo.Event.tap, this.sendPost); 
	Mojo.Event.stopListening(jQuery('#attach-image-button')[0], Mojo.Event.tap, this.attachImage);
	Mojo.Event.stopListening(jQuery('#post-shorten-text-button')[0], Mojo.Event.tap, this.shortenText);
	Mojo.Event.stopListening(jQuery('#post-shorten-urls-button')[0], Mojo.Event.tap, this.shortenURLs);
	Mojo.Event.stopListening(jQuery('#image-uploader')[0], Mojo.Event.propertyChange, this.changeImageUploader);	
	Mojo.Event.stopListening(jQuery('#image-uploader-email')[0], Mojo.Event.propertyChange, this.setImageUploaderEmail);	
	
	
	this.stopListeningForEnter('post-textfield');
	
	Mojo.Event.stopListening(jQuery('#post-textfield')[0], Mojo.Event.propertyChange, this._updateCharCount.bindAsEventListener(this));	
	
	jQuery('#post-panel-irt-dismiss').unbind(Mojo.Event.tap);
	jQuery('#post-image-lookup-email').unbind(Mojo.Event.tap);
	jQuery('#post-image-choose').unbind(Mojo.Event.tap);
	
	jQuery().unbind('update_succeeded');
	jQuery().unbind('update_failed');
	
	/*
		Listen for file upload events
	*/
	Mojo.Event.listen(document, sc.events.fileUploadStart, thisA.onUploadStart);
	Mojo.Event.listen(document, sc.events.fileUploadSuccess, thisA.onUploadSuccess);
	Mojo.Event.listen(document, sc.events.fileUploadFailure, thisA.onUploadFailure);

	
};


/**
 * @private 
 */
PostAssistant.prototype._updateCharCount = function() {
	var thisA = this;
	
	_updateCharCountNow();

	function _updateCharCountNow() {
		var numchars  = thisA.postTextFieldModel.value.length;
		var charleft = 140 - numchars;
		document.getElementById('post-panel-counter-number').innerHTML = charleft.toString();
		if (charleft < 0) {
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



PostAssistant.prototype.shortenText = function(event) {
	var stxt = new SpazShortText();
	this.postTextFieldModel.value = stxt.shorten(this.postTextFieldModel.value);
	this.controller.modelChanged(this.postTextFieldModel);
	this._updateCharCount();
	this.deactivateButtonSpinner('post-shorten-text-button');
};

PostAssistant.prototype.shortenURLs = function(event) {
	
	var event_target = jQuery('#post-shorten-urls-button')[0];
	
	var surl = new SpazShortURL(SPAZCORE_SHORTURL_SERVICE_BITLY);
	var longurls = sc.helpers.extractURLs(this.postTextFieldModel.value);

	/*
		check URL lengths
	*/
	var reallylongurls = [];
	for (var i=0; i<longurls.length; i++) {
		if (longurls[i].length > 25) { // only shorten links longer than 25chars
			reallylongurls.push(longurls[i]);
		}
	}
	
	/*
		drop out if we don't have any URLs
	*/
	if (reallylongurls.length < 1) {
		this.deactivateButtonSpinner('post-shorten-urls-button');
		this._updateCharCount();
		return;
	}
	
	function onShortURLSuccess(e) {
		var data = sch.getEventData(e);
		this.postTextFieldModel.value = sc.helpers.replaceMultiple(this.postTextFieldModel.value, data);
		this.controller.modelChanged(this.postTextFieldModel);
		this.deactivateButtonSpinner('post-shorten-urls-button');
		this._updateCharCount();
		sch.unlisten(event_target, sc.events.newShortURLSuccess, onShortURLSuccess, this);
		sch.unlisten(event_target, sc.events.newShortURLFailure, onShortURLFailure, this);
	}
	function onShortURLFailure(e) {
		var error_obj = sch.getEventData(e);
		this.deactivateButtonSpinner('post-shorten-urls-button');
		this._updateCharCount();
		sch.unlisten(event_target, sc.events.newShortURLSuccess, onShortURLSuccess, this);
		sch.unlisten(event_target, sc.events.newShortURLFailure, onShortURLFailure, this);
	}
	
	sch.listen(event_target, sc.events.newShortURLSuccess, onShortURLSuccess, this);
	sch.listen(event_target, sc.events.newShortURLFailure, onShortURLFailure, this);

	surl.shorten(reallylongurls, {
		'event_target':event_target,
		'apiopts': {
			'version':'2.0.1',
			'format':'json',
			'login':'spazcore',
			'apiKey':sc.app.prefs.get('services-bitly-apikey')
		}
	});
	
	
	
};


/**
 * saves the new image uploader label and loads up the appropriate email address for that api
 */
PostAssistant.prototype.changeImageUploader = function(e) {
	var api_label = this.imageUploaderModel['image-uploader'];
	sc.app.prefs.set('image-uploader', api_label);
	this.loadImageUploaderEmail(api_label);
	
};

/**
 * Loads up the posting address for the given api label. If a user metakey is set for this, use that. otherwise retrieve from API 
 */
PostAssistant.prototype.loadImageUploaderEmail = function(api_label) {
	if (!api_label) {
		api_label = this.imageUploaderModel['image-uploader'];
	}
	
	var email = null;
	
	email = this.getImageUploaderEmail(api_label);
	
	if (!email) {
		email = this.SPM.apis[api_label].getToAddress({
			'username':sc.app.username
		});
		this.setImageUploaderEmail(api_label, email);
	}
	
	this.imageUploaderEmailModel['image-uploader-email'] = email;
	this.controller.modelChanged(this.imageUploaderEmailModel);
};

/**
 * Gets the meta value for the current user & api's posting address
 */
PostAssistant.prototype.getImageUploaderEmail = function(api_label) {
	return this.Users.getMeta(sc.app.userid, api_label+'_posting_address');
};

/**
 * Sets the posting email for the given api and the current user 
 */
PostAssistant.prototype.setImageUploaderEmail = function(api_label, email) {
	if (!api_label || !sch.isString(api_label)) {
		api_label = this.imageUploaderModel['image-uploader'];
	}
	if (!email || !sch.isString(email)) {
		email = this.imageUploaderEmailModel['image-uploader-email'];
	}
	
	this.Users.setMeta(sc.app.userid, api_label+'_posting_address', email);
};


/**
 * Sends a post, either by email or normal AJAX posting to Twitter, per this.postMode
 */
PostAssistant.prototype.sendPost = function(event) {
	var status = this.postTextFieldModel.value;
	
	if (this.postMode === 'email') {
		
		var api_label = this.imageUploaderModel['image-uploader'];
		var email = this.imageUploaderEmailModel['image-uploader-email'];
		var emailobj = {'name':api_label, 'address':email};
		var file = this.model.attachment;
		this.postImageMessage(emailobj, status, file);
		this.deactivateSpinner();
		this.controller.stageController.popScene();
		return;
		
	} else {

		if (status.length > 0 && status.length <= 140) {
			var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'), 10);

			if (this.model.attachment) { // we have an attachment; post through service

				var source = 'spaz';

				this.SFU.setAPI(this.imageUploaderModel['image-uploader']);

				if (this.imageUploaderModel['image-uploader'] === 'pikchur') {
					this.SFU.setAPIKey(sc.app.prefs.get('services-pikchur-apikey'));
					source = sc.app.prefs.get('services-pikchur-source');
				}

				
				this.SFU.uploadAndPost(this.model.attachment, {
					'username' : sc.app.username,
					'password' : sc.app.password,
					'source'   : source,
					'message'  : status,
					'platform' : {
						'sceneAssistant' : this
					}
				});
				
				
				
			} else { // normal post without attachment
				
				if (in_reply_to > 0) {
					this.twit.update(status, null, in_reply_to);
				} else {
					this.twit.update(status, null, null);
				}
				
			}

			this.postTextFieldModel.disabled = true;
			this.controller.modelChanged(this.postTextFieldModel);

		} else { // don't post if length < 0 or > 140
		
			this.deactivateSpinner();
			
		}
		
	}
	
};




/**
 * Change the "mode" of the posting scene so we see the controls for attaching an image 
 */
PostAssistant.prototype.attachImage = function() {
	
	var thisA = this;
	
	if (this.postMode === 'email') {
		jQuery('#post-buttons-standard').slideUp('200', function() {
			jQuery('#post-buttons-image').slideDown('200');
		});

		this.loadImageUploaderEmail();

		jQuery('#post-image-lookup-email').bind(Mojo.Event.tap, function(e) {
			var api_label = thisA.imageUploaderModel['image-uploader'];
			var help_text = $L(thisA.SPM.apis[api_label].help_text);
			var email_info_url = $L(thisA.SPM.apis[api_label].email_info_url);

			thisA.showAlert(
				$L(help_text),
				jQuery('#Look-Up Posting Email Address')[0],
				function(choice) {
					if (choice === 'Open Browser') {
						thisA.openInBrowser(email_info_url);
					}
				}, 
				[{label:$L('Open')+' '+api_label, value:"Open Browser", type:'affirmative'}]
			);
		});

		jQuery('#post-image-choose').bind(Mojo.Event.tap, function(e) {
			thisA.chooseImage();
		});
		jQuery('#post-image-cancel').one('click', this.cancelAttachImage);


	} else { // direct upload posting
		
		thisA.chooseImage();
		
	}

	
};

/**
 * Go back to the "normal" posting scene controls 
 */
PostAssistant.prototype.cancelAttachImage = function() {
	
	jQuery('#post-image-lookup-email').unbind(Mojo.Event.tap);

	jQuery('#post-image-choose').unbind(Mojo.Event.tap);
	
	
	if ( jQuery('#post-buttons-image').is(':visible') ) {
		jQuery('#post-buttons-image').slideUp('200', function() {
			jQuery('#post-buttons-standard').slideDown('200');
		});
	}
	if (this.postMode === 'email') {
		this.setPostButtonLabel($L('Email Image Post'));
	} else {
		this.setPostButtonLabel($L('Post'));
	}
	
};


PostAssistant.prototype.setPostButtonLabel = function(label) {
	this.postButtonModel.buttonLabel = label;
	this.controller.modelChanged(this.postButtonModel);
};



PostAssistant.prototype.postImageMessage = function(post_add_obj, message, file_path) {
	
	file_obj = {'fullPath':file_path};
	
	Spaz.postToService({
		fileName: file_path,
		message: message,
		controller: this.controller
	});

};


PostAssistant.prototype.emailImageMessage = function(post_add_obj, message, file_path) {
	Spaz.sendEmail({
      to: [post_add_obj],
      msg: message,
      subject: message,
      attachments: [file_obj],
      controller: this.controller
    });
    // next line should close new post "dialog"
    this.controller.stageController.popScene();
};

/**
 * opens the file picker for images, and passes a callback to change the post scene state to reflect
 * the new "email and image" mode 
 */
PostAssistant.prototype.chooseImage = function(posting_address, message, filepath) {

	var thisA = this;
	
	// function fakeIt(file) {
	// 	jQuery('#post-attachment').show().html(file);
	// 	thisA.model.attachment = file;
	// 	thisA.postMode = 'email';
	// 	thisA.cancelAttachImage();
	// 	jQuery('#post-panel-attachment').show();
	// 	jQuery('#post-panel-attachment-dismiss').one('click', function() {
	// 		thisA.postMode = 'normal';
	// 		jQuery('#post-panel-attachment').hide();
	// 		thisA.model.attachment = null;
	// 		thisA.cancelAttachImage();
	// 	});
	//     }
	// 
	// fakeIt('file:///media/internal/wallpapers/01.jpg');
	// return;
	
	
	var params = {
	    kinds: ['image'],
	    onSelect: function(file) {
			dump(file);

			thisA.model.attachment = file.fullPath;
			thisA.model.attachment_icon = file.iconPath;
			
			dump(thisA.model);
			
			// thisA.postMode = 'email';
			
			thisA.returningFromFilePicker = true;
			
			dump(thisA.postMode);	
	    }
	};
	Mojo.FilePicker.pickFile(params, this.controller.stageController);
};


PostAssistant.prototype.onReturnFromFilePicker = function() {
	sch.debug('returned from file picker');
	
	var thisA = this;
	
	this.cancelAttachImage();
	jQuery('#post-panel-attachment').show();
	jQuery('#post-panel-attachment-dismiss').one('click', function() {
		// thisA.postMode = 'normal';
		jQuery('#post-panel-attachment').hide();
		thisA.model.attachment = null;
		thisA.cancelAttachImage();
	});
	
};



/**
 * 
 */
PostAssistant.prototype.renderSuccessfulPost = function(event, data) {
	if (sch.isArray(data)) {
		data = data[0];
	}

	data.text = Spaz.makeItemsClickable(data.text);
	
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
	this.filterTimeline();
	
	// this.playAudioCue('send');
	
	this.deactivateSpinner();
	
	this.controller.stageController.popScene();

};


/**
 *  
 */
PostAssistant.prototype.reportFailedPost = function(error_obj) {
	this.deactivateSpinner();
	this.postTextFieldModel.disabled = false;
	this.controller.modelChanged(this.postTextFieldModel);
	
	var err_msg = $L("There was a problem posting your status");
	this.displayErrorInfo(err_msg, error_obj);
};

PostAssistant.prototype.deactivateSpinner = function() {
	this.buttonWidget = jQuery('#post-send-button').get(0);
	this.buttonWidget.mojo.deactivate();
};


/**
 * fires when upload from this.SFU starts 
 */
PostAssistant.prototype.onUploadStart = function(e) {
	Mojo.Log.info('fileUploadStart');
	var data = sch.getEventData(e);
	sch.debug(data);	
};

/**
 * fires when upload from this.SFU is successful
 */
PostAssistant.prototype.onUploadSuccess = function(e) {
	
	Mojo.Log.info('fileUploadSuccess');
	var returnobj = {};
	var data = sch.getEventData(e);
	sch.debug(data);
	
	/*
		Parse the response if we are complete
	*/
	if (data.completed) {
		var parser=new DOMParser();
		
		sch.error("returned from upload:");
		sch.error(data.responseString);
		
		var xmldoc = parser.parseFromString(data.responseString,"text/xml");
		var rspAttr = xmldoc.getElementsByTagName("rsp")[0].attributes;
		
		/*
			Note that pikchur won't give us the statusid of the posted tweet
			because they have to be difficult
		*/
		if (rspAttr.getNamedItem("stat") && rspAttr.getNamedItem("stat").nodeValue === 'ok') {
			returnobj['mediaurl'] = jQuery(xmldoc).find('mediaurl').text();
			returnobj['statusid'] = parseInt(jQuery(xmldoc).find('statusid').text(), 10);

		/*
			because Twitgoo has to be different
		*/
		} else if (rspAttr.getNamedItem("status") && rspAttr.getNamedItem("status").nodeValue === 'ok') {
			returnobj['mediaurl'] = jQuery(xmldoc).find('mediaurl').text();
			returnobj['statusid'] = parseInt(jQuery(xmldoc).find('statusid').text(), 10);
			
		} else {
			returnobj['errAttributes'] = xmldoc.getElementsByTagName("err")[0].attributes;
			returnobj['errMsg'] = errAttributes.getNamedItem("msg").nodeValue;
		}
		sch.debug(returnobj);
		
		if (returnobj.mediaurl) {
			sch.debug("MEDIAURL");
			var siu = new SpazImageURL();
			var thumb = siu.getThumbForUrl(returnobj.mediaurl);
			sch.debug('THUMB');
			sch.debug(thumb);

			// e.data.thisAssistant.renderSuccessfulPost(e, data);

			// jQuery('#uploaded-img-link').attr('href', returnobj.mediaurl);
			// jQuery('#posted-tweet').text(returnobj.statusid);
			// jQuery('#uploaded-img-thumb').attr('src',  thumb);
			// jQuery('#uploaded-img').show();

		} else {
			sch.debug("NO MEDIAURL");
			jQuery('#uploaded-img').hide();
		}
		
		this.deactivateSpinner();
		this.controller.stageController.popScene({'refresh':true});
	}
	

};


/**
 * fires when upload from this.SFU fails
 */
PostAssistant.prototype.onUploadFailure = function(e) {
	// var data = sch.getEventData(e);
	sch.error("File Upload Failure. Data:");
	sch.error(e);
	
	this.deactivateSpinner();
	this.postTextFieldModel.disabled = false;
	this.controller.modelChanged(this.postTextFieldModel);
	
};