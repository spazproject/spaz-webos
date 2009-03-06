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
	html += '	<div id="message-detail-actions">';
	html += '		<div class="spaz-button-group">';
	html += '			<div class="spaz-button-wide" id="message-detail-action-reply" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'">@Reply to this message</div>';
	html += '			<div class="spaz-button-wide" id="message-detail-action-retweet" data-status-id="'+d.id+'">ReTweet this message</div>';
	html += '			<div class="spaz-button-wide" id="message-detail-action-dm" data-screen_name="'+d.user.screen_name+'">Direct message this user</div>';
	html += '			<div class="spaz-button-wide" id="message-detail-action-favorite" data-status-id="'+d.id+'" data-screen_name="'+d.user.screen_name+'">Add as favorite</div>';
	html += '		</div>';
	html += '	</div>';
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('user-detail', function(d) {
	var html = '';
	
	html += '	<div data-screen_name="'+d.screen_name+'" data-id="'+d.id+'">';
	html += '		<img src="'+d.profile_image_url+'" id="user-detail-image" data-screen_name="'+d.screen_name+'" title="View user\'s profile" />';
	html += '		<div id="user-detail-info">';
	html += '			<div id="user-detail-name" data-screen_name="'+d.screen_name+'">'+d.name+' ('+d.screen_name+')</div>';
	html += '			<div id="user-detail-description">'+d.description+'</div>';

	if (d.location) {
		html += '		    <div><a id="user-detail-location" href="http://maps.google.com/?q=' +encodeURIComponent(d.location)+ '" title="View this location on a map">'+d.location+'</a></div>';
	}
	if (d.url) {
		html += '			<div><a id="user-detail-homepage" href="'+d.url+'" title="Open user\'s homepage">Homepage</a></div>';
	}
	html += '		</div>';
	html += '		<div id="user-detail-actions">';
	html += '			<div class="spaz-button-group">';
	html += '				<div id="view-user-posts" class="spaz-button-wide" data-screen_name="'+d.screen_name+'">View user\'s recent posts</div>';
	html += '				<div id="user-timeline" data-screen_name="'+d.screen_name+'" style="display:none"></div>';
	html += '				<div id="search-user"class="spaz-button-wide" data-screen_name="'+d.screen_name+'">Search for user</div>';
	html += '			</div>';
	html += '			<div class="spaz-button-group">';
	html += '				<div id="reply-to-user" class="spaz-button-wide" data-screen_name="'+d.screen_name+'">@reply to user</div>';
	html += '				<div id="dm-user" class="spaz-button-wide" data-screen_name="'+d.screen_name+'">Send direct message to user</div>';
	html += '			</div>';
	html += '			<div class="spaz-button-group">';
	html += '				<div id="follow-user" class="spaz-button-wide" data-screen_name="'+d.screen_name+'">Follow user</div>';
	html += '				<div id="block-user" class="spaz-button-wide" data-screen_name="'+d.screen_name+'">Block user</div>';
	html += '			</div>';
	html += '		</div>';
	html += '	</div>';

	return html;
});


sc.app.tpl.addTemplateMethod('tweet', function(d) {
	var html = '';
	

	html += '<div class="timeline-entry new" data-status-id="'+d.id+'" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.user.id+'" data-user-screen_name="'+d.user.screen_name+'">';
	html += '		<img src="'+d.user.profile_image_url+'" title="'+d.user.screen_name+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="screen-name">'+d.user.screen_name+'</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '		<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '	</div>';
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('dm', function(d) {
	var html = '';

	html += '<div class="timeline-entry new" data-status-id="'+d.id+'" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.sender.id+'" data-user-screen_name="'+d.sender.screen_name+'">';
	html += '		<img src="'+d.sender.profile_image_url+'" title="'+d.sender.screen_name+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="screen-name">'+d.sender.screen_name+'</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '		<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span></div>';
	html += '	</div>';
	html += '</div>';

	return html;
});

sc.app.tpl.addTemplateMethod('search-item', function(d) {
	var html = '';

	html += '<div class="timeline-entry new" data-status-id="'+d.id+'" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'" data-timestamp="'+d.created_at_unixtime+'">';
	html += '	<div class="user" data-user-id="'+d.from_user_id+'" data-user-screen_name="'+d.from_user+'">';
	html += '		<img src="'+d.profile_image_url+'" title="'+d.from_user+'" />';
	html += '	</div>';
	html += '	<div class="status">';
	html += '		<div class="screen-name">'+d.from_user+'</div>';
	html += '	 	<div class="text">';
	html += '			'+d.text+'';
	html += '		</div>';
	html += '		<div class="meta" data-status-id="'+d.id+'"><span class="date" data-created_at="'+d.created_at+'">'+d.relative_time+'</span> &#x2192;</div>';
	html += '	</div>';
	html += '</div>';

	return html;
});

