/**
 * This is an interface to a complex preference stored as a hash
 * @param (Object) prefsObj  An existing SpazPrefs object (optional)
 */
var Users = function(prefsObj) {
	if (prefsObj) {
		this.prefs = prefsObj;
	} else {
		this.prefs = new SpazPrefs(default_preferences);
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
		if (! sc.helpers.isUUID(this._users[i].id)) {
			dump('user '+this._users[i].username + ' has an old style id');
			this._users[i].id = this.generateID();
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
	var id = this.generateID();
	this._users.push = {
		'id':id,
		'username':username,
		'password':password,
		'type':type,
		'meta':{}
	};
	this.save();
	dump("Added new user:"+id);
};


/**
 * @TODO 
 */
Users.prototype.getByType	= function(type) {
	
};

/**
 * retrives the user object by user and type
 * @param {string} id  the user id UUID
 * @param {string} type 
 */
Users.prototype.getUser		= function(id) {

	var index = this._findUserIndex(id);

	if (index !== false) {
		return this._users[i];		
	}
	
	return false;
	
};


Users.prototype._findUserIndex = function(id) {
	
	for (i=0; i<this._users.length; i++) {
		
		if (this._users[i].id === id) {
			dump('Found matching user record to '+ id);
			return i;
		}
		
	}
	
	return false;
};




// Users.prototype.generateID = function(username, type) {
// 	var id = username.toLowerCase()+"_"+type.toLowerCase();
// 	return id;
// };
Users.prototype.generateID = function() {
	var id = sc.helpers.UUID();
	return id;
};




Users.prototype.getMeta = function(id, key) {
	
	if ( user = this.getUser(id) ) {
		if (user.meta && user.meta[key] !== null) {
			return user.meta[key];
		}
	}
	
	return null;
	
};

Users.prototype.setMeta = function(id, key, value) {
	
	var index = this._findUserIndex(id);

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