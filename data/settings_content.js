$(function() {
    function stringStartsWith(string, prefix) {
        if (string) {
            return string.lastIndexOf(prefix, 0) === 0;
        } else {
            return false;
        }
    }

    $('#proxy-type.ui.dropdown').dropdown({onChange: function(value, text) {
        proxyChanged();
    }});

    $('#proxy-host, #proxy-port').on('change', function() {
        proxyChanged();
    });

    var delayedSearch = null;
    $('#search').on('keydown change blur', function() {
        if (delayedSearch) {
            clearTimeout(delayedSearch);
        }

        var query = $(this).val();

        delayedSearch = setTimeout(function() {
        showSubscriptions(window.subscriptions, { type: 'search', query: query });
            delayedSearch = null;
        }, 250);
    });

    function proxyChanged() {
        var proxyType = $('#proxy-type .text').text().toLowerCase();
        var proxyHost = $('#proxy-host').val();
        var proxyPort = $('#proxy-port').val();
        addon.port.emit('proxyChanged', [proxyType, proxyHost, proxyPort].join(':'));
    }

    function showSubscriptions(subscriptions, filter) {
        var subscriptionHtml = "";
        for (var i = 0; i < subscriptions.length; i++) {
            var line = subscriptions[i];
            var title;

            if (filter) {
                if (filter.type === 'domain' && (stringStartsWith(line, '|') || line.indexOf('*') >= 0)) {
                    continue;
                }

                if (filter.type === 'search' && line.indexOf(filter.query) < 0) {
                    continue;
                }
            }


            if (!line.trim() || stringStartsWith(line, '!') || i === 0) {
                subscriptionHtml += '<p class="comment rule">' + line + '</p>';
            } else if (stringStartsWith(line, '@@')) {
                subscriptionHtml += '<p title="' + title + '" class="whitelist rule">' + line + '</p>';
            } else {
                subscriptionHtml += '<p title="' + title + '" class="proxy rule">' + line + '</p>';
            }
        }

        $('#subscription').html(subscriptionHtml);
    }

    function showUserProxyRules(rules) {
        var source = $('#user-rule-template').html();
        var template = Handlebars.compile(source);
        $('#user-rules tbody').html(template({rules: rules}));
    }

    // var subscriptions = addon.options.subscriptions;

    if (typeof addon !== 'undefined') {
        window.subscriptions = addon.options.subscriptions;
        window.userProxyRules = addon.options.userProxyRules;
        showSubscriptions(window.subscriptions);
        showUserProxyRules(window.userProxyRules);

        var proxyConfig = addon.options.proxyConfig;
        if (typeof proxyConfig !== 'undefined' && proxyConfig) {
            var proxySplited = proxyConfig.split(':');
            if (proxySplited.length === 3) {
                $('#proxy-type .text').text(proxySplited[0]);
                $('#proxy-host').val(proxySplited[1]);
                $('#proxy-port').val(proxySplited[2]);
            }
        }

        addon.port.on('subscriptionsChanged', function(subscriptions) {
            window.subscriptions = addon.options.subscriptions;
            showSubscriptions(window.subscriptions);
        });
    } else {
        $.ajax({ url: 'gfwlist.txt', dataType: 'text', success: function(subscriptions) {
            window.subscriptions = subscriptions.split("\n");
            showSubscriptions(window.subscriptions);
        }});      

        window.userProxyRules = [{type: "domain", expression: "example.com"}, {type: "domain", expression: "example.com"}];
        showUserProxyRules(window.userProxyRules);
    }



});