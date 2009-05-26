/*
	Templating functions
*/

sc.app.tpl = new SpazTemplate();

sc.app.tpl.addTemplateMethod('message-detail', function(d) {
	var html = '';
	
	html += '<div data-user-screen_name="'+d.user.screen_name+'" data-user-id="'+d.user.id+'" data-status-id="'+d.id+'">';
	html += '	<img src="'+d.user.profile_image_url+'" id="message-detail-image" data-screen_name="'+d.user.screen_name+'" title="View user\'s profile" />';
	html += '	<div class="status">';
	html += '		<div class="screen_name" data-screen_name="'+d.user.screen_name+'">'+d.user.screen_name+'</div>';
	html += '		<div class="text">'+d.text+'</div>';
	html += '		<div class="meta" data-status-id="'+d.id+'">';
	html += '			<div class="date"><strong>Posted</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+d.relative_time+'</span> <strong>from</strong> <span class="source-link">'+d.source+'</span></div>';
	if (d.in_reply_to_status_id) {
		html += '			<div class="in-reply-to"><strong>In-reply-to</strong>: <span class="in-reply-to-link clickable" data-irt-status-id="'+d.in_reply_to_status_id+'">@'+d.in_reply_to_screen_name+'</span></div>';
	}
	html += '		</div>';
	html += '	</div>';
	if (sc.app.username && sc.app.password) {
		html += '	<div id="message-detail-actions">';
		html += '		<div class="spaz-button-group">';
		html += '			<button class="palm-button" id="message-detail-action-reply" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'">@Reply to this message</button>';
		html += '			<button class="palm-button" id="message-detail-action-retweet" data-status-id="'+d.id+'">ReTweet this message</button>';
		html += '			<button class="palm-button" id="message-detail-action-dm" data-screen_name="'+d.user.screen_name+'">Direct message this user</button>';
		if (d.favorited) {
			html += '			<button class="palm-button" id="message-detail-action-favorite" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'" data-favorited="true">Remove as favorite</button>';
		} else {
			html += '			<button class="palm-button" id="message-detail-action-favorite" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'" data-favorited="false">Add as favorite</button>';
		}
		html += '		</div>';
		html += '	</div>';
	}
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('message-detail-dm', function(d) {
	var html = '';
	
	html += '<div data-user-screen_name="'+d.sender.screen_name+'" data-user-id="'+d.sender.id+'" data-status-id="'+d.id+'" data-isdm="true">';
	html += '	<img src="'+d.sender.profile_image_url+'" id="message-detail-image" data-screen_name="'+d.sender.screen_name+'" title="View user\'s profile" />';
	html += '	<div class="status">';
	html += '		<div class="screen_name" data-screen_name="'+d.sender.screen_name+'">'+d.sender.screen_name+'</div>';
	html += '		<div class="text">'+d.text+'</div>';
	html += '		<div class="meta" data-status-id="'+d.id+'">';
	html += '			<div class="date"><strong>Direct message sent</strong> <span class="date-relative" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '		</div>';
	html += '	</div>';
	if (sc.app.username && sc.app.password) {
		html += '	<div id="message-detail-actions">';
		html += '		<div class="spaz-button-group">';
		html += '			<button class="palm-button" id="message-detail-action-dm" data-screen_name="'+d.sender.screen_name+'">Direct message this user</button>';
		html += '		</div>';
		html += '	</div>';
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
	
	html += '	<div data-screen_name="'+d.screen_name+'" data-id="'+d.id+'">';
	html += '		<img src="'+d.profile_image_url+'" id="user-detail-image" data-screen_name="'+d.screen_name+'" title="View user\'s profile" />';
	html += '		<div id="user-detail-info">';
	html += '			<div id="user-detail-name" data-screen_name="'+d.screen_name+'">';
	html += '			'+d.name;
	if (d.name !== d.screen_name) {
		html += '			('+d.screen_name+')';
	}
	html += '			</div>';
	
	html += '			<div id="user-detail-description">'+d.description+'</div>';

	if (d.location) {
		html += '		    <div><a id="user-detail-location" href="http://maps.google.com/?q=' +encodeURIComponent(d.location)+ '" title="View this location on a map">'+d.location+'</a></div>';
	}
	if (d.url) {
		html += '			<div><a id="user-detail-homepage" href="'+d.url+'" title="Open user\'s homepage">Homepage</a></div>';
	}
	html += '		</div>';
	html += '		<div id="user-detail-actions">';
	// html += '			<div class="spaz-button-group">';
	html += '				<button id="view-user-posts" class="palm-button" data-screen_name="'+d.screen_name+'">View user\'s recent posts</button>';
	html += '				<div id="user-timeline" data-screen_name="'+d.screen_name+'" style="display:none"></div>';
	html += '				<button id="search-user"class="palm-button" data-screen_name="'+d.screen_name+'">Search for user</button>';
	// html += '			</div>';
	if (sc.app.username && sc.app.password) {
		// html += '			<div class="spaz-button-group">';
		html += '				<button id="reply-to-user" class="palm-button" data-screen_name="'+d.screen_name+'">@reply to user</button>';
		html += '				<button id="dm-user" class="palm-button" data-screen_name="'+d.screen_name+'">Send direct message to user</button>';
		// html += '			</div>';
		// html += '			<div class="spaz-button-group">';
		if (d.following) {
			html += '				<button id="follow-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-following="true">Stop following user</button>';
		} else {
			html += '				<button id="follow-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-following="false">Follow user</button>';
		}
		html += '				<button id="block-user" class="palm-button" data-screen_name="'+d.screen_name+'" data-blocked="false">Block user</button>';
		// html += '			</div>';
	};
	html += '		</div>';
	html += '	</div>';

	return html;
});


sc.app.tpl.addTemplateMethod('tweet', function(d) {
	var html = '';
	
	html += '<div class="timeline-entry';
	if (!d.from_cache) {
		html += ' new';
	}
	if (d.SC_is_reply) {
		html += ' reply'
	}
	html += '" data-status-id="'+d.id+'" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">';
	html += '		<img src="'+d.user.profile_image_url+'" title="'+d.user.screen_name+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="meta-wrapper">';
	html += '			<div class="screen-name">'+d.user.screen_name+'</div>';
	html += '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '		</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '	</div>';
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('dm', function(d) {
	var html = '';

	html += '<div class="timeline-entry dm';
	if (!d.from_cache) {
		html + ' new';
	}
	html += '" data-isdm="true" data-status-id="'+d.id+'" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'">';
	html += '		<img src="'+d.sender.profile_image_url+'" title="'+d.sender.screen_name+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="meta-wrapper">';
	html += '			<div class="screen-name">'+d.sender.screen_name+'</div>';
	html += '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '		</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '	</div>';
	// html += '  <div class="entry-json" style="display:none">'+sch.enJSON(d)+'</div>';
	html += '  <div class="entry-json" style="display:none"></div>';
	html += '</div>';
	
	return html;
});

sc.app.tpl.addTemplateMethod('search-item', function(d) {
	var html = '';

	html += '<div class="timeline-entry" data-issearch="true" data-status-id="'+d.id+'" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'">';
	html += '		<img src="'+d.profile_image_url+'" title="'+d.from_user+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="meta-wrapper">';
	html += '			<div class="screen-name">'+d.from_user+'</div>';
	html += '			<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '		</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '	</div>';
	html += '</div>';

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
	
	html += ' <div class="human_msg">'+d.human_msg+'</div>'
	if (d.twitter_msg) {
		html += ' <div class="row"><div class="label">'+$L('Twitter error')+'</div> <div class="value twitter_msg">'+d.twitter_msg+'</div></div>'
		html += ' <div class="row"><div class="label">'+$L('Twitter request')+'</div> <div class="value twitter_request">'+d.twitter_request+'</div></div>'
	}
	html += ' <div class="row"><div class="label">'+$L('Status code')+'</div> <div class="value status">'+d.status+'</div></div>'
	html += ' <div class="row"><div class="label">'+$L('Status text')+'</div> <div class="value statusText">'+d.statusText+'</div></div>'	
	html += ' <div class="row"><div class="label">'+$L('URL')+'</div> <div class="value url">'+d.url+'</div></div>'	
	
	
	html += '</div>';
	
	return html;
	
});



