function LoginAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

LoginAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Luna.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */

	/*
		Username
	*/
	this.controller.setupWidget('username',
		this.atts = {
			hintText: 'enter username',
			focus: true,
			enterSubmits: true
		}
	);
	
	/*
		Password
	*/
	this.controller.setupWidget('password',
	    this.atts = {
	        hintText: 'enter password',
	        label: "password",
	        // focus: true
        }
    );
	
	
	/*
		login button
	*/
	this.controller.setupWidget('login-button',
		this.atts = {
			label: 'Login',
			onStart: 'Login',
			onActive: 'Verifying',
			onComplete: 'You\'re in!',
			activityFunction: this.handleLogin.bind(this)
		},
		this.model = {
	        buttonLabel: 'Login',
	        buttonClass: 'login-button',
	        disabled: false
		}
		
	);
	
	
	/* add event handlers to listen to events from widgets */
	LoginAssistant.prototype.setup = function() {
		Luna.Event.listen($('login-button'),'luna-tap', this.handleLogin);
    }

}


LoginAssistant.prototype.handleLogin = function(event) {
	alert('hi!');
}


LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


LoginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
