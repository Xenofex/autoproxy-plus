function stringStartsWith(string, prefix) {
    if (string) {
        return string.lastIndexOf(prefix, 0) === 0;
    } else {
        return false;
    }
}

exports.stringStartsWith = stringStartsWith;