let { Class } = require('sdk/core/heritage');
let { domainOf, allDomainsOf } = require('./domain_utils');
let { stringStartsWith } = require('./utils');

let Matcher = Class({
    initialize: function initialize(expression) {
        this.expression = expression;
    },
    match: function match(uri) {
        throw "Subclass must implement the 'match' method";
    }
});

Matcher.parse = function parse(filterRule) {
    if (stringStartsWith(filterRule, '||')) {
        return new DomainNameMatcher(filterRule.substring(2));
    } else if (stringStartsWith(filterRule, '|')) {
        return new PrefixMatcher(filterRule.substring(1));
    } else {
        return new TextPatterMatcher(filterRule);
    }
};

let PrefixMatcher = Class({
    extends: Matcher,
    match: function match(uri) {
        return stringStartsWith(uri.spec, expression);
    }

});

let DomainNameMatcher = Class({
    extends: Matcher,
    match: function match(uri) {
        // should any of this domain and parent domain matches, return true;
        // otherwise none of them matches, return false;
        let allDomains = allDomainsOf(uri.host);
        for (var i = 0; i < allDomains.length; i++) {
            if (allDomains[i] === this.expression) {
                return true;
            }
        }
        
        return false;
    }
});

let TextPatterMatcher = Class({
    extends: Matcher,

    initialize: function initialize(expression) {
        Matcher.prototype.initialize.call(this, expression);
        if (this.expression.charAt(0) == '/' && this.expression.charAt(this.expression.length - 1) == '/') {
            this.regex = new RegExp(this.expression.substring(1, this.expression.length - 2));
        }
    },

    match: function match(uri) {
        let uriString = uri.spec;
        if (this.regex) {
            return this.regex.test(uriString);
        } else if (stringStartsWith(uriString, 'https://')) {
            return false;
        } else {
            return uriString.indexOf(this.expression) >= 0;
        }
    },

    isRegex: function isRegex() {
        return Boolean(this.regex);
    }
});


exports.Matcher = Matcher;
exports.PrefixMatcher = PrefixMatcher;
exports.DomainNameMatcher = DomainNameMatcher;
exports.TextPatterMatcher = TextPatterMatcher;