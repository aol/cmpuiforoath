/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import 'style-loader!./cmpui.less';

// main
import 'style-loader!./main/main.less';
import mainCtrl from './main/main';
import mainView from 'html-loader?minimize=true!./main/main.html';

// purposes
import purposesCtrl from './purposes/purposes';
import purposesView from 'html-loader?minimize=true!./purposes/purposes.html';
import 'style-loader!./purposes/purposes.less';

// vendors
import vendorsCtrl from './vendors/vendors';
import vendorsView from 'html-loader?minimize=true!./vendors/vendors.html';
import 'style-loader!./vendors/vendors.less';

// confirm
import confirmCtrl from './confirm/confirm';
import confirmView from 'html-loader?minimize=true!./confirm/confirm.html';
import 'style-loader!./confirm/confirm.less';

// models
import consentData from './consentData';
import vendorListService from './vendorListService';

// utilities
import utils from './utils';

// publisher configurations
import publisherConfig from './publisherConfig';

window.__cmpui = new function (win) {
    if (win.__cmpui) {
        return win.__cmpui;
    }

    // When this UI is rendered as a standalone page, a redirect url
    // will be passed as a query parameter and stored in this variable
    var redirectUrl;

    // These views represent the 4 screens in the consent UI flow
    var views = {
        main: {html: mainView, ctrl: mainCtrl},
        purposes: {html: purposesView, ctrl: purposesCtrl},
        vendors: {html: vendorsView, ctrl: vendorsCtrl},
        confirm: {html: confirmView, ctrl: confirmCtrl}
    };

    var curViewName = null;
    var prevViewName = null;

    // When this UI is rendered in an iframe, a __cmpUICall message will
    // be sent to this frame via postMessage with a "renderConsents" command.
    // The message data will include a callId property, which is stored
    // in this variable.  It will be used when sending the __cmpUIReturn
    // message to the parent frame after the user has saved their consent
    var renderConsentUICallId = null;

    // The postMessage data may be in either a JSON string or an object.
    // The response to the parent frame should be in the same format as
    // the format of the message sent to this frame
    var postMessageStringFormat = false;

    var renderConsentUI = function (siteDomain, skipInitialScreen) {
        // fetch the vendor list data
        vendorListService.getVendorList(siteDomain, function (vendorList, success) {
            // API failed, bail out
            if (!success) {
                utils.logMessage('error', 'CMP Error: failed to load vendor list for GDPR consent');
                dismissConsentUi(false);
                return;
            }

            // find the highest vendor id in the vendor list and pass it to the
            // consentData model for use when encoding the consent string
            var maxVendorId = 0;
            for (var v = 0; v < vendorList.vendors.length; v++) {
                if (vendorList.vendors[v].id > maxVendorId) {
                    maxVendorId = vendorList.vendors[v].id;
                }
            }
            consentData.setMaxVendorId(maxVendorId);
            consentData.setMaxPurposeId(vendorList.purposes.length);

            // set vendor list version for use when encoding the consent string
            consentData.setVendorListVersion(vendorList.vendorListVersion);

            // pass the purposes and vendors to the relevant controllers
            purposesCtrl.setPurposes(vendorList.purposes);
            vendorsCtrl.setVendors(vendorList.vendors);

            // render
            renderView(skipInitialScreen ? 'purposes' : 'main');
        });
    };

    // check if the redirect_url query parameter (when rendered on a standalone
    // page) matches a domain on the whitelist
    var isValidRedirectUrl = function (url) {
        var whitelist = publisherConfig.whitelistedRedirectDomains;
        for (var d in publisherConfig.whitelistedRedirectDomains) {
            if (url.split(/[\?#]/)[0].indexOf(whitelist[d]) >= 0) {
                return true;
            }
        }
        return false;
    };

    // initialisation logic
    var init = function () {
        // check for redirect_url query parameter
        var queryParams = utils.parseQuery(win.location.search);
        redirectUrl = decodeURIComponent(queryParams.redirect_url || '');

        if (redirectUrl) {
            if (isValidRedirectUrl(redirectUrl)) {
                // check for an EuConsent query parameter.  If it exists, then the
                // user has previously provided their consents.  This scenario occurs
                // when the user chooses to update or revoke their existing consents.
                // Typically this option is available from the publishers privacy page.
                var consentString = queryParams.EuConsent;
                if (consentString) {
                    // Update the consentData model with the existing consent string
                    consentData.setAll(consentString);
                }

                // if redirect_url exists on the page, then this is running as a
                // standalone page, don't wait for a post message.  Just render
                // the UI immediately
                renderConsentUI(null, !!consentString);
            } else {
                utils.logMessage('error', 'CMP Error: The redirect_url is either missing or not whitelisted.');
            }
            return;
        }

        // when rendering in an iframe, wait for a __cmpUICall message to
        // render the UI
        utils.addWindowMessageListener(win, function (event) {
            var msgIsString = typeof event.data === "string";
            var json = utils.parsePostMessageData(event.data);

            // save the message format for use when posting a response
            // back to the parent frame.  The incoming format should match
            // the response format
            postMessageStringFormat = msgIsString;

            var cmpUiCall = json.__cmpUICall;
            if (cmpUiCall) {
                var command = cmpUiCall.command;
                var parameter = cmpUiCall.parameter;
                var callId = cmpUiCall.callId;
                if (command === 'renderConsentUI') {
                    // store the callId for use when sending the __cmpUIReturn message
                    renderConsentUICallId = callId;

                    // check for a parameter.EuConsent value.  If it exists, then the
                    // user has previously provided their consents.  This scenario occurs
                    // when the user chooses to update or revoke their existing consents.
                    // Typically this option is avaiable from the publishers privacy page.
                    var consentString = parameter.consentString;
                    if (consentString) {
                        consentData.setAll(consentString);
                    }

                    // render the UI
                    renderConsentUI(parameter.siteDomain, !!consentString);
                }
            }
        });
    };

    /**
     * Dismiss the consent UI.  This is called when the user has saved their
     * consent preferences.
     */
    var dismissConsentUi = function (success) {
        // generate the consent string
        var consentString = success ? consentData.build() : undefined;

        if (redirectUrl) {
            // if redirectUrl, then redirect back to the original page
            // passing the consent string in query parameters
            var urlHasParams = redirectUrl.indexOf('?') > -1;
            var queryParamStr = urlHasParams ? '&' : '?';
            queryParamStr += 'EuConsent=' + encodeURIComponent(consentString);

            win.location.replace(redirectUrl + queryParamStr);
            return;
        }

        // destroy the DOM elements
        var consentUi = document.getElementsByClassName('cmp-body')[0];
        consentUi.innerHTML = '';

        // construct the message data to post to the parent frame
        var responseObj = {
            __cmpUIReturn: {
                returnValue: consentString,
                success: success,
                callId: renderConsentUICallId
            }
        };

        // post the message back to the parent frame.  This provides the
        // consent string to the CMP JS
        win.parent.postMessage(postMessageStringFormat ?
            JSON.stringify(responseObj) : responseObj, '*');
    };

    /**
     * renders one of the views in the consent flow
     *
     * @param {string} viewName - "main", "purposes", "vendors", or "confirm"
     */
    var renderView = function (viewName) {
        var consentUi = document.getElementsByClassName('cmp-body')[0];
        consentUi.innerHTML = views[viewName].html;

        if (views[viewName].ctrl.render) {
            views[viewName].ctrl.render(consentData);
        }
        prevViewName = curViewName;
        curViewName = viewName;
    };

    /**
     * Switches to previous view
     */
    var renderPreviousView = function () {
        renderView(prevViewName);
    };

    /**
     * User has saved their preferences, dismiss the UI
     */
    var save = function () {
        dismissConsentUi(true);
    };

    // execute initialisation logic
    init();

    // api methods
    return function (cmd) {
        return {
            renderView: renderView,
            renderPreviousView: renderPreviousView,
            save: save
        }[cmd].apply(null, [].slice.call(arguments, 1));
    };
}(window);
