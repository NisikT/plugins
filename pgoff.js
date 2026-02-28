(function () {
    'use strict';

    function startPlugin() {
        if (!window.Lampa) return;

        // Додаємо налаштування
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'cardify_hide_pg',
                type: 'checkbox',
                default: false
            },
            field: {
                name: 'Приховати віковий рейтинг (PG)',
                description: 'Прибирає 12+, 16+, 18+ у картці Cardify'
            }
        });

        // Слухаємо відкриття будь-якої активності
        Lampa.Listener.follow('activity', function (e) {

            if (!Lampa.Storage.get('cardify_hide_pg', false)) return;
            if (!e.object || !e.object.activity) return;

            setTimeout(function () {

                var render = e.object.activity.render();
                if (!render) return;

                // Перевіряємо що це саме Cardify
                if (render.find('.full-start-new').length) {
                    render.find('.full-start__pg').hide();
                }

            }, 100);
        });

        console.log('Cardify PG Hider loaded');
    }

    if (window.appready) startPlugin();
    else window.addEventListener('appready', startPlugin);

})();
