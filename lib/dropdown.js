// exports.init; 
function initDropdown() {
  var data = require('sdk/self').data;
  var sp = require("sdk/simple-prefs");
  var ss = require('sdk/simple-storage');
  var Panel = require('sdk/panel').Panel;
  var ProxyRule = require('./proxy_rule.js').ProxyRule;

  var dropdown = Panel({
    contentURL: data.url('dropdown.html'),
    contentScriptOptions: { prefs: sp.prefs },
    height: 380,
    position: {
      right: 10,
      top: 0
    }
  });

  console.log("data.url('dropdown.html'): ", data.url('dropdown.html'));
  dropdown.port.on('prefsChanged', function(newNV) {
    sp.prefs[newNV.name] = newNV.value;
  });

  dropdown.port.on('addRule', function(newRule) {
    console.log('newRule: ', newRule);
    new ProxyRule(newRule).save();
  });

  dropdown.port.on('removeRule', function(rule) {
    console.log('removing rule: ', rule);
    var ruleInStorage = ProxyRule.find(rule);
    if (ruleInStorage) {
      ruleInStorage.destroy();
    }
  });

  dropdown.port.on('openSettings', function() {
    var subscriptionCache = ss.storage.subscriptionCache ? ss.storage.subscriptionCache.split("\n") : null;

    var settings = Panel({
      contentURL: data.url('settings.html'),
      contentScriptOptions: { 
        subscriptions: subscriptionCache, 
        proxyConfig: sp.prefs.proxyConfig,
        userProxyRules: ProxyRule.findAll()
      },
      height: 500,
      width: 700,
      position: {
        right: 10,
        top: 0
      }
    });

    settings.port.on('proxyChanged', function(newValue) {
      sp.prefs.proxyConfig = newValue;
    });

    settings.show();
    dropdown.hide();
  });


  sp.on('', function(key) {
    dropdown.port.emit('prefsChanged', sp.prefs);
    console.log(sp.prefs[key]);
  });

  return dropdown;
}

function init() {
  require("sdk/ui/button/action").ActionButton({
    id: "show-panel",
    label: "AutoProxy Plus",
    icon: {
      "16": "./icon-16.png",
      "32": "./icon-32.png",
      "64": "./icon-64.png"
    },
    onClick: function (state) {
      initDropdown().show();
    }
  });
}

exports.init = init;