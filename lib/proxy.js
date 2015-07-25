let { Class } = require('sdk/core/heritage');
let { Unknown } = require('sdk/platform/xpcom');
let { Cc, Ci } = require('chrome');
let pS = Cc['@mozilla.org/network/protocol-proxy-service;1'].getService(Ci.nsIProtocolProxyService);
let sp = require("sdk/simple-prefs");
let ProxyRule = require('./proxy_rule').ProxyRule;
let { Matcher, PrefixMatcher, DomainNameMatcher, TextRegexpMatcher } = require('./matchers');
let { stringStartsWith, addValueToKey } = require('./utils');
let { domainOf, allDomainsOf } = require('./domain_utils');
let getParsedRules = require('./proxy_rules_subscription').getParsedRules;

const PR_UINT32_MAX = 0xffffffff;
const PROXY_AUTO = 1, PROXY_GLOBAL = 2, PROXY_OFF = 3;
const ProxyModeToConst = { auto: PROXY_AUTO, global: PROXY_GLOBAL, off: PROXY_OFF };

let ProxyMode = ProxyModeToConst[sp.prefs.proxyMode];

let subscriptionRules = {
    whiteList: {},
    proxyList: {}
};

let userProxyRules = {
    whiteList: {},
    proxyList: {}
};

let whiteLists = [];
let proxyLists = [];


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
            return pS.newProxyInfo(components[0], components[1], components[2], 1, PR_UINT32_MAX, null);
        }

    } else {
        return null;
    }

}

function matchesAnyIn(matchersHash, uri, domains) {
    if (Array.isArray(matchersHash)) {
        for (var i = 0; i < matchersHash.length; i++) {
            if (matchesAnyIn(matchersHash[i], uri, domains)) {
                return true;
            }
        };

        return false;
    } else {
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

}

function applyFilter(proxyService, uri, proxyInfo) {
    if (uri.spec === sp.prefs.subscriptionURL) {
        return defaultProxy;
    }

    console.log('ProxyMode: ', ProxyMode, ' proxyMode: ', sp.prefs.proxyMode);

    if (ProxyMode === PROXY_GLOBAL) {
        return defaultProxy;
    } else if (ProxyMode === PROXY_AUTO) {
        if (!subscriptionRules && !userProxyRules) {
            return proxyInfo;
        }

        let allDomains = allDomainsOf(uri.host);
        if (universalRulesEnabled) {
            allDomains.push('__default__');
        }
       
        if (matchesAnyIn(whiteLists, uri, allDomains)) {
            console.log(uri.spec + ' matched whiteList');
            return proxyInfo;
        } else if (matchesAnyIn(proxyLists, uri, allDomains)) {
            console.log(uri.spec + ' matched proxyList');
            return defaultProxy;
        } else {
            console.log(uri.spec + ' matched nothing');
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

        if (ret) {
            console.log(uri.spec + " [proxy: " + ret.type + '://' + ret.host + ':' + ret.port + ']');
        }

        return ret;
    }
}); 

function reloadSubscription(ignoreCache, callback) {
    console.log("sp.prefs.subscriptionURL: ", sp.prefs.subscriptionURL);
    getParsedRules(sp.prefs.subscriptionURL, ignoreCache, function(result) {
        if (result.whiteList && result.proxyList) {
            console.info("subscription parsed successfully");
        } else {
            console.error("invalid subscription content format");
        }
        
        subscriptionRules = result;
        reloadRuleLists();

        if (typeof callback === 'function') {
            callback();
        }

        // var File = require('sdk/io/file');
        // var f = File.open('C:\\Users\\Xenofex\\Sandbox\\javascript\\autoproxy\\autoproxyplus\\parsed_rules.json', 'w');
        // f.write(JSON.stringify(subscriptionRules));
        // f.close();
    });

}

function reloadUserProxyRules() {
    let allRules = ProxyRule.findAll();
    console.log('in reloadUserProxyRules, allRules: ', allRules);

    let whiteList = {}, proxyList = {};
    let DEFAULT = '__default__';

    allRules.forEach(function(rule) {
        var matcher = ProxyRule.toMatcher(rule);
        var toList = rule.isWhitelist ? whiteList : proxyList;
        if (matcher instanceof TextRegexpMatcher) {
            if (matcher.isRegex()) {
                addValueToKey(toList, DEFAULT, matcher);
            } else {
                addValueToKey(toList, domainOf(matcher.expression), matcher);
            }
        } else {
            addValueToKey(toList, domainOf(matcher.expression), matcher);
        }

    });
    console.log('whiteList and proxyList generated');

    userProxyRules = { whiteList: whiteList, proxyList: proxyList };
    reloadRuleLists();
    console.log('reloadUserProxyRules: ', userProxyRules);
}

function reloadRuleLists() {
    whiteLists = [userProxyRules.whiteList, subscriptionRules.whiteList];
    proxyLists = [userProxyRules.proxyList, subscriptionRules.proxyList];
}

function init() {
    reloadSubscription(false);
    reloadUserProxyRules();

    sp.on('reloadSubscription', function() {
        reloadSubscription(true);
    });

    let APPFilter = new AutoProxyPlusFilter();
    pS.registerFilter(APPFilter, 0);
}


exports.init = init;
exports.applyFilter = applyFilter;
exports.defaultProxy = defaultProxy;
exports.subscriptionRules = subscriptionRules;
exports.reloadSubscription = reloadSubscription;
exports.reloadUserProxyRules = reloadUserProxyRules;
