
const SPAZ_DASHBOARD_STAGENAME = 'dashboard';
const SPAZ_MAIN_STAGENAME      = 'main';
const SPAZ_BGNOTIFIER_DASHBOARD_STAGENAME = 'bgnotifier';

const SPAZ_DONATION_URL = 'http://getspaz.com/donate';



var loggedin_appmenu_items = [
	Mojo.Menu.editItem,
	{ label: $L('Update Location...'),	command: 'update-location' },
	{ label: $L('New Search Card'),	command: 'new-search-card' },
	{ label: $L('Accounts...'), 	command:'accounts' },
	{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
	{ label: $L('About Spaz'),		command: 'appmenu-about' },
	{ label: $L('Help...'),			command:Mojo.Menu.helpCmd },
	{ label: $L('Donate...'),		command:'donate' }
	
];


function AppAssistant(appController) {
	
	Mojo.Log.info("Logging from AppAssistant Constructor");
	
}





// 
// AppAssistant.prototype.cleanup = function() {
// 	Mojo.Log.info('Logging from AppAssistant.cleanup');
// 	Mojo.Log.info('Shutting down app');
// 	// if (!this.weAreHeadless) {
// 	// 	Mojo.Log.info('We are NOT headless -- registering next notification');
// 	// 	sc.app.bgnotifier.registerNextNotification();
// 	// }
// };



AppAssistant.prototype.handleLaunch = function(launchParams) {
	
	var cardStageProxy = this.controller.getStageProxy(SPAZ_MAIN_STAGENAME);
	var cardStageController = this.controller.getStageController(SPAZ_MAIN_STAGENAME);
	sch.error('cardStageController:');
	sch.error(cardStageController);
	var appController = Mojo.Controller.getAppController();
	var dashboardStage = this.controller.getStageProxy(SPAZ_DASHBOARD_STAGENAME);
	
	Mojo.Log.info("Logging from AppAssistant handleLaunch");

	Mojo.Log.info("Launch Parameters:");
	Mojo.Log.info(sch.enJSON(launchParams));
	
	Spaz.closeDashboard();

	// /**
	//  * opens the main app stage. embedded here for closure's sake
	//  */
	// var that = this;
	// function openMainStage() {
	// 	// sc.app.bgnotifier.stop();
	// 	if (!cardStageController) {
	// 		
	// 		that.initialize();
	// 		
	// 		sch.error('NO CARDSTAGECONTROLLER EXISTS');
	// 		sch.error('FIRSTLOAD ----------------------');
	// 		var pushStart = function(stageController) {
	// 			that.mapObjectsToNewStage(stageController);
	// 			that.gotoMyTimeline(stageController);
	// 		};
	// 		var stageArguments = {
	// 			"name": SPAZ_MAIN_STAGENAME,
	// 			"assistantName":"StageAssistant"
	// 		};
	// 		sch.error('Creating stage');
	// 		that.controller.createStageWithCallback(stageArguments, pushStart.bind(that), "card");
	// 		
	// 	} else {
	// 		sch.error("cardStageController Exists -----------------------");
	// 		if (!window.sc) {
	// 			that.mapObjectsToNewStage(cardStageController);
	// 		}
	// 		sch.error('Focusing stage controller window');
	// 		cardStageController.window.focus();
	// 	}
	// }

	/*
		if there are no launchparams, open the main stage as normal
	*/
	if (!launchParams) {
		sch.error('No launchParams - OPENING MAIN STAGE');
		// openMainStage();
	}
	
	if (launchParams) {
		if (launchParams.action) {
			sch.error("action:", launchParams.action);
			switch(launchParams.action) {
			
				case 'post':
					/*
						this is NYI
					*/
					// if (launchParams.actionopts) {
					// 	var msg = launchParams.actionopts.msg || '';
					// 	var irt = launchParams.actionopts.irt || -1;
					// }
					// // make the user choose an account to post from, and then
					// // do something here to open a posting window with a prefilled form
					// 				
					// break;
				case 'bgcheck': 
					
					/*
						right now bgchecking is buggy. the pref should always
						be false, unless the user hacks their prefs up
					*/
					if (sc.app.prefs.get('bgnotify-enabled')) {
						sch.error('RUNNING BG CHECK');
						that.initialize();
						sc.app.bgnotifier.start();
						break;
					} // else we drop through to default
					
				default:
					sch.error('default action - OPENING MAIN STAGE');
					// openMainStage();
			}
		} else if (launchParams.fromstage) {
			sch.error("fromstage:", launchParams.fromstage);
			if (launchParams.fromstage === SPAZ_MAIN_STAGENAME) {
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
	
	sch.debug(event.command);
	
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
				
			case 'donate':
				var sr = new Mojo.Service.Request("palm://com.palm.applicationManager", {
				  method: "open",
				  parameters:  {
				      id: 'com.palm.app.browser',
				      params: {
				          target: SPAZ_DONATION_URL
				      }
				  }
				});
				
				break;

		}
	}
};



/**
 * Because the app assistant doesn't share a window object with the stages, 
 * we need to map the sc. namespace to the stageController.window 
 */
AppAssistant.prototype.mapObjectsToNewStage = function(stageController) {
	stageController.window.sc = sc; // map spazcore namespace
	// stageController.window.jQuery = jQuery; // map jQuery
	/*
		re-map setInterval to the stageController's window.setInterval,
		as Mojo unsets it when we make a noWindow app.
	*/
	window.setInterval = stageController.window.setInterval;
};



