let { Class } = require('sdk/core/heritage');
let { Unknown } = require('sdk/platform/xpcom');
let { Cc, Ci } = require('chrome');
let pS = Cc['@mozilla.org/network/protocol-proxy-service;1'].getService(Ci.nsIProtocolProxyService);
let sp = require("sdk/simple-prefs");

let { domainOf, allDomainsOf } = require('./domain_utils.js');
let getParsedRules = require('./proxy_rules_subscription.js').getParsedRules;

const PR_UINT32_MAX = 0xffffffff;
const PROXY_AUTO = 1, PROXY_GLOBAL = 2, PROXY_OFF = 3;
const ProxyModeToConst = { auto: PROXY_AUTO, global: PROXY_GLOBAL, off: PROXY_OFF };

let ProxyMode = ProxyModeToConst[sp.prefs.proxyMode];

let parsedRules = {
    whiteList: {},
    proxyList: {}
};


sp.on('proxyMode', function() {
    ProxyMode = ProxyModeToConst[sp.prefs.proxyMode];
});

let universalRulesEnabled = true;


let defaultProxy = createProxyFromPrefs();

sp.on('proxyConfig', function () {
    defaultProxy = createProxyFromPrefs();
});

function createProxyFromPrefs() {
    var proxyLine = sp.prefs.proxyConfig;
    if (proxyLine) {
        var components = proxyLine.split(":");
        if (components.length != 3) {
            return null;
        } else {
            return pS.newProxyInfo(components[0], components[1], components[2], 0, PR_UINT32_MAX, null);
        }

    } else {
        return null;
    }

}

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
    if (uri.spec === sp.prefs.subscriptionURL) {
        return defaultProxy;
    }

    console.log('ProxyMode: ', ProxyMode, ' proxyMode: ', sp.prefs.proxyMode);

    if (ProxyMode === PROXY_GLOBAL) {
        return defaultProxy;
    } else if (ProxyMode === PROXY_AUTO) {
        if (!parsedRules) {
            return proxyInfo;
        }

        let allDomains = allDomainsOf(uri.host);
        if (universalRulesEnabled) {
            allDomains.push('__default__');
        }
       
        if (matchesAnyIn(parsedRules.whiteList, uri, allDomains)) {
            console.log(uri.spec, ' matched whiteList');
            return proxyInfo;
        } else if (matchesAnyIn(parsedRules.proxyList, uri, allDomains)) {
            console.log(uri.spec, ' matched proxyList');
            return defaultProxy;
        } else {
            console.log(uri.spec, ' matched nothing');
            return proxyInfo;
        }
    } else { // Proxy Off
        return proxyInfo;
    }
}

var AutoProxyPlusFilter = Class({
    extends:  Unknown,
    interfaces: [ 'nsIProtocolProxyFilter' ],
    applyFilter: function(proxyService, uri, proxyInfo) {
        var ret = applyFilter(proxyService, uri, proxyInfo);
        console.log(ret);

        return ret;
    }
}); 

function reloadSubscription(ignoreCache, callback) {
    getParsedRules(sp.prefs.subscriptionURL, ignoreCache, function(result) {
        if (result.whiteList && result.proxyList) {
            console.info("subscription parsed successfully");
        } else {
            console.error("invalid subscription content format");
        }
        
        parsedRules = result;

        if (typeof callback === 'function') {
            callback();
        }

        // var File = require('sdk/io/file');
        // var f = File.open('C:\\Users\\Xenofex\\Sandbox\\javascript\\autoproxy\\autoproxyplus\\parsed_rules.json', 'w');
        // f.write(JSON.stringify(parsedRules));
        // f.close();
    });

}

function init() {
    reloadSubscription(false);

    sp.on('reloadSubscription', function() {
        reloadSubscription(true);
    });

    let APPFilter = new AutoProxyPlusFilter();
    pS.registerFilter(APPFilter, 0);
}


exports.init = init;
exports.applyFilter = applyFilter;
exports.defaultProxy = defaultProxy;
exports.parsedRules = parsedRules;
exports.reloadSubscription = reloadSubscription;