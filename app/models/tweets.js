/**
 * A model for interfacing with the Tweets depot
 * 
 */
var Tweets = function() {
	
	this.bucket = "tweets";
	this.dm_bucket = "dms";
	
	this._init();
};

Tweets.prototype._init  = function() {
	var opts = {
		'name'    : 'SpazDepot',
		'replace' : false
	};
	
	if (!this.mojoDepot) {
		this.mojoDepot = new Mojo.Depot(opts);
	}
};

Tweets.prototype.get    = function(id, is_dm, onSuccess, onFailure) {
	if (!is_dm) {
		this.mojoDepot.getSingle(this.bucket, id, onSuccess, onFailure);
	} else {
		this.mojoDepot.getSingle(this.dm_bucket, id, onSuccess, onFailure);
	}
};

Tweets.prototype.save   = function(object, onSuccess, onFailure) {
	var objid = object.id;
	dump("Saving id "+objid);
	if (!object.SC_is_dm) {
		dump("Saving TWEET "+objid);
		this.mojoDepot.addSingle(this.bucket, objid, object, null, function(){ dump('save '+objid+' success') }, function(msg){ dump('save '+objid+' fail:'+msg) });
	} else {
		dump("Saving DM "+objid);
		this.mojoDepot.addSingle(this.dm_bucket, objid, object, null, function(){ dump('save '+objid+' success') }, function(msg){ dump('save '+objid+' fail:'+msg) });
	}
};

Tweets.prototype.remove = function(objid, onSuccess, onFailure) {
	
};

Tweets.prototype.onSaveSuccess = function(obj, msg) {
	dump('TweetModel Saved');
};

Tweets.prototype.onSaveFailure = function(msg, obj) {
	dump('TweetModel Save Failed On : '+obj+' '+msg);
};


