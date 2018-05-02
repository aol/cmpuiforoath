/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

var utils = (function () {
    var parseQuery = function (queryString) {
        var query = {};
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

    var isNumeric = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    var logMessage = function (type, args) {
        if (console && (typeof console[type] === 'function')) {
            console[type](args);
        }
    };

    var addWindowMessageListener = function (win, handler) {
        win = win || window;
        if (win.addEventListener) {
            win.addEventListener('message', handler, false);
        } else {
            win.attachEvent('onmessage', handler); // for IE
        }
    };

    function ajax(url, callback) {
        var xhr = window.XMLHttpRequest ?
            new XMLHttpRequest() :
            new ActiveXObject('Microsoft.XMLHTTP');

        var success = function () {
            var status = typeof xhr.status !== 'undefined' ?
                xhr.status :
                200;
            var response = xhr.responseText;
            try {
                response = status === 200 ?
                    JSON.parse(xhr.responseText) :
                    undefined;
            } catch (e) {
            }

            callback(response, status);
        };

        if (window.XDomainRequest) {
            xhr = new XDomainRequest();
            xhr.onload = success;
        }

        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                success();
            }
        };

        try {
            xhr.open('GET', url, true);
            xhr.send(null);
        }
        catch (e) {
            callback(undefined, 0);
        }
    }

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
        isNumeric: isNumeric,
        logMessage: logMessage,
        addWindowMessageListener: addWindowMessageListener,
        ajax: ajax,
        parsePostMessageData: parsePostMessageData
    }
})();

export default utils;
