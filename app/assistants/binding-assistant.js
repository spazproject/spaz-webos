function BindingAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	var options = {
			name: "binding_demo", //Name used for the HTML5 database name. (required)
			version: 1, //Version number used for the HTML5 database. (optional, defaults to 1)	
			//displayName: "demoDB", //Name that would be used in user interface that the user sees regarding this database. Not currently used. (optional, defaults to name)
		    //estimatedSize: 200000, //Estimated size for this database. (optional, no default)
			replace: true //A truthy value for replace will cause any existing data for this depot to be discarded and a new,
	};

	
	this.demoDepot = new Mojo.Depot(options, this.dbSuccess, this.dbFailure);
}

BindingAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	jsondata = {
	    "user": {
	        "followers_count": 795,
	        "description": "David LeFevre \u2013 Gemini - Earth Muffin \u2013 Dad \u2013 Husband \u2013 Visionary - Marketing Wizard - Entrepreneur... & You?",
	        "url": "http:\/\/www.loanamp.com\/GetMotivatedPresentation",
	        "profile_image_url": "http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/67663757\/David_Pic_normal.JPG",
	        "protected": false,
	        "location": "Texas",
	        "screen_name": "Go2DavidLeFevre",
	        "name": "David LeFevre",
	        "id": "18175897"
	    },
	    "text": "I don't have a crystal ball, but I think we're facing a massive and fundamental change in the way money works in this society...",
	    "truncated": false,
	    "favorited": false,
	    "in_reply_to_user_id": null,
	    "created_at": "Wed Jan 14 15:01:55 +0000 2009",
	    "source": "web",
	    "in_reply_to_status_id": null,
	    "id": "1118407075"
	};
		
	this.demoDepot.addSingle('bucket1', jsondata.id, jsondata, undefined, this.dbSuccess.bind(this), this.dbFailure.bind(this));
	
	this.demoDepot.getMultiple('bucket1', null, 10, 0, this.dbSuccess, this.dbFailure);
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
}


BindingAssistant.prototype.dbSuccess = function(obj) {
	dump("dbSuccess:");
	dump(obj);
};
BindingAssistant.prototype.dbFailure = function(msg) {
	dump("dbFailure:"+msg);
};

BindingAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


BindingAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

BindingAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


