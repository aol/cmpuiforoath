/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import utils from './utils';
import $ from 'jquery';

var vendorListAService = (function () {
    var GLOBAL_VL_API_URL = 'https://service.cmp.oath.com/cmp/v0/vendor_list/global';
    var PUBVENDORS_PATH = '/pubvendors.json';

    var cachedVLData = {};
    var gvlCallbacks = [];
    var gvlVendorMap = {};
    var pubVendorsJsonExists;

    /**
     * Fetches IAB global vendor list from Oath's CMP API
     *
     * @param {function} callback - function(vendorList, success)
     */
    var getGlobalVendorList = function (callback) {
        if (gvlCallbacks.length) {
            // an existing request is pending, add the callback to the list
            gvlCallbacks.push(callback);
            return;
        }

        if (cachedVLData.glboal) {
            // found global vendor list in cache
            callback(cachedVLData.global);
            return;
        }

        gvlCallbacks.push(callback);
        // fetch global vendor list data
        $.getJSON(GLOBAL_VL_API_URL)
            .done(function (gvl) {
                cachedVLData.glboal = gvl;

                // build gvl vendor map
                for (var v = 0; v < gvl.vendors.length; v++) {
                    var vendor = gvl.vendors[v];
                    gvlVendorMap[vendor.id] = vendor;
                }

                // pass vendor list to callbacks
                while (gvlCallbacks.length) {
                    gvlCallbacks.shift()(cachedVLData.glboal, true);
                }
            })
            .fail(function (response) {
                // pass failure response to callbacks
                while (gvlCallbacks.length) {
                    gvlCallbacks.shift()(undefined, false);
                }
            });
    };

    /**
     * Fetches pubvendors.json from well-known location on current site.
     *
     * @param {string} siteDomain - domain on which to request pubvendors.json file
     * @param {Function} callback - function(pubvendors, success)
     */
    var getPubVendorsJSON = function (siteDomain, callback) {
        if (pubVendorsJsonExists === false) {
            // we have already determined pubvendors.json does not exist
            callback(undefined, false);
            return;
        }

        $.getJSON((siteDomain || '') + PUBVENDORS_PATH)
            .done(function (response) {
                pubVendorsJsonExists = true;
                callback(response, true);
            })
            .fail(function (response) {
                pubVendorsJsonExists = false;
                callback(response, false);
            });
    };

    /**
     * Combine the global vendor list with the pubvendors.json to create
     * a publisher specific vendor list.  The resulting list contains only
     * the vendors defined in the pubvendors.json file.
     *
     * @param {object} gvl - global vendor list
     * @param {object} pvl = publisher vendor list
     * @returns {object} merged vendor list object
     */
    var mergeVendorListData = function (gvl, pvl) {
        var vendors = [];
        for (var v = 0; v < pvl.vendors.length; v++) {
            var id = pvl.vendors[v].id;
            if (gvlVendorMap[id]) {
                vendors.push(gvlVendorMap[id]);
            } else {
                utils.logMessage('error', 'CMP Error: pubvendors.json references vendor id ' +
                    id + ' which does not exist in the Global Vendor List');
            }
        }
        var mergedVL = JSON.parse(JSON.stringify(gvl));
        mergedVL.vendors = vendors;
        return mergedVL;
    };

    /**
     * Fetch global vendor list and pubvendors.json, merge
     * the data, and return the result in the callback
     *
     * @param {string?} siteDomain
     * @param {Function} callback - callback(vendorList, success}
     */
    var getVendorList = function (siteDomain, callback) {
        getGlobalVendorList(function (gvl, success) {
            if (success) {
                getPubVendorsJSON(siteDomain, function (pvl, success) {
                    if (success) {
                        // merge gvl and pvl data and return it
                        var mergedData = mergeVendorListData(gvl, pvl);
                        callback(mergedData, !!mergedData);
                    } else {
                        // failed to get pubvendors.json.  It either doesn't exist or is
                        // not properly formatted. Return gvl
                        callback(gvl, true);
                    }
                });
            } else {
                // failed to load gvl
                callback(undefined, false);
            }
        });
    };

    return {
        getVendorList: getVendorList
    };
})();

export default vendorListAService;