$(function() {
    var $items = $('#mode-select .item');

    if (typeof addon !== 'undefined') {
        $items.find("#proxy-" + addon.options.prefs.proxyMode).addClass('active');
        $items.click(function() {
            addon.port.emit("prefsChanged", {name: "proxyMode", value: this.id.substring(6)});
        });

        addon.port.on('prefsChanged', function (prefs) {
            $items.find("#proxy-" + prefs.proxyMode).addClass('active');
        });
    }


    $items.click(function() {
      $(this)
      .addClass('active')
      .closest('.ui.menu')
      .find('.item')
      .not($(this))
      .removeClass('active');
    });
});