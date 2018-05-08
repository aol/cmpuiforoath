/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import 'style-loader!./cmpui.less';
import 'style-loader!./main/main.less';
import 'style-loader!./purposes/purposes.less';
import 'style-loader!./vendors/vendors.less';
import 'style-loader!./confirm/confirm.less';

import mainView from 'html-loader?minimize=true!./main/main.html';
import purposesView from 'html-loader?minimize=true!./purposes/purposes.html';
import vendorsView from 'html-loader?minimize=true!./vendors/vendors.html';
import confirmView from 'html-loader?minimize=true!./confirm/confirm.html';

import mainCtrl from './main/main';
import purposesCtrl from './purposes/purposes';
import vendorsCtrl from './vendors/vendors';
import confirmCtrl from './confirm/confirm';

import consentData from '../consentData';
import vendorListService from '../vendorListService';

import utils from '../utils';

window.__cmpui = new function (win) {
    if (win.__cmpui) {
        return win.__cmpui;
    }

    // When this UI is rendered as a standalone page, a redirect url
    // will be passed as a query paramter and stored in this variable
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
    // be send to this frame via postMessage with a "renderConsents" commanmd.
    // The message data will include a callId property, which is stored
    // in this variable.  It will be used when sending the __cmpUIReturn
    // message to the parent frame after the user has saved their consent
    var renderConsentUICallId = null;

    // The postMessage data may be in either a JSON string or an object.
    // The response to the parent frame should be in the same format as
    // the format of the message send to this frame
    var postMessageStringFormat = false;

    // TODO: This should be updated to provide a publisher specific whitelist.
    // This whitelist is intended to prevent an attack on an open redirect
    // vulnerability, in the scenario where the CMP JS redirects to this
    // UI as a standalone page (as opposed to loading it in an iframe)
    // This whitelist should include publisher domains that are integrated
    // with the CMP
    var WHITELISTED_REDIRECT_DOMAINS = [
        'oath.com',
        'aol.com',
        'yahoo.com'
    ];

    var renderConsentUI = function (skipInitialScreen) {
        // fetch the vendor list data
        vendorListService.getVendorList(null, function (vendorList, success) {
            // API failed, bail out
            if (!success) {
                utils.logMessage('error', 'failed to load vendor list for GDPR consent');
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
            consentData.setVendorListVersion(vendorList.vendorListVersion);

            // pass the purposes and vendors to the relevant controllers
            purposesCtrl.setPurposes(vendorList.purposes);
            vendorsCtrl.setVendors(vendorList.vendors);

            if (skipInitialScreen) {
                renderView('purposes');
            } else {
                // render the initial view
                renderView('main');
            }
        });
    };

    // check if the redirect_url query parameter (when rendered on a standalone
    // page) matches a domain on the whitelist
    var isValidRedirectUrl = function (url) {
        for (var d in WHITELISTED_REDIRECT_DOMAINS) {
            if (url.split(/[\?#]/)[0].indexOf(WHITELISTED_REDIRECT_DOMAINS[d]) >= 0) {
                return true;
            }
        }
        return false;
    };

    // initialization logic
    var init = function () {
        // check for redirect_url query parameter
        var queryParams = utils.parseQuery(window.location.search);
        redirectUrl = decodeURIComponent(queryParams.redirect_url || '');

        if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
            // check for an EuConsent query parameter.  If it exists, then the
            // user has previously provided their consents.  This scenario occurs
            // when the user chooses to update or revoke their existing consents.
            // Typically this option is avaiable from the publishers privacy page.
            var consentString = queryParams.EuConsent;
            if (consentString) {
                // Update the consentData model with the existing consent string
                consentData.setAll(consentString);
            }

            // if redirect_url exists on the page, then this is running as a
            // standalone page, don't wait for a post message.  Just render
            // the UI immediately
            renderConsentUI(!!consentString);
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
                    renderConsentUI(!!consentString);
                }
            }
        });
    };

    // dismiss the consent UI.  This is called once the user has saved their
    // consent preferences.
    var dismissConsentUi = function (success) {
        // generate the consent string
        var consentString = success ? consentData.build() : undefined;

        if (redirectUrl) {
            // if redirectUrl, then redirect back to the original page
            // passing the consent string in query parameters
            var urlHasParams = redirectUrl.indexOf('?') > -1;
            var queryParamStr = urlHasParams ? '&' : '?';
            queryParamStr += 'EuConsent=' + encodeURIComponent(consentString);

            window.location.replace(redirectUrl + queryParamStr);
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
        window.parent.postMessage(postMessageStringFormat ?
            JSON.stringify(responseObj) : responseObj, '*');
    };

    // renders one of the views in the consent flow
    var renderView = function (viewName) {
        var consentUi = document.getElementsByClassName('cmp-body')[0];

        consentUi.innerHTML = views[viewName].html;

        if (views[viewName].ctrl.render) {
            views[viewName].ctrl.render(consentData);
        }
        prevViewName = curViewName;
        curViewName = viewName;
    };

    var renderPreviousView = function () {
        renderView(prevViewName);
    };

    var save = function () {
        dismissConsentUi(true);
    };

    init();

    // api methods
    var api = function (cmd) {
        return {
            renderView: renderView,
            renderPreviousView: renderPreviousView,
            save: save
        }[cmd].apply(null, [].slice.call(arguments, 1));
    };

    return api;
}(window);
