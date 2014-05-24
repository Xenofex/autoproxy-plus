// exports.init; 
var system = require("sdk/system");
var data = require('sdk/self').data;
var sp = require("sdk/simple-prefs");
var ss = require('sdk/simple-storage');
var Panel = require('sdk/panel').Panel;
var ProxyRule = require('./proxy_rule').ProxyRule;


function initDropdown(button, panelPosition) {
  var reloadUserProxyRules = require('./proxy').reloadUserProxyRules;

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
    reloadUserProxyRules();
  });

  dropdown.port.on('removeRule', function(rule) {
    console.log('removing rule: ', rule);
    var ruleInStorage = ProxyRule.find(rule);
    if (ruleInStorage) {
      ruleInStorage.destroy();
      reloadUserProxyRules();
    }
  });

  dropdown.port.on('openSettings', function() {
    var subscriptionCache = ss.storage.subscriptionCache;

    var settings = Panel({
      contentURL: data.url('settings.html'),
      contentScriptOptions: { 
        subscriptions: subscriptionCache ? subscriptionCache.split("\n") : [], 
        proxyConfig: sp.prefs.proxyConfig,
        userProxyRules: ProxyRule.findAll(),
        subscriptionURL: sp.prefs.subscriptionURL
      },
      height: 500,
      width: 700
    });

    settings.port.on('updateProxy', function(newValue) {
      sp.prefs.proxyConfig = newValue;
    });

    settings.port.on('updateRule', function(newRule) {
      new ProxyRule(newRule).save();
      reloadUserProxyRules();
    });

    settings.port.on('removeRule', function(rule) {
      console.log('removing rule: ', rule);
      var ruleInStorage = ProxyRule.find(rule);
      if (ruleInStorage) {
        ruleInStorage.destroy();
        reloadUserProxyRules();
      }
    });

    settings.port.on('updateSubscriptionURL', function(newURL) {
        console.log("newURL: ", newURL);
        sp.prefs.subscriptionURL = newURL;
        // sp.prefs.reloadSubscription = !sp.prefs.reloadSubscription;
        require('./proxy').reloadSubscription(true, function() {
            subscriptionCache = ss.storage.subscriptionCache;
            settings.port.emit('subscriptionUpdatedAt', {
                updatedAt: new Date(), 
                subscriptions: subscriptionCache ? subscriptionCache.split("\n") : [] 
            });
        });
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

function iconObjForState(state) {
  var ret = {};
  ["16", "32", "64"].forEach(function(key) {
    // "./icon-auto-16.png"
    ret[key] = "./icon-" + state + "-" + key + ".png";
  });

  return ret;
}

function init() {
  var iconStates = ['auto', 'global', 'off'];
  var iconObj = iconObjForState(sp.prefs.proxyMode || "auto");

  var button = require("sdk/ui/button/action").ActionButton({
    id: "show-panel",
    label: "AutoProxy Plus",
    icon: iconObj,
    onClick: clicked
  });

  var panelPosition;
  if (parseFloat(system.version) >= 30.0) {
    panelPosition = { position: button };
    console.log("panelPosition is", button);
  } else {
    panelPosition = { position: { right: 10, top: 0 } };
  }


  sp.on('proxyMode', function() {
      button.icon = iconObjForState(sp.prefs.proxyMode);
  });

  function clicked() {
    initDropdown(button, panelPosition).show(panelPosition);
  }
}

exports.init = init;
