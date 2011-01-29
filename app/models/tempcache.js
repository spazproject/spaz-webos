var TempCache = function(opts) {
	
	opts = sch.defaults({
		'appObj':null
	}, opts);
	
	this.init();
	this.App = opts.appObj;
};

/**
 * Initialize a temporary property we use to store 
 * cache data that only lives for the duration of the
 * application run
 */
TempCache.prototype.init = function() {
	this._spaztmpcache = null;
};


TempCache.prototype.exists = function() {
	return Boolean(this._spaztmpcache);
};


/**
 * Init the temp cache for a particular user 
 */
TempCache.prototype.initUser = function(idkey) {
	
	if (!idkey) {
		idkey = this.App.userid;
	}
	
	Mojo.Log.info('TempCache: idkey for user is '+idkey);
	
	if (!this._spaztmpcache) {
		this._spaztmpcache = {};
	}
	if (!this._spaztmpcache[idkey]) {
		this._spaztmpcache[idkey] = {};
	}

};


/**
 * save a key:val pair to a idkey's temp cache
 */
TempCache.prototype.save = function(key, val, idkey) {
	
	if (!idkey) {
		idkey = this.App.userid;
	}

	Mojo.Log.info("saving key:"+key);
	Mojo.Log.info("saving val:"+val);
	Mojo.Log.info("saving idkey:"+idkey);	
	
	if (!this._spaztmpcache) {
		this.init();
	}
	
	if (!this._spaztmpcache[idkey]) {
		this.initUser(idkey);
	}
	
	this._spaztmpcache[idkey][key] = val;
	
	/*
		try to avoid blocking
	*/
	var tc = this;
	setTimeout(function() { tc.saveToDB(idkey); }, 1);
	

};

/**
 * save a key:val pair to a idkey's temp cache
 */
TempCache.prototype.load = function(key, idkey) {
	
	if (!idkey) {
		idkey = this.App.userid;
	}
	
	if (!this._spaztmpcache) {
		this._spaztmpcache = {};
	}
	if (!this._spaztmpcache[idkey]) {
		this.initUser(idkey);
	}
	
	Mojo.Log.info("TempCache: loading key:"+key);
	Mojo.Log.info("TempCache: loading idkey:"+idkey);
	
	if (this._spaztmpcache[idkey][key]) {
		return this._spaztmpcache[idkey][key];
	}
	
	return null;
};


TempCache.prototype.saveToDB = function(idkey) {
	
	Mojo.Log.error('Saving Cache to DB');
	
	Mojo.Timing.resume("timing_TempCache.saveToDB");
	
	if (!idkey) {
		idkey = this.App.userid;
	}
	
	function success(tx, rs) {
		Mojo.Log.info("SUCCESS SAVING TEMP CACHE");
		sch.triggerCustomEvent('temp_cache_save_db_success', document);
		Mojo.Timing.pause("timing_TempCache.saveToDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	function failure(tx, err) {
		sch.error("ERROR SAVING TEMP CACHE");
		Mojo.Log.error(err);
		sch.triggerCustomEvent('temp_cache_save_db_failure', document);
		Mojo.Timing.pause("timing_TempCache.saveToDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}

	Mojo.Timing.resume("timing_TempCache.JSON.stringify");	
	var json_cache = JSON.stringify(this._spaztmpcache[idkey]);
	Mojo.Timing.pause("timing_TempCache.JSON.stringify");

	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
	var key = 'json_cache_'+idkey;
	var sql_table = "CREATE TABLE IF NOT EXISTS tempcache (key, value)";
	var sql_clean = "DELETE FROM tempcache WHERE key = ?";
	var sql_insert= "INSERT INTO tempcache (key, value) VALUES(?,?)";
	SpazTempCache.transaction( (function (tx) { 
	   tx.executeSql(sql_table, []);
	   tx.executeSql(sql_clean, [key]);
	   tx.executeSql(sql_insert, [key, json_cache], success, failure);
	}));
};



TempCache.prototype.loadFromDB = function(onLoad, idkey) {
	Mojo.Timing.resume("timing_TempCache.loadFromDB");
	
	var that = this;
	
	if (!idkey) {
		idkey = this.App.userid;
	}
	
	if (!this._spaztmpcache) {
		this._spaztmpcache = {};
	}
	
	function success(tx, rs) {
		Mojo.Log.info("SUCCESS LOADING TEMP CACHE");
		Mojo.Timing.resume("timing_TempCache.sch.deJSON");
		for(var i = 0; i < rs.rows.length; i++) {
			var this_key = rs.rows.item(i).key.replace('json_cache_', '');
			var this_val = sch.deJSON(rs.rows.item(i).value);
			that._spaztmpcache[this_key] = this_val;
		}
		
		Mojo.Timing.pause("timing_TempCache.sch.deJSON");
		
		if (onLoad) {
			onLoad();
		}
		sch.triggerCustomEvent('temp_cache_load_db_success', document, that._spaztmpcache);
		Mojo.Timing.pause("timing_TempCache.loadFromDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	function failure(tx, err) {
		Mojo.Log.error("ERROR LOADING TEMP CACHE: %j", err);
		sch.triggerCustomEvent('temp_cache_load_db_failure', document, err);
		Mojo.Timing.pause("timing_TempCache.loadFromDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	
	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
	var sql_table = "CREATE TABLE IF NOT EXISTS tempcache (key, value)";
	var sql_select    = "SELECT key, value FROM tempcache WHERE key LIKE 'json_cache_%'";
	SpazTempCache.transaction( (function (tx) { 
		tx.executeSql(sql_table, []);
		tx.executeSql(sql_select, [], success, failure);
	}));

	
};


TempCache.prototype.clear = function() {
    Mojo.Timing.resume("timing_TempCache.clear");
	this.init();
	
	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
	SpazTempCache.transaction( (function (tx) { 
	   tx.executeSql("DELETE FROM tempcache", []);
	}));
	
	var appController = Mojo.Controller.getAppController();
	
	Mojo.Log.error('triggering temp_cache_cleared');
	appController.sendToNotificationChain({"event":"temp_cache_cleared"});
	
	Mojo.Timing.pause("timing_TempCache.clear");
};