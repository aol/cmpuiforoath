/*
 * Copyright 2018 AppNexus Inc.; Conversant, LLC; DMG Media Limited; Index Exchange, Inc.;
 * MediaMath, Inc.; Oath Inc.; Quantcast Corp.; and, Sizmek, Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in project root for terms.
 */

/**
 * Data model the web-safe base64 encoded IAB consent string.
 * This model provides methods for configuring, encoding and
 * decoding the consent string.
 */
var consentData = (function () {
    var fieldSize = {
        version: 6,
        created: 36,
        lastUpdated: 36,
        cmpId: 12,
        cmpVersion: 12,
        consentScreen: 6,
        consentLanguage: 12,
        vendorListVersion: 12,
        purposesAllowed: 24,
        maxVendorId: 16,
        encodingType: 1,
        numEntries: 12,
        defaultConsent: 1,
        isRange: 1,
        startVendorId: 16,
        endVendorId: 16
    };

    // polyfill for atob and btoa
    var loadBase64Polyfills = function () {
        var object =
            typeof exports !== 'undefined' ? exports :
                typeof self !== 'undefined' ? self : // #8: web workers
                    $.global; // #31: ExtendScript

        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        function InvalidCharacterError(message) {
            this.message = message;
        }

        InvalidCharacterError.prototype = new Error;
        InvalidCharacterError.prototype.name = 'InvalidCharacterError';

        // encoder
        // [https://gist.github.com/999166] by [https://github.com/nignag]
        object.btoa || (
            object.btoa = function (input) {
                var str = String(input);
                for (
                    // initialize result and counter
                    var block, charCode, idx = 0, map = chars, output = '';
                    // if the next str index does not exist:
                    //   change the mapping table to "="
                    //   check if d has no fractional digits
                    str.charAt(idx | 0) || (map = '=', idx % 1);
                    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
                    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
                ) {
                    charCode = str.charCodeAt(idx += 3 / 4);
                    if (charCode > 0xFF) {
                        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
                    }
                    block = block << 8 | charCode;
                }
                return output;
            });

        // decoder
        // [https://gist.github.com/1020396] by [https://github.com/atk]
        object.atob || (
            object.atob = function (input) {
                var str = String(input).replace(/[=]+$/, ''); // #31: ExtendScript bad parse of /=
                if (str.length % 4 == 1) {
                    throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
                }
                for (
                    // initialize result and counters
                    var bc = 0, bs, buffer, idx = 0, output = '';
                    // get next character
                    buffer = str.charAt(idx++);
                    // character found in table? initialize bit storage and add its ascii value;
                    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                        // and if not first of each 4 characters,
                        // convert the first 8 bits to one ascii character
                    bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
                ) {
                    // try to find character in table (0-63, not found => -1)
                    buffer = chars.indexOf(buffer);
                }
                return output;
            });

    };
    loadBase64Polyfills();

    var Data = (function () {
        var COOKIE_VERSION = 1;
        var CMP_ID = 14;
        var CMP_VERSION = 1;
        var LOWERCASE_START = 'a'.charCodeAt(0);
        var BITFIELD_ENCODING = 0;
        var RANGES_ENCODING = 1;
        // some (fifty) zeros to pad with, since IE doesn't have String.repeat()
        // needs at least as many zeros as the largest binary field (36 bits)
        var PAD_ZEROS = '00000000000000000000000000000000000000000000000000';
        var BinaryField = function () {
            this.binaryStr = '';
            this.addField = function (value, bits, fieldName) {
                var binary = (value + 0 || 0).toString(2);
                if (binary.length < bits) {
                    binary = PAD_ZEROS.substr(0, bits - binary.length) + binary;
                } else if (binary.length > bits) {
                    throw new Error('Encountered an overflow setting cookie field ' + fieldName);
                }
                this.binaryStr += binary;
            };
        };

        return {
            build: function (fields) {
                fields['version'] = COOKIE_VERSION;
                fields['cmpId'] = CMP_ID;
                fields['cmpVersion'] = CMP_VERSION;
                var binaryStr = Data.encodeBinary(fields);
                var bytes = Data.binaryToBytes(binaryStr);
                return Data.toWebSafeBase64(bytes);
            },
            setAll: function (value) {
                var bytes = Data.fromWebSafeBase64(value);
                var binary = Data.bytesToBinary(bytes);
                return Data.decodeBinary(binary);
            },
            bytesToBinary: function (bytes) {
                var binaryStr = '';
                // optimized binary conversion & loop
                var nibbles = [
                    '0000',
                    '0001',
                    '0010',
                    '0011',
                    '0100',
                    '0101',
                    '0110',
                    '0111',
                    '1000',
                    '1001',
                    '1010',
                    '1011',
                    '1100',
                    '1101',
                    '1110',
                    '1111'
                ];
                var binary8 = function (byte) {
                    return nibbles[(byte >>> 4) & 0xf] + nibbles[byte & 0xf];
                };
                for (var i = 0; i < bytes.length; i++) {
                    binaryStr += binary8(bytes.charCodeAt(i));
                }
                // object that stores a binary string ('010101'), gets integer fields from the string, and keeps track of the current position
                var binary = {
                    string: binaryStr,
                    atPos: 0,
                    // returns the next integer field of size 'bits', advancing the position 'atPos'
                    getBits: function (bits) {
                        var val = parseInt(this.string.substr(this.atPos, bits), 2);
                        this.atPos += bits;
                        return val;
                    }
                };
                return binary;
            },
            binaryToBytes: function (binary) {
                var bytes = '';
                // pad binary string to multiple of 8 bits
                binary = binary + PAD_ZEROS.substr(0, 7 - (binary.length + 7) % 8);
                for (var i = 0; i < binary.length; i += 8) {
                    bytes += String.fromCharCode(parseInt(binary.substr(i, 8), 2));
                }
                return bytes;
            },
            toWebSafeBase64: function (bytes) {
                return btoa(bytes)
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');
            },
            fromWebSafeBase64: function (base64) {
                return atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
            },
            // converts a number to a two-letter language code ("en")
            languageFromCookieValue: function (number) {
                return (
                    String.fromCharCode((LOWERCASE_START + number / 64) >>> 0) +
                    String.fromCharCode(LOWERCASE_START + number % 64)
                );
            },
            // converts a two-letter language code ("en") to a number
            languageToCookieValue: function (lang) {
                return (lang.charCodeAt(0) - LOWERCASE_START) * 64 + (lang.charCodeAt(1) - LOWERCASE_START);
            },
            dateFromDeciseconds: function (deciseconds) {
                return new Date(deciseconds * 100);
            },
            dateToDeciseconds: function (date) {
                return Math.floor(date.getTime() / 100);
            },
            decodeBinary: function (binary) {
                var version = binary.getBits(fieldSize.version);
                if (version != COOKIE_VERSION) {
                    throw new Error('Cookie version ' + version + ' is not supported');
                }
                var fields = {
                    version: version,
                    created: Data.dateFromDeciseconds(binary.getBits(fieldSize.created)),
                    lastUpdated: Data.dateFromDeciseconds(binary.getBits(fieldSize.lastUpdated)),
                    cmpId: binary.getBits(fieldSize.cmpId),
                    cmpVersion: binary.getBits(fieldSize.cmpVersion),
                    consentScreen: binary.getBits(fieldSize.consentScreen),
                    consentLanguage: Data.languageFromCookieValue(binary.getBits(fieldSize.consentLanguage)),
                    vendorListVersion: binary.getBits(fieldSize.vendorListVersion),
                    purposesAllowed: binary.getBits(fieldSize.purposesAllowed),
                    maxVendorId: binary.getBits(fieldSize.maxVendorId),
                    encodingType: binary.getBits(fieldSize.encodingType)
                };

                var maxVendorId = fields.maxVendorId;
                var vendorConsents = new Array(maxVendorId + 1);
                if (fields.encodingType == BITFIELD_ENCODING) {
                    var bitsLeft = binary.string.length - binary.atPos;
                    if (bitsLeft < maxVendorId) {
                        throw new Error('Incorrect bitfield size: ' + bitsLeft + ' < ' + maxVendorId);
                    }
                    for (var i = 0; i < maxVendorId; i++) {
                        // vendorIds and vendorConsents are 1-based
                        vendorConsents[i + 1] = binary.string.charAt(binary.atPos + i) == '1';
                    }
                } else {
                    // range encoding
                    fields.defaultConsent = binary.getBits(fieldSize.defaultConsent) == 1;
                    for (var i = 0; i < maxVendorId; i++) {
                        vendorConsents[i + 1] = fields.defaultConsent;
                    }
                    fields.numEntries = binary.getBits(fieldSize.numEntries);
                    for (var i = 0; i < fields.numEntries; i++) {
                        var isRange = binary.getBits(fieldSize.isRange) == 1;
                        var startVendorId = binary.getBits(fieldSize.startVendorId);
                        var endVendorId = isRange ? binary.getBits(fieldSize.endVendorId) : startVendorId;
                        if (binary.atPos > binary.string.length) {
                            throw new Error('Not enough bits for numEntries in ranges');
                        }
                        if (startVendorId > endVendorId || endVendorId > maxVendorId) {
                            throw new Error(
                                'Invalid vendorId range: ' +
                                startVendorId +
                                '-' +
                                endVendorId +
                                '. The max valid vendorId is: ' +
                                maxVendorId
                            );
                        }
                        for (var vendorId = startVendorId; vendorId <= endVendorId; vendorId++) {
                            vendorConsents[vendorId] = !fields.defaultConsent;
                        }
                    }
                }
                fields.vendorConsents = vendorConsents;
                return fields;
            },
            /* Helper function for encodeBinary.
                 If range encoding shorter than bitfield, returns:
                   {binary: BinaryField object, numEntries: num, defaultConsent: 1/0 }
                 otherwise, returns null */
            encodeRanges: function (fields) {
                // start with range encoding, stop if it becomes longer than bitfield encoding
                var ranges = new BinaryField();
                var vendorConsents = fields.vendorConsents;
                var extraBits = 13;
                var defaultConsent = !!vendorConsents[1];
                var startRange;
                var endRange;
                var rangeStarted = false;
                var maxVendorId = fields.maxVendorId;
                var numEntries = 0;
                for (var i = 2; i <= maxVendorId; i++) {
                    var inRange = !!vendorConsents[i] != !!defaultConsent;
                    if (inRange) {
                        if (!rangeStarted) {
                            startRange = i;
                            rangeStarted = true;
                        }
                        endRange = i;
                    }
                    // if we've reached the end of a range, record it
                    if (rangeStarted && (!inRange || i == maxVendorId)) {
                        numEntries++;
                        var isRange = endRange > startRange;
                        ranges.addField(isRange ? 1 : 0, fieldSize.isRange, 'isRange');
                        ranges.addField(startRange, fieldSize.startVendorId, 'startVendorId');
                        if (isRange) {
                            ranges.addField(endRange, fieldSize.endVendorId, 'endVendorId');
                        }
                        // if we're longer than bitfield encoding, return null
                        if (extraBits + ranges.binaryStr.length > maxVendorId) {
                            return null;
                        }
                        rangeStarted = false;
                    }
                }
                return {
                    binary: ranges,
                    defaultConsent: defaultConsent ? 1 : 0,
                    numEntries: numEntries
                };
            },
            encodeBinary: function (fields) {
                var vendorConsents = fields.vendorConsents;
                var binary = new BinaryField();
                if (fields.version != COOKIE_VERSION) {
                    throw new Error('version ' + fields.version + ' not supported');
                }
                binary.addField(fields.version, fieldSize.version, 'version');
                binary.addField(Data.dateToDeciseconds(fields.created), fieldSize.created, 'created');
                binary.addField(
                    Data.dateToDeciseconds(fields.lastUpdated),
                    fieldSize.lastUpdated,
                    'lastUpdated'
                );
                binary.addField(fields.cmpId, fieldSize.cmpId, 'cmpId');
                binary.addField(fields.cmpVersion, fieldSize.cmpVersion, 'cmpVersion');
                binary.addField(fields.consentScreen, fieldSize.consentScreen, 'consentScreen');
                binary.addField(
                    Data.languageToCookieValue(fields.consentLanguage || 'en'),
                    fieldSize.consentLanguage,
                    'consentLanguage'
                );
                binary.addField(fields.vendorListVersion, fieldSize.vendorListVersion, 'vendorListVersion');
                binary.addField(fields.purposesAllowed, fieldSize.purposesAllowed, 'purposesAllowed');
                binary.addField(fields.maxVendorId, fieldSize.maxVendorId, 'maxVendorId');

                var ranges = Data.encodeRanges(fields);

                fields.encodingType = ranges ? RANGES_ENCODING : BITFIELD_ENCODING;
                binary.addField(fields.encodingType, fieldSize.encodingType, 'encodingType');
                if (fields.encodingType == BITFIELD_ENCODING) {
                    for (var i = 1; i <= fields.maxVendorId; i++) {
                        binary.binaryStr += vendorConsents[i] ? '1' : '0';
                    }
                } else {
                    fields.defaultConsent = ranges.defaultConsent;
                    fields.numEntries = ranges.numEntries;
                    binary.addField(fields.defaultConsent, fieldSize.defaultConsent, 'defaultConsent');
                    binary.addField(fields.numEntries, fieldSize.numEntries, 'numEntries');
                    binary.binaryStr += ranges.binary.binaryStr;
                }
                return binary.binaryStr;
            }
        };
    })();

    /* field keys & types
       *=settable, #=fixed, @=code-determined
          # version: 6bit-int
          @ created: Date (stored as 36bit deciseconds)
          @ lastUpdated: Date (stored as 36bit deciseconds)
          # cmpId: 12bit-int
          # cmpVersion: 12bit-int
          * consentScreen: 6bit-int
          * consentLanguage: String ("en") (stored as 12bit encoding)
          * vendorListVersion: 12bit-int
          * purposesAllowed: 24bit-int
          * maxVendorId: 16bit-int
          @ encodingType: 1bit-int
          * vendorConsents: Array(Boolean) (stored as bitfield or range-encoding)
          (if encodingType==1)
           @ defaultConsent: 1bit-int
           @ numEntries: 12bit-int
    */

    var fields = {vendorConsents: []};

    /* consentData functions. Fields described above. Fields are a singleton */
    return {
        setMaxVendorId: function (num) {
            fields.maxVendorId = num;
        },
        /* set vendorId (1-based) to consentState (true/false) */
        setVendorConsent: function (consentState, vendorId) {
            fields.vendorConsents[vendorId] = !!consentState;
        },
        setAllVendorConsents: function (consentState) {
            for (var vendorId = 1; vendorId <= fields.maxVendorId; vendorId++) {
                fields.vendorConsents[vendorId] = !!consentState;
            }
        },
        /* get consent state (true/flase) from for all vendors */
        getAllVendorConsents: function () {
            return fields.vendorConsents;
        },
        /* get consent state (true/false) from vendorId (1-based) */
        getVendorConsent: function (vendorId) {
            return !!fields.vendorConsents[vendorId];
        },
        /* set purposeId (1-based, 1-24) to consentState (true/false) */
        setPurposeConsent: function (consentState, purposeId) {
            var mask = 1 << (fieldSize.purposesAllowed - purposeId);
            fields.purposesAllowed = consentState
                ? fields.purposesAllowed | mask
                : fields.purposesAllowed & ~mask;
        },
        setAllPurposeConsents: function (consentState) {
            for (var purposeId = 1; purposeId <= 24; purposeId++) {
                var mask = 1 << (fieldSize.purposesAllowed - purposeId);
                fields.purposesAllowed = consentState
                    ? fields.purposesAllowed | mask
                    : fields.purposesAllowed & ~mask;
            }
        },
        /* get consent state (true/flase) from for all purposes */
        getAllPurposeConsents: function () {
            if (!fields.purposesAllowed || fields.purposesAllowed.length === 0) {
                return [];
            }
            var binaryString = fields.purposesAllowed.toString(2);
            var consents = new Array(binaryString.length + 1);
            for (var c = 0; c < binaryString.length; c++) {
                consents[c + 1] = binaryString[c] === '1';
            }
            return consents;
        },
        /* get consent state (true/flase) from purposeId (1-based) */
        getPurposeConsent: function (purposeId) {
            var mask = 1 << (fieldSize.purposesAllowed - purposeId);
            return (fields.purposesAllowed & mask) != 0;
        },
        setVendorListVersion: function (version) {
            fields.vendorListVersion = version;
        },
        getVendorListVersion: function () {
            return fields.vendorListVersion;
        },
        /* build the base64-encoded cookie value string from stored 'field' values*/
        build: function () {
            if (!fields.created) fields.created = new Date();
            fields.lastUpdated = new Date();
            // TODO: check that all required fields are set
            return Data.build(fields);
        },
        /* parse a base64-encoded cookie value string into stored 'field' values */
        setAll: function (value) {
            fields = Data.setAll(value);
        }
    };
})();

export default consentData;
