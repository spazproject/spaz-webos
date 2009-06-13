/************************************
 * global scene helper functions
 ************************************/

/**
 * This helper looks through the array of scenes and looks for an existing instance of 
 * the given targetScene. If one exists, we pop all scenes before it to return to it. Otherwise
 * we swap to a new instance of the scene
 * 
 * @param {string} targetScene the scene name
 * @param {many} returnValue a return value passed to the pop or swap call
 */
var findAndSwapScene = function(targetScene, returnValue) {
	/*
		initialize
	*/
	var scene_exists = false;
	
	/*
		get an array of existing scenes
	*/
	var scenes = Mojo.Controller.stageController.getScenes();
	

	for (var k=0; k<scenes.length; k++) {
		if (scenes[k].sceneName == targetScene) { // this scene already exists, so popScenesTo it
			scene_exists = true;
		}
	}
	
	if (scene_exists) {
		Mojo.Controller.stageController.popScenesTo(targetScene, returnValue);
	} else {
		Mojo.Controller.stageController.swapScene(targetScene, returnValue);
	}
};


/**
 * converts various items in a timeline entry's text into clickables
 * @param {string} str
 * @return {string}
 */
var makeItemsClickable = function(str) {
	
	str = sch.autolink(str, null, null, 20);
	str = sch.autolinkTwitterScreenname(str, '<span class="username clickable" data-user-screen_name="#username#">@#username#</span>');
	str = sch.autolinkTwitterHashtag(str, '<span class="hashtag clickable" data-hashtag="#hashtag#">##hashtag#</span>');

	
	return str;
};


/*
	map sc.helpers.dump() to dump() for extra succinctness
*/
var dump = sc.helpers.dump;


var profile = function() {
	if (console && console.profile)
		console.profile();	
};

var profileEnd = function() {
	if (console && console.profileEnd)
		console.profileEnd();
};