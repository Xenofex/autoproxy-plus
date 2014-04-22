$(function() {
    $('input[name="mode"]').val([self.options.prefs.proxyMode]).click(function() {
        self.port.emit("prefsChanged", {name: "proxyMode", value: this.value});
    });

    self.port.on('prefsChanged', function (prefs) {
        $('input[name="mode"]').val([prefs.proxyMode]);
    });
});