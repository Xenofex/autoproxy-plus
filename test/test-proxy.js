let { subscriptionRules, defaultProxy, applyFilter, reloadSubscription } = require('../lib/proxy');
let { makeUri } = require('./util');
let sp = require("sdk/simple-prefs");

exports['test parsedRules'] = function(assert) {
    assert.strictEqual(typeof subscriptionRules.whiteList, 'object');
    assert.strictEqual(typeof subscriptionRules.proxyList, 'object');
};

function useProxy(url, assert) {
    let dummyProxy = {};
    assert.equal(applyFilter(null, makeUri(url), dummyProxy), defaultProxy);
}

function noProxy(url, assert) {
    let dummyProxy = {};
    assert.equal(applyFilter(null, makeUri(url), dummyProxy), dummyProxy);
}

exports['test applyFilter'] = function(assert, done) {
    reloadSubscription(true, function () {
        assert.ok(subscriptionRules.whiteList && subscriptionRules.proxyList,
                 "should have succesfully parsed subscription rule");
        noProxy('http://site.locql.com', assert);
        useProxy('https://twitter.com/d', assert);
        useProxy('https://www.facebook.com/some_page', assert);
        useProxy('http://www.youtube.com', assert);
        done();
    })
};

require("sdk/test").run(exports);
