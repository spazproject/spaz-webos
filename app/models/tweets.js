/**
 * A model for interfacing with the Tweets depot
 * 
 */
var Tweets = function(replace) {
	
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
				sch.error("found match "+record.key);
				matches.push(record);
			}
		}, function(count) {
			sch.error('Firing callback on array of matches('+count+')');
			cb(matches);
		});
	};
	
	this._init(replace);
};

/**
 * max size of a bucket. We need to be able to cull older entries 
 */
Tweets.prototype.maxBucketSize = 20000;


Tweets.prototype._init  = function(replace) {
	if (replace === true) {
		sch.error('REPLACING DEPOT!!!!!!!!!!!=======================');
		this.bucket.nuke();
		this.dm_bucket.nuke();
		this.user_bucket.nuke();
	} else {
		sch.error('NOT REPLACING DEPOT!!!!!!!!!!====================');
	}
};

Tweets.prototype.get    = function(id, isdm, onSuccess, onFailure) {
	var bucket = this.getBucket(isdm);
	
	var that = this;
	
	/*
		make sure this is an integer
	*/	
	id = parseInt(id, 10);
	
	bucket.get(id,
		function(data) { // wrapper for the passed onSuccess
			if (!data) {
				sch.error("Couldn't retrieve id "+id+"; getting remotely");
				that.getRemote(
					id,
					isdm,
					function(data) {
						sch.error('saving remotely retrieved message');
						bucket.save(data);
						onSuccess(data);
					},
					onFailure
				);
			} else {
				sch.error("Retrieved id "+id+" from lawnchair bucket");
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
	objid = parseInt(objid, 10);
	
	object.key = objid;

	sch.error("Saving object "+sch.enJSON(object));
	
	
	sch.error("Saving id "+objid);
	if (!object.SC_is_dm) {
		sch.error("Saving TWEET "+objid);
		this.bucket.save(object);
		if (object.user) {
			sch.error("Saving user "+object.user.id);
			this.saveUser(object.user);			
		} else {
			sch.error('Tweet '+objid+' did not have a user object');
		}
	} else {
		sch.error("Saving DM "+objid);
		this.dm_bucket.save(object);
		if (object.sender) {
			sch.error("Saving user "+object.sender.id);
			this.saveUser(object.sender);
		} else {
			sch.error('Tweet '+objid+' did not have a sender object');
		}
		if (object.recipient) {
			sch.error("Saving user "+object.recipient.id);
			this.saveUser(object.recipient);
		} else {
			sch.error('Tweet '+objid+' did not have a recipient object');
		}
	}
};

Tweets.prototype.remove = function(objid, isdm, onSuccess, onFailure) {
	isdm = isdm === true || false;

	var bucket = this.getBucket(isdm);
	
	objid = parseInt(objid, 10);
	bucket.remove(objid);
};



Tweets.prototype.saveUser = function(userobj) { 
	userobj.key = parseInt(userobj.id, 10);
	this.user_bucket.save(userobj);
};


Tweets.prototype.getUser = function(id, onSuccess, onFailure) {
	var that = this;
	var screen_name;
	
	sch.error('passed id is "'+id+'"');
	
	var onDataSuccess = function(data) { // wrapper for the passed onSuccess
		if (!data) {
			sch.error("Couldn't retrieve id "+id+"; getting remotely");
			that.getRemoteUser(
				id,
				function(data) {
					sch.error('saving remotely retrieved user');
					that.saveUser(data);
					onSuccess(data);
				},
				onFailure
			);
		} else {
			sch.error("Retrieved user id "+id+" from lawnchair bucket");
			onSuccess(data);
		}
	};
	
	/*
		if the id starts with a '@', we have a screen_name
	*/
	if (id.indexOf('@') === 0) {
		sch.error('we have a screen name');
		screen_name = id.slice(1);
		sch.error('screen name is '+screen_name);
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
		id = parseInt(id, 10);

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


Tweets.prototype.getRemote = function(id, isdm, onSuccess, onFailure) {
	this.initSpazTwit();
	
	sch.error("getting message id "+id+" remotely!!");
	
	if (isdm) {
		thisA.showAlert($L('There was an error retrieving this direct message from cache'));
	} else {
		this.twit.getOne(id, onSuccess, onFailure);
	}
};

Tweets.prototype.getRemoteUser = function(id, onSuccess, onFailure) {
	this.initSpazTwit();
	
	sch.error("getting user id "+id+" remotely!!");
	
	this.twit.getUser(id, onSuccess, onFailure);
};





Tweets.prototype.initSpazTwit = function() {
	var event_mode = 'jquery'; // default this to jquery because we have so much using it
	
	var users = new Users(sc.app.prefs);
	
	this.twit = new SpazTwit(null, null, {
		'event_mode':event_mode,
		'timeout':1000*60
	});

	if (sc.app.userid) {
		// alert('setting credentials for '+sc.app.username);
		
		var userobj = users.getUser(sc.app.userid);
		
		if (userobj.type === SPAZCORE_SERVICE_CUSTOM) {
			var api_url = users.getMeta(sc.app.userid, 'api-url');
			this.twit.setBaseURL(api_url);
		} else {
			this.twit.setBaseURLByService(userobj.type);				
		}
		this.twit.setCredentials(userobj.username, userobj.password);
		
	}
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


