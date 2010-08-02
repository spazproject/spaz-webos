/*
	Templating functions
*/

sc.app.tpl = new SpazTemplate();

sc.app.tpl.addTemplateMethod('message-detail', function(d) {
	var html = '', thumbHTML = '';

	if (d.SC_thumbnail_urls) {
		thumbHTML += '<div class="thumbnails">';
		for (var key in d.SC_thumbnail_urls) {
			// thumbHTML += '<a href="'+key+'"><img class="thumbnail" data-img-url="'+key+'" src="'+d.SC_thumbnail_urls[key]+'"></a>';
			thumbHTML += '<img class="thumbnail" data-img-url="'+key+'" src="'+d.SC_thumbnail_urls[key]+'">';
		}
		thumbHTML += '</div>';
	}
	
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
	+ '		'+thumbHTML
	+ '		<div class="text">'+d.text+'</div>'
	+ '		<div class="meta" data-status-id="'+d.id+'">'
	+ '			<div class="date"><strong>Posted</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+sch.getRelativeTime(d.created_at)+'</span> from <span class="source-link">'+d.source+'</span></div>';
	if (d.in_reply_to_status_id) {
		html += '			<div class="in-reply-to"><strong>In-reply-to</strong>: <span class="in-reply-to-link clickable" data-irt-status-id="'+d.in_reply_to_status_id+'">@'+d.in_reply_to_screen_name+'</span></div>';
	}
	html += '		</div>'
	+ '	</div>';
	if (sc.app.username) {
		
		html += '	<div id="message-detail-actions">'
		+ '		<div class="palm-group palm-group-spaz">'
		+ '			<div class="palm-group-title" id="search-toggle" x-mojo-loc="">Actions</div>'
		+ '			<div class="palm-list">'
		+ '				<div class="palm-row single">'
		+ '					<button class="palm-button" id="message-detail-action-reply" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'">@Reply to this message</button>'
		+ '				</div>'
		// + '				<div class="palm-row single">'
		// + '					<button class="palm-button" id="message-detail-action-retweet" data-status-id="'+d.id+'">ReTweet this message</button>'
		// + '				</div>'
		+ '				<div class="palm-row single">'
		+ '					<button class="palm-button" id="message-detail-action-share" data-status-id="'+d.id+'">Share this message</button>'
		+ '				</div>';
		if (d.favorited) {
			html += '   			<div class="palm-row single">'
			 + '					<button class="palm-button" id="message-detail-action-favorite" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'" data-favorited="true">Remove as favorite</button>'
			 + '				</div>';
		} else {
			html += '   			<div class="palm-row single">'
			+ '					<button class="palm-button" id="message-detail-action-favorite" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'" data-favorited="false">Add as favorite</button>'
			+ '				</div>';
		}
		html += '   			<div class="palm-row single">'
		+ '					<button class="palm-button" id="message-detail-action-dm" data-screen_name="'+d.user.screen_name+'">Direct message this user</button>'
		+ '				</div>'
		+ '			</div>'
		+ '		</div>'
    + '	</div>';
	}
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('message-detail-dm', function(d) {
	var html = '';
	
	
	html += ''
	+ '	<div class="user" data-user-screen_name="'+d.user.screen_name+'" data-user-id="'+d.user.id+'" data-status-id="'+d.id+'">'
	+ '		<div class="user-image rounded-user-image" style="background-image:url('+d.user.profile_image_url+')" data-screen_name="'+d.user.screen_name+'" title="View user\'s profile"></div>'
	+ '		<div class="screen_name" data-screen_name="'+d.user.screen_name+'">'
	+ 			d.user.screen_name;
	if (d.user["protected"]) {
		html += '			<div class="protected-icon">&nbsp;</div>';
	}
	html += '	</div>';
	if (d.user.name && d.user.name !== d.user.screen_name) {
		html += '		<div class="real_name" data-screen_name="'+d.user.screen_name+'">'+d.user.name+'</div>';
	}
	html +='	</div>';
	
	html += '	<div class="text-status">'
	+ '		<div class="text">'+d.text+'</div>'
	+ '		<div class="meta" data-status-id="'+d.id+'">'
	+ '			<div class="date"><strong>Direct message sent</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+sch.getRelativeTime(d.created_at)+'</span></div>'
	+ '		</div>'
	+ '	</div>';
	if (sc.app.username) {
		html += '	<div id="message-detail-actions">'
		+ '		<div class="spaz-button-group">'
		+ '			<div class="palm-group palm-group-spaz">'
		+ '				<div class="palm-group-title" id="search-toggle" x-mojo-loc="">Actions</div>'
		+ '				<div class="palm-list">'
		+ '					<div class="palm-row single">'
		+ '						<button class="palm-button" id="message-detail-action-dm" data-screen_name="'+d.user.screen_name+'">Direct message this user</button>'
		+ '					</div>'
		+ '				</div>'
		+ '			</div>'
		+ '		</div>'
		+ '	</div>';
	};
	html += '</div>';


	// html = "DM detail view is not yet implemented!";

	return html;
});


/*
	@TODO
*/
sc.app.tpl.addTemplateMethod('message-detail-searchresult', function(d) {
	var html = 'Search result detail not finished yet';
	return html;
});



sc.app.tpl.addTemplateMethod('user-detail', function(d) {
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
	+ '		<div class="user-description">'+(d.description || "")+'</div>';
	if (d.location) {
		html += '   	 <div><a class="user-location" href="http://maps.google.com/?q=' +encodeURIComponent(d.location)+ '" title="View this location on a map">'+d.location+'</a></div>';
	}
	if (d.url) {
		html += '		<div><a class="user-homepage" href="'+d.url+'" title="Open user\'s homepage">Homepage</a></div>';
	}
	// if (d.protected) {
	// 	html += '		<div class="protected-icon">Protected user</div>';
	// }
	html += '	</div>';
	
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
	
	
	
	
	html += '		<div id="user-detail-actions">';
	

	html += '			<div class="spaz-button-group">'
	+ '				<div class="palm-group palm-group-spaz">'
	+ '					<div class="palm-group-title" id="search-toggle" x-mojo-loc="">Actions</div>'
	+ '					<div class="palm-list">'
	+ '						<div class="palm-row single">'
	+ '							<button id="search-user" class="palm-button" data-screen_name="'+d.screen_name+'">Search for user</button>'
	+ '						</div>';
	if (sc.app.username) {
		html += '						<div class="palm-row single">'
		+ '							<button id="reply-to-user" class="palm-button" data-screen_name="'+d.screen_name+'">@reply to user</button>'
		+ '						</div>'
		+ '						<div class="palm-row single">'
		+ '							<button id="dm-user" class="palm-button" data-screen_name="'+d.screen_name+'">Send direct message to user</button>'
		+ '						</div>';
		if (d.following) {
			html += '						<div class="palm-row single">'
			+ '							<button id="follow-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-following="true">Stop following user</button>'
			+ '						</div>';

		} else {
			html += '						<div class="palm-row single">'
			+ '							<button id="follow-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-following="false">Follow user</button>'
			+ '						</div>';

		}
		html += '						<div class="palm-row single">'
		+ '							<button id="block-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-blocked="false">Block user</button>'
		+ '						</div>';
	};
	html += '					</div>'
	+ '				</div>'
	+ '			</div>'
	+ '		</div>'
	+ '	</div>';

	return html;
});


sc.app.tpl.addTemplateMethod('tweet', function(d) {
	var html = '';
	
	if (!d.user || !d.user.id) {
		sch.error('Tweet did not contain a user object');
		sch.error('Tweet object: '+sch.enJSON(d));
	}
	
	html += '<div class="timeline-entry';
	if (!d.not_new) {
		html += ' new';
	}
	if (d.SC_is_reply) {
		html += ' reply';
	}
	html += '" data-status-id="'+d.id+'" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
	+ '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">'
	+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.user.profile_image_url+')"></div>'
	+ '	</div>'
	+ '	<div class="text-status">'
	+ '		<div class="meta-wrapper">'
	+ '			<div class="screen-name">'+d.user.screen_name;
	if (d.user["protected"]) {
		html += '			<div class="protected-icon"></div>';
	}
	html += '			</div>'
	+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+sch.getRelativeTime(d.created_at)+'</span></div>'
	+ '		</div>'
	+ '	 	<div class="text">'
	+ '			'+d.text+''
	+ '		</div>'
	+ '	</div>'
	+ '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('dm', function(d) {
	var html = '';

	html += '<div class="timeline-entry dm';
	if (!d.from_cache) {
		html += ' new';
	}
	html += '" data-isdm="true" data-status-id="'+d.id+'" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
	+ '	<div class="user" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'">'
	+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.sender.profile_image_url+')"></div>'
	+ '	</div>'
	+ '	<div class="text-status">'
	+ '		<div class="meta-wrapper">'
	+ '			<div class="screen-name">'+d.sender.screen_name+'</div>'
	+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+sch.getRelativeTime(d.created_at)+'</span></div>'
	+ '		</div>'
	+ '	 	<div class="text">'
	+ '			'+d.text+''
	+ '		</div>'
	+ '	</div>';
	// html += '  <div class="entry-json" style="display:none">'+sch.enJSON(d)+'</div>';
	html += '  <div class="entry-json" style="display:none"></div>'
	+ '</div>';
	
	return html;
});

sc.app.tpl.addTemplateMethod('search-item', function(d) {
	var html = '';

	html += '<div class="timeline-entry" data-issearch="true" data-status-id="'+d.id+'" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'" data-timestamp="'+d.SC_created_at_unixtime+'">'
	+ '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">'
	+ '		<div class="user-img rounded-user-image" style="background-image:url('+d.user.profile_image_url+')"></div>'
	+ '	</div>'
	+ '	<div class="text-status">'
	+ '		<div class="meta-wrapper">'
	+ '			<div class="screen-name">'+d.from_user+'</div>'
	+ '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+sch.getRelativeTime(d.created_at)+'</span></div>'
	+ '		</div>'
	+ '	 	<div class="text">'
	+ '			'+d.text+''
	+ '		</div>'
	+ '	</div>'
	+ '</div>';

	return html;
});


sc.app.tpl.addTemplateMethod('error_info', function(d) {
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
	
	dump(d);
	
	var html = '';
	
	html += '<div class="error_info">';
	
	html += ' <div class="human_msg">'+d.human_msg+'</div>';
	if (d.twitter_msg) {
		html += ' <div class="row"><div class="label">'+$L('Twitter error')+'</div> <div class="value twitter_msg">'+d.twitter_msg+'</div></div>'
		+ ' <div class="row"><div class="label">'+$L('Twitter request')+'</div> <div class="value twitter_request">'+d.twitter_request+'</div></div>';
	}
	html += ' <div class="row"><div class="label">'+$L('Status code')+'</div> <div class="value status">'+d.status+'</div></div>'
	+ ' <div class="row"><div class="label">'+$L('Status text')+'</div> <div class="value statusText">'+d.statusText+'</div></div>'	
	+ ' <div class="row"><div class="label">'+$L('URL')+'</div> <div class="value url">'+d.url+'</div></div>'
  + '</div>';
	
	return html;
	
});

sc.app.tpl.addTemplateMethod('error_info_text', function(d) {
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
	
	sch.debug(d);
	
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



