let { stringStartsWith } = require('./utils.js');

let prefixes = ['http://', 'https://', '//', '.'];
function domainOf(uri, defaultDomain) {
    if (typeof uri !== 'string') {
        console.trace();
        throw "uri is not a String but a " + typeof uri;
    }

    if (!uri || uri.length === 0) {
        return undefined;
    }

    defaultDomain = defaultDomain || '__default__';

    for (let i = 0; i < prefixes.length; i++) {
        let prefix = prefixes[i];

        if (stringStartsWith(uri, prefix)) {
            uri = uri.substring(prefix.length);
            break;
        }
    }

    let idx = uri.indexOf('/');
    if (idx >= 0) {
        return uri.substring(0, idx);
    }

    idx = uri.indexOf('*');
    if (idx >= 0) {
        return uri.substring(0, idx);
    }

    let isDomain = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,})$/.test(uri);
    if (isDomain) {
        return uri;
    } else {
        return defaultDomain;
    }
}

function allDomainsOf(domain) {
    if (!domain || domain.length === 0) {
        return [];
    }

    let parts = domain.split('.');
    if (parts.length <= 2) {
        return [domain];
    } else {
        let ret = [];
        for (let i = 0; i <= parts.length - 2; i++) {
            ret.push(parts.slice(i, parts.length).join('.'));
        }

        return ret;
    }
}

exports.domainOf = domainOf;
exports.allDomainsOf = allDomainsOf;