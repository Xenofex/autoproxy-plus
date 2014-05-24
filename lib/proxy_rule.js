let ss = require('sdk/simple-storage');
let { Class } = require('sdk/core/heritage');
const { EventTarget } = require("sdk/event/target");
let { Matcher, PrefixMatcher, DomainNameMatcher, TextRegexpMatcher } = require('./matchers');
let { on, once, off, emit } = require('sdk/event/core');

if (!ss.storage.userProxyRules) {
    ss.storage.userProxyRules = {};
}

function newProxyRuleId() {
    var keys = Object.keys(ss.storage.userProxyRules);
    if (keys.length === 0) {
        return "1";
    } else {
        return (Math.max.apply(null, keys) + 1).toString();
    }
}

/***********************class ProxyRule********************************/
var ProxyRule = Class({
    extends: EventTarget,
    initialize: function initialize(rule) {
        EventTarget.prototype.initialize.call(this, rule);
        if (rule) { // Copy constructor
            this.id = rule.id;
            this.type = rule.type;
            this.isWhitelist = rule.isWhitelist;
            this.expression = rule.expression;
        }

    }
});

ProxyRule.prototype.id = null;
ProxyRule.prototype.type = null; // String: domain|prefix|expression
ProxyRule.prototype.isWhitelist = false;   //
ProxyRule.prototype.expression = null;

ProxyRule.prototype.save = function() {
    if (!this.id) {
        this.id = newProxyRuleId();
    }

    ss.storage.userProxyRules[this.id] = this;
    console.log(this);
    emit(ProxyRule, "save", this);
};

ProxyRule.prototype.destroy = function() {
    delete ss.storage.userProxyRules[this.id];
    emit(ProxyRule, "destroy", this);
};

ProxyRule.prototype.equals = function(that) {
    return this.type === that.type && this.isWhitelist === that.isWhitelist &&
           this.expression === that.expression;
};

ProxyRule.prototype.toMatcher = function() {
    if (this.type == 'domain') {
        return new DomainNameMatcher(this.expression);
    } else if (this.type == 'prefix') {
        return new PrefixMatcher(this.expression);
    } else if (this.type == 'expression') {
        return new TextRegexpMatcher(this.expression);
    } else {
        return undefined;
    }
};

ProxyRule.toMatcher = function(rule) {
    return ProxyRule.prototype.toMatcher.call(rule);
}

ProxyRule.find = function(rule) {
    if (typeof rule === 'string') {
        return new ProxyRule(ss.storage.userProxyRules[rule]);
    } else if (rule.id) {
        return new ProxyRule(ss.storage.userProxyRules[rule.id]);
    } else {
        for (var id in ss.storage.userProxyRules) {
            if (ss.storage.userProxyRules[id].equals(rule)) {
                return new ProxyRule(ss.storage.userProxyRules[id]);
            }
        }
    }
};

ProxyRule.findAll = function() {
    var rules = [];
    for (var id in ss.storage.userProxyRules) {
        rules.push(ss.storage.userProxyRules[id]);
    }

    return rules;
};


ProxyRule.validEvents = ["save", "destroy"];
ProxyRule.validTypes = ["domain", "prefix", "expression"];

exports.ProxyRule = ProxyRule;
