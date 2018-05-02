/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

import Handlebars from 'handlebars';
import 'secure-handlebars';

var uiUtils = (function () {

    var createCheckboxWithTooltip = function (name, value, label, checked, tooltip) {
        var html = [
            '<div class="form-check">',
            '    <input type="checkbox" class="form-check-input" id="{{id}}" name="{{name}}" value="{{value}}" {{checked}}>',
            '    <label class="form-check-label" for="{{id}}">{{label}}</label>',
            '    <div class="cmp-tooltip-icon" title="{{tooltip}}"></div>',
            '</div>']
            .join('');
        var data = {
            id: name + '_' + value,
            name: name,
            value: value,
            label: label,
            checked: checked ? 'checked' : '',
            tooltip: tooltip
        };

        return Handlebars.compile(html)(data);
    };

    var createCheckboxWithLink = function (name, value, label, checked, linkName, linkUrl) {
        var html = [
            '<div class="form-check">',
            '    <input type="checkbox" class="form-check-input" id="{{id}}" name="{{name}}" value="{{value}}" {{checked}}>',
            '    <label class="form-check-label cmp-label-width-medium" for="{{id}}">{{label}}</label>',
            '    <a href="{{linkUrl}}" target="_blank">{{linkName}}</a>',
            '</div>']
            .join('');
        var data = {
            id: name + '_' + value,
            name: name,
            value: value,
            label: label,
            checked: checked ? 'checked' : '',
            linkName: linkName,
            linkUrl: linkUrl
        };

        return Handlebars.compile(html)(data);
    };

    return {
        createCheckboxWithTooltip: createCheckboxWithTooltip,
        createCheckboxWithLink: createCheckboxWithLink
    }
})();

export default uiUtils;
