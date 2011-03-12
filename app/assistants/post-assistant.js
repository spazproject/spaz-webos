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
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
}
PostAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};
PostAssistant.prototype.setup = function() {
	
	var thisA = this;
	
	this.initTwit();
	
	this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
	
	this.postMode = 'normal'; // 'normal' or 'email'
	
	this.postTextField = jQuery('#post-textfield')[0];
	
	this.Users = new SpazAccounts(App.prefs);
	
	this.model = {
		'attachment':null,
		'attachment_icon':null
	};
	
	this.buttonAttributes = {
		type: Mojo.Widget.activityButton
	};
	this.postButtonModel = {
		buttonLabel : $L("Send"),
		buttonClass: 'primary'
	};
	this.attachImageButtonModel = {
		buttonLabel : $L("Attach Image"),
		buttonClass: 'secondary'
	};
	this.shortenTextButtonModel = {
		buttonLabel : $L("Shorten text"),
		buttonClass: 'secondary'
	};
	this.shortenURLsButtonModel = {
		buttonLabel : $L("Shorten URLs"),
		buttonClass: 'secondary'
	};
	this.postTextFieldModel = {
		value:'',
		disabled:false
	};
	
	this.controller.setupWidget('post-send-button',			this.buttonAttributes, this.postButtonModel);
	this.controller.setupWidget('attach-image-button',		{}, this.attachImageButtonModel);
	this.controller.setupWidget('post-shorten-text-button', this.buttonAttributes, this.shortenTextButtonModel);
	this.controller.setupWidget('post-shorten-urls-button', this.buttonAttributes, this.shortenURLsButtonModel);
	this.controller.setupWidget('post-textfield', {
			'multiline':true,
			'enterSubmits':App.prefs.get('post-send-on-enter'),
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
	
	var i;
	
	/*
		init photo emailer
	*/
	this.SPM = new SpazPhotoMailer();
	var emailers = this.SPM.getAPILabels();
	this.validImageEmailers = [];
	for (i=0; i < emailers.length; i++) {
		this.validImageEmailers.push({label:$L(emailers[i]),  value:emailers[i]});
	};

	/*
		init photo uploader
	*/
	this.SFU = new SpazFileUploader();
	var uploaders = this.SFU.getAPILabels();
	this.validImageUploaders = [];
	for (i=0; i < uploaders.length; i++) {
		this.validImageUploaders.push({label:$L(uploaders[i]),	value:uploaders[i]});
	};
	
	/*
		check if we have a valid image uploader
	*/
	var iupl = App.prefs.get('image-uploader');
	var valid_iupl = false;
	var image_uploader = new SpazImageUploader();
	for (var key in image_uploader.services) {
		if (key == iupl) {
			valid_iupl = true;
		}
	}
	if (!valid_iupl) {
		iupl = default_preferences['image-uploader']; // set this as default
		App.prefs.set('image-uploader', iupl);
	}
	
	/*
		set the image uploader in the model
	*/
	this.imageUploaderModel = {
		'image-uploader':iupl
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
		if (App.prefs.get('post-send-on-enter')) {
			this.controller.get('post-send-button').mojo.activate();
			this.sendPost();
		}
	});
	Mojo.Event.listen(jQuery('#image-uploader')[0], Mojo.Event.propertyChange, this.changeImageUploader.bindAsEventListener(this)); 
	Mojo.Event.listen(jQuery('#image-uploader-email')[0], Mojo.Event.propertyChange, this.setImageUploaderEmail.bindAsEventListener(this)); 



	/*
		if update succeeds
	*/
	jQuery(document).bind('update_succeeded', { thisAssistant:this }, function(e, data) {
		e.data.thisAssistant.renderSuccessfulPost(e, data);
	});

	/*
		if update fails
	*/
	jQuery(document).bind('update_failed', { thisAssistant:this }, function(e, error_obj) {
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
	
	this.checkForAccount();
	
	/*
		Tweetphoto is no longer valid, so we need to change that
	*/
	if (this.imageUploaderModel['image-uploader'] == ('tweetphoto'||'yfrog')) {
		this.imageUploaderModel['image-uploader'] = 'drippic';
		App.prefs.set('image-uploader', 'drippic');
		this.showAlert(
			$L('Tweetphoto is no longer supported by Spaz, so I\'ve changed your image hosting preference to drippic. You can pick a different service under the App menu in Preferences.'),
			$L('Change in image hosting service')
		);
	}
	

	if (this.args && !this.postTextField.mojo.getValue()) {
		
		/*
			set the text if some was passed-in
		*/
		if (this.args.text) {
		    this.postTextField.mojo.setValue(this.args.text);
		}
		
		if (this.args.type) {
			/*
				set cursor position
			*/
			switch(this.args.type) {
				case 'quote':
					this.postTextField.mojo.setCursorPosition(0,0);
					break;
					if (App.prefs.get('post-rt-cursor-position') == 'beginning') {
						this.postTextField.mojo.setCursorPosition(0,0);
					}					
				case 'rt':
					if (App.prefs.get('post-rt-cursor-position') == 'beginning') {
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
		
		Mojo.Log.error('this.args: %j', this.args);
		
		if (this.args.type === 'dm' && this.args.dm_irt_text) {
		    this.setDMIRT(this.args.dm_recipient, this.args.dm_irt_text);
		    jQuery('#post-panel-irt-dismiss').hide();
		}

	}
	

	if (this.returningFromFilePicker === true) {
		this.onReturnFromFilePicker();
		this.returningFromFilePicker = false;
	}
	
	
	
    if (this.args.type == 'dm') {
        jQuery('#post-panel-scenetitle').html($L('DM as #{username}').interpolate({'username':App.username}));
        jQuery('#post-panel-subtitle').html($L('To #{recipient}').interpolate({'recipient':this.args.dm_recipient}));

    } else {
        jQuery('#post-panel-scenetitle').html($L('Post as #{username}').interpolate({'username':App.username}));
    }
	
	this._updateCharCount();


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
	
	jQuery(document).unbind('update_succeeded');
	jQuery(document).unbind('update_failed');
	
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


PostAssistant.prototype.setDMIRT = function(username, irt_text) {
	var prefix = $L('From #{username}:').interpolate({username: username});
	var status_text = irt_text;
	
	// update the GUI stuff
	jQuery('#post-panel-irt-prefix', this.controller.getSceneScroller())
	    .html(prefix);
	jQuery('#post-panel-irt-message', this.controller.getSceneScroller())
		.html(status_text);
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
	
	var surl = new SpazShortURL(SPAZCORE_SHORTURL_SERVICE_JMP);
	var longurls = sc.helpers.extractURLs(this.postTextFieldModel.value);

	/*
		check URL lengths
	*/
	var reallylongurls = [];
	for (var i=0; i<longurls.length; i++) {
		if (longurls[i].length > 25) { // only shorten links longer than 25chars
			reallylongurls.push(longurls[i]);
		}
		sch.error(reallylongurls.length+ ' Long URLs');
	}
	
	/*
		drop out if we don't have any URLs
	*/
	if (reallylongurls.length < 1) {
		this.deactivateButtonSpinner('post-shorten-urls-button');
		this._updateCharCount();
		sch.error('No Long URLs');
		return;
	}
	
	
	var that = this;
	
	function onShortURLSuccess(e, data) {
		Mojo.Log.info('that.postTextFieldModel.value: %s', that.postTextFieldModel.value);
		Mojo.Log.info('data: %j', data);
		that.postTextFieldModel.value = that.postTextFieldModel.value.replace(data.longurl, data.shorturl);
		that.controller.modelChanged(that.postTextFieldModel);
		Mojo.Log.info('that.postTextFieldModel.value: %s', that.postTextFieldModel.value);
		Mojo.Log.info('data: %j', data);
		that.deactivateButtonSpinner('post-shorten-urls-button');
		that._updateCharCount();
	}
	function onShortURLFailure(e, error_obj) {
		that.deactivateButtonSpinner('post-shorten-urls-button');
		that._updateCharCount();
	}

	// unbind first so we don't get dupes
	sch.unlisten(event_target, sc.events.newShortURLSuccess, onShortURLSuccess, this);
	sch.unlisten(event_target, sc.events.newShortURLFailure, onShortURLFailure, this);
	
	sch.listen(event_target, sc.events.newShortURLSuccess, onShortURLSuccess, this);
	sch.listen(event_target, sc.events.newShortURLFailure, onShortURLFailure, this);

	surl.shorten(reallylongurls, {
		'event_target':event_target,
		'apiopts': {
			'version':'2.0.1',
			'format':'json',
			'login': App.prefs.get('services-bitly-login') || 'spazcore',
			'apiKey':App.prefs.get('services-bitly-apikey') || 'R_f3b86681a63a6bbefc7d8949fd915f1d'
		}
	});
	
	
	
};


/**
 * saves the new image uploader label and loads up the appropriate email address for that api
 */
PostAssistant.prototype.changeImageUploader = function(e) {
	var api_label = this.imageUploaderModel['image-uploader'];
	App.prefs.set('image-uploader', api_label);
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
			'username':App.username
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
	return this.Users.getMeta(App.userid, api_label+'_posting_address');
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
	
	this.Users.setMeta(App.userid, api_label+'_posting_address', email);
};


/**
 * Sends a post, either by email or normal AJAX posting to Twitter, per this.postMode
 */
PostAssistant.prototype.sendPost = function(event) {
	var that = this;
	
	var status = this.postTextFieldModel.value;
	
	if (this.postMode === 'email') {
		
		var api_label = this.imageUploaderModel['image-uploader'];
		var email = this.imageUploaderEmailModel['image-uploader-email'];
		var emailobj = {'name':api_label, 'address':email};
		var file = this.model.attachment;
		this.postImageMessage(emailobj, status, file);
		this.deactivateSpinner();
		this.popScene();
		return;
		
	} else {

		if (status.length > 0 && status.length <= 140) {
		    if (this.args.type === 'dm') {
		        var dm_recipient = this.args.dm_recipient;
		    } else {
		        // var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'), 10);
		        var in_reply_to = jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id');
		    }
			

			if (this.model.attachment) { // we have an attachment; post through service
				var auth = Spaz.Prefs.getAuthObject();
				var image_upl_status = status;
				/*
					FIRST, UPLOAD THE IMAGE
					THEN, POST MSG TO TWITTER IF UPLOAD SUCCESSFUL
				*/
				
				var image_uploader = new SpazImageUploader();
				
				if (this.args.type === 'dm') {
				    image_upl_status = 'from Spaz';
				}
				
				
				image_uploader_opts = {
					'auth_obj': auth,
					'service' : App.prefs.get('image-uploader') || this.imageUploaderModel['image-uploader'],
					'file_url': this.model.attachment,
					'extra': {
						'message':image_upl_status
					},
					'onSuccess':function(event_data) { // onSuccess
						if (event_data.url) {
							var img_url = event_data.url;
							var img_url_len = 0, status_txt_len = 0;
							
							img_url_len = img_url.length;
							status_txt_len = status.length;
							
							if (img_url_len + status_txt_len >= 140) {
								status = status.slice(0,137-img_url_len)+'…';
							};
							
							/*
								make new status
							*/
							status = status + ' ' + img_url;
							
							sch.debug('Posting message…');
							that.setPostButtonLabel('Posting message…');

                            if (that.args.type === 'dm') {
                                that.twit.sendDirectMessage(dm_recipient, status,
                                    function(data) {
                                      that.onDMSuccess.call(that, data);
                                    },
                                    function(xhr, msg, exc) {
                                        that.onDMFailure.call(that, xhr, msg, exc);
                                    }
                                );
                            } else if (in_reply_to > 0) {
								that.twit.update(status, null, in_reply_to);
							} else {
								that.twit.update(status, null, null);
							}
						} else if (event_data.error) {
							Mojo.Controller.errorDialog($L("Posting image failed:") + " " + event_data.error);
							that.deactivateSpinner();
							that.setPostButtonLabel($L('Retry post'));
						} else {
							Mojo.Controller.errorDialog($L("Posting image failed"));
							that.deactivateSpinner();
							that.setPostButtonLabel($L('Retry post'));
						}
					},
					'onFailure':function(response_data) { // onFailure
						sch.error('Posting image FAILED');
						ech.error("Error!");
						ech.error(response_data);
						Mojo.Controller.errorDialog($L("Posting image failed"));
						that.deactivateSpinner();
					},
					'platform' : { // need this for webOS to upload
						'sceneAssistant' : this
					}
				};
				
				// force pikchur uploading if using identi.ca
				if (Spaz.Prefs.getAccountType() == SPAZCORE_ACCOUNT_IDENTICA) {
					image_uploader_opts['service'] = 'pikchur';
					image_uploader_opts['extra']['service'] = 'identi.ca';
				}
				
				image_uploader.setOpts(image_uploader_opts);
				
				sch.debug('Uploading image…');
				this.setPostButtonLabel('Uploading image…');
				image_uploader.upload();


				
				
			} else { // normal post without attachment
				if (this.args.type === 'dm') {
                    that.twit.sendDirectMessage(dm_recipient, status,
                        function(data) {
                          that.onDMSuccess.call(that, data);
                        },
                        function(xhr, msg, exc) {
                            that.onDMFailure.call(that, xhr, msg, exc);
                        }
                    );
                    
				} else if (in_reply_to > 0) {
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
	this.popScene();
};

/**
 * opens the file picker for images, and passes a callback to change the post scene state to reflect
 * the new "email and image" mode 
 */
PostAssistant.prototype.chooseImage = function(posting_address, message, filepath) {

	var thisA = this;
	
	// function fakeIt(file) {
	//	jQuery('#post-attachment').show().html(file);
	//	thisA.model.attachment = file;
	//	thisA.postMode = 'email';
	//	thisA.cancelAttachImage();
	//	jQuery('#post-panel-attachment').show();
	//	jQuery('#post-panel-attachment-dismiss').one('click', function() {
	//		thisA.postMode = 'normal';
	//		jQuery('#post-panel-attachment').hide();
	//		thisA.model.attachment = null;
	//		thisA.cancelAttachImage();
	//	});
	//	   }
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
 * just passes to renderSuccessfulPost 
 */
PostAssistant.prototype.onDMSuccess = function(data) {
	this.setPostButtonLabel('Posted!');
	
	this.deactivateSpinner();
	
	this.popScene();
};


PostAssistant.prototype.onDMFailure = function(xhr, msg, exc) {
    Mojo.Log.error('xhr, message, exc: %j, %s, %j', xhr, msg, exc);
    this.deactivateSpinner();
	this.postTextFieldModel.disabled = false;
	this.controller.modelChanged(this.postTextFieldModel);
	
	var err_msg = $L("There was a problem sending your direct message");
	this.displayErrorInfo(err_msg, {'xhr':xhr, 'msg':msg});
};

/**
 * 
 */
PostAssistant.prototype.renderSuccessfulPost = function(event, data) {
	Mojo.Log.error('RENDERSUCCESSFULPOST');
	
	this.setPostButtonLabel('Posted!');
	
	this.deactivateSpinner();
	
	this.popScene();
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
			// returnobj['statusid'] = parseInt(jQuery(xmldoc).find('statusid').text(), 10);
			returnobj['statusid'] = jQuery(xmldoc).find('statusid').text();

		/*
			because Twitgoo has to be different
		*/
		} else if (rspAttr.getNamedItem("status") && rspAttr.getNamedItem("status").nodeValue === 'ok') {
			returnobj['mediaurl'] = jQuery(xmldoc).find('mediaurl').text();
			// returnobj['statusid'] = parseInt(jQuery(xmldoc).find('statusid').text(), 10);
			returnobj['statusid'] = jQuery(xmldoc).find('statusid').text();
			
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
		
		this.popScene();		
	}
	

};


/**
 * handles special popping logic 
 */
PostAssistant.prototype.popScene = function() {
	/*
		only pop if we have a scene to pop to
	*/
	Mojo.Log.error('this.controller.stageController.getScenes().length: %s', this.controller.stageController.getScenes().length);
	if (this.controller.stageController.getScenes().length > 1) {
		this.controller.stageController.popScene({'returnFromPop': true});
	} else {
		if (this.args.xapp === true) { // if we launched with post args, just close the stage when done
			window.close();
		} else {
			this.controller.stageController.swapScene({name: 'start'});
		}
		
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



PostAssistant.prototype.checkForAccount = function() {
	if (!App.username) {
		this.showAlert(
			$L('You need to set up and select an account before posting'),
			$L('Error'),
			function(choice) {
				this.controller.stageController.swapScene({name: 'startlogin'}, {'nextscene':'post', 'nextsceneargs':{'text':this.postTextField.mojo.getValue()} });
			}
		);
		
	}
};