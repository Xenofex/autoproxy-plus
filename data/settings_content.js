$(function() {
    function stringStartsWith(string, prefix) {
        if (string) {
            return string.lastIndexOf(prefix, 0) === 0;
        } else {
            return false;
        }
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function alertSuccess(msg, msgTime) {
        $('#success-box .header').text(msg);

        $('#success-box').removeClass('visible').addClass('hidden').transition({
            animation: 'fade up', 
            duration: 250, 
            complete: function() {
                setTimeout(function() {
                    $('#success-box').removeClass('visible').addClass('hidden');
                }, msgTime || 500);
            } 
        });
    }


    $('.tabular.menu .item').click(function() {
        var $this = $(this);
        $this.siblings(".active").removeClass('active');
        $this.addClass('active');
        $('.ui.tab').removeClass('active')
        .filter('[data-tab="' + $this.data('tab') + '"]').addClass('active');
    });

    $('#update-subscription').click(function() {
        var newURL = $('#subscription-url').val();

        if (typeof addon !== 'undefined') {
            addon.port.emit('updateSubscriptionURL', newURL);
        }
    });

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
        addon.port.emit('updateProxy', [proxyType, proxyHost, proxyPort].join(':'));
        alertSuccess('Saved');
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
        function findRuleById(id) {
            for (var i = rules.length - 1; i >= 0; i--) {
                if (rules[i].id === id) {
                    return rules[i];
                }
            }

            return null;
        }

        var source = $('#user-rule-template').html();
        var template = Handlebars.compile(source);
        $('#user-rules tbody').html(template({rules: rules}));

        $('.actions .trash').click(function() {
            var $this = $(this);

            if (!$this.data('initialized')) {
                $this.popup({
                    on: 'click',
                    html: 'Sure to delete? <div class="mini negative ui button">Delete</div>'
                }).popup('show');

                $this.data('initialized', true);
            }

            setTimeout(function() {
                var $tr = $this.closest('tr');
                var id = $tr.prop('id');

                $('.ui.popup .ui.negative.button').click(function () {
                    $this.popup('hide');
                    $tr.transition({
                        // animation: 'slide down',
                        complete: function() {
                            $tr.remove();
                        }
                    });

                    if (typeof addon !== 'undefined') {
                        addon.port.emit('removeRule', id);
                    }
                });
            }, 260);
           

        });

        $('.actions .pencil').click(function() {
            var $this = $(this);
            var $template = $('#new-rule-template');

            var id = $this.closest('tr').prop('id');
            var rule = findRuleById(id);

            var html = $template.html();

            if (!$this.data('initialized')) {
                $this.popup({
                    on: 'click',
                    html: html,
                    target: $this.closest('tr').find('td:nth-child(2)')
                }).popup('show');


                $this.data('initialized', true);
            }

             setTimeout(function() {
                var $form = $('.ui.popup #edit-rule');
                function updateRuleInEditForm() {
                    var mode = $form.find('#mode .text').text();
                    var match = $form.find('#match .text').text();
                    var expression = $form.find('#rule-expression').val();

                    rule.isWhitelist = mode.toLowerCase() === 'whitelist';
                    rule.type = match.toLowerCase();
                    rule.expression = expression;

                    if (typeof addon !== 'undefined') {
                        addon.port.emit('updateRule', rule);
                    }

                    var $tr = $this.closest('tr');
                    $tr.find('td:nth-child(1)').html(rule.isWhiteist ? '&#10004;' : '');
                    $tr.find('td:nth-child(2)').text(rule.type);
                    $tr.find('td:nth-child(3)').text(rule.expression);
                }

                $form.find('.ui.dropdown').dropdown({
                    onChange: updateRuleInEditForm
                });
                
                $form.find('#mode .text').text(rule.isWhiteist ? 'Whitelist' : 'Proxy');
                $form.find('#match .text').text(capitaliseFirstLetter(rule.type));
                $form.find('#rule-expression').val(rule.expression).on('change blur', updateRuleInEditForm);
            }, 260);

        });
    }


    // var subscriptions = addon.options.subscriptions;

    if (typeof addon !== 'undefined') {
        window.subscriptions = addon.options.subscriptions;
        window.userProxyRules = addon.options.userProxyRules;
        showSubscriptions(window.subscriptions);
        showUserProxyRules(window.userProxyRules);

        $('#subscription-url').val(addon.options.subscriptionURL);

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

        addon.port.on('subscriptionUpdatedAt', function(date) {
            alertSuccess("Subscription updated at: " + date, 1000);
        });
    } else {
        $.ajax({ url: 'gfwlist.txt', dataType: 'text', success: function(subscriptions) {
            window.subscriptions = subscriptions.split("\n");
            showSubscriptions(window.subscriptions);
        }});      

        window.userProxyRules = [{id: '1', type: "domain", expression: "example.com"}, {id: '2', type: "domain", expression: "example.com"}];
        showUserProxyRules(window.userProxyRules);
    }



});