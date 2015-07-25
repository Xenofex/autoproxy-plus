let { parsedRules, defaultProxy, applyFilter } = require('../lib/proxy');

exports['test parsedRules'] = function(assert) {
    assert.strictEqual(typeof parsedRules.whiteList, 'object');
    assert.strictEqual(typeof parsedRules.proxyList, 'object');
    console.log('here');
};

exports['test applyFilter'] = function(assert) {
    assert.ok(!applyFilter(null, 'http://site.locql.com', null));
    assert.ok(applyFilter(null, 'https://twitter.com/d', null));
    assert.ok(applyFilter(null, 'https://www.facebook.com/some_page', null));
    assert.ok(applyFilter(null, 'http://www.youtube.com', null));
};

console.log("exports: ", exports['parsedRules']);

require("sdk/test").run(exports);
