$(function() {
  if (typeof addon === 'undefined') {
    addon = { options: { prefs: { proxyMode: 'auto'}}, port: { on: $.noop, emit: $.noop } };
  }

  function addRule() {
    addon.port.emit("addRule", getRule());
  }

  function removeRule() {
    addon.port.emit("removeRule", getRule());
  }

  function getRule() {
    var rule;
    if ($('#mode.dropdown .text').text().toLowerCase() == "proxy") {
      rule = "";
    } else {
      rule = "@@";
    }

    var matchText = $('#match.dropdown .text').text().toLowerCase();
    if (matchText == 'domain') {
      rule += "||";
    } else if (matchText == 'prefix') {
      rule += "|";
    }

    rule += $('#rule-expression').val();
    
    return rule;
  }

  $('.ui.dropdown').dropdown();

  $('#new-rule-button').click(function() {
    $('#new-rule').transition('slide down', '250ms');
    $(this).toggleClass('active');
    $('#rule-expression').val('');
  });

  $('#settings').click(function() {
    addon.port.emit('openSettings');
  });

  $('#add-rule').click(function() {
    addRule();
    $('#new-rule .dimmer').dimmer({ 
        closable: false
      }).dimmer('show');
  });

  $('#rule-added').click(function () {
    $('#new-rule .dimmer').dimmer('hide');
    $('#new-rule-button').click();
  });

  $('#undo-adding-rule').click(function() {
    removeRule();  
    $('#new-rule .dimmer').dimmer('hide');
  });

  var $items = $('#mode-select .item');
  $items.click(function() {
    $(this).addClass('active')
      .closest('.ui.menu').find('.item').not($(this)).removeClass('active');

    addon.port.emit("prefsChanged", { name: "proxyMode", value: this.id.substring(6)});
  });

  $items.filter("#proxy-" + addon.options.prefs.proxyMode).click();
  addon.port.on('prefsChanged', function (prefs) {
    $items.find("#proxy-" + prefs.proxyMode).click();
  });

});