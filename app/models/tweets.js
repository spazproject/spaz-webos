/**
 * A model for interfacing with the Tweets depot
 * 
 */
var Tweets = function(opts) {
	
	this.opts = sch.defaults({
		'replace':false,
		'prefs_obj':null
	}, opts);
	
	this.bucket = new Lawnchair({name:"ext:tweets"});
	this.dm_bucket = new Lawnchair({name:"ext:dms"});
	this.user_bucket = new Lawnchair({name:"ext:users"});
	
	this.user_bucket.each = function(callback, onFinish) {
		var cb = this.adaptor.terseToVerboseCallback(callback);
		var onfin = this.adaptor.terseToVerboseCallback(onFinish);
		this.all(function(results) {
			var l = results.length;
			for (var i = 0; i < l; i++) {
				cb(results[i], i);
			}
			onfin(l);
		});
	};
	
	this.user_bucket.match = function(condition, callback) {
		var is = (typeof condition == 'string') ? function(r){return eval(condition);} : condition;
		var cb = this.adaptor.terseToVerboseCallback(callback);
		var matches = [];
		this.each(function(record, index) {
			if (is(record)) {
				sch.debug("found match "+record.key);
				matches.push(record);
			}
		}, function(count) {
			sch.debug('Firing callback on array of matches('+count+')');
			cb(matches);
		});
	};
	
	this._init(this.opts.replace);
};

/**
 * max size of a bucket. We need to be able to cull older entries 
 */
Tweets.prototype.maxBucketSize = 20000;


Tweets.prototype._init  = function(replace) {
	if (replace === true) {
		sch.debug('REPLACING DEPOT!!!!!!!!!!!=======================');
		this.bucket.nuke();
		this.dm_bucket.nuke();
		this.user_bucket.nuke();
	} else {
		sch.debug('NOT REPLACING DEPOT!!!!!!!!!!====================');
	}
};

Tweets.prototype.get    = function(id, isdm, onSuccess, onFailure) {
	var bucket = this.getBucket(isdm);
	
	var that = this;
	
	/*
		make sure this is an integer
	*/	
	// id = parseInt(id, 10);
	
	bucket.get(id,
		function(data) { // wrapper for the passed onSuccess
			if (!data) {
				sch.debug("Couldn't retrieve id "+id+"; getting remotely");
				that.getRemote(
					id,
					isdm,
					function(data) {
						sch.debug('saving remotely retrieved message');
						bucket.save(data);
						onSuccess(data);
					},
					onFailure
				);
			} else {
				sch.debug("Retrieved id "+id+" from lawnchair bucket");
				onSuccess(data);
			}
		},
		onFailure
	);
};


Tweets.prototype.save   = function(object, onSuccess, onFailure) {
	var objid = object.id;
	
	/*
		make sure this is an integer
	*/
	// objid = parseInt(objid, 10);
	
	object.key = objid;

	sch.debug("Saving object "+sch.enJSON(object));
	
	
	sch.debug("Saving id "+objid);
	if (!object.SC_is_dm) {
		sch.debug("Saving TWEET "+objid);
		this.bucket.save(object);
		if (object.user) {
			sch.debug("Saving user "+object.user.id);
			this.saveUser(object.user);			
		} else {
			sch.debug('Tweet '+objid+' did not have a user object');
		}
	} else {
		sch.debug("Saving DM "+objid);
		this.dm_bucket.save(object);
		if (object.sender) {
			sch.debug("Saving user "+object.sender.id);
			this.saveUser(object.sender);
		} else {
			sch.debug('Tweet '+objid+' did not have a sender object');
		}
		if (object.recipient) {
			sch.debug("Saving user "+object.recipient.id);
			this.saveUser(object.recipient);
		} else {
			sch.debug('Tweet '+objid+' did not have a recipient object');
		}
	}
};

Tweets.prototype.remove = function(objid, isdm, onSuccess, onFailure) {
	isdm = isdm === true || false;

	var bucket = this.getBucket(isdm);
	
	// objid = parseInt(objid, 10);
	bucket.remove(objid);
};



Tweets.prototype.saveUser = function(userobj) { 
	// userobj.key = parseInt(userobj.id, 10);
	userobj.key = userobj.id;
	this.user_bucket.save(userobj);
};


Tweets.prototype.getUser = function(id, onSuccess, onFailure, extra) {
	var that = this;
	var screen_name;
	
	sch.debug('passed id is "'+id+'"');
	
	if (extra) {
		Mojo.Log.error('extra passed to getUser:%j', extra);
	}
	
	var onDataSuccess = function(data) { // wrapper for the passed onSuccess
		if (!data) {
			sch.debug("Couldn't retrieve id "+id+"; getting remotely");
			that.getRemoteUser(
				id,
				function(data) {
					if (!data) {
						Mojo.Log.error('Success, but no result returned');
						Spaz.getActiveSceneAssistant().showAlert($L('No response from server'), $L('Error'));
					} else {
						sch.debug('saving remotely retrieved user');
						that.saveUser(data);
						onSuccess(data);					
					}
				},
				onFailure,
				extra
			);
		} else {
			sch.debug("Retrieved user id "+id+" from lawnchair bucket");
			onSuccess(data);
		}
	};
	
	/*
		if the id starts with a '@', we have a screen_name
	*/
	if (id.indexOf('@') === 0) {
		sch.debug('we have a screen name');
		screen_name = id.slice(1);
		sch.debug('screen name is '+screen_name);
		this.user_bucket.match(
			function(r) {
				if (r.screen_name == screen_name) {
					return true;
				}
			},
			function(r) {
				if (r && sch.isArray(r) && r.length > 0) {
					var match = r[0];
					onDataSuccess(match);
				} else {
					onDataSuccess(); // passing null will force it to get user remotely
				}
			}
		);
		
	/*
		otherwise, we assume we have a numeric ID
	*/
	} else {
		// id = parseInt(id, 10);

		this.user_bucket.get(
			id,
			onDataSuccess,
			onFailure
		);


	}
	
};

Tweets.prototype.removeUser = function(id) {
	this.user_bucket.remove(id);
};



Tweets.prototype.getSince = function(unixtime, isdm) {
	var bucket = this.getBucket(isdm);
	
	bucket.find(
		function(r) {
			return r.SC_created_at_unixtime > unixtime;
		}
	);
};





Tweets.prototype.getSinceId = function(since_id, isdm) {
	var bucket = this.getBucket(isdm);
	
	bucket.find(
		function(r) {
			return r.key > since_id;
		}
	);
};





Tweets.prototype.removeBefore = function(unixtime, isdm) {
	var bucket = this.getBucket(isdm);
	
	bucket.find(
		function(r) {
			return r.SC_created_at_unixtime < unixtime;
		},
		function(r) {
			bucket.remove(r);
		}
	);
};

Tweets.prototype.removeBeforeId = function(id, isdm) {
	var bucket = this.getBucket(isdm);
	
	bucket.find(
		function(r) {
			return r.key < id;
		},
		function(r) {
			bucket.remove(r);
		}
	);
};


Tweets.prototype.getBucket = function(isdm) {
	if (isdm) {
		return this.dm_bucket;
	} else {
		return this.bucket;
	}
};


Tweets.prototype.getRemote = function(id, isdm, onSuccess, onFailure, twit_opts) {
	var twit;

	if (twit_opts) {
		twit = this.initTempSpazTwit(twit_opts);
	} else {
		this.initSpazTwit();
		twit = this.twit;
	}

	sch.debug("getting message id "+id+" remotely!!");
	
	if (isdm) {
		thisA.showAlert($L('There was an error retrieving this direct message from cache'));
	} else {
		twit.getOne(id, onSuccess, onFailure);
	}
};

Tweets.prototype.getRemoteUser = function(id, onSuccess, onFailure, twit_opts) {
	var twit;
	
	if (twit_opts) {
		twit = this.initTempSpazTwit(twit_opts);
	} else {
		this.initSpazTwit();
		twit = this.twit;
	}
	
	
	sch.debug("getting user id "+id+" remotely!!");
	
	twit.getUser(id, onSuccess, onFailure);
};





Tweets.prototype.initSpazTwit = function(event_mode) {
	event_mode = event_mode || 'jquery'; // default this to jquery because we have so much using it
	
	var users = new SpazAccounts(this.opts.prefs_obj);
	
	this.twit = new SpazTwit({
		'event_mode':event_mode,
		'timeout':1000*60
	});
	this.twit.setSource(this.opts.prefs_obj.get('twitter-source'));
	
	
	var auth;
	if ( (auth = Spaz.Prefs.getAuthObject()) ) {
		this.twit.setCredentials(auth);
		this.twit.setBaseURLByService(Spaz.Prefs.getAccountType());
	} else {
		// alert('NOT seetting credentials for!');
	}	

};


/**
 * in situations where we want to use different credentials/access a different
 * service, we make a new, temporary SpazTwit object 
 */
Tweets.prototype.initTempSpazTwit = function(opts) {
	var twit, auth;
	
	opts = sch.defaults({
		'event_mode':'jquery',
		'auth_obj':null,
		'user_type':SPAZCORE_ACCOUNT_TWITTER,
		'user_api_url':null
	}, opts);
	
	Mojo.Log.error('initTempSpazTwit opts:%j', opts);	
	
	twit = new SpazTwit({
		'event_mode':opts.event_mode,
		'timeout':1000*60
	});
	twit.setSource(this.opts.prefs_obj.get('twitter-source'));
	
	if ( opts.auth_obj ) {
		twit.setCredentials(opts.auth_obj);
	}
	
	if (opts.user_api_url) {
		twit.setBaseURL(opts.user_api_url);
	} else if (opts.user_type) {
		twit.setBaseURLByService(opts.user_type);
	}
	
	return twit;
	
};


Tweets.prototype.onSaveSuccess = function(obj, msg) {
	dump('TweetModel Saved');
};

Tweets.prototype.onSaveFailure = function(msg, obj) {
	dump('TweetModel Save Failed On : '+obj+' '+msg);
};

Tweets.prototype.reset = function() {
	this._init(true);
};


