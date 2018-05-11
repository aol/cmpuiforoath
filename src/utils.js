/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

/**
 * General utility methods
 */
var utils = (function () {
    /**
     * Converts query string into object of key/values
     *
     * @param queryString
     * @returns {object}
     */
    var parseQuery = function (queryString) {
        var query = {};

        // strip out leading "?"
        if (queryString[0] === '?') {
            queryString = queryString.substring(1);
        }

        var pairs = queryString.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (pair[0]) {
                query[pair[0]] = pair[1];
            }
        }
        return query;
    };

    /**
     * Browser compatible method for logging messages.  Some browsers (IE)
     * do not support console messages at all times
     *
     * @param {string} type - "log", "error", or "info"
     * @param {*} value - value to
     */
    var logMessage = function (type, value) {
        if (console && (typeof console[type] === 'function')) {
            console[type](value);
        }
    };

    /**
     * Browser compatible method for listening for message events
     *
     * @param {window} win
     * @param {function} handler
     */
    var addWindowMessageListener = function (win, handler) {
        win = win || window;
        if (win.addEventListener) {
            win.addEventListener('message', handler, false);
        } else {
            win.attachEvent('onmessage', handler); // for IE
        }
    };

    /**
     * Parses data passed via postMessage calls.
     *
     * @param {string|object} data - json string or object
     * @returns {*}
     */
    var parsePostMessageData = function (data) {
        var json = data;
        if (typeof data === "string") {
            try {
                json = JSON.parse(data);
            } catch (e) {
            }
        }
        return json;
    };

    return {
        parseQuery: parseQuery,
        logMessage: logMessage,
        addWindowMessageListener: addWindowMessageListener,
        parsePostMessageData: parsePostMessageData
    }
})();

export default utils;
