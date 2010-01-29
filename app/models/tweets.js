/**
 * A model for interfacing with the Tweets depot
 * 
 */
var Tweets = function(replace) {
	
	this.bucket = new Lawnchair({name:"ext:tweets"});
	this.dm_bucket = new Lawnchair({name:"ext:dms"});
	this.user_bucket = new Lawnchair({name:"ext:users"});
	
	this._init(replace);
};

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

Tweets.prototype.get    = function(id, is_dm, onSuccess, onFailure) {

	/*
		make sure this is an integer
	*/	
	id = parseInt(id, 10);
	
	if (!is_dm) {
		this.bucket.get(id, onSuccess, onFailure);
	} else {
		this.dm_bucket.get(id, onSuccess, onFailure);
	}
};


Tweets.prototype.getMultiple = function(type, since_id) {
	
};


Tweets.prototype.save   = function(object, onSuccess, onFailure) {
	var objid = object.id;
	
	/*
		make sure this is an integer
	*/
	objid = parseInt(objid, 10);
	
	object.key = objid;
	
	
	sch.error("Saving id "+objid);
	if (!object.SC_is_dm) {
		sch.error("Saving TWEET "+objid);
		this.bucket.save(object);
		this.user_bucket.save(object.user);
	} else {
		sch.error("Saving DM "+objid);
		this.dm_bucket.save(object);
		this.user_bucket.save(object.sender);
		this.user_bucket.save(object.recipient);
	}
};

Tweets.prototype.remove = function(objid, isdm, onSuccess, onFailure) {
	isdm = isdm === true || false;
	objid = parseInt(objid, 10);
	if (!isdm) {
		this.bucket.remove(objid);
	} else {
		this.dm_bucket.remove(objid);
	}
	
};



Tweets.prototype.saveUser = function(userobj) { 
	userobj.key = parseInt(userobj.id, 10);
	this.user_bucket.save(userobj);
};

Tweets.prototype.getUser = function(id, onSuccess, onFailure) {
	this.user_bucket.get(id, onSuccess, onFailure);
};

Tweets.prototype.removeUser = function(id) {
	this.user_bucket.remove(id);
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

