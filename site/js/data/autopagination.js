/**
 * Define my autopagination data attribute handler.
 * @todo This is a quick, compatible repositioning of the script. Needs a review and partial rewrite!
 **/
define(["../ofw-jquery"], function() {

    /** Private properties **/
	var _objects = [];			// An array of autopagination objects on this page

    /** Private API **/

    /**
     * Object init
     */
    var init = function(){
    	// Nothing happens here for now, everything in public init.
    };

    /** Public API **/
    var api = {

        /**
         * Activate the data attributes in this context.
		 * @param {jQuery|Array} $elements An array of jQuery objects that have the data attribute.
		 * @param {jQuery} [$context=$(document)] The current jQuery object context in which the handlers are searched for.
         */
        activate: function($elements, $context) {
			$elements.each(function(){
				// Set defaults and data
					var $el =  $(this);
					var _rawdata = $el.attr('data-autopagination');
					if(_rawdata == '') return true;
					var data = JSON.parse(_rawdata);
					var block = $el.attr('data-autopagination-block');
					var button = $el.attr('data-autopagination-button');
					if(typeof block == 'undefined') block = 'autopagination';
				// Use button or infinite scroll
					var _useMoreButton = null;
					if(typeof button != 'undefined') _useMoreButton = $(button);
				// Create my autopagination object
					var autopaginationObject = new OutlastFrameworkAutopagination({
						model: data.model,
						url: data.url,
						startPage: data.startPage,
						pageCount: data.pageCount,
						watchElement: false,
						watchInterval: 500,
						targetBlock: block,
						targetElement: this,
						useMoreButton: _useMoreButton
					});
					_objects.push(autopaginationObject);
			});
		}
	};

    /** Perform private initialization **/
    init();

    // Return my external API
    return api;

});

/**
 * A single autopagination object.
 * @param {object} options Options.
 */
var OutlastFrameworkAutopagination = function(options){

    /** Options **/
    var _defaultOptions = {
		model: null,			// Name of the model
		url: null, 				// The pagination url (pagination url, without number)
		startPage: 1, 			// The start page
		pageCount: 2,			// The total number of pages
		watchElement: false,	// The element to watch. If it enters viewport, next page is loaded.
		watchInterval: 500,		// The ms time to watch element.
		targetBlock: false,		// The block to use for the data
		targetElement: false,	// The target element to use (where the paginated html should be appended)
		useMoreButton: null		// If set, watchElement will be ignored and a click event on useMoreButton will be watched instead. This should be a selector.
	};
	var _myOptions;

    /** Private properties **/
	var _readyFunctions = [];	// An array of ready functions added
	var _loading = false;		// True if currently loading
	var _target;				// The target element to use (where the paginated html should be appended)
	var _currentPage = 1;		// The current page
	var _watchElement;			// The hidden watch element that is used to track when we reach the bottom of the list

    /** Private API **/

    /**
     * Object init
     */
    var init = function(options){
		// Merge default options
		_myOptions = $.extend(true, {}, _defaultOptions, options);

		// Start parsing options
		_currentPage = parseInt(_myOptions.startPage);

		// My target element
		_target = $(_myOptions.targetElement);

		// Create my bottom element (if not specified in options) and make invisible
		if(!_myOptions.watchElement){
			_watchElement = $('<div class="ofw-watchelement '+_myOptions.model+'"></div>');
			_target.append(_watchElement);
		}
		else _watchElement = $(_myOptions.watchElement);
		_watchElement.css('visibility', 'hidden');

		// If button is set, make it invisible if no additional pages
		if(_myOptions.useMoreButton != null && _myOptions.startPage >= _myOptions.pageCount){
			$(_myOptions.useMoreButton).hide();
		}

		// Set watchElement interval or use button
		if(_myOptions.useMoreButton == null){
			// Check in intervals to see if element is in viewport
			setInterval(function(){
				 if(!_loading && ofw.inviewport(_watchElement)) api.next();
			}, _myOptions.watchInterval);
		}
		else{
			$(_myOptions.useMoreButton).click(api.next);
		}
    };

    /** Public API **/
    var api = {

		/**
		 * Load up the next items.
		 */
		next: function(){

			// Check if loading
			if(_loading) return false;

			// Check if already at max page count
			if(_currentPage >= _myOptions.pageCount) return false;

			// Load page
			ofw.log("Loading next page. Current "+_currentPage);
			_loading = true;
			_currentPage += 1;

			// Set as visible
			_watchElement.css('visibility', 'visible');

			// Get next data
			ofw.ajax.get(_myOptions.url+_currentPage+'&zaj_pushstate_block='+_myOptions.targetBlock, function(res){
				_watchElement.before(res).css('visibility', 'hidden').css('width', '100%');
				_loading = false;
				ofw.log("Done loading, running callbacks.");

				// Check if already at max page count, if so hide button
				if(_currentPage >= _myOptions.pageCount){
					if(_myOptions.useMoreButton != null) $(_myOptions.useMoreButton).hide();
				}

				// Call all of my readyFunctions
				$.each(_readyFunctions, function(i, func){ func(_myOptions.model, _currentPage); });
			});
			return true;
		},

		/**
		 * Adds a function that is to be executed after pagination completes.
		 * @param {function} func The function to be executed. You can add several.
		 */
		ready: function(func){
			_readyFunctions.push(func);
		}

	};

    /** Perform private initialization **/
    init(options);

    // Return my external API
    return api;
};