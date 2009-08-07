/**
 * This is an interface to a complex preference stored as a hash
 * @param (Object) prefsObj  An existing SpazPrefs object (optional)
 */
var Users = function(prefsObj) {
	if (prefsObj) {
		this.prefs = prefsObj;
	} else {
		this.prefs = new scPrefs(default_preferences);
		this.prefs.load();
	}
	this._users = this.prefs.get('users');
};


Users.prototype.load	= function() { 
	this._users = this.prefs.get('users');
	this.fixIDs();
};


Users.prototype.fixIDs  = function() {
	
	for (i=0; i<this._users.length; i++) {
		if (this._users[i].id.toLowerCase() === this._users[i].username.toLowerCase()) {
			dump('user '+this._users[i].username + ' has an old, identical id');
			this._users[i].id = this.generateID(this._users[i].username, this._users[i].type);
			this.save();
		}
	}
	dump('done fixing IDs in user hash');
	
};


Users.prototype.save	= function() {
	this.prefs.set('users', this._users);
	dump('saved users to users pref');
	for (var x in this._users) {
		dump(this._users[x].id);
	};
};


Users.prototype.getAll	= function() {
	return this._users;
};

/**
 * Set all users by passing in a hash. overwrites all existing data! 
 */
Users.prototype.setAll	= function(userhash) {
	this._users = userhash;
	this.save();
	dump("Saved these users:");
	for (var x in this._users) {
		dump(this._users[x].id);
	};
};

Users.prototype.initUsers	= function(onSuccess, onFailure) {
	this._users = [];
	this.save();
};


Users.prototype.add			= function(username, password, type) {
	var username = username.toLowerCase();
	this._users.push = {
		'id':this.generateID(username, type),
		'username':username,
		'password':password,
		'type':type,
		'meta':{}
	};
	this.save();
	dump("Added new user:"+this.generateID(username, type));
};


/**
 * @TODO 
 */
Users.prototype.getByType	= function(type) {
	
};

/**
 * retrives the user object by user and type
 * @param {string} username
 * @param {string} type 
 */
Users.prototype.getUser		= function(username, type) {

	var index = this._findUserIndex(username, type);

	if (index !== false) {
		return this._users[i];		
	}
	
	return false;
	
};


Users.prototype._findUserIndex = function(username, type) {
	var username = username.toLowerCase();
	var type     = type.toLowerCase();
	
	var id = this.generateID(username, type);
	
	for (i=0; i<this._users.length; i++) {
		
		if (this._users[i].id.toLowerCase() === id) {
			dump('Found matching user record to '+ id);
			return i;
		}
		
	}
	
	return false;
};




Users.prototype.generateID = function(username, type) {
	var id = username.toLowerCase()+"_"+type.toLowerCase();
	return id;
};


Users.prototype.getMeta = function(username, type, key) {
	var user = null;
	var id = this.generateID(username, type);
	
	if ( user = this.getUser(username, type) ) {
		if (user.meta && user.meta[key] !== null) {
			return user.meta[key];
		}
	}
	
	return null;
	
};

Users.prototype.setMeta = function(username, type, key, value) {
	
	var index = this._findUserIndex(username, type);

	if (index !== false) {		
		if (!this._users[index].meta) {
			this._users[index].meta = {};
		}
		this._users[index].meta[key] = value;
		
		this.save();
		
		return this._users[index].meta[key];
		
	}
	return false;
	
};