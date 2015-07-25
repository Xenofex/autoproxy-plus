let {Cc, Ci} = require('chrome');

function makeUri(url) {
    // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIURI
    var ioService = Cc["@mozilla.org/network/io-service;1"]
                  .getService(Ci.nsIIOService);
    return ioService.newURI(url, 'ascii', null);
}

exports.makeUri = makeUri;

