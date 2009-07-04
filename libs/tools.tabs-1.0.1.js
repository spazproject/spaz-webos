/**
 * tools.tabs 1.0.1 - Tabs done rigth.
 * 
 * Copyright (c) 2009 Tero Piirainen
 * http://flowplayer.org/tools/tabs.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Launch  : November 2008
 * Date: 2009-06-12 11:02:45 +0000 (Fri, 12 Jun 2009)
 * Revision: 1911 
 */ 
(function($) {
		
	// static constructs
	$.tools = $.tools || {version: {}};
	
	$.tools.version.tabs = '1.0.1';
	
	$.tools.addTabEffect = function(name, fn) {
		effects[name] = fn;
	};		
	
	
	var effects = { 
		'default': function(i) { 
			this.getPanes().hide().eq(i).show(); 
		}, 
		
		// custom configuration variable: fadeInSpeed
		fade: function(i) {
			this.getPanes().hide().eq(i).fadeIn(this.getConf().fadeInSpeed);	
		},
		
		slide: function(i) {
			this.getCurrentPane().slideUp("fast");
			this.getPanes().eq(i).slideDown();			 
		},

		horizontal: function(i) {
			
			// store original width of a pane into memory
			if (!$._hW) { $._hW = this.getPanes().eq(0).width(); }
			
			// set current pane's width to zero
			this.getCurrentPane().animate({width: 0}, function() { $(this).hide(); });
			
			// grow opened pane to it's original width
			this.getPanes().eq(i).animate({width: $._hW}, function() { $(this).show(); });			 
		}		
	};   	
	 

	function Tabs(tabs, panes, opts) { 
		
		var self = this;
		var current;

		// generic binding function
		function bind(name, fn) {
			$(self).bind(name, function(e, args)  {
				if (fn && fn.call(this, args.index) === false && args) {
					args.proceed = false;	
				}	
			});
			return self;
		}
		
		// bind all callbacks from configuration
		$.each(opts, function(name, fn) {
			if ($.isFunction(fn)) { bind(name, fn); }
		});
		
		
		// public methods
		$.extend(this, {				
			click: function(i) {
				
				if (i === current) { return self; }
				
				var pane = self.getCurrentPane();				
				var tab = tabs.eq(i);												 
				
				if (typeof i == 'string') {
					tab = tabs.filter("[href=" +i+ "]");
					i = tabs.index(tab);
				}
				
				if (!tab.length) { 
					if (current >= 0) { return self; }
					i = opts.initialIndex;
					tab = tabs.eq(i);
				}				
				
				// possibility to cancel click action
				var args = {index: i, proceed: true};
				$(self).triggerHandler("onBeforeClick", args);				
				if (!args.proceed) { return self; }				
				
				tab.addClass(opts.current);
				
				// call the effect
				effects[opts.effect].call(self, i);
				
				// onClick callback
				$(self).triggerHandler("onClick", args);	
				
				tabs.removeClass(opts.current);	
				tab.addClass(opts.current);											
				current = i;
				return self;
			},
			
			getConf: function() {
				return opts;	
			},

			getTabs: function() {
				return tabs;	
			},
			
			getPanes: function() {
				return panes;	
			},
			
			getCurrentPane: function() {
				return panes.eq(current);	
			},
			
			getCurrentTab: function() {
				return tabs.eq(current);	
			},
			
			getIndex: function() {
				return current;	
			},
			
			next: function() {
				return self.click(current + 1);
			},
			
			prev: function() {
				return self.click(current - 1);	
			}, 
			
			onBeforeClick: function(fn) {
				return bind("onBeforeClick", fn);	
			},
			
			onClick: function(fn) {
				return bind("onClick", fn);	
			}			
		
		});
		
		
		// setup click actions for each tab
		tabs.each(function(i) { 
			$(this).bind(opts.event, function(e) {
				self.click(i);
				if (!opts.history) { 
					return e.preventDefault();
				}
			});			
		});
		
		// enable history plugin
		if (opts.history) {
			tabs.history(function(evt, hash) {
				self.click(hash || 0);		
			});
		}

		// if no pane is visible --> click on the first tab
		if (location.hash) {
			self.click(location.hash);	
		} else {
			self.click(opts.initialIndex);	
		}		
		
		// cross tab anchor link
		panes.find("a[href^=#]").click(function() {
			self.click($(this).attr("href"));		
		});
		
	}
	
	
	// jQuery plugin implementation
	$.fn.tabs = function(query, arg) {
		
		// return existing instance
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("tabs");
		if (el) { return el; }

		
		// setup options
		var opts = {
			tabs: 'a',
			current: 'current',
			onBeforeClick: null,
			onClick: null, 
			effect: 'default',
			history: false,
			initialIndex: 0,			
			event: 'click',
			api:false
		};
		
		if ($.isFunction(arg)) {
			arg = {onBeforeClick: arg};
		}
		
		$.extend(opts, arg);
		
		// install tabs for each items in jQuery		
		this.each(function() {				
			var els = $(this).find(opts.tabs);
			
			if (!els.length) {
				els = $(this).children();	
			}
			
			var panes = query.jquery ? query : $(query);

			el = new Tabs(els, panes, opts);
			$(this).data("tabs", el);	 
		});		
		
		return opts.api ? el: this;		
	};		
		
}) (jQuery); 


//{{{ history plugin

/**
 *	tools.history plugin. execute a callback when browser's 
 * back/forward buttons are pressed.
 *	
 *	Can be used as a separate tool. Example:
 *	
 *	$("ul.tabs a").history(function(hash) {		
 *		
 *	});	
 */
(function($) {
	
	var hash, iframe;		

	// jQuery plugin implementation
	$.prototype.history = function(fn) {
			
		var el = this;
		
		// IE
		if ($.browser.msie) {
			
			// create iframe that is constantly checked for hash changes
			if (!iframe) {
				iframe = $("<iframe />").hide().get(0);
				$("body").append(iframe);
				
				setInterval(function() {
					var idoc = iframe.contentWindow.document;
					var h = idoc.location.hash;
				
					if (hash !== h) {						
						$.event.trigger("hash", h);
						hash = h;
					}
				}, 100);					
			}
			
			// when link is clicked the iframe hash updated
			el.bind("click.hash", function(e) {	
				var doc = iframe.contentWindow.document;
				doc.open().close();				
				doc.location.hash = $(this).attr("href");
			}); 
			
			// pseudoclick of the first item 
			el.eq(0).triggerHandler("click.hash");
			
			
		// other browsers scans for location.hash changes directly withou iframe hack
		} else { 
			setInterval(function() {
				var h = location.hash;
				
				if (el.filter("[href*=" + h + "]").length && h !== hash) {
					hash = h;
					$.event.trigger("hash", h);
				}						
			}, 100);
		}
		 
		// bind a history listener
		$(window).bind("hash", fn);
		
		// return jQuery
		return this;		
	};	
	

})(jQuery); 

//}}}

