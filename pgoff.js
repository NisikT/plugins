(function () {
    'use strict';

    function startPlugin() {
        if (!window.Lampa) return;

        // Додаємо налаштування
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'hide_pg_cardify',
                type: 'checkbox',
                default: false
            },
            field: {
                name: 'Приховати віковий рейтинг (Cardify)',
                description: 'Прибирає 12+, 16+, 18+ у картці'
            }
        });

        // Глобальний спостерігач DOM (працює завжди)
        const observer = new MutationObserver(function () {

            if (!Lampa.Storage.get('hide_pg_cardify', false)) return;

            document.querySelectorAll('.full-start__pg').forEach(function (el) {
                el.style.display = 'none';
            });

        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('Cardify PG Hider (3.1.6) loaded');
    }

    if (window.appready) startPlugin();
    else window.addEventListener('appready', startPlugin);

})();
