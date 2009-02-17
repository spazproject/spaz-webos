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
		

		
	this.demoDepot.addSingle('bucket1', 'test_entry_key'+sch.getTimeAsInt(), {
		'funk':'punk',
		'date':sch.getTimeAsInt(),
		'user':{
			'id': Base64.encode(sch.getTimeAsInt().toString()),
			'name':'bear'
		}
	}, undefined, this.dbSuccess.bind(this), this.dbFailure.bind(this));
	
	this.demoDepot.getMultiple('bucket1', null, 10, 0, this.dbSuccess, this.dbFailure);
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
}


BindingAssistant.prototype.dbSuccess = function(obj) {
	console.log("dbSuccess:");
	console.dir(obj);
};
BindingAssistant.prototype.dbFailure = function(msg) {
	console.log("dbFailure:"+msg);
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


