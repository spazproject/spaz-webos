var default_preferences = {
	
	'last_username':null,
	'last_type':null,
	'last_userid':null,
	
	'app-theme':'Dreadnaught',

	'users':[], // an array of user objects with properties { 'id', 'username', 'password', 'type', 'meta' }	
	'always-go-to-my-timeline':false,

    'use-markdown': true,

    'sound-enabled': true,
    'vibration-enabled': true,
    'wilhelm-enabled': true,

    'network-refreshinterval': 900000,
    'network-searchrefreshinterval': 900000,

    'network-autoadjustrefreshinterval': true,

	'notify-newmessages':true,
	'notify-mentions':true,
	'notify-dms':true,
	'notify-searchresults':true,
	
	'network-refresh-auto':true,
	'network-refresh-wake':false,
	
    'timeline-scrollonupdate': true,

    'timeline-maxentries': 100,
    'timeline-maxentries-dm': 50, 
    'timeline-maxentries-reply': 50, 

    'timeline-friends-getcount': 100,
    'timeline-replies-getcount': 10,
    'timeline-dm-getcount': 10,

	'timeline-save-cache': true,

    'url-shortener': 'bitly',

    'image-uploader': 'twitpic',

    'services-twitpic-sharepassword': false,

    'services-pingfm-userappkey':  '',
    'services-pingfm-enabled':     false,
    'services-pingfm-sendreplies': false,
    'services-pingfm-updatetype': 'default',

	'services-pikchur-apikey': 	'aJMHC7eHRbhnA7FLdXmAtA',
	'services-pikchur-source': 	'NjMw',
	'services-bitly-apikey': 	'R_f3b86681a63a6bbefc7d8949fd915f1d',

    'twitter-api-base-url': 'https://twitter.com/',
    'twitter-www-base-url': 'http://twitter.com/',

    'twitter-source': 'spaz',

	'timeline-text-size': 'tall', // also grande, venti
	
	'post-rt-cursor-position': 'beginning', // 'beginning' or 'end'
	'post-send-on-enter': true,

	// track run data that was once in VersionCookie
	'run-lastVersion':'0.0.1',
	'run-isFirst':true,
	'run-isNew':true,
	'run-count':0 
};