var TempCache = {};

/**
 * Initialize a temporary property we use to store 
 * cache data that only lives for the duration of the
 * application run
 */
TempCache.init = function() {
	window.spaztmpcache = {};
};


TempCache.exists = function() {
	return Boolean(window.spaztmpcache);
};


/**
 * Init the temp cache for a particular user 
 */
TempCache.initUser = function(idkey) {
	
	if (!idkey) {
		idkey = App.userid;
	}
	
	sch.debug('TempCache: idkey for user is '+idkey);
	
	if (!window.spaztmpcache) {
		TempCache.init();
	}
	if (!window.spaztmpcache[idkey]) {
		window.spaztmpcache[idkey] = {};
	}

};


/**
 * save a key:val pair to a idkey's temp cache
 */
TempCache.save = function(key, val, idkey) {
	
	if (!idkey) {
		idkey = App.userid;
	}

	sch.debug("saving key:"+key);
	sch.debug("saving val:"+val);
	sch.debug("saving idkey:"+idkey);	
	
	if (!window.spaztmpcache) {
		TempCache.init();
		
	}
	if (!window.spaztmpcache[idkey]) {
		TempCache.initUser(idkey);
	}
	
	window.spaztmpcache[idkey][key] = val;

};

/**
 * save a key:val pair to a idkey's temp cache
 */
TempCache.load = function(key, idkey) {
	
	if (!idkey) {
		idkey = App.userid;
	}
	
	if (!window.spaztmpcache) {
		TempCache.init();
		return null;
	}
	if (!window.spaztmpcache[idkey]) {
		TempCache.initUser(idkey);
		return null;
	}
	
	sch.debug("TempCache: loading key:"+key);
	sch.debug("TempCache: loading idkey:"+idkey);
	
	if (window.spaztmpcache[idkey][key]) {
		return window.spaztmpcache[idkey][key];
	}
	
	return null;
};


TempCache.saveToDB = function() {
	Mojo.Timing.resume("timing_TempCache.saveToDB");
	
	function success(tx, rs) {
		sch.debug("SUCCESS SAVING TEMP CACHE");
		sch.debug(rs);
		sch.triggerCustomEvent('temp_cache_save_db_success', document);
		Mojo.Timing.pause("timing_TempCache.saveToDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	function failure(tx, err) {
		sch.error("ERROR SAVING TEMP CACHE");
		sch.debug(err);
		sch.triggerCustomEvent('temp_cache_save_db_failure', document);
		Mojo.Timing.pause("timing_TempCache.saveToDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	
	var json_cache = JSON.stringify(window.spaztmpcache);
	
	sch.debug(json_cache);

	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
	var sql_table = "CREATE TABLE IF NOT EXISTS tempcache (key, value)";
	var sql_clean = "DELETE FROM tempcache";
	var sql_insert= "INSERT INTO tempcache (key, value) VALUES(?,?)";
	SpazTempCache.transaction( (function (tx) { 
	   tx.executeSql(sql_table, []);
	   tx.executeSql(sql_clean, []);
	   tx.executeSql(sql_insert, ['json_cache', json_cache], success, failure);
	}));
	
};

TempCache.loadFromDB = function() {
	Mojo.Timing.resume("timing_TempCache.loadFromDB");
	
	function success(tx, rs) {
		sch.debug("SUCCESS LOADING TEMP CACHE");
		var json_cache = rs.rows.item(0).value;
		sch.debug('json_cache:'+json_cache);
		window.spaztmpcache = sch.deJSON(json_cache);
		sch.debug(window.spaztmpcache);
		sch.triggerCustomEvent('temp_cache_load_db_success', document, window.spaztmpcache);
		Mojo.Timing.pause("timing_TempCache.loadFromDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	function failure(tx, err) {
		sch.error("ERROR LOADING TEMP CACHE");
		sch.debug(err);
		sch.triggerCustomEvent('temp_cache_load_db_failure', document, err);
		Mojo.Timing.pause("timing_TempCache.loadFromDB");
		
		Mojo.Log.error(Mojo.Timing.createTimingString("timing_", "Cache op times"));
	}
	
	var SpazTempCache = openDatabase("ext:SpazTempCache", "1", 'SpazTempCache', 10*1024*1024);
	var sql_select    = "SELECT value FROM tempcache WHERE key = ?";
	SpazTempCache.transaction( (function (tx) { 
	   tx.executeSql(sql_select, ['json_cache'], success, failure);
	}));
	
	
	
};


TempCache.clear = function() {
    Mojo.Timing.resume("timing_TempCache.clear");
	TempCache.init();
	TempCache.saveToDB();
	sch.trigger('temp_cache_cleared', document);
	Mojo.Timing.pause("timing_TempCache.clear");
};