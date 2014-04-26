$(function() {
    var $items = $('#mode-select .item');
    $items.click(function() {
      $(this)
      .addClass('active')
      .closest('.ui.menu')
      .find('.item')
      .not($(this))
      .removeClass('active');

      addon.port.emit("prefsChanged", {name: "proxyMode", value: this.id.substring(6)});
    });

    if (typeof addon === 'undefined') {
        addon = { options: { prefs: { proxyMode: 'auto'}}};
    }

    $items.filter("#proxy-" + addon.options.prefs.proxyMode).click();
    addon.port.on('prefsChanged', function (prefs) {
        $items.find("#proxy-" + prefs.proxyMode).click();
    });

});