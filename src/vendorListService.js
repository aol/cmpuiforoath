/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import utils from './utils';

var vendorListService = (function () {
    // TODO: This should be changed to be a publisher specific API
    var GET_VENDOR_LIST_API = 'https://service.cmp.oath.com/cmp/v0/vendor_list/global';

    var cachedVendorLists = {};
    var vendorListCallbacks = {};

    /**
     * Make call to Vendor List API
     * @param {string} apiUrl - fully qualified API URL
     * @param {object} params - parameters to pass to API
     * @param {Function} callback - callback(response, success)
     */
    var callVendorListAPI = function (apiUrl, params, callback) {
        var paramsStr = '';
        if (params) {
            var paramsArr = [];
            for (var key in params) {
                paramsArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
            paramsStr = '?' + paramsArr.join('&');
        }

        utils.ajax(apiUrl + paramsStr, function (response, status) {
            if (status === 200) {
                callback(response, true);
            } else {
                callback(undefined, false);
            }
        });
    };

    /**
     * Get vendor list from CMP Service API
     * @param {number|string} version - vendor list version number or "LATEST"
     * @param {Function} callback - callback(object: VendorList,
     *      success: boolean}
     */
    var getVendorList = function (version, callback) {
        if (cachedVendorLists[version]) {
            callback(cachedVendorLists[version], true);
        } else if (vendorListCallbacks[version] && vendorListCallbacks[version].length) {
            vendorListCallbacks[version].push(callback);
        } else {
            vendorListCallbacks[version] = [callback];
            var params = utils.isNumeric(version) ? {version: version} : {};
            callVendorListAPI(GET_VENDOR_LIST_API, params, function (response, success) {
                cachedVendorLists[version] = response;
                while (vendorListCallbacks[version].length) {
                    vendorListCallbacks[version].shift()(cachedVendorLists[version], success);
                }
            });
        }
    };

    var api = {
        getVendorList: getVendorList
    };
    return api;
})();

export default vendorListService;