/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

var publisherConfig = (function () {
    return {
        // List of domains that have the CMP configured to point to this
        // consent UI.  Only the top level domains are needed.  Sub-domains
        // will be whitelisted as well.
        //
        // example value - ['oath.com', 'aol.com', 'yahoo.com']
        whitelistedRedirectDomains: [
        ]
    };
})();

export default publisherConfig;
