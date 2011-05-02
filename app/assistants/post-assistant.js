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
	
	this.controller.setupWidget('shorten-menu', undefined, {
		items: [
			{label: $L("Shorten URLs"), command: "shortenURLs"},
			{label: $L("Shorten Text"), command: "shortenText"}
		]
	});
	var cmdMenuItems = [
		{label: $L("Attach"), icon: "attach", command: "attachImage"},
		{label: $L("Shorten"), iconPath: "images/theme/menu-icon-shorten.png", submenu: "shorten-menu"},
		//
		{},
		{},
		{label: $L("Post"), icon: "send", command: "sendPost"}
	
	];
	if(parseInt(Mojo.Environment.DeviceInfo.platformVersionMajor, 10) >= 2) {
		cmdMenuItems.splice(2, 0, {label: $L("Get Now Playing"), iconPath: "images/theme/menu-icon-koto.png", command: "getKotoData"});
	}
	this.setupCommonMenus({cmdMenuItems: cmdMenuItems});
	
	this.postMode = 'normal'; // 'normal' or 'email'
	
	this.postTextField = jQuery('#post-textfield')[0];
	
	this.Users = new SpazAccounts(App.prefs);
	
	this.model = {
		'attachment':null,
		'attachment_icon':null
	};

	this.postTextFieldModel = {
		value:'',
		disabled:false
	};
	
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
		this.validImageEmailers.push({label:emailers[i],  value:emailers[i]});
	};

	/*
		init photo uploader
	*/
	this.SFU = new SpazFileUploader();
	var uploaders = this.SFU.getAPILabels();
	this.validImageUploaders = [];
	for (i=0; i < uploaders.length; i++) {
		this.validImageUploaders.push({label:uploaders[i],	value:uploaders[i]});
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
	this.listenForEnter('post-textfield', function() {
		if (App.prefs.get('post-send-on-enter')) {
			thisA.activateSpinner();
			thisA.sendPost();
		}
	});
	Mojo.Event.listen(jQuery('#image-uploader')[0], Mojo.Event.propertyChange, this.changeImageUploader.bindAsEventListener(this)); 
	Mojo.Event.listen(jQuery('#image-uploader-email')[0], Mojo.Event.propertyChange, this.setImageUploaderEmail.bindAsEventListener(this)); 



	/*
		if update succeeds
	*/
	jQuery(document).bind('update_succeeded', function(e, data) {
		thisA.renderSuccessfulPost(e, data);
	});

	/*
		if update fails
	*/
	jQuery(document).bind('update_failed', function(e, error_obj) {
		thisA.reportFailedPost(error_obj);
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
		this.imageUploaderModel['image-uploader'] = 'twitpic';
		App.prefs.set('image-uploader', 'twitpic');
		this.showAlert(
			$L('Tweetphoto is no longer supported by Spaz, so I\'ve changed your image hosting preference to TwitPic. You can pick a different service under the App menu in Preferences.'),
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
	
	// Mojo.Event.stopListening(jQuery('#post-send-button')[0], Mojo.Event.tap, this.sendPost); 
	// Mojo.Event.stopListening(jQuery('#attach-image-button')[0], Mojo.Event.tap, this.attachImage);
	// Mojo.Event.stopListening(jQuery('#post-shorten-text-button')[0], Mojo.Event.tap, this.shortenText);
	// Mojo.Event.stopListening(jQuery('#post-shorten-urls-button')[0], Mojo.Event.tap, this.shortenURLs);
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
	//this.deactivateButtonSpinner('post-shorten-text-button');
};

PostAssistant.prototype.shortenURLs = function(event) {
	
	var event_target = jQuery('#post-buttons-standard')[0];
	
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
		//this.deactivateButtonSpinner('post-shorten-urls-button');
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
		//that.deactivateButtonSpinner('post-shorten-urls-button');
		that._updateCharCount();
	}
	function onShortURLFailure(e, error_obj) {
		//that.deactivateButtonSpinner('post-shorten-urls-button');
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

PostAssistant.prototype.getKotoData = function(e) {
	var appids = ['com.tibfib.app.koto.alt', 'com.tibfib.app.koto', 'com.tibfib.app.koto.lite'], index = 0, that = this;
	function makeCall() {
		if (index < appids.length) {
			Mojo.Log.info('Trying to post with appid %s', appids[index]);
			var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
				method: 'launch',
				parameters: {
					id: appids[index],
					params: {
						action: "getNowPlayingData", 
						callback: {
							id: Mojo.Controller.appInfo.id,
							action: "tweetNowPlaying"
						}
					}
				},
				onFailure: function() {
					Mojo.Log.info('Failed to post with appid %s', appids[index]);
					index++; // go to next appid
					makeCall(); // retry
				}.bind(this)
			});
		} else {
			that.showAlert($L("Want to tweet what you're listening to directly from Spaz? Download Koto Player now!"), 
				$L("Koto Player not installed"),
				function(value) {
					if (value == "lite") {
						that.controller.serviceRequest("palm://com.palm.applicationManager", {
							method: "open",
							parameters: {
								id: 'com.palm.app.browser',
								params: {target: "http://developer.palm.com/appredirect/?packageid=com.tibfib.app.koto.lite"}
							}
						});
					} else if (value == "full") {
						that.controller.serviceRequest("palm://com.palm.applicationManager", {
							method: "open",
							parameters: {
								id: 'com.palm.app.browser',
								params: {target: "http://developer.palm.com/appredirect/?packageid=com.tibfib.app.koto"}
							}
						});
					}
				}.bind(that),
				[
					{label:$L('Buy Full Version'), value:"full"},
					{label:$L('Try Lite Version'), value:"lite"},
					{label:$L('cancel'), type: "dismiss"}
				]
			);
		}

	}
    makeCall();
};

PostAssistant.prototype.addTextToPost = function(text) {
	this.postTextFieldModel.value += text;
	this.controller.modelChanged(this.postTextFieldModel);
	this._updateCharCount();
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
							that.showBanner('Posting message…');

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
							//that.setPostButtonLabel($L('Retry post'));
						} else {
							Mojo.Controller.errorDialog($L("Posting image failed"));
							that.deactivateSpinner();
							//that.setPostButtonLabel($L('Retry post'));
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
				that.showBanner('Uploading image…');
				image_uploader.upload();


				
				
			} else { // normal post without attachment
				if (this.args.type === 'dm') {
					that.showBanner('Sending message…');
                    that.twit.sendDirectMessage(dm_recipient, status,
                        function(data) {
                          that.onDMSuccess.call(that, data);
                        },
                        function(xhr, msg, exc) {
                            that.onDMFailure.call(that, xhr, msg, exc);
                        }
                    );
                    
				} else if (in_reply_to > 0) {
					that.showBanner('Posting reply…');
					this.twit.update(status, null, in_reply_to);
				} else {
					that.showBanner('Posting message…');
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
	
	thisA.chooseImage();

	
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
		//this.setPostButtonLabel($L('Email Image Post'));
	} else {
		//this.setPostButtonLabel($L('Post'));
	}
	
};


PostAssistant.prototype.setPostButtonLabel = function(label) {
	//this.postButtonModel.buttonLabel = label;
	//this.controller.modelChanged(this.postButtonModel);
	
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
	this.renderSuccessfulPost(null, data);
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
	
	this.showBanner('Posted!');
	
	this.deactivateSpinner();
	
	var popper = _.bind(this.popScene, this);
	popper();
};


/**
 *	
 */
PostAssistant.prototype.reportFailedPost = function(error_obj) {
	this.deactivateSpinner();
	this.postTextFieldModel.disabled = false;
	Spaz.getActiveSceneAssistant().controller.modelChanged(this.postTextFieldModel);
	
	var err_msg = $L("There was a problem posting your status");
	this.displayErrorInfo(err_msg, error_obj);
};

PostAssistant.prototype.activateSpinner = function() {
	Mojo.Log.error('activating spinner');
};

PostAssistant.prototype.deactivateSpinner = function() {
	//this.buttonWidget = jQuery('#post-send-button').get(0);
	//this.buttonWidget.mojo.deactivate();
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
	Mojo.Log.error('Spaz.getStageController().getScenes().length: %s', Spaz.getStageController().getScenes().length);
	if (Spaz.getStageController().getScenes().length > 1) {
		Mojo.Log.error('About to returnFromPop');
		Spaz.getStageController().popScene({'returnFromPop': true});
	} else {
		if (this.args.xapp === true) { // if we launched with post args, just close the stage when done
			window.close();
		} else {
			Spaz.getStageController().swapScene({name: 'start'});
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