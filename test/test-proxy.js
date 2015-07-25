let { subscriptionRules, defaultProxy, applyFilter } = require('../lib/proxy');
let { makeUri } = require('./util');

exports['test parsedRules'] = function(assert) {
    assert.strictEqual(typeof subscriptionRules.whiteList, 'object');
    assert.strictEqual(typeof subscriptionRules.proxyList, 'object');
};


exports['test applyFilter'] = function(assert) {
    assert.ok(!applyFilter(null, makeUri('http://site.locql.com'), null));
    assert.ok(applyFilter(null, makeUri('https://twitter.com/d'), null));
    assert.ok(applyFilter(null, makeUri('https://www.facebook.com/some_page'), null));
    assert.ok(applyFilter(null, makeUri('http://www.youtube.com'), null));
};

require("sdk/test").run(exports);
