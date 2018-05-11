/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import $ from 'jquery';
import uiUtils from '../uiUtils';

var purposesCtrl = (function () {
    var element;
    var purposes = [];
    var consentData;

    var setPurposes = function (p) {
        purposes = p;
    };

    var onPurposeSelectionChanged = function () {
        var noPurposesSelected = $('.cmp-purposes input[type="checkbox"]:checked').length === 0;
        if (noPurposesSelected) {
            element.addClass('no-selections');
        } else {
            element.removeClass('no-selections');
        }
    };

    var savePurposes = function () {
        var purposeItems = $('.cmp-purposes input[type="checkbox"]');
        purposeItems.each(function () {
            if (this.name === 'purposeId') {
                consentData.setPurposeConsent(this.checked, this.value);
            }
        });
    };

    var createPurposeItemHtml = function (purpose, checked) {
        return uiUtils.createCheckboxWithTooltip('purposeId', purpose.id, purpose.name, checked, purpose.description);
    };

    var render = function (models) {
        consentData = models;

        element = $('.cmp-purposes');

        // render purpose list
        var listEl = $('.cmp-purposes .cmp-consent-list');
        var html = '';
        for (var i = 0; i < purposes.length; i++) {
            var checked = consentData.getPurposeConsent(purposes[i].id);
            html += createPurposeItemHtml(purposes[i], checked);
        }
        listEl.html(html);

        // listen for change events
        var purposeItems = $('.cmp-purposes input[type="checkbox"]');
        purposeItems.change(onPurposeSelectionChanged);
        onPurposeSelectionChanged();

        // "accept all" button handler
        $('.cmp-purposes .cmp-btn-acceptall').click(function () {
            consentData.setAllPurposeConsents(true);
            __cmpui('renderView', 'vendors');
        });

        // "accept all" button handler for 2nd button
        $('.cmp-purposes .cmp-btn-acceptall-alt').click(function () {
            consentData.setAllPurposeConsents(true);
            __cmpui('renderView', 'vendors');
        });

        // "save" button handler
        $('.cmp-purposes .cmp-btn-save').click(function () {
            savePurposes();
            __cmpui('renderView', 'vendors');
        });

        // "reject all" button handler
        $('.cmp-purposes .cmp-btn-rejectall').click(function () {
            savePurposes();
            __cmpui('renderView', 'confirm');
        });
    };

    return {
        setPurposes: setPurposes,
        render: render
    };
})();

export default purposesCtrl;