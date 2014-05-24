let { domainOf, allDomainsOf } = require('./domain_utils');
let { stringStartsWith } = require('./utils');
let { Matcher, PrefixMatcher, DomainNameMatcher, TextPatterMatcher } = require('./matchers');
let XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;
let base64 = require("sdk/base64");
let sp = require("sdk/simple-prefs");
var ss = require("sdk/simple-storage");
const SubscriptionExpiration = 60 * 60 * 24 * 1000; // 1 day in milliseconds.

function eachLine(func, lineEnd) {
    lineEnd = lineEnd || "\n";

    let i, stop, lineNo = 0, startIdx = -1;
    for (i = 0; i < this.length; i++) {
        let character = this.charAt(i);
        if (character === lineEnd) {
            stop = func(this.substring(startIdx + 1, i), lineNo);
            if (stop === false) {
                return;
            }

            startIdx = i;
            lineNo++;
        }
    }

    if (startIdx != i) {
        func(this.substring(startIdx + 1, i), lineNo);
    }
}

if (!String.prototype.eachLine) {
    String.prototype.eachLine = eachLine;
} else {
    console.error("String#eachLine has been defined somewhere else!");
}

function isEmptyOrComment(line) {
    line = line.trim();
    return line.length === 0 || line.charAt(0) == '!';
}

function addValueToKey(obj, key, value) {
    let array = obj[key];
    if (!array) {
        array = [];
        obj[key] = array;
    }

    array.push(value);
}

function parseGfwList(gfwlist) {
    let whiteList = {};
    let proxyList = {};
    let DEFAULT = '__default__';

    gfwlist.eachLine(function(line, idx) {
        if (idx === 0 || isEmptyOrComment(line)) {
            return true;
        }

        let matcher, toList;
        if (stringStartsWith(line, '@@')) { // White list
            let exp = line.substring(2);
            matcher = Matcher.parse(exp);
            toList = whiteList;
        } else {
            matcher = Matcher.parse(line);
            toList = proxyList;
        }


        if (matcher instanceof TextPatterMatcher) {
            if (matcher.isRegex()) {
                addValueToKey(toList, DEFAULT, matcher);
            } else {
                addValueToKey(toList, domainOf(matcher.expression), matcher);
            }
        } else {
            addValueToKey(toList, domainOf(matcher.expression), matcher);
        }

    });

    return { whiteList: whiteList, proxyList: proxyList };
}

function saveGfwList(body, url) {
    ss.storage.subscriptionCacheURL = url;
    ss.storage.subscriptionCache = body;
    ss.storage.subscriptionCachedAt = new Date();
}

function getParsedRules(gfwlistURL, ignoreCache, callback) {
    let cachedAt = ss.storage.subscriptionCachedAt;
    console.log('subscription was cached at: ', cachedAt, 'type: ', typeof cachedAt);

    if (!gfwlistURL) {
        saveGfwList(null, null);
        callback(parseGfwList('')  );
    } else if (!ignoreCache && cachedAt && (new Date() - new Date(cachedAt) < SubscriptionExpiration) &&
               ss.storage.subscriptionCache && ss.storage.subscriptionCacheURL == gfwlistURL) {
        console.log("Loaded subscription from cache");
        callback(parseGfwList(ss.storage.subscriptionCache));
    } else {
        console.log("Updating subscription");

        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            let responseText = xhr.responseText;
            let text = responseText.replace(/\s/g, "");
            let decodedResponse = base64.decode(text);
            saveGfwList(decodedResponse, gfwlistURL);

            callback(parseGfwList(decodedResponse));
        };

        xhr.onerror = function() {
            console.error('failed to get gfwlist');
        };

        xhr.open('GET', gfwlistURL, true);
        xhr.send();
    }
}

exports.getParsedRules = getParsedRules;
exports.stringEachLine = eachLine;
