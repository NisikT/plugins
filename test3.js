(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (Lampa.Manifest.app_digital < 300) return; // Тільки для v3.0.0+

    // Флаг, щоб уникнути повторної ініціалізації
    if (window.plugin_new_interface_logo_ready) return;
    window.plugin_new_interface_logo_ready = true;

    // ==============================
    // ❌ REMOVED:
    // - new interface (InfoPanel)
    // - background system
    // - card resizing / netflix style
    // ==============================

    // ==============================
    // ✅ KEEP: CHILD MODE API HOOK
    // ==============================
    (function initChildModeApiHook() {
        if (!Lampa.TMDB || !Lampa.TMDB.api) return;

        var originalApi = Lampa.TMDB.api;

        Lampa.TMDB.api = function (url) {
            if (Lampa.Storage.get("child_mode", false)) {
                if (
                    url.indexOf("discover/") !== -1 ||
                    url.indexOf("trending/") !== -1 ||
                    url.indexOf("movie/") !== -1 ||
                    url.indexOf("tv/") !== -1
                ) {
                    if (url.indexOf("certification") === -1) {
                        var separator = url.indexOf("?") !== -1 ? "&" : "?";
                        url += separator + "certification_country=RU&certification.lte=16&include_adult=false";
                    }
                }
                if (url.indexOf("search/") !== -1 && url.indexOf("include_adult") === -1) {
                    var separator = url.indexOf("?") !== -1 ? "&" : "?";
                    url += separator + "include_adult=false";
                }
            }
            return originalApi(url);
        };
    })();

    // ========== ДОДАЄМО ПЕРЕКЛАДИ ==========
    Lampa.Lang.add({
        new_interface_name: {
            en: 'New interface',
            uk: 'Новий інтерфейс',
            ru: 'Новый интерфейс'
        },
        new_interface_desc: {
            en: 'Enable enhanced viewing interface with background and detailed information',
            uk: 'Увімкнення розширеного інтерфейсу з фоном та детальною інформацією',
            ru: 'Включение расширенного интерфейса с фоном и подробной информацией'
        },
        logo_name: {
            en: 'Logos instead of titles',
            uk: 'Логотипи замість назв',
            ru: 'Логотипы вместо названий'
        },
        logo_desc: {
            en: 'Show movie/series logos instead of text in fullscreen view',
            uk: 'Показує логотипи фільмів/серіалів замість тексту в повноекранному перегляді',
            ru: 'Показывает логотипы фильмов/сериалов вместо текста в полноэкранном просмотре'
        }
    });

    // ========== НАЛАШТУВАННЯ В МЕНЮ ==========
    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'new_interface',
            type: 'trigger',
            default: true  // За замовчуванням увімкнено
        },
        field: {
            name: Lampa.Lang.translate('new_interface_name'),
            description: Lampa.Lang.translate('new_interface_desc')
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'logo_glav',
            type: 'select',
            values: {
                1: 'Вимкнути',
                0: 'Увімкнути',
            },
            default: '0', // За замовчуванням увімкнені
        },
        field: {
            name: Lampa.Lang.translate('logo_name'),
            description: Lampa.Lang.translate('logo_desc'),
        }
    });

    // ========== ОСНОВНА ЛОГІКА НОВОГО ІНТЕРФЕЙСУ ==========

    function startNewInterface() {
        if (!Lampa.Maker || !Lampa.Maker.map || !Lampa.Utils) return;
        
        addStyles();
        applyGlobalCardFix(); // Додаємо глобальний фікс для карток

        const mainMap = Lampa.Maker.map('Main');
        if (!mainMap || !mainMap.Items || !mainMap.Create) return;

        wrap(mainMap.Items, 'onInit', function (original, args) {
            if (original) original.apply(this, args);
            this.__newInterfaceEnabled = shouldUseNewInterface(this && this.object);
        });

        wrap(mainMap.Create, 'onCreate', function (original, args) {
            if (original) original.apply(this, args);
            if (!this.__newInterfaceEnabled) return;
            const state = ensureState(this);
            state.attach();
        });

        wrap(mainMap.Create, 'onCreateAndAppend', function (original, args) {
            const element = args && args[0];
            if (this.__newInterfaceEnabled && element) {
                prepareLineData(element);
            }
            return original ? original.apply(this, args) : undefined;
        });

        wrap(mainMap.Items, 'onAppend', function (original, args) {
            if (original) original.apply(this, args);
            if (!this.__newInterfaceEnabled) return;
            const item = args && args[0];
            const element = args && args[1];
            if (item && element) attachLineHandlers(this, item, element);
        });

        wrap(mainMap.Items, 'onDestroy', function (original, args) {
            if (this.__newInterfaceState) {
                this.__newInterfaceState.destroy();
                delete this.__newInterfaceState;
            }
            delete this.__newInterfaceEnabled;
            if (original) original.apply(this, args);
        });
    }

    // ========== ДОДАЄМО ПЕРЕКЛАДИ ==========
    function applyGlobalCardFix() {
        const styleId = 'new_interface_global_card_fix';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .new-interface .card:not(.card--wide):not(.card--small):not(.card--more) {
                width: 18.3em !important;
            }
            .new-interface .card:not(.card--wide):not(.card--small):not(.card--more) .card__view {
                padding-bottom: 56% !important;
            }
            
            .new-interface .card--collection:not(.card--wide) {
                width: 34.3em !important;
            }
            .new-interface .card--collection:not(.card--wide) .card__view {
                padding-bottom: 56% !important;
            }
            
            .new-interface .card:not(.card--wide):not(.card--small) {
                position: relative;
            }
            .new-interface .card:not(.card--wide):not(.card--small)::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                border-radius: 0.6em;
                box-shadow: 0 0.3em 0.6em rgba(0, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    function shouldUseNewInterface(object) {
        if (!object) return false;
        if (!(object.source === 'tmdb' || object.source === 'cub')) return false;
        if (window.innerWidth < 767) return false;
        
        if (!Lampa.Storage.field('new_interface')) return false;
        
        return true;
    }

    function ensureState(main) {
        if (main.__newInterfaceState) return main.__newInterfaceState;
        const state = createInterfaceState(main);
        main.__newInterfaceState = state;
        return state;
    }

    function createInterfaceState(main) {
        const info = new InterfaceInfo();
        info.create();

        const background = document.createElement('img');
        background.className = 'full-start__background';

        const state = {
            main,
            info,
            background,
            infoElement: null,
            backgroundTimer: null,
            backgroundLast: '',
            attached: false,
            attach() {
                if (this.attached) return;

                const container = main.render(true);
                if (!container) return;

                container.classList.add('new-interface');

                if (!background.parentElement) {
                    container.insertBefore(background, container.firstChild || null);
                }

                const infoNode = info.render(true);
                this.infoElement = infoNode;

                if (infoNode && infoNode.parentNode !== container) {
                    if (background.parentElement === container) {
                        container.insertBefore(infoNode, background.nextSibling);
                    } else {
                        container.insertBefore(infoNode, container.firstChild || null);
                    }
                }

                main.scroll.minus(infoNode);

                this.attached = true;
            },
            update(data) {
                if (!data) return;
                info.update(data);
                this.updateBackground(data);
            },
            updateBackground(data) {
                const path = data && data.backdrop_path ? Lampa.Api.img(data.backdrop_path, 'w1280') : '';

                if (!path || path === this.backgroundLast) return;

                clearTimeout(this.backgroundTimer);

                this.backgroundTimer = setTimeout(() => {
                    background.classList.remove('loaded');

                    background.onload = () => background.classList.add('loaded');
                    background.onerror = () => background.classList.remove('loaded');

                    this.backgroundLast = path;

                    setTimeout(() => {
                        background.src = this.backgroundLast;
                    }, 300);
                }, 1000);
            },
            reset() {
                info.empty();
            },
            destroy() {
                clearTimeout(this.backgroundTimer);
                info.destroy();

                const container = main.render(true);
                if (container) container.classList.remove('new-interface');

                if (this.infoElement && this.infoElement.parentNode) {
                    this.infoElement.parentNode.removeChild(this.infoElement);
                }

                if (background && background.parentNode) {
                    background.parentNode.removeChild(background);
                }

                this.attached = false;
            }
        };

        return state;
    }

    function prepareLineData(element) {
        if (!element) return;
        if (Array.isArray(element.results)) {
            Lampa.Utils.extendItemsParams(element.results, {
                style: {
                    name: 'wide'
                }
            });
        }
    }

    function updateCardTitle(card) {
        if (!card || typeof card.render !== 'function') return;

        const element = card.render(true);
        if (!element) return;

        if (!element.isConnected) {
            clearTimeout(card.__newInterfaceLabelTimer);
            card.__newInterfaceLabelTimer = setTimeout(() => updateCardTitle(card), 50);
            return;
        }

        clearTimeout(card.__newInterfaceLabelTimer);

        const text = (card.data && (card.data.title || card.data.name || card.data.original_title || card.data.original_name)) ? (card.data.title || card.data.name || card.data.original_title || card.data.original_name).trim() : '';

        const seek = element.querySelector('.new-interface-card-title');

        if (!text) {
            if (seek && seek.parentNode) seek.parentNode.removeChild(seek);
            card.__newInterfaceLabel = null;
            return;
        }

        let label = seek || card.__newInterfaceLabel;

        if (!label) {
            label = document.createElement('div');
            label.className = 'new-interface-card-title';
        }

        label.textContent = text;

        if (!label.parentNode || label.parentNode !== element) {
            if (label.parentNode) label.parentNode.removeChild(label);
            element.appendChild(label);
        }

        card.__newInterfaceLabel = label;
    }

    function decorateCard(state, card) {
        if (!card || card.__newInterfaceCard || typeof card.use !== 'function' || !card.data) return;

        card.__newInterfaceCard = true;

        card.params = card.params || {};
        card.params.style = card.params.style || {};

        if (!card.params.style.name) card.params.style.name = 'wide';

        card.use({
            onFocus() {
                state.update(card.data);
            },
            onHover() {
                state.update(card.data);
            },
            onTouch() {
                state.update(card.data);
            },
            onVisible() {
                updateCardTitle(card);
            },
            onUpdate() {
                updateCardTitle(card);
            },
            onDestroy() {
                clearTimeout(card.__newInterfaceLabelTimer);
                if (card.__newInterfaceLabel && card.__newInterfaceLabel.parentNode) {
                    card.__newInterfaceLabel.parentNode.removeChild(card.__newInterfaceLabel);
                }
                card.__newInterfaceLabel = null;
                delete card.__newInterfaceCard;
            }
        });

        updateCardTitle(card);
    }

    function getCardData(card, element, index = 0) {
        if (card && card.data) return card.data;
        if (element && Array.isArray(element.results)) return element.results[index] || element.results[0];
        return null;
    }

    function getDomCardData(node) {
        if (!node) return null;

        let current = node && node.jquery ? node[0] : node;

        while (current && !current.card_data) {
            current = current.parentNode;
        }

        return current && current.card_data ? current.card_data : null;
    }

    function getFocusedCardData(line) {
        const container = line && typeof line.render === 'function' ? line.render(true) : null;
        if (!container || !container.querySelector) return null;

        const focus = container.querySelector('.selector.focus') || container.querySelector('.focus');

        return getDomCardData(focus);
    }

    function attachLineHandlers(main, line, element) {
        if (line.__newInterfaceLine) return;
        line.__newInterfaceLine = true;

        const state = ensureState(main);
        const applyToCard = (card) => decorateCard(state, card);

        line.use({
            onInstance(card) {
                applyToCard(card);
            },
            onActive(card, itemData) {
                const current = getCardData(card, itemData);
                if (current) state.update(current);
            },
            onToggle() {
                setTimeout(() => {
                    const domData = getFocusedCardData(line);
                    if (domData) state.update(domData);
                }, 32);
            },
            onMore() {
                state.reset();
            },
            onDestroy() {
                state.reset();
                delete line.__newInterfaceLine;
            }
        });

        if (Array.isArray(line.items) && line.items.length) {
            line.items.forEach(applyToCard);
        }

        if (line.last) {
            const lastData = getDomCardData(line.last);
            if (lastData) state.update(lastData);
        }
    }

    function wrap(target, method, handler) {
        if (!target) return;
        const original = typeof target[method] === 'function' ? target[method] : null;
        target[method] = function (...args) {
            return handler.call(this, original, args);
        };
    }

    function addStyles() {
        if (addStyles.added) return;
        addStyles.added = true;

        Lampa.Template.add('new_interface_logo_styles', `<style>
        .new-interface {
            position: relative;
        }

        .new-interface .card.card--wide {
            width: 18.3em;
        }

        .new-interface-info {
            position: relative;
            padding: 1.5em;
            height: 24em;
        }

        .new-interface-info__body {
            width: 80%;
            padding-top: 1.1em;
        }

        .new-interface-info__head {
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 1em;
            font-size: 1.3em;
            min-height: 1em;
        }

        .new-interface-info__head span {
            color: #fff;
        }

        .new-interface-info__title {
            font-size: 4em;
            font-weight: 600;
            margin-bottom: 0.3em;
            overflow: hidden;
            -o-text-overflow: '.';
            text-overflow: '.';
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
            margin-left: -0.03em;
            line-height: 1.3;
        }

        .new-interface-info__title img {
            max-height: 125px;
            margin-top: 5px;
        }

        .new-interface-info__details {
            margin-bottom: 1.6em;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            min-height: 1.9em;
            font-size: 1.1em;
        }

        .new-interface-info__split {
            margin: 0 1em;
            font-size: 0.7em;
        }

        .new-interface-info__description {
            font-size: 1.2em;
            font-weight: 300;
            line-height: 1.5;
            overflow: hidden;
            -o-text-overflow: '.';
            text-overflow: '.';
            display: -webkit-box;
            -webkit-line-clp: 4;
            line-clamp: 4;
            -webkit-box-orient: vertical;
            width: 70%;
        }

        .new-interface .card-more__box {
            padding-bottom: 95%;
        }

        .new-interface .full-start__background {
            height: 108%;
            top: -6em;
        }

        .new-interface .full-start__rate {
            font-size: 1.3em;
            margin-right: 0;
        }

        .new-interface .card__promo {
            display: none;
        }

        .new-interface .card.card--wide + .card-more .card-more__box {
            padding-bottom: 95%;
        }

        .new-interface .card.card--wide .card-watched {
            display: none !important;
        }

        .new-interface-card-title {
            margin-top: 0.6em;
            font-size: 1.05em;
            font-weight: 500;
            color: #fff