/**
 * Popup campaign object
 **/
define('system/js/ui/popup-campaign', ["../ofw-jquery"], function() {

    return function PopupCampaign(options){
        var popupCampaign = this;
        /** Options **/
        var defaultOptions = {
            url: null,     // The controller that displays the popup HTML (in ofw.alert)
            selector: null,       // OR you can use this instead of url to simple removeClass('hide') on the popup campaign div
            timeDelay: 25000,                   // 25 seconds delay before the popup is shown. You should use localStorage for the start time, so that the timer is preserved across page views.
            cookieName: 'popupcampaign',        // Optional, defaults to 'popupcampaign' - The name of the cookie (or localstorage key?) that stores the number of times this user has seen this item. Only needed if you have several per page.
            cookieExpiryDays: 90,               // Optional, defaults to 90 - The number of days after which the cookie / localstorage expires.
            showCount: 1,                       // Optional, defaults to 1 - The number of times this visitor sees the popup campaign before it is no longer shown again (until the cookie expires).
            showAgainAfterDays: 3,              // Optional, defaults to 3 - The number of days after which a visitor should again see the popup (only relevant if showCount > 1)
            openButton: null,      // Optional, defaults to null - If set, a click event will be added to this selector that triggers openPopup()
            closeButton: null,      // Optional, defaults to null - If set, a click event will be added to this selector that triggers closePopup()
            handleUrlResponse: null, // Optional, defaults to null - If set, the response from the url option will be passed to this callback function, along with the campaign as second parameter.
                                     // ...if null (the default), the response from url will be ofw.alert()-ed.
            onOpenPopup: null, // Optional, defaults to empty function - Callback called after the popup is openned.
            onClosePopup: null // Optional, defaults to empty function - Callback called after the popup is closed.
        };

        var myOptions = {};

        /** Private properties **/
        var closeCount = 0;
        var popupEnabled = true;
        var popupTimeout = null;

        /**
         * Object init
         */
        var init = function(){
            // Merge default options
            myOptions = $.extend(true, {}, defaultOptions, options);

            // Set current close count
            if(checkCookie(myOptions.cookieName+'_closecount')){
                closeCount = checkCookie(myOptions.cookieName+'_closecount');
            }

            // Open popup after seconds defined in timeDelay parameter
            if(myOptions.timeDelay != null){
                popupTimeout = setTimeout(function(){
                    createPopup();
                }, myOptions.timeDelay);
            }

            // Initialize buttons
            initButtons();
        };

        /**
         * Create and open popup
         * @returns {*}
         */
        var createPopup = function(){
            // delete timeout
            if(popupTimeout != null) clearTimeout(popupTimeout);
            // check cookies, localstorage, showCount
            if(!isPopupReadyForNextShow()) return;
            // popup campaign called without a controller
            if(myOptions.url == null && myOptions.selector == null){
                return console.error('Popup campaign called without url and selector. Check the documentation and define the url or selector parameter.');
            }

            if(myOptions.onOpenPopup != null){
                myOptions.onOpenPopup(popupCampaign);
            }

            // a controller was defined
            if(myOptions.url != null){
                ofw.ajax.post(myOptions.url, function(r){
                    if(myOptions.handleUrlResponse == null){
                        ofw.alert(r, function(){
                            onPopupClose();
                        });
                        initButtons();
                    }
                    else{
                        if(typeof(myOptions.handleUrlResponse) != 'function'){
                            myOptions.handleUrlResponse = new Function(myOptions.handleUrlResponse);
                        }
                        myOptions.handleUrlResponse(r);

                        // Init buttons
                        initButtons();
                    }
                });
            }

            // a selector was defined
            if(myOptions.url == null && myOptions.selector != null){
                $(myOptions.selector).removeClass('hide');
            }

            // Init buttons
            initButtons();

        };

		/**
		 * Initialize my buttons.
         */
        var initButtons = function(){
            // If openButton is set, open popup on button click
            $(myOptions.openButton).off('click').on('click', function(e){
               createPopup();
            });

            // If closeButton is set, hide popup on button click
            $(myOptions.closeButton).off('click').on('click', function(e){
                closePopup();
            });
        };

        /**
         * Check to see if the popup is ready to be shown.
         * @returns boolean true if everything is OK
         */
        var isPopupReadyForNextShow = function(){

            // If popup is disabled, then we know its not
            if(!popupEnabled) return false;

            // Now let's check based on rules
            var now = new Date();
            now = Math.round(now.getTime()/1000);

            var showCount = getShowCount();
            var showTime = getShowTime();

            return (
                // If the show count is less than the max
                showCount < myOptions.showCount &&
                // If the last shown time is at least showAgainAfterDays away
                showTime - myOptions.cookieExpiryDays*24*60*60 <= now - myOptions.showAgainAfterDays*24*60*60
               );
        };

		/**
		 * Get the last show time.
         */
        var getShowTime = function(){
            var cookieSet = checkCookie(myOptions.cookieName);
            var localStorageSet = checkLocalStorage(myOptions.cookieName);

            if(cookieSet) return cookieSet;
            else if(localStorageSet) return localStorageSet;
            else return 0;
        };

		/**
		 * Get the current show count.
         */
        var getShowCount = function(){
            var showCountCookieCheck = checkCookie(myOptions.cookieName + '_closecount');
            var showCountStorageSet = checkLocalStorage(myOptions.cookieName + '_closecount');

            if(showCountCookieCheck) return showCountCookieCheck;
            else if(showCountStorageSet) return showCountStorageSet;
            else return 0;
        };

        /**
         * Check cookie
         * @param name String cookie name
         * @returns {boolean}
         */
        var checkCookie = function(name){
            // get all cookies
            var cookies = document.cookie.split(';');
            for(var i = 0; i <cookies.length; i++) {
                var c = cookies[i];
                while (c.charAt(0)==' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    var cookieData = c.split('=');
                    // cookie found
                    if(cookieData[0] == name) {
                        // return cookie value
                        return cookieData[1];
                    }
                }
            }
            return false;
        };

        /**
         * Check localstorage
         */
        var checkLocalStorage = function(name){
            if(window.localStorage){
                var now = new Date();
                var item = localStorage.getItem(name);

                // item not found
                if(typeof(item) == 'undefined' || item == null){
                    return false;
                }
                // item found, but time has expired
                if(item < (now.getTime()/1000) && name == myOptions.cookieName){
                    // delete item and return false
                    deleteLocalStorage();
                    return false;
                }
                // item found with valid time
                return item;
            }
            return false;
        };

        /**
         * Delete item from localstorage
         */
        var deleteLocalStorage = function(){
            if(window.localStorage){
                if(localStorage.getItem(myOptions.cookieName)){
                    localStorage.removeItem(myOptions.cookieName);
                }

                if(localStorage.getItem(myOptions.cookieName+'_closecount')){
                    localStorage.removeItem(myOptions.cookieName+'_closecount');
                }
            }
        };

        /**
         * Delete cookie
         */
        var deleteCookie = function(){
           document.cookie = myOptions.cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
           document.cookie = myOptions.cookieName + '_closecount=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };

        /**
         * Close popup
         */
        var closePopup = function(){
            // Hide
            if(myOptions.selector) $(myOptions.selector).addClass('hide');
            onPopupClose();
        };

        /**
         * Save a popup name to cookie and localstorage
         */
        var onPopupClose = function(){
            // increment closecount and set
            closeCount++;
            setCloseCount(closeCount);

            // check if there is a callback function
            if(myOptions.onClosePopup != null){
                myOptions.onClosePopup(popupCampaign);
            }

        };

        /**
         * Set how many times the visitor has seen the popup.
         * @param closeCount int
         */
        var setCloseCount = function(closeCount){
            // get expiry date
            var expiry_date = new Date();
            expiry_date = Math.round((expiry_date.getTime()/1000) + myOptions.cookieExpiryDays*24*60*60);

            // set cookie
            document.cookie = myOptions.cookieName+"="+expiry_date+"; expires="+expiry_date+"; path=/";
            document.cookie = myOptions.cookieName+"_closecount="+closeCount+"; expires="+expiry_date+"; path=/";
            if(window.localStorage){
                localStorage.setItem(myOptions.cookieName, expiry_date);
                localStorage.setItem(myOptions.cookieName+'_closecount', closeCount);
            }
        };


        /** Public API **/
        var api = {

            /**
             * Public initialization method.
             **/
            start: function(){
                init();
            },

            /**
             * Enable popup campaigns
             */
            enable: function(){
                popupEnabled = true;
            },

            /**
             * Disable popup campaigns
             */
            disable: function(){
                popupEnabled = false;
            },

            /**
             * Set how many times the visitor should see the popup
             * @param closeCount int
             */
            setCloseCount: function(closeCount){
                setCloseCount(closeCount);
            },

            /**
             * Add one to the closed count (but without actually closing).
             * @param closeCount int
             */
            incrementCloseCount: function(){

            },

            /**
             * Reset campaign (restart the count)
             */
            reset: function(){
                deleteLocalStorage();
                deleteCookie();
            },

            /**
             * Close popup
             */
            closePopup: function(){
                closePopup();
            },

            /**
             * Open popup
             */
            openPopup: function(){
                createPopup();
            }

        };

        // Return my external API
        return api;
    };

});
