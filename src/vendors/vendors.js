/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import $ from 'jquery';
import uiUtils from '../uiUtils';

var vendorsCtrl = (function (win) {
    var element;
    var vendors = [];
    var consentData;

    var setVendors = function (v) {
        vendors = v;
    };

    var onVendorSelectionChanged = function () {
        var noVendorsSelected = $('.cmp-vendors input[type="checkbox"]:checked').length === 0;
        if (noVendorsSelected) {
            element.addClass('no-selections');
        } else {
            element.removeClass('no-selections');
        }
    };

    var saveVendors = function() {
        var vendorItems = $('.cmp-vendors input[type="checkbox"]');
        vendorItems.each(function() {
            if (this.name === 'vendorId') {
                consentData.setVendorConsent(this.checked, this.value);
            }
        });
    };

    var createVendorItemHtml = function (vendor, checked) {
        return uiUtils.createCheckboxWithLink('vendorId', vendor.id, vendor.name, checked, 'Privacy Policy', vendor.policyUrl);
    };

    var render = function (models) {
        consentData = models;

        element = $('.cmp-vendors');

        // render vendor list
        var listEl = $('.cmp-vendors .cmp-consent-list');
        var html = '';
        for (var i = 0; i < vendors.length; i++) {
            var checked = consentData.getVendorConsent(vendors[i].id);
            html += createVendorItemHtml(vendors[i], checked);
        }
        listEl.html(html);

        // listen for change events
        var vendorItems = $('.cmp-vendors input[type="checkbox"]');
        vendorItems.change(onVendorSelectionChanged);
        onVendorSelectionChanged();

        // "accept all" button handler
        $('.cmp-vendors .cmp-btn-acceptall').click(function() {
            consentData.setAllVendorConsents(true);
            win.__cmpui('save');
        });

        // "accept all" button handler for 2nd button
        $('.cmp-vendors .cmp-btn-acceptall-alt').click(function() {
            consentData.setAllVendorConsents(true);
            win.__cmpui('save');
        });

        // "save" button handler
        $('.cmp-vendors .cmp-btn-save').click(function() {
            saveVendors();
            win.__cmpui('save');
        });

        // "reject all" button handler
        $('.cmp-vendors .cmp-btn-rejectall').click(function () {
            saveVendors();
            __cmpui('renderView', 'confirm');
        });

        // "back to purposes" button handler
        $('.cmp-vendors .cmp-btn-back').click(function () {
            saveVendors();
            __cmpui('renderView', 'purposes');
        });
    };

    return {
        setVendors: setVendors,
        render: render
    };
})(window);

export default vendorsCtrl;