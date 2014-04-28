function stringStartsWith(string, prefix) {
    if (string) {
        return string.lastIndexOf(prefix, 0) === 0;
    } else {
        return false;
    }
}

function openResourceHTML(url, contentScripts) {
    if (typeof contentScripts === 'string') {
        contentScripts = [contentScripts];
    }
    var data = require('sdk/self').data;

    if (contentScripts) {
        for (var i = contentScripts.length - 1; i >= 0; i--) {
            contentScripts[i] = data.url(contentScripts[i]);
        } 
    }


    var dataUrl = data.url(url);

    var windowUtils = require('sdk/window/utils');
    var focusedWindow = windowUtils.getFocusedWindow();
    var width = 500, height = 400;
    var left = (focusedWindow.outerWidth - width) / 2 + focusedWindow.screenX;
    var top = (focusedWindow.outerHeight - height) / 2 + focusedWindow.screenY;

    var tabs = require('sdk/tabs');
    tabs.open(dataUrl);

    // var settingsWindow = windowUtils.open(dataUrl);
    // console.log('settingsWindow: ', settingsWindow);

    function attachContentScript(tab) {
        if (tab.url === dataUrl) {
            console.log('attaching contentscripts', contentScripts);
            tab.attach({ contentScriptFile: contentScripts });
            tabs.removeListener('load', attachContentScript);
        }
    }

    tabs.on('load', attachContentScript);
}

exports.stringStartsWith = stringStartsWith;
exports.openResourceHTML = openResourceHTML;