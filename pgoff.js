(function () {
    'use strict';

    function startPlugin() {
        if (!window.Lampa) return;

        // Добавляем настройку
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'hide_pg_rating',
                type: 'trigger',
                default: false
            },
            field: {
                name: 'Скрывать возрастной рейтинг (PG)',
                description: 'Убирает 12+, 16+, 18+ из карточки фильма'
            }
        });

        // Слушаем открытие карточки
        Lampa.Listener.follow('full', function (e) {

            if (!Lampa.Storage.get('hide_pg_rating', false)) return;

            setTimeout(function () {

                if (!e.object || !e.object.activity) return;

                var render = e.object.activity.render();
                if (!render) return;

                // Скрываем возрастной рейтинг
                render.find('.full-start__pg').hide();

            }, 0);
        });

        console.log('PG Rating Hider loaded');
    }

    if (window.appready) startPlugin();
    else window.addEventListener('appready', startPlugin);

})();