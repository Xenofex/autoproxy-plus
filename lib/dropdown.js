exports.init = function initDropdown() {
  var data = require('sdk/self').data;
  var sp = require("sdk/simple-prefs");

  var dropdown = require('sdk/panel').Panel({
    contentURL: data.url('dropdown.html'),
    contentScriptFile: [data.url('jquery-2.1.0.min.js'), data.url('dropdown_content.js')],
    contentScriptOptions: { prefs: sp.prefs },
    position: {
      right: 10,
      top: 0
    }
  });

  dropdown.port.on('prefsChanged', function(newNV) {
    sp.prefs[newNV.name] = newNV.value;
  });

  sp.on('', function(key) {
    dropdown.contentScriptOptions.prefs = sp.prefs;
    dropdown.port.emit('prefsChanged');
    console.log(sp.prefs[key]);
  });

  require("sdk/ui/button/action").ActionButton({
    id: "show-panel",
    label: "Show Panel",
    icon: {
      "16": "./icon-16.png",
      "32": "./icon-32.png",
      "64": "./icon-64.png"
    },
    onClick: function (state) {
      dropdown.show();
    }
  });

  return dropdown;
};
