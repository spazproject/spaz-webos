function StartsearchAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	scene_helpers.addCommonSceneMethods(this);
}

StartsearchAssistant.prototype.setup = function() {
	var thisA = this;

	this.scroller = this.controller.getSceneScroller();
	
	this.initAppMenu();

	this.setupCommonMenus({
		viewMenuItems: [
			{
				items: [
					// {label:$L('Back'),        icon:'back', command:'back'},
					{label:$L('Search & Explore'), command:'scroll-top'}
				]
			}
		],
		cmdMenuItems: [{ items:
			[]
		}]
	});
	
	
	/*
		Initialize the model
	*/
	// alert(username+":"+password)
	this.model = {
		'search':'',
	};
	
	
	
	
	/*
		Search
	*/
	this.controller.setupWidget('search',
	    this.atts = {
	        // hintText: 'enter search terms',
	        label: "search terms",
			enterSubmits: true,
			modelProperty:		'search',
			changeOnKeyPress: true, 
			focusMode:		Mojo.Widget.focusSelectMode,
			multiline:		false,
		},
		this.model
    );
	
	
	Mojo.Event.listen($('reload-trends-button'), Mojo.Event.tap, function() {
		thisA.refreshTrends();
	});
	
	Mojo.Event.listen($('search-button'), Mojo.Event.tap, this.handleSearch.bind(this));
	
	/*
		listen for trends data updates
	*/
	jQuery().bind('new_trends_data', {thisAssistant:this}, function(e, trends) {
		thisA.hideInlineSpinner('#trends-spinner-container');
		
		/*
			some trends are wrapped in double-quotes, so we need to turn then into entities
		*/
		for (var k=0; k<trends.length; k++) {
			trends[k].searchterm = trends[k].searchterm.replace(/"/gi, '&quot;');
		}
		
		var trendshtml = Mojo.View.render({'collection':trends, template:'startsearch/trend-item'});
		
		jQuery('#trends-list .trend-item').remove();
		jQuery('#trends-list').append(trendshtml);
		jQuery('#trends-list .trend-item').fadeIn(500);
	});
	
	this.refreshTrends();
	

	
	
}

StartsearchAssistant.prototype.activate = function(event) {
	
	Mojo.Log.info("Logging from StartsearchAssistant Activate");

	var thisA = this;

	jQuery('.trend-item').live(Mojo.Event.tap, function() {
		var term = jQuery(this).attr('data-searchterm');
		thisA.searchFor(term, 'lightweight');
	});


}


StartsearchAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	
	jQuery('.trend-item').die(Mojo.Event.tap);
}

StartsearchAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


StartsearchAssistant.prototype.refreshTrends = function() {
	this.showInlineSpinner('#trends-spinner-container', 'Loading…');
	sc.app.twit.getTrends();
};


StartsearchAssistant.prototype.handleSearch = function(event) {
	if (this.model && this.model.search) {
		this.searchFor(this.model.search, 'lightweight');
	}
}


StartsearchAssistant.prototype.propertyChanged = function(event) {
	dump("********* property Change *************");
}


