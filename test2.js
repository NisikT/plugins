(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (Lampa.Manifest.app_digital < 300) return;

    if (window.plugin_new_interface_logo_ready) return;
    window.plugin_new_interface_logo_ready = true;

    // ==============================
    // ✅ SETTINGS + CHILD MODE + COLOR RATINGS INTEGRATION
    // ==============================

    var globalInfoCache = {};

    function preloadData(data) {
        if (!data || !data.id) return;
        var source = data.source || 'tmdb';
        if (source !== 'tmdb') return;
        var mediaType = data.media_type === 'tv' ? 'tv' : 'movie';
        var language = Lampa.Storage.get('language') || 'ru';
        var apiUrl = Lampa.TMDB.api(mediaType + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&language=' + language);
        if (!globalInfoCache[apiUrl]) {
            var network = new Lampa.Reguest();
            network.silent(apiUrl, function(response) {
                globalInfoCache[apiUrl] = response;
            });
        }
    }

    function preloadAllVisibleCards() {
        if (!Lampa.Storage.get('async_load', true)) return;
        document.querySelectorAll('.card').forEach(function(card) {
            if (card.card_data) preloadData(card.card_data);
        });
    }

    new MutationObserver(preloadAllVisibleCards).observe(document.body, { childList: true, subtree: true });

    function getColor(v) {
        if (v <= 3) return 'red';
        if (v < 6) return 'orange';
        if (v < 7) return 'cornflowerblue';
        if (v < 8) return 'darkmagenta';
        return 'lawngreen';
    }

    function applyRatingColors() {
        if (!Lampa.Storage.get('si_colored_ratings', true)) return;
        document.querySelectorAll('.card__vote, .full-start__rate').forEach(function(el) {
            var match = el.textContent.match(/(\d+(\.\d+)?)/);
            if (!match) return;
            var v = parseFloat(match[0]);
            el.style.color = getColor(v);
        });
    }

    new MutationObserver(applyRatingColors).observe(document.body, { childList: true, subtree: true });

    function initializeSettings() {
        Lampa.Settings.listener.follow('open', function(event) {
            if (event.name === 'main') {
                if (Lampa.Settings.main().render().find('[data-component="style_interface"]').length === 0) {
                    Lampa.SettingsApi.addComponent({ component: 'style_interface', name: 'Стильный интерфейс' });
                }
                Lampa.Settings.main().update();
                Lampa.Settings.main().render().find('[data-component="style_interface"]').removeClass('hide');
            }
        });

        var params = [
            { name: 'si_colored_ratings', field: 'Цветные рейтинги', onChange: applyRatingColors },
            { name: 'si_rating_border', field: 'Обводка рейтингов' },
            { name: 'child_mode', field: 'Детский режим', onChange: function(){ location.reload(); } },
            { name: 'async_load', field: 'Включить асинхронную загрузку данных' }
        ];

        params.forEach(function(p) {
            Lampa.SettingsApi.addParam({
                component: 'style_interface',
                param: { name: p.name, type: 'trigger', default: true },
                field: { name: p.field },
                onChange: p.onChange || function() {}
            });
        });
    }

    initializeSettings();

    // ==============================
    // ✅ CHILD MODE API HOOK
    // ==============================
    (function initChildModeApiHook() {
        if (!Lampa.TMDB || !Lampa.TMDB.api) return;
        var originalApi = Lampa.TMDB.api;
        Lampa.TMDB.api = function(url) {
            if (Lampa.Storage.get('child_mode', false)) {
                if (/discover\/|trending\/|movie\/|tv\//.test(url) && url.indexOf('certification') === -1) {
                    var sep = url.indexOf('?') !== -1 ? '&' : '?';
                    url += sep + 'certification_country=RU&certification.lte=16&include_adult=false';
                }
                if (url.indexOf('search/') !== -1 && url.indexOf('include_adult') === -1) {
                    var sep2 = url.indexOf('?') !== -1 ? '&' : '?';
                    url += sep2 + 'include_adult=false';
                }
            }
            return originalApi(url);
        };
    })();

    // ==============================
    // Запускаємо оригінальний інтерфейс + лого-плагін
    // ==============================

    startNewInterface();
    startLogosPlugin();

})();
