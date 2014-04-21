let { Class } = require('sdk/core/heritage');
let { Unknown } = require('sdk/platform/xpcom');
let { Cc, Ci } = require('chrome');
let { domainOf, allDomainsOf } = require('./domain_utils.js');
let pS = Cc['@mozilla.org/network/protocol-proxy-service;1'].getService(Ci.nsIProtocolProxyService);
let getParsedRules = require('./proxy_rules.js').getParsedRules;

const PR_UINT32_MAX = 0xffffffff;

let gfwlistURL = 'http://autoproxy-gfwlist.googlecode.com/svn/trunk/gfwlist.txt';

let parsedRules;
getParsedRules(gfwlistURL, function(result) {
    if (result.whiteList && result.proxyList) {
        console.info("gfwList parsed successfully");
    }
    
    parsedRules = result;
});

let universalRulesEnabled = true;
let defaultProxy = pS.newProxyInfo('http', 'localhost', '8087', 0, PR_UINT32_MAX, null);

function matchesAnyIn(matchersHash, uri, domains) {
    for (var i = 0; i < domains.length; i++) {
        let matchers = matchersHash[domains[i]];

        if (matchers) {
            for (var j = 0; j < matchers.length; j++) {
                let matched = matchers[j].match(uri);
                if (matched) {
                    return true;
                }
            }
        }
    }

    return false;
}

function applyFilter(proxyService, uri, proxyInfo) {
    if (uri.spec === gfwlistURL) {
        return defaultProxy;
    }


    if (!parsedRules) {
        return null;
    }

    let allDomains = allDomainsOf(uri.host);
    if (universalRulesEnabled) {
        allDomains.push('__default__');
    }
   
    if (matchesAnyIn(parsedRules.whiteList, uri, allDomains)) {
        return null;
    } else if (matchesAnyIn(parsedRules.proxyList, uri, allDomains)) {
        return defaultProxy;
    }
}

var AutoProxyPlusFilter = Class({
    extends:  Unknown,
    interfaces: [ 'nsIProtocolProxyFilter' ],
    applyFilter: applyFilter
}); 

function init() {
    let APPFilter = new AutoProxyPlusFilter();
    pS.registerFilter(APPFilter, 0);
}


exports.init = init;
exports.applyFilter = applyFilter;
exports.defaultProxy = defaultProxy;
exports.parsedRules = parsedRules;