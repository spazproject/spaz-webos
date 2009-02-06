/**
 * A model for interfacing with the Tweets depot
 * 
 */
var Tweets = function() {
	
	this.bucket = "tweets";
	
	
};

Tweets.prototype._init  = function() {
	var opts = {
		'name'    : , 
		'displayName' : 'SpazDB',
		'replace' : false,		
	};
	
	Luna.Depot.initialize(opts,
		function() {
			Luna.Log.info('Tweets depot initialized.');
		},
		function(msg) {
			Luna.Log.error('Could not initialize Tweets depot. Error message: "', msg, '"');
		}
	);
};

Tweets.prototype.get    = function(id, onSuccess, onFailure) { 
	return tweet_obj;
};

Tweets.prototype.save   = function(object, onSuccess, onFailure) {
	return true;
};

Tweets.prototype.delete = function(id, onSuccess, onFailure) {
	
};


