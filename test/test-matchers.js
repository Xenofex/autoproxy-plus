let { Matcher, PrefixMatcher, DomainNameMatcher, TextPatterMatcher } = require('./matchers');

exports['test Matcher parsing'] = function(assert) {
    assert.ok(Matcher.parse("alliance.org.hk") instanceof TextPatterMatcher);
    assert.ok(Matcher.parse(".allinfa.com") instanceof TextPatterMatcher);
    assert.ok(Matcher.parse("|http://allinfa.com") instanceof PrefixMatcher);
    assert.ok(Matcher.parse("||allinfo.com") instanceof DomainNameMatcher);

    let textMatcher = Matcher.parse(".allinfa.com");
    assert.ok(textMatcher.match('http://www.allinfa.com'));
    assert.ok(textMatcher.match('http://www.google.com/search?q=www.allinfa.com'));
    assert.ok(!textMatcher.match('https://www.allinfa.com'), 'TextPatternMatcher should not match https');

    let regexMatcher = Matcher.parse("/^https?://[^/]+example.com/");
    assert.ok(Boolean(regexMatcher.regex));
    assert.ok(regexMatcher.match('http://www.example.com/abc'));
    assert.ok(regexMatcher.match('https://www.example.com/abc'));
};

require("sdk/test").run(exports);