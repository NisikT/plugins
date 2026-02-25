(function () {
    'use strict';

    function createButton() {

        Lampa.Listener.follow('head', function (e) {

            if (e.type === 'ready') {

                // Проверка чтобы не добавить кнопку дважды
                if (document.querySelector('.reload-lampa-btn')) return;

                let button = document.createElement('div');
                button.className = 'head__action reload-lampa-btn selector';
                button.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                        d="M12,6V9L16,5L12,1V4C7.58,4 4,7.58 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.96 6,13 6,12C6,8.69 8.69,6 12,6M18.76,7.74L17.3,9.2C17.75,10.04 18,11 18,12C18,15.31 15.31,18 12,18V15L8,19L12,23V20C16.42,20 20,16.42 20,12C20,10.43 19.54,8.97 18.76,7.74Z"/>
                    </svg>
                `;

                button.addEventListener('hover:enter', function () {
                    location.reload();
                });

                let actions = document.querySelector('.head__actions');
                if (actions) actions.appendChild(button);
            }
        });
    }

    if (window.appready) createButton();
    else document.addEventListener('DOMContentLoaded', createButton);

})();