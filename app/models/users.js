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
}


Users.prototype.load	= function() { 
	this._users = this.prefs.get('users');
};


Users.prototype.save	= function() {
	this.prefs.set('users', this._users);
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
};

Users.prototype.initUsers	= function(onSuccess, onFailure) {
	this._users = []
	this.save();
};


Users.prototype.add			= function(username, password, type) {
	username = username.toLowerCase();
	this._users.push = {
		'username':username,
		'password':password,
		'type':type
	};
	this.saveUsers();
	dump("Added new user:"+username);
};


/**
 * @TODO 
 */
Users.prototype.getByType	= function(type) {
	
};


Users.prototype.getUser		= function(username) {
	username = username.toLowerCase();
	
	for (i=0; i<this._users.length; i++) {
		
		if (this._users[i].username.toLowerCase() === username) {
			dump('Found matching user record to '+ username)
			return this._users[i];
		}
		
	}
	
	return false;
	
}


