// exports.init; 
var system = require("sdk/system");

var panelPosition;
if (parseFloat(system.version) >= 30.0) {
  panelPosition = button;
  console.log("panelPosition is", button);
} else {
  panelPosition = { right: 10, top: 0 };
}


function initDropdown(button) {
  var data = require('sdk/self').data;
  var sp = require("sdk/simple-prefs");
  var ss = require('sdk/simple-storage');
  var Panel = require('sdk/panel').Panel;
  var ProxyRule = require('./proxy_rule.js').ProxyRule;

  var dropdown = Panel({
    contentURL: data.url('dropdown.html'),
    contentScriptOptions: { prefs: sp.prefs },
    height: 380
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
    var subscriptionCache = ss.storage.subscriptionCache;

    var settings = Panel({
      contentURL: data.url('settings.html'),
      contentScriptOptions: { 
        subscriptions: subscriptionCache ? subscriptionCache.split("\n") : [], 
        proxyConfig: sp.prefs.proxyConfig,
        userProxyRules: ProxyRule.findAll()
      },
      height: 500,
      width: 700,
      position: panelPosition
    });

    settings.port.on('updateProxy', function(newValue) {
      sp.prefs.proxyConfig = newValue;
    });

    settings.port.on('updateRule', function(newRule) {
      new ProxyRule(newRule).save();
    });

    settings.port.on('removeRule', function(rule) {
      console.log('removing rule: ', rule);
      var ruleInStorage = ProxyRule.find(rule);
      if (ruleInStorage) {
        ruleInStorage.destroy();
      }
    });


    settings.show(panelPosition);
    dropdown.hide();
  });


  sp.on('', function(key) {
    dropdown.port.emit('prefsChanged', sp.prefs);
    console.log(sp.prefs[key]);
  });

  return dropdown;
}

function init() {
  var button = require("sdk/ui/button/action").ActionButton({
    id: "show-panel",
    label: "AutoProxy Plus",
    icon: {
      "16": "./icon16.png",
      "32": "./icon32.png",
      "64": "./icon64.png"
    },
    onClick: clicked
  });

  function clicked() {
    initDropdown(button).show(panelPosition);
  }
}

exports.init = init;
