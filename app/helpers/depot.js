
var makeCacheDepot = function(replace) {
	if (replace) {
		replace = true;
	} else {
		replace = false;
	}
	
	var depot = new Mojo.Depot({
		'name':'ext:SpazDepotTimelineCache',
		'displayName':'SpazDepotTimelineCache',
		'replace':replace,
		'version':1
	});
	
	return depot;
	
};