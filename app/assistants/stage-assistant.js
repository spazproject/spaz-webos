function StageAssistant () {	
	Mojo.Log.info("Logging from StageAssistant Constructor");
	sc.setDumpLevel(5);
	
	/*
		this connects App to this property of the appAssistant
	*/
	window.App = Spaz.getAppObj();
	
	/*
		we init this here because SpazAuth is loaded in the stage's window object
		and not mapped back from the appController
	*/
	SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
	        authType: SPAZCORE_AUTHTYPE_OAUTH,
	        consumerKey: SPAZCORE_CONSUMERKEY_TWITTER,
	        consumerSecret: SPAZCORE_CONSUMERSECRET_TWITTER,
	        accessURL: 'https://twitter.com/oauth/access_token'
	    });
	
	/*
		loads the SpazCore templates
	*/
	this.loadTemplates();
	
	Spaz.setTheme(Spaz.getAppObj().prefs.get('app-theme'));
}




StageAssistant.prototype.setup = function() {
	Mojo.Log.info("Logging from StageAssistant Setup");
	
	var thisSA = this;
	
	this.gestureStartHandler = this.gestureStart.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.document, "gesturestart", this.gestureStartHandler);
	this.gestureEndHandler = this.gestureEnd.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.document, "gestureend", this.gestureEndHandler);
};


StageAssistant.prototype.cleanup = function() {
	
	Mojo.Log.info("StageAssistant cleanup");

	var sc = null;
	
	Mojo.Event.stopListening(this.controller.document, "gesturestart", this.gestureStartHandler);
	Mojo.Event.stopListening(this.controller.document, "gestureend", this.gestureEndHandler);
	/*
		try to clean up ALL jQuery listeners everywhere
	*/
	jQuery(document).unbind();
	jQuery(document).die();
};

StageAssistant.prototype.gestureStart = function(event) {
	this.gestureStartY = event.centerY;
};
 
StageAssistant.prototype.gestureEnd = function(event) {
	var gestureDistanceY = event.centerY - this.gestureStartY;
	if (gestureDistanceY > 0) {
		this.controller.activeScene().getSceneScroller().mojo.revealTop();
	} else if (gestureDistanceY < 0) {
		this.controller.activeScene().getSceneScroller().mojo.revealBottom();
	}
};


StageAssistant.prototype.considerForNotification = function(params){   
	Mojo.Log.error('NOTIFICATION RECEIVED in StageAssistant:%j ', params);

	return params;   
};


StageAssistant.prototype.handleCommand = function(event){
	
	sch.error("StageAssistant handleCommand:"+event.command);
	
	var active_scene = this.controller.activeScene();
	
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			
			
			/*
				Navigation
			*/
			case 'accounts':
				Spaz.findAndSwapScene("startlogin", active_scene);
				break;
			case 'my-timeline':
				Spaz.findAndSwapScene("my-timeline", active_scene);
				break;
			case 'favorites':
				Spaz.findAndSwapScene("favorites", active_scene);
				break;
			case 'friends-followers':
				Spaz.findAndSwapScene("friends-followers", active_scene);
				break;
			case 'search':
				Spaz.findAndSwapScene("startsearch", active_scene);
				break;
			case 'followers':
				Spaz.findAndSwapScene("manage-followers", active_scene);
				break;
			case 'appmenu-about':
				Mojo.Controller.stageController.pushScene("about", active_scene);
				break;
			case Mojo.Menu.prefsCmd:
				Mojo.Controller.stageController.pushScene("preferences", active_scene);
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Controller.stageController.pushScene("help", active_scene);
				break;
		
			
			default:
				break;			
		}
		
	}
};


/**
 *  
 */
StageAssistant.prototype.gotoMyTimeline = function(stageController) {
	/*
		load users from prefs obj
	*/
	var users = new SpazAccounts(App.prefs);
	users.load();
	
	/*
		get last user
	*/
	if (App.prefs.get('always-go-to-my-timeline')) {
		var last_userid = App.prefs.get('last_userid');
		var last_user_obj = users.get(last_userid);
		if (last_user_obj !== false) {
			sch.error(last_user_obj);
			App.username = last_user_obj.username;
			App.type     = last_user_obj.type;
			App.userid   = last_user_obj.id;
			this.controller.pushScene('my-timeline');
		} else {
			this.controller.pushScene('start');
		}
	} else {
		this.controller.pushScene('start');
	}
				
};




StageAssistant.prototype.loadTemplates = function() {
	/*
		Templating functions
	*/

	App.tpl = new SpazTemplate();

	App.tpl.addTemplateMethod('message-detail', function(d) {
		
		if (App.username) { // might not be logged-in
			d.isSent = (d.user.screen_name.toLowerCase() === App.username.toLowerCase());
		}		

		var html = '', thumbHTML = '';

		// if (d.SC_thumbnail_urls) {
		// 	thumbHTML += '<div class="thumbnails">';
		// 	for (var key in d.SC_thumbnail_urls) {
		// 		// thumbHTML += '<a href="'+key+'"><img class="thumbnail" data-img-url="'+key+'" src="'+d.SC_thumbnail_urls[key]+'"></a>';
		// 		thumbHTML += '<img class="thumbnail" data-img-url="'+key+'" src="'+d.SC_thumbnail_urls[key]+'">';
		// 	}
		// 	thumbHTML += '</div>';
		// }

		html += ''
		+ '	<div class="user" data-user-screen_name="'+d.user.screen_name+'" data-user-id="'+d.user.id+'" data-status-id="'+d.id+'">'
		+ '		<div class="user-image rounded-user-image" style="background-image:url('+d.user.profile_image_url+')" data-screen_name="'+d.user.screen_name+'" data-user-id="'+d.user.id+'" title="View user\'s profile"></div>'
		+ '		<div class="screen_name" data-screen_name="'+d.user.screen_name+'">'
		+ 			d.user.screen_name;
		if (d.user["protected"]) {
			html += '			<div class="protected-icon">&nbsp;</div>';
		}
		html += '	</div>';
		if (d.user.name && d.user.name !== d.user.screen_name) {
			html += '		<div class="real_name" data-screen_name="'+d.user.screen_name+'">'+d.user.name+'</div>';
		}
		html += '	</div>'
		+ '	<div class="text-status">'
		// + '		'+thumbHTML
		+ '		<div class="text">'+d.text+'</div>'
		+ '		<div class="meta" data-status-id="'+d.id+'">'
		+ '			<div class="date">'
		+ '             <strong>Posted</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+Spaz.getFancyTime(d.created_at)+'</span>'
		+ '             from <span class="source-link">'+d.source+'</span></div>'
		+ '		</div>'
		+ '	</div>';
		+ '</div>';

		return html;
	});

    App.tpl.addTemplateMethod('message-detail-irt', function(d) {
        html = '<div class="in-reply-to" data-irt-status-id="'+d.in_reply_to_status_id+'"><strong>View conversation with</strong> <span class="in-reply-to-link clickable" data-irt-status-id="'+d.in_reply_to_status_id+'">@'+d.in_reply_to_screen_name+'</span></div>';        
        return html;
    });


	App.tpl.addTemplateMethod('message-detail-dm', function(d) {
		var html = '';


		html += ''
		+ '	<div class="user" data-user-screen_name="'+d.sender.screen_name+'" data-user-id="'+d.sender.id+'" data-status-id="'+d.id+'">'
		+ '		<div class="user-image rounded-user-image" style="background-image:url('+d.sender.profile_image_url+')" data-screen_name="'+d.sender.screen_name+'" title="View user\'s profile"></div>'
		+ '		<div class="screen_name" data-screen_name="'+d.sender.screen_name+'">'
		+ 			d.sender.screen_name;
		if (d.sender["protected"]) {
			html += '			<div class="protected-icon">&nbsp;</div>';
		}
		html += '	</div>';
		if (d.sender.name && d.sender.name !== d.sender.screen_name) {
			html += '		<div class="real_name" data-screen_name="'+d.sender.screen_name+'">'+d.sender.name+'</div>';
		}
		html +='	</div>';

		html += '	<div class="text-status">'
		+ '		<div class="text">'+d.text+'</div>'
		+ '		<div class="meta" data-status-id="'+d.id+'">'
		+ '			<div class="date"><strong>Direct message sent</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+Spaz.getFancyTime(d.created_at)+'</span></div>'
		+ '		</div>'
		+ '	</div>';
		+ '</div>';

		return html;
	});


	/*
		@TODO
	*/
	App.tpl.addTemplateMethod('message-detail-searchresult', function(d) {
		var html = 'Search result detail not finished yet';
		return html;
	});



	App.tpl.addTemplateMethod('user-detail', function(d) {
		var html = '';

		html += ''
		+ '<div id="user-detail">'
		+ '	<div class="user" data-user-screen_name="'+d.screen_name+'" data-user-id="'+d.id+'" data-status-id="'+d.id+'">'
		+ '		<div class="user-image rounded-user-image" style="background-image:url('+d.profile_image_url+')" data-screen_name="'+d.screen_name+'" title="View user\'s profile"></div>'
		+ '		<div class="screen_name" data-screen_name="'+d.screen_name+'">'
		+ 			d.screen_name;
		if (d["protected"]) {
			html += '			<div class="protected-icon">&nbsp;</div>';
		}
		html += '		</div>';
		if (d.name && d.name !== d.screen_name) {
			html += '		<div class="real_name" data-screen_name="'+d.screen_name+'">'+d.name+'</div>';
		}
		html +='	</div>'
		+ '	<div class="user-info">'
		+ '		<div class="user-description">'+d.description+'</div>'
		+ '	</div>';

		/*
			details table
		*/
		var url_str = $L('n/a');
		var loc_str = $L('n/a');
		if (d.url) {
			url_str = '<a class="user-homepage" href="'+d.url+'" title="Open user\'s homepage">'+d.url+'</a>';
		}		
		if (d.location) {
			loc_str = '<a class="user-location" href="http://maps.google.com/?q=' +encodeURIComponent(d.location)+ '" title="View this location on a map">'+d.location+'</a>';
		}

		html += ''
		+ '<div class="user-info-stats">'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('URL')+'</div>'
		+ '		<div class="value">'+url_str+'</div>'
		+ '	</div>'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('Location')+'</div>'
		+ '		<div class="value">'+loc_str+'</div>'
		+ '	</div>'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('Friends')+'</div>'
		+ '		<div class="value">'+d.friends_count+'</div>'
		+ '	</div>'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('Followers')+'</div>'
		+ '		<div class="value">'+d.followers_count+'</div>'
		+ '	</div>'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('Statuses')+'</div>'
		+ '		<div class="value">'+d.statuses_count+'</div>'
		+ '	</div>'
		+ '	<div class="row">'
		+ '		<div class="label">'+$L('Since')+'</div>'
		+ '		<div class="value">'+(new Date(d.created_at).toDateString())+'</div>'
		+ '	</div>'
		+ '</div>';

		html += ''
		+ '	<table class="palm-divider collapsible" id="user-timeline-trigger" x-mojo-tap-highlight="momentary">'
		+ '		<tbody>'
		+ '			<tr>'
		+ '				<td class="left"></td>'
		+ '				<td class="label">'+$L('View User\'s Posts')+'</td>'
		+ '				<td class="line" width="100%"></td>'
		+ '				<td><div class="palm-arrow-closed arrow_button"></div></td>'
		+ '				<td class="right"></td>'
		+ '			</tr>'
		+ '		</tbody>'
		+ '	</table> '
		+ '	<div class="pane">'
		+ '		<div id="user-timeline" data-screen_name="'+d.screen_name+'" style="display:none"></div>'
		+ '	</div>'
		+ '</div>';

		return html;
	});


	App.tpl.addTemplateMethod('tweet', function(d) {
		var html = '';

		if (!d.user || !d.user.id) {
			sch.error('Tweet did not contain a user object');
			sch.error('Tweet object: '+sch.enJSON(d));
		}

		html += '<div class="timeline-entry';
		if (d.Spaz_is_new) {
			html += ' new';
		}
		if (d.SC_is_reply) {
			html += ' reply';
		}
		if (d.SC_is_retweet) {
			html += ' retweet';
		}
		html += '" data-status-id="'+d.id+'" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
		+ '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">'
		+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.user.profile_image_url+'); background-size: 100% 100%;"></div>'
		+ '	</div>';
		if (d.SC_is_retweet && d.retweeting_user) {
			html +=''
			+ '	<div class="rt-user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">'
			+ '		<div class="rt-user-img rounded-user-image" style="background-image:url('+d.retweeting_user.profile_image_url+'); background-size: 100% 100%;"></div>'
			+ '	</div>';
		}
		html += ''
		+ '	<div class="text-status">'
		+ '		<div class="meta-wrapper">'
		+ '			<div class="screen-name">'+d.user.screen_name;
		if (d.SC_is_retweet && d.retweeting_user) {
			html += ' <div class="retweeted-indicator"></div> '+d.retweeting_user.screen_name;
		}
		if (d.user["protected"]) {
			html += '			<div class="protected-icon"></div>';
		}
		html += '			</div>'
		+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+Spaz.getFancyTime(d.created_at, RELATIVE_TIME_LABELS)+'</span></div>'
		+ '		</div>'
		+ '	 	<div class="text">'
		+ '			'+d.text+''
		+ '		</div>'
		+ '	</div>'
		+ '</div>';

		return html;
	});

	App.tpl.addTemplateMethod('dm', function(d) {
		var html = '';

		html += '<div class="timeline-entry dm';
		if (d.Spaz_is_new) {
			html += ' new';
		}
		html += '" data-isdm="true" data-status-id="'+d.id+'" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
		+ '	<div class="user" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'">'
		+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.sender.profile_image_url+')"></div>'
		+ '	</div>'
		+ '	<div class="text-status">'
		+ '		<div class="meta-wrapper">'
		+ '			<div class="screen-name">'+d.sender.screen_name+'</div>'
		+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+Spaz.getFancyTime(d.created_at, RELATIVE_TIME_LABELS)+'</span></div>'
		+ '		</div>'
		+ '	 	<div class="text">'
		+ '			'+d.text+''
		+ '		</div>'
		+ '	</div>'
		+ '</div>';
		
		return html;
	});

	App.tpl.addTemplateMethod('search-item', function(d) {
		var html = '';

		html += '<div class="timeline-entry" data-issearch="true" data-status-id="'+d.id+'" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
		+ '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">'
		+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.user.profile_image_url+')"></div>'
		+ '	</div>'
		+ '	<div class="text-status">'
		+ '		<div class="meta-wrapper">'
		+ '			<div class="screen-name">'+d.from_user+'</div>'
		+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+Spaz.getFancyTime(d.created_at, RELATIVE_TIME_LABELS)+'</span></div>'
		+ '		</div>'
		+ '	 	<div class="text">'
		+ '			'+d.text+''
		+ '		</div>'
		+ '	</div>'
		+ '</div>';

		return html;
	});


	App.tpl.addTemplateMethod('error_info', function(d) {
		/*
		* status':		
		* statusText':	
		* responseText':	
		* url':			
		* msg':			
		* human_msg':	
		* twitter_request
		* twitter_msg':	    		
		*/

		Mojo.Log.error('%j', d);

		var html = '';

		html += '<div class="error_info">';

		html += ' <div class="human_msg">'+d.human_msg+'</div>';
		if (d.url) {
		    html += ' <div class="row url">'+d.url+'</div>';
		}
		if (d.twitter_msg) {
			html += ' <div class="row"><div class="label">'+$L('Twitter error')+'</div> <div class="value twitter_msg">'+d.twitter_msg+'</div></div>'
			+ ' <div class="row"><div class="label">'+$L('Twitter req')+'</div> <div class="value twitter_request">'+d.twitter_request+'</div></div>';
		}
		if (d.status) {
			html += ' <div class="row"><div class="label">'+$L('Status code')+'</div> <div class="value status">'+d.status+'</div></div>';
		}
		if (d.statusText) {
			html += ' <div class="row"><div class="label">'+$L('Status text')+'</div> <div class="value statusText">'+d.statusText+'</div></div>';
		}
		html += '</div>';

		return html;

	});

	App.tpl.addTemplateMethod('error_info_text', function(d) {
		/*
		* status':		
		* statusText':	
		* responseText':	
		* url':			
		* msg':			
		* human_msg':	
		* twitter_request
		* twitter_msg':	    		
		*/

		Mojo.Log.error('%j', d);

		var html = '';

		html += d.human_msg+"\n";
		if (d.twitter_msg) {
			html += $L('Twitter error')+  ':'+d.twitter_msg+"\n"
			+ $L('Twitter request')+':'+d.twitter_request+"\n";
		}
		// html += $L('Status code')+':'+d.status+"\n"
		// + $L('Status text')+':'+d.statusText+"\n"
		// + $L('URL')        +':'+d.url+"\n";
		html += $L('Status code')+':'+d.status+"\n"
		+ $L('URL')        +':'+d.url+"\n";

		return html;

	});

    App.tpl.addTemplateMethod('follower_row', function(d) {
        var arr_html = [
            '<div class="timeline-entry follower">',
                '<div class="user" data-user-id="'+d.id+'" data-user-screen_name="'+d.screen_name+'">',
                    '<div class="user-img rounded-user-image" style="background-image:url('+d.profile_image_url+')"></div>',
                '</div>',
                '<div class="user-name">',
                    '<div class="user-name-screen">',
                        d.screen_name,
                    '</div>',
                    '<div class="user-name-full">',
                        d.name||'',
                    '</div>',
                '</div>',
            '</div>'
        ];
        
        return arr_html.join('');
    });

};
