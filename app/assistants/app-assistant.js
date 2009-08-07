
const SPAZ_DASHBOARD_STAGENAME = 'dashboard';

var loggedin_appmenu_items = [
	Mojo.Menu.editItem,
	{ label: $L('Update Location...'),	command: 'update-location' },
	// { label: $L('New Search Card'),	command: 'new-search-card' },
	{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
	{ label: $L('About Spaz'),		command: 'appmenu-about' },
	{ label: $L('Help...'),			command:Mojo.Menu.helpCmd }
];


function AppAssistant(appController) {
	
	Mojo.Log.info("Logging from AppAssistant Constructor");
	var thisSA = this;	

	/*
		Remap JSON parser because JSON2.js one was causing probs with unicode
	*/
	sc.helpers.deJSON = function(str) {
		try {
			var obj = Mojo.parseJSON(str);
			return obj;
		} catch(e) {
			dump('There was a problem decoding the JSON string');
			dump('Here is the JSON string: '+str);
			return null;
		}
		
	};
	sc.helpers.enJSON = function(obj) {
		var json = obj.toJSON();
		return json;
	};

	sc.info = Mojo.Log.info;
	sc.warn = Mojo.Log.warn;
	sc.error = Mojo.Log.error;

	this.sc = sc;
	
	

	/*
		model for saving Tweets to Depot. We replace on every start to make sure we don't go over-budget
	*/
	sc.app.Tweets = new Tweets(true);

	sc.app.search_cards = [];
	sc.app.new_search_card = 0;
	sc.app.search_card_prefix = "searchcard_";

	sc.app.username = null;
	sc.app.password = null;
	
	sc.app.prefs = null;
	
}


AppAssistant.prototype.handleLaunch = function(launchParams) {
	Mojo.Log.info("Logging from AppAssistant handleLaunch");
	var thisA = this;

	dump("Launch Parameters:");
	dump(launchParams);

	Spaz.closeDashboard();

	if (launchParams) {
		if (launchParams.action) { // do an action

			switch(launchParams.action) {
				
				case 'post':
					if (launchParams.actionopts) {
						var msg = launchParams.actionopts.msg || '';
						var irt = launchParams.actionopts.irt || -1;
					}
					// make the user choose an account to post from, and then
					// do something here to open a posting window with a prefilled form
					
					break;
				default:
					
			}
			
		} else if (launchParams.fromstage) {
			
			if (launchParams.fromstage === 'main') {
				PalmSystem.activate();
			} else {
				var stageController = this.controller.getStageController(launchParams.fromstage);
				if (stageController) {
					stageController.window.focus();
				}			
			}
			
		}
	}
};


/**
 *  
 */
AppAssistant.prototype.handleCommand = function(event){
	
	dump(event.command);
	
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			/*
				back
			*/
			case 'back':
				Mojo.Controller.stageController.popScene();
				break;


			case 'search-trends':
				Mojo.Controller.notYetImplemented();
				break;

		}
	}
};
