function MessageDetailAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);

	sc.setDumpLevel(5);
	
	/*
		this connects App to this property of the appAssistant
	*/
	App = Spaz.getAppObj();
	
	Mojo.Log.error('argFromPusher: %j', argFromPusher);
	
	if (sc.helpers.isString(argFromPusher) || sc.helpers.isNumber(argFromPusher)) {
		/*
			we were passed a single arg, so we need to retrieve the message data
		*/
		this.status_id  = argFromPusher;
	} else {
		this.passed_status_obj = argFromPusher.status_obj;
		this.status_id  = argFromPusher.status_id;
		this.isdm  = argFromPusher.isdm;
	}
	
	this.statusobj = null;
	
	this.message_rendered = false;
	this.conversation_rendered = false;

}

MessageDetailAssistant.prototype.aboutToActivate = function(callback){
	callback.defer(); //delays displaying scene, looks better
};

MessageDetailAssistant.prototype.setup = function() {

	var thisA = this;
	
	this.initTwit();
	
	this.scroller = this.controller.getSceneScroller();
	
	if (App.username) {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items: [
						{label: $L("Message Details"), command:'scroll-top', width:260},
						{label: $L('Compose'),  icon:'compose', command:'compose', shortcut:'N'}

					]
				}

			],
			cmdMenuItems:[
				{},
				{
					items:[
						{label:$L('Reply'),  icon:'reply', command:'reply', shortcut:'R'},
						{label:$L('Share'),  icon:'forward-email',  command:'share', shortcut:'S'},
						{label:$L('Favorite'), icon:'favorite-outline', command:'favorite', disabled:true, shortcut:'F'},
						{label:$L('Delete'),  icon:'stop', command:'delete', disabled:true, shortcut:'D'}
					]
				},
				{}
			]
		});
		
		this.initAppMenu({ 'items':LOGGEDIN_APPMENU_ITEMS });
		
		
		this.setCommand('reply', function(e) {
			var near = e.originalEvent && e.originalEvent.target; // need to get the DOM element location from orig event
			if (thisA.statusobj) {
				var screen_name = null, screen_names = [];
				if (thisA.statusobj.SC_is_dm) { // this is a dm
					screen_name = thisA.statusobj.sender.screen_name;
					thisA.prepDirectMessage('@'+screen_name, thisA.statusobj.text);
				} else { // this is a public reply
					screen_name = thisA.statusobj.user.screen_name;
					screen_names = sch.extractScreenNames(thisA.statusobj.SC_text_raw, [screen_name, Spaz.Prefs.getUsername()]);
					if (screen_names.length > 0) { // we want to present reply to all option
						this.controller.popupSubmenu({
							onChoose: function(cmd) {

								switch (cmd) {
									case 'reply-detail':
										thisA.prepReply(screen_name, thisA.statusobj.id, thisA.statusobj);
										break;
									case 'reply-all-detail':
										screen_names.unshift(screen_name); // add the poster's screen_name back in
										thisA.prepReply(screen_names, thisA.statusobj.id, thisA.statusobj);
										break;
									default:
										return;
								}
							},
							placeNear: near,
							items: [
								{label: $L('@reply'), command:  'reply-detail'},
								{label: $L('@reply to all'), command:  'reply-all-detail'}
							]
						});
					} else { // no extra usernames, do standard reply
						thisA.prepReply(screen_name, thisA.statusobj.id, thisA.statusobj);
					}
				}

			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('share', function(e) {
			if (thisA.statusobj) {
				thisA.showShareMenu(e, thisA.statusobj);
			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('favorite', function(e) {
			Mojo.Log.error('called favorite handler');
			if (thisA.statusobj) {
				Mojo.Log.error('statusobj defined');
				if (thisA.statusobj.SC_is_dm) {
					Mojo.Log.error("can't fave a dm");
					return; // can't fave a dm
				} else {
					if (thisA.statusobj.favorited) {
						Mojo.Log.error('UNFAVORITING %j', thisA.statusobj);
						thisA.twit.unfavorite(
							thisA.statusobj.id,
							function(data) {
								thisA.statusobj.favorited = false;
								thisA.setFavButtonState();
								thisA.showBanner($L('Removed favorite'));
							},
							function(xhr, msg, exc) {
								thisA.showBanner($L('Error removing favorite'));
							}
						);
					} else {
						Mojo.Log.error('FAVORITING %j', thisA.statusobj);
						thisA.twit.favorite(
							thisA.statusobj.id,
							function(data) {
								thisA.statusobj.favorited = true;
								thisA.setFavButtonState();
								thisA.showBanner($L('Added favorite'));								
							},
							function(xhr, msg, exc) {
								thisA.showBanner($L('Error adding favorite'));
							}
						);
					}
				}
			} else {
				Mojo.Log.error('this.statusobj not yet defined');
			}
		});
		this.setCommand('delete', function(e) {
			if (thisA.statusobj) {
				
				thisA.showAlert(
					$L('Do you want to delete this message?'),
					$L('Confirm Delete'),
					function(choice) {
						switch(choice) {
							case 'yes':
								var status_id = thisA.statusobj.id;
								if (thisA.statusobj.SC_is_dm) {
									thisA.deleteDirectMessage(status_id);
								} else {
									thisA.deleteStatus(status_id);
								}

								Mojo.Controller.stageController.popScene({'returnFromPop':true});
								break;

							default:
						}
						return true;
					},
					[
						{label:$L('Yes'), value:"yes", type:'negative'},
						{label:$L('No'), value:"no", type:'dismiss'}
					]
				);
				
			}
		});
		
		
	} else {
		this.setupCommonMenus({
			viewMenuItems: [
				{
					items:[
						{label: $L("Message Details"), command:'scroll-top', 'class':"palm-header left", width:320}				
					]
				}

			],
			cmdMenuItems:[]
		});
		
		this.initAppMenu();
		
	};	
	
	jQuery(document).bind('get_one_status_succeeded', { thisAssistant:this }, this.processStatusReturn);

	jQuery(document).bind('get_one_status_failed', { thisAssistant:this }, function(e, error_obj) {
		var err_msg = $L("There was an error retrieving this status");
		thisA.displayErrorInfo(err_msg, error_obj);		
	});

	
	
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
};

MessageDetailAssistant.prototype.activate = function(event) {
	
	var thisA = this;
	
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	if (this.isdm) {
		if (this.passed_status_obj){
			jQuery(document).trigger('get_one_status_succeeded', [this.passed_status_obj]);
		} else {
			App.Tweets.get(this.status_id, this.isdm,
				function(data) {
					if (data !== null) {
						Mojo.Log.error('Message '+thisA.status_id+' pulled from DB');
						jQuery(document).trigger('get_one_status_succeeded', [data]);
					} else { // if nothing is returned, get it from Twitter
						Mojo.Log.error('DM was not in App.Tweets cache');
						thisA.showAlert($L('There was an error retrieving this direct message from cache'));
					}
					
				},
				function(message) {
					Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
					thisA.showAlert($L('There was an error retrieving the message data'));
				}
			);
		}
	} else {
		App.Tweets.get(
			this.status_id,
			this.isdm,
			function(data) {
				Mojo.Log.error('Status pulled from DB');
				jQuery(document).trigger('get_one_status_succeeded', [data]);
			},
			function(xhr) {
				Mojo.Log.error('Couldn\'t retrieve message from Depot: %j', xhr);
				thisA.showAlert($L('There was an error retrieving the message data'));
			}
		);
	}
	

	jQuery('#timeline-conversation .in-reply-to', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-irt-status-id');
		Mojo.Log.error('statusid: %s', statusid);
		thisA.buildConversationView(statusid);
	});



	jQuery('#message-detail-image', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});
	
	

	
	
	
	
	jQuery('#message-detail .user', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-id');
		Mojo.Controller.stageController.pushScene('user-detail', userid);
	});

	jQuery('#message-detail .username.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var userid = jQuery(this).attr('data-user-screen_name');
		Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
	});

	jQuery('#message-detail .hashtag.clickable', this.scroller).live(Mojo.Event.tap, function(e) {
		var hashtag = jQuery(this).attr('data-hashtag');
		thisA.searchFor('#'+hashtag);
	});

	jQuery('#message-detail div.timeline-entry>.status>.meta', this.scroller).live(Mojo.Event.tap, function(e) {
		var statusid = jQuery(this).attr('data-status-id');
		Mojo.Controller.stageController.pushScene('message-detail', statusid);
	});

	jQuery('#message-detail img.thumbnail', this.scroller).live(Mojo.Event.tap, function(e) {
		var siu = new SpazImageURL();
		var img_url = jQuery(this).attr('data-img-url');
		sch.debug('MAIN URL:'+img_url);
		img_url = siu.getImageForUrl(img_url);
		sch.debug('IMAGE URL:'+img_url);
		Mojo.Controller.stageController.pushScene('view-image', {'imageURLs':[img_url]});
	});
	
	/*
		Because I didn't want to use a Mojo List due to laziness, we use the
		OLD SKOOL way from the user detail timeline
	*/
	jQuery('#timeline-conversation div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
		var jqtarget = jQuery(e.target);

		e.stopImmediatePropagation();
		
		var userid,
			status_id,
			isdm,
			status_obj;

		if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
			userid = jQuery(this).attr('data-user-id');
			Mojo.Controller.stageController.pushScene('user-detail', userid);
			return;

		} else if (jqtarget.is('.username.clickable')) {
			userid = jqtarget.attr('data-user-screen_name');
			Mojo.Controller.stageController.pushScene('user-detail', '@'+userid);
			return;

		} else if (jqtarget.is('.hashtag.clickable')) {
			var hashtag = jqtarget.attr('data-hashtag');
			thisA.searchFor('#'+hashtag);
			return;

		} else if (jqtarget.is('div.timeline-entry .meta')) {
			status_id = jqtarget.attr('data-status-id');
			isdm = false;
			status_obj = null;

			if (jqtarget.parent().parent().hasClass('dm')) {
				isdm = true;
			}

			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;

		} else if (jqtarget.is('div.timeline-entry a[href]')) {
			return;

		} else {
			status_id = jQuery(this).attr('data-status-id');
			isdm = false;
			status_obj = null;

			if (jQuery(this).hasClass('dm')) {
				isdm = true;
			}

			Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
			return;
		}
	});


};


MessageDetailAssistant.prototype.deactivate = function(event) {
	jQuery('#message-detail .in-reply-to', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail-image', this.scroller).die(Mojo.Event.tap);
	
	jQuery('#message-detail .user', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail .username.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail .hashtag.clickable', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail div.timeline-entry>.status>.meta', this.scroller).die(Mojo.Event.tap);
	jQuery('#message-detail img.thumbnail', this.scroller).die(Mojo.Event.tap);
	

	/*
		stop listening for timeline entry taps
	*/
	jQuery('#timeline-conversation div.timeline-entry', this.scroller).die(Mojo.Event.tap);
	
	
};

MessageDetailAssistant.prototype.cleanup = function(event) {
	jQuery(document).unbind('get_one_status_succeeded');
	jQuery(document).unbind('get_one_status_failed');
};


MessageDetailAssistant.prototype.processStatusReturn = function(e, statusobj) {
	var itemhtml;
	
	var thisA = e.data.thisAssistant;
	
	if (!thisA.message_rendered) {
		var sui = new SpazImageURL();

		Mojo.Log.error('statusobj: %j', statusobj);

		if (!statusobj.SC_is_dm) {
			if (App.username) { // we may not be logged-in
				statusobj.isSent = (statusobj.user.screen_name.toLowerCase() === App.username.toLowerCase());
			} else {
				statusobj.isSent = false;
			}
			
		}

		thisA.statusobj = statusobj;
		thisA.statusRetrieved = false;

		Mojo.Log.error('message data: %j', thisA.statusobj);

		thisA.statusobj.SC_thumbnail_urls = sui.getThumbsForUrls(thisA.statusobj.text);
		thisA.statusobj.text = Spaz.makeItemsClickable(thisA.statusobj.text);

		/*
			save this tweet to Depot
		*/
		// App.Tweets.save(statusobj);

		/*
			render tweet
		*/
		if (thisA.isdm) {
			itemhtml = App.tpl.parseTemplate('message-detail-dm', thisA.statusobj);
		} else {
			itemhtml = App.tpl.parseTemplate('message-detail', thisA.statusobj);
		}

		
		var embed = function() {
			jQuery('#message-detail .text').embedly({
				urls:'/http:\/\/(.*yfrog\..*\/.*|tweetphoto\.com\/.*|www\.flickr\.com\/photos\/.*|flic\.kr\/.*|twitpic\.com\/.*|www\.twitpic\.com\/.*|twitpic\.com\/photos\/.*|www\.twitpic\.com\/photos\/.*|.*imgur\.com\/.*|.*\.posterous\.com\/.*|post\.ly\/.*|twitgoo\.com\/.*|i.*\.photobucket\.com\/albums\/.*|s.*\.photobucket\.com\/albums\/.*|phodroid\.com\/.*\/.*\/.*|www\.mobypicture\.com\/user\/.*\/view\/.*|moby\.to\/.*|xkcd\.com\/.*|www\.xkcd\.com\/.*|imgs\.xkcd\.com\/.*|www\.asofterworld\.com\/index\.php\?id=.*|www\.asofterworld\.com\/.*\.jpg|asofterworld\.com\/.*\.jpg|www\.qwantz\.com\/index\.php\?comic=.*|23hq\.com\/.*\/photo\/.*|www\.23hq\.com\/.*\/photo\/.*|.*dribbble\.com\/shots\/.*|drbl\.in\/.*|.*\.smugmug\.com\/.*|.*\.smugmug\.com\/.*#.*|emberapp\.com\/.*\/images\/.*|emberapp\.com\/.*\/images\/.*\/sizes\/.*|emberapp\.com\/.*\/collections\/.*\/.*|emberapp\.com\/.*\/categories\/.*\/.*\/.*|embr\.it\/.*|picasaweb\.google\.com.*\/.*\/.*#.*|picasaweb\.google\.com.*\/lh\/photo\/.*|picasaweb\.google\.com.*\/.*\/.*|dailybooth\.com\/.*\/.*|brizzly\.com\/pic\/.*|pics\.brizzly\.com\/.*\.jpg|img\.ly\/.*|www\.tinypic\.com\/view\.php.*|tinypic\.com\/view\.php.*|www\.tinypic\.com\/player\.php.*|tinypic\.com\/player\.php.*|www\.tinypic\.com\/r\/.*\/.*|tinypic\.com\/r\/.*\/.*|.*\.tinypic\.com\/.*\.jpg|.*\.tinypic\.com\/.*\.png|meadd\.com\/.*\/.*|meadd\.com\/.*|.*\.deviantart\.com\/art\/.*|.*\.deviantart\.com\/gallery\/.*|.*\.deviantart\.com\/#\/.*|fav\.me\/.*|.*\.deviantart\.com|.*\.deviantart\.com\/gallery|.*\.deviantart\.com\/.*\/.*\.jpg|.*\.deviantart\.com\/.*\/.*\.gif|.*\.deviantart\.net\/.*\/.*\.jpg|.*\.deviantart\.net\/.*\/.*\.gif|plixi\.com\/p\/.*|plixi\.com\/profile\/home\/.*|plixi\.com\/.*|m\.plixi\.com\/.*|www\.fotopedia\.com\/.*\/.*|fotopedia\.com\/.*\/.*|photozou\.jp\/photo\/show\/.*\/.*|photozou\.jp\/photo\/photo_only\/.*\/.*|instagr\.am\/p\/.*|instagram\.com\/p\/.*|skitch\.com\/.*\/.*\/.*|img\.skitch\.com\/.*|https:\/\/skitch\.com\/.*\/.*\/.*|https:\/\/img\.skitch\.com\/.*|share\.ovi\.com\/media\/.*\/.*|www\.questionablecontent\.net\/|questionablecontent\.net\/|www\.questionablecontent\.net\/view\.php.*|questionablecontent\.net\/view\.php.*|questionablecontent\.net\/comics\/.*\.png|www\.questionablecontent\.net\/comics\/.*\.png|picplz\.com\/user\/.*\/pic\/.*\/|twitrpix\.com\/.*|.*\.twitrpix\.com\/.*|www\.someecards\.com\/.*\/.*|someecards\.com\/.*\/.*|some\.ly\/.*|www\.some\.ly\/.*|pikchur\.com\/.*|achewood\.com\/.*|www\.achewood\.com\/.*|achewood\.com\/index\.php.*|www\.achewood\.com\/index\.php.*|www\.whosay\.com\/content\/.*|www\.whosay\.com\/photos\/.*|www\.whosay\.com\/videos\/.*|say\.ly\/.*|ow\.ly\/i\/.*|color\.com\/s\/.*|soundcloud\.com\/.*|soundcloud\.com\/.*\/.*|soundcloud\.com\/.*\/sets\/.*|soundcloud\.com\/groups\/.*|snd\.sc\/.*|www\.last\.fm\/music\/.*|www\.last\.fm\/music\/+videos\/.*|www\.last\.fm\/music\/+images\/.*|www\.last\.fm\/music\/.*\/_\/.*|www\.last\.fm\/music\/.*\/.*|www\.mixcloud\.com\/.*\/.*\/|www\.radionomy\.com\/.*\/radio\/.*|radionomy\.com\/.*\/radio\/.*|www\.hark\.com\/clips\/.*|www\.rdio\.com\/#\/artist\/.*\/album\/.*|www\.rdio\.com\/artist\/.*\/album\/.*|www\.zero-inch\.com\/.*|.*\.bandcamp\.com\/|.*\.bandcamp\.com\/track\/.*|.*\.bandcamp\.com\/album\/.*|freemusicarchive\.org\/music\/.*|www\.freemusicarchive\.org\/music\/.*|freemusicarchive\.org\/curator\/.*|www\.freemusicarchive\.org\/curator\/.*|www\.npr\.org\/.*\/.*\/.*\/.*\/.*|www\.npr\.org\/.*\/.*\/.*\/.*\/.*\/.*|www\.npr\.org\/.*\/.*\/.*\/.*\/.*\/.*\/.*|www\.npr\.org\/templates\/story\/story\.php.*|huffduffer\.com\/.*\/.*|www\.audioboo\.fm\/boos\/.*|audioboo\.fm\/boos\/.*|boo\.fm\/b.*|www\.xiami\.com\/song\/.*|xiami\.com\/song\/.*|www\.saynow\.com\/playMsg\.html.*|www\.saynow\.com\/playMsg\.html.*|listen\.grooveshark\.com\/s\/.*|radioreddit\.com\/songs.*|www\.radioreddit\.com\/songs.*|radioreddit\.com\/\?q=songs.*|www\.radioreddit\.com\/\?q=songs.*|www\.gogoyoko\.com\/song\/.*|.*amazon\..*\/gp\/product\/.*|.*amazon\..*\/.*\/dp\/.*|.*amazon\..*\/dp\/.*|.*amazon\..*\/o\/ASIN\/.*|.*amazon\..*\/gp\/offer-listing\/.*|.*amazon\..*\/.*\/ASIN\/.*|.*amazon\..*\/gp\/product\/images\/.*|.*amazon\..*\/gp\/aw\/d\/.*|www\.amzn\.com\/.*|amzn\.com\/.*|www\.shopstyle\.com\/browse.*|www\.shopstyle\.com\/action\/apiVisitRetailer.*|api\.shopstyle\.com\/action\/apiVisitRetailer.*|www\.shopstyle\.com\/action\/viewLook.*|www\.crunchbase\.com\/.*\/.*|crunchbase\.com\/.*\/.*|www\.slideshare\.net\/.*\/.*|www\.slideshare\.net\/mobile\/.*\/.*|slidesha\.re\/.*|scribd\.com\/doc\/.*|www\.scribd\.com\/doc\/.*|scribd\.com\/mobile\/documents\/.*|www\.scribd\.com\/mobile\/documents\/.*|screenr\.com\/.*|polldaddy\.com\/community\/poll\/.*|polldaddy\.com\/poll\/.*|answers\.polldaddy\.com\/poll\/.*|www\.5min\.com\/Video\/.*|www\.howcast\.com\/videos\/.*|www\.screencast\.com\/.*\/media\/.*|screencast\.com\/.*\/media\/.*|www\.screencast\.com\/t\/.*|screencast\.com\/t\/.*|issuu\.com\/.*\/docs\/.*|www\.kickstarter\.com\/projects\/.*\/.*|www\.scrapblog\.com\/viewer\/viewer\.aspx.*|ping\.fm\/p\/.*|chart\.ly\/symbols\/.*|chart\.ly\/.*|maps\.google\.com\/maps\?.*|maps\.google\.com\/\?.*|maps\.google\.com\/maps\/ms\?.*|.*\.craigslist\.org\/.*\/.*|my\.opera\.com\/.*\/albums\/show\.dml\?id=.*|my\.opera\.com\/.*\/albums\/showpic\.dml\?album=.*&picture=.*|www\.polleverywhere\.com\/polls\/.*|www\.polleverywhere\.com\/multiple_choice_polls\/.*|www\.polleverywhere\.com\/free_text_polls\/.*|www\.quantcast\.com\/wd:.*|www\.quantcast\.com\/.*|siteanalytics\.compete\.com\/.*|statsheet\.com\/statplot\/charts\/.*\/.*\/.*\/.*|statsheet\.com\/statplot\/charts\/e\/.*|statsheet\.com\/.*\/teams\/.*\/.*|statsheet\.com\/tools\/chartlets\?chart=.*|brainbird\.net\/notice\/.*|shitmydadsays\.com\/notice\/.*|www\.studivz\.net\/Profile\/.*|www\.studivz\.net\/l\/.*|www\.studivz\.net\/Groups\/Overview\/.*|www\.studivz\.net\/Gadgets\/Info\/.*|www\.studivz\.net\/Gadgets\/Install\/.*|www\.studivz\.net\/.*|www\.meinvz\.net\/Profile\/.*|www\.meinvz\.net\/l\/.*|www\.meinvz\.net\/Groups\/Overview\/.*|www\.meinvz\.net\/Gadgets\/Info\/.*|www\.meinvz\.net\/Gadgets\/Install\/.*|www\.meinvz\.net\/.*|www\.schuelervz\.net\/Profile\/.*|www\.schuelervz\.net\/l\/.*|www\.schuelervz\.net\/Groups\/Overview\/.*|www\.schuelervz\.net\/Gadgets\/Info\/.*|www\.schuelervz\.net\/Gadgets\/Install\/.*|www\.schuelervz\.net\/.*|myloc\.me\/.*|redux\.com\/stream\/item\/.*\/.*|redux\.com\/f\/.*\/.*|www\.redux\.com\/stream\/item\/.*\/.*|www\.redux\.com\/f\/.*\/.*|cl\.ly\/.*|cl\.ly\/.*\/content|speakerdeck\.com\/u\/.*\/p\/.*|www\.kiva\.org\/lend\/.*|www\.timetoast\.com\/timelines\/.*|storify\.com\/.*\/.*|.*meetup\.com\/.*|meetu\.ps\/.*|www\.dailymile\.com\/people\/.*\/entries\/.*|.*\.kinomap\.com\/.*|www\.metacdn\.com\/api\/users\/.*\/content\/.*|www\.metacdn\.com\/api\/users\/.*\/media\/.*|prezi\.com\/.*\/.*|.*\.uservoice\.com\/.*\/suggestions\/.*|formspring\.me\/.*|www\.formspring\.me\/.*|formspring\.me\/.*\/q\/.*|www\.formspring\.me\/.*\/q\/.*|twitlonger\.com\/show\/.*|www\.twitlonger\.com\/show\/.*|tl\.gd\/.*|www\.qwiki\.com\/q\/.*|crocodoc\.com\/.*|.*\.crocodoc\.com\/.*|https:\/\/crocodoc\.com\/.*|https:\/\/.*\.crocodoc\.com\/.*|.*youtube\.com\/watch.*|.*\.youtube\.com\/v\/.*|youtu\.be\/.*|.*\.youtube\.com\/user\/.*|.*\.youtube\.com\/.*#.*\/.*|m\.youtube\.com\/watch.*|m\.youtube\.com\/index.*|.*\.youtube\.com\/profile.*|.*\.youtube\.com\/view_play_list.*|.*\.youtube\.com\/playlist.*|.*justin\.tv\/.*|.*justin\.tv\/.*\/b\/.*|.*justin\.tv\/.*\/w\/.*|www\.ustream\.tv\/recorded\/.*|www\.ustream\.tv\/channel\/.*|www\.ustream\.tv\/.*|qik\.com\/video\/.*|qik\.com\/.*|qik\.ly\/.*|.*revision3\.com\/.*|.*\.dailymotion\.com\/video\/.*|.*\.dailymotion\.com\/.*\/video\/.*|collegehumor\.com\/video:.*|collegehumor\.com\/video\/.*|www\.collegehumor\.com\/video:.*|www\.collegehumor\.com\/video\/.*|.*twitvid\.com\/.*|www\.break\.com\/.*\/.*|vids\.myspace\.com\/index\.cfm\?fuseaction=vids\.individual&videoid.*|www\.myspace\.com\/index\.cfm\?fuseaction=.*&videoid.*|www\.metacafe\.com\/watch\/.*|www\.metacafe\.com\/w\/.*|blip\.tv\/file\/.*|.*\.blip\.tv\/file\/.*|video\.google\.com\/videoplay\?.*|.*revver\.com\/video\/.*|video\.yahoo\.com\/watch\/.*\/.*|video\.yahoo\.com\/network\/.*|.*viddler\.com\/explore\/.*\/videos\/.*|liveleak\.com\/view\?.*|www\.liveleak\.com\/view\?.*|animoto\.com\/play\/.*|dotsub\.com\/view\/.*|www\.overstream\.net\/view\.php\?oid=.*|www\.livestream\.com\/.*|www\.worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|teachertube\.com\/viewVideo\.php.*|www\.teachertube\.com\/viewVideo\.php.*|www1\.teachertube\.com\/viewVideo\.php.*|www2\.teachertube\.com\/viewVideo\.php.*|bambuser\.com\/v\/.*|bambuser\.com\/channel\/.*|bambuser\.com\/channel\/.*\/broadcast\/.*|www\.schooltube\.com\/video\/.*\/.*|bigthink\.com\/ideas\/.*|bigthink\.com\/series\/.*|sendables\.jibjab\.com\/view\/.*|sendables\.jibjab\.com\/originals\/.*|www\.xtranormal\.com\/watch\/.*|socialcam\.com\/v\/.*|www\.socialcam\.com\/v\/.*|dipdive\.com\/media\/.*|dipdive\.com\/member\/.*\/media\/.*|dipdive\.com\/v\/.*|.*\.dipdive\.com\/media\/.*|.*\.dipdive\.com\/v\/.*|v\.youku\.com\/v_show\/.*\.html|v\.youku\.com\/v_playlist\/.*\.html|www\.snotr\.com\/video\/.*|snotr\.com\/video\/.*|video\.jardenberg\.se\/.*|www\.clipfish\.de\/.*\/.*\/video\/.*|www\.myvideo\.de\/watch\/.*|www\.whitehouse\.gov\/photos-and-video\/video\/.*|www\.whitehouse\.gov\/video\/.*|wh\.gov\/photos-and-video\/video\/.*|wh\.gov\/video\/.*|www\.hulu\.com\/watch.*|www\.hulu\.com\/w\/.*|hulu\.com\/watch.*|hulu\.com\/w\/.*|.*crackle\.com\/c\/.*|www\.fancast\.com\/.*\/videos|www\.funnyordie\.com\/videos\/.*|www\.funnyordie\.com\/m\/.*|funnyordie\.com\/videos\/.*|funnyordie\.com\/m\/.*|www\.vimeo\.com\/groups\/.*\/videos\/.*|www\.vimeo\.com\/.*|vimeo\.com\/groups\/.*\/videos\/.*|vimeo\.com\/.*|vimeo\.com\/m\/#\/.*|www\.ted\.com\/talks\/.*\.html.*|www\.ted\.com\/talks\/lang\/.*\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/lang\/.*\/.*\.html.*|.*nfb\.ca\/film\/.*|www\.thedailyshow\.com\/watch\/.*|www\.thedailyshow\.com\/full-episodes\/.*|www\.thedailyshow\.com\/collection\/.*\/.*\/.*|movies\.yahoo\.com\/movie\/.*\/video\/.*|movies\.yahoo\.com\/movie\/.*\/trailer|movies\.yahoo\.com\/movie\/.*\/video|www\.colbertnation\.com\/the-colbert-report-collections\/.*|www\.colbertnation\.com\/full-episodes\/.*|www\.colbertnation\.com\/the-colbert-report-videos\/.*|www\.comedycentral\.com\/videos\/index\.jhtml\?.*|www\.theonion\.com\/video\/.*|theonion\.com\/video\/.*|wordpress\.tv\/.*\/.*\/.*\/.*\/|www\.traileraddict\.com\/trailer\/.*|www\.traileraddict\.com\/clip\/.*|www\.traileraddict\.com\/poster\/.*|www\.escapistmagazine\.com\/videos\/.*|www\.trailerspy\.com\/trailer\/.*\/.*|www\.trailerspy\.com\/trailer\/.*|www\.trailerspy\.com\/view_video\.php.*|www\.atom\.com\/.*\/.*\/|fora\.tv\/.*\/.*\/.*\/.*|www\.spike\.com\/video\/.*|www\.gametrailers\.com\/video\/.*|gametrailers\.com\/video\/.*|www\.koldcast\.tv\/video\/.*|www\.koldcast\.tv\/#video:.*|techcrunch\.tv\/watch.*|techcrunch\.tv\/.*\/watch.*|mixergy\.com\/.*|video\.pbs\.org\/video\/.*|www\.zapiks\.com\/.*|tv\.digg\.com\/diggnation\/.*|tv\.digg\.com\/diggreel\/.*|tv\.digg\.com\/diggdialogg\/.*|www\.trutv\.com\/video\/.*|www\.nzonscreen\.com\/title\/.*|nzonscreen\.com\/title\/.*|app\.wistia\.com\/embed\/medias\/.*|https:\/\/app\.wistia\.com\/embed\/medias\/.*|hungrynation\.tv\/.*\/episode\/.*|www\.hungrynation\.tv\/.*\/episode\/.*|hungrynation\.tv\/episode\/.*|www\.hungrynation\.tv\/episode\/.*|indymogul\.com\/.*\/episode\/.*|www\.indymogul\.com\/.*\/episode\/.*|indymogul\.com\/episode\/.*|www\.indymogul\.com\/episode\/.*|channelfrederator\.com\/.*\/episode\/.*|www\.channelfrederator\.com\/.*\/episode\/.*|channelfrederator\.com\/episode\/.*|www\.channelfrederator\.com\/episode\/.*|tmiweekly\.com\/.*\/episode\/.*|www\.tmiweekly\.com\/.*\/episode\/.*|tmiweekly\.com\/episode\/.*|www\.tmiweekly\.com\/episode\/.*|99dollarmusicvideos\.com\/.*\/episode\/.*|www\.99dollarmusicvideos\.com\/.*\/episode\/.*|99dollarmusicvideos\.com\/episode\/.*|www\.99dollarmusicvideos\.com\/episode\/.*|ultrakawaii\.com\/.*\/episode\/.*|www\.ultrakawaii\.com\/.*\/episode\/.*|ultrakawaii\.com\/episode\/.*|www\.ultrakawaii\.com\/episode\/.*|barelypolitical\.com\/.*\/episode\/.*|www\.barelypolitical\.com\/.*\/episode\/.*|barelypolitical\.com\/episode\/.*|www\.barelypolitical\.com\/episode\/.*|barelydigital\.com\/.*\/episode\/.*|www\.barelydigital\.com\/.*\/episode\/.*|barelydigital\.com\/episode\/.*|www\.barelydigital\.com\/episode\/.*|threadbanger\.com\/.*\/episode\/.*|www\.threadbanger\.com\/.*\/episode\/.*|threadbanger\.com\/episode\/.*|www\.threadbanger\.com\/episode\/.*|vodcars\.com\/.*\/episode\/.*|www\.vodcars\.com\/.*\/episode\/.*|vodcars\.com\/episode\/.*|www\.vodcars\.com\/episode\/.*|confreaks\.net\/videos\/.*|www\.confreaks\.net\/videos\/.*|video\.allthingsd\.com\/video\/.*|videos\.nymag\.com\/.*|aniboom\.com\/animation-video\/.*|www\.aniboom\.com\/animation-video\/.*|clipshack\.com\/Clip\.aspx\?.*|www\.clipshack\.com\/Clip\.aspx\?.*|grindtv\.com\/.*\/video\/.*|www\.grindtv\.com\/.*\/video\/.*|ifood\.tv\/recipe\/.*|ifood\.tv\/video\/.*|ifood\.tv\/channel\/user\/.*|www\.ifood\.tv\/recipe\/.*|www\.ifood\.tv\/video\/.*|www\.ifood\.tv\/channel\/user\/.*|logotv\.com\/video\/.*|www\.logotv\.com\/video\/.*|lonelyplanet\.com\/Clip\.aspx\?.*|www\.lonelyplanet\.com\/Clip\.aspx\?.*|streetfire\.net\/video\/.*\.htm.*|www\.streetfire\.net\/video\/.*\.htm.*|trooptube\.tv\/videos\/.*|www\.trooptube\.tv\/videos\/.*|sciencestage\.com\/v\/.*\.html|sciencestage\.com\/a\/.*\.html|www\.sciencestage\.com\/v\/.*\.html|www\.sciencestage\.com\/a\/.*\.html|www\.godtube\.com\/featured\/video\/.*|godtube\.com\/featured\/video\/.*|www\.godtube\.com\/watch\/.*|godtube\.com\/watch\/.*|www\.tangle\.com\/view_video.*|mediamatters\.org\/mmtv\/.*|www\.clikthrough\.com\/theater\/video\/.*|espn\.go\.com\/video\/clip.*|espn\.go\.com\/.*\/story.*|abcnews\.com\/.*\/video\/.*|abcnews\.com\/video\/playerIndex.*|washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.boston\.com\/video.*|boston\.com\/video.*|www\.facebook\.com\/photo\.php.*|www\.facebook\.com\/video\/video\.php.*|www\.facebook\.com\/v\/.*|cnbc\.com\/id\/.*\?.*video.*|www\.cnbc\.com\/id\/.*\?.*video.*|cnbc\.com\/id\/.*\/play\/1\/video\/.*|www\.cnbc\.com\/id\/.*\/play\/1\/video\/.*|cbsnews\.com\/video\/watch\/.*|www\.google\.com\/buzz\/.*\/.*\/.*|www\.google\.com\/buzz\/.*|www\.google\.com\/profiles\/.*|google\.com\/buzz\/.*\/.*\/.*|google\.com\/buzz\/.*|google\.com\/profiles\/.*|www\.cnn\.com\/video\/.*|edition\.cnn\.com\/video\/.*|money\.cnn\.com\/video\/.*|today\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/ns\/.*|today\.msnbc\.msn\.com\/id\/.*\/ns\/.*|multimedia\.foxsports\.com\/m\/video\/.*\/.*|msn\.foxsports\.com\/video.*|www\.globalpost\.com\/video\/.*|www\.globalpost\.com\/dispatch\/.*|guardian\.co\.uk\/.*\/video\/.*\/.*\/.*\/.*|www\.guardian\.co\.uk\/.*\/video\/.*\/.*\/.*\/.*|bravotv\.com\/.*\/.*\/videos\/.*|www\.bravotv\.com\/.*\/.*\/videos\/.*|video\.nationalgeographic\.com\/.*\/.*\/.*\.html|dsc\.discovery\.com\/videos\/.*|animal\.discovery\.com\/videos\/.*|health\.discovery\.com\/videos\/.*|investigation\.discovery\.com\/videos\/.*|military\.discovery\.com\/videos\/.*|planetgreen\.discovery\.com\/videos\/.*|science\.discovery\.com\/videos\/.*|tlc\.discovery\.com\/videos\/.*|video\.forbes\.com\/fvn\/.*)/i',
				maxWidth: 300,
				maxHeight:300,
				'method':'afterParent',
				'wrapElement':'div',
				'className':'thumbnails'
			});
		}

		
		jQuery('#message-detail').html(itemhtml);

		/*
			expand URLs and get embed.ly previews
		*/
		var $messagetxt = jQuery('#message-detail .text');
		var msghtml = $messagetxt.html();
		var shurl = new SpazShortURL();
		var urls = shurl.findExpandableURLs(msghtml);
		if (urls) {
			for (var i = 0; i < urls.length; i++) {
				shurl.expand(urls[i], {
					'onSuccess':function(data) {
						msghtml = shurl.replaceExpandableURL(msghtml, data.shorturl, data.longurl)
						$messagetxt.html(msghtml);
						if ((i + 1) >= urls.length) {
							embed();
						}
					}
				});
			}
		} else {
			embed();
		}



		
		if (thisA.statusobj.isSent || thisA.statusobj.SC_is_dm) {
			thisA.enableDeleteButton(true);
		}

		if (!thisA.statusobj.SC_is_dm) {
			thisA.enableFavButton(true);
		}

		thisA.setFavButtonState();
		
	}
	
	
	sch.updateRelativeTimes('#message-detail .status>.meta>.date>.date-relative', 'data-created_at');


	
	if (thisA.statusobj.in_reply_to_status_id && !thisA.conversation_rendered) {
		var irt_html = App.tpl.parseTemplate('message-detail-irt', thisA.statusobj);
		jQuery('#timeline-conversation').html(irt_html).fadeIn(250);
	}
	
	thisA.message_rendered = true;
	
};

/**
 * @param {Boolean} [is_favorite] true or false. if not provided, gets value from this.statusobj
 */
MessageDetailAssistant.prototype.setFavButtonState = function(is_favorite) {
	
	if (this.statusobj && !this.statusobj.SC_is_dm) {
		
		if (is_favorite !== true && is_favorite !== false) {
			is_favorite = this.statusobj.favorited;
		}
		
		var menu_item = this.cmdMenuModel.items[1].items[2];

		Mojo.Log.error('menu_item: %j', menu_item);
		Mojo.Log.error('is_favorite: %s', is_favorite);
			
		if (is_favorite) {
			menu_item.icon = 'favorite';
			this.controller.modelChanged(this.cmdMenuModel);
		} else {
			menu_item.icon = 'favorite-outline';
			this.controller.modelChanged(this.cmdMenuModel);
		}
		
	}
};


MessageDetailAssistant.prototype.enableFavButton = function(enabled) {
	
	if (enabled) {
		this.cmdMenuModel.items[1].items[2].disabled = false;
		this.controller.modelChanged(this.cmdMenuModel);
	} else {
		this.cmdMenuModel.items[1].items[2].disabled = true;
		this.controller.modelChanged(this.cmdMenuModel);
	}
	
};



MessageDetailAssistant.prototype.enableDeleteButton = function(enabled) {
	
	if (enabled) {
		this.cmdMenuModel.items[1].items[3].disabled = false;
		this.controller.modelChanged(this.cmdMenuModel);
	} else {
		this.cmdMenuModel.items[1].items[3].disabled = true;
		this.controller.modelChanged(this.cmdMenuModel);
	}
	
};


MessageDetailAssistant.prototype.buildConversationView = function(statusid) {

	var thisA = this;

	if (!this.conversation_rendered) { this.conversation_rendered = false; }

	var $container = jQuery('#timeline-conversation');
	
	if (this.conversation_rendered) {
		Mojo.Log.error('timeline-conversation has already been set-up. returning.');
		return;
	}

	var initWindow = function() {
		$container
			.html('<div class="loading"><img src="images/theme/loading-tiny.gif" style="display:inline-block; margin-bottom:-2px"> Loading…</div>')
			.find('.loading')
			.fadeIn(250);	
	};


	var build = function(base_id) {
		var convo_array = [], added_ids = [];

		initWindow();

		Mojo.Log.error("==========Retrieving base_id "+base_id+' =======================');
		App.Tweets.get(
			base_id, // status_id
			false, // isdm
			onRetrieved, // success
			function(message) { // failure
				Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
				thisA.showAlert($L('There was an error retrieving the message data'));
			}
		);



		function onRetrieved(status_obj) {		
			
			// add newly retrieved message
			Mojo.Log.error("Adding "+status_obj.id);
			status_obj.db_id = status_obj.id;
			status_obj.id    = status_obj.id;
			status_obj.text = Spaz.makeItemsClickable(status_obj.text);
			var $status_html  = jQuery(App.tpl.parseTemplate('tweet', status_obj));
			// Mojo.Log.error("Adding %s", status_html);
			$container.append($status_html.fadeIn(400));


			Mojo.Log.error("Retrieved "+status_obj.id);

			if (added_ids.indexOf(status_obj.id) !== -1) {
				Mojo.Log.error("This id has already been retrieved");
				finishLoadingConvo();
				return;
			} else {

				convo_array.push(status_obj);
				added_ids.push(status_obj.id);

				Mojo.Log.error("conversation length is now "+convo_array.length);
				Mojo.Log.error("added_ids: "+added_ids.toString());

				if (status_obj.in_reply_to_status_id
						&& (added_ids.indexOf(status_obj.in_reply_to_status_id) === -1)
						&& (status_obj.in_reply_to_status_id != status_obj.id)
						) {
					App.Tweets.get(
						status_obj.in_reply_to_status_id, // status_id
						false, // isdm
						onRetrieved, // success
						function(message) { // failure
							Mojo.Log.error('Couldn\'t retrieve message from Depot:'+message);
							thisA.showAlert($L('There was an error retrieving the message data'));
						}
					);
				} else {
					finishLoadingConvo();
					return;
				}				
			}
		}



		function finishLoadingConvo() {
			$container.find('.loading').fadeOut(400, function() {
				jQuery(this).remove();
			});
			thisA.conversation_rendered = true;
		}

	};
	
	build(statusid);
	
};
