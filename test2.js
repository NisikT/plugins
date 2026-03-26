(function () {
    "use strict";

    // 1. Завантажуємо ідеальний фон (Шукаємо постер без тексту 'xx' або 'null')
    function loadOriginalPoster(e, render, data) {
        var tmdbPath = null;
        var isMobile = window.innerWidth <= 768;

        if (data) {
            if (isMobile) {
                var textlessPoster = null;
                var images = data.images || (e.data && e.data.images) || (e.object && e.object.card && e.object.card.images);
                
                if (images && images.posters && images.posters.length) {
                    var textless = images.posters.filter(function(p) { 
                        return p.iso_639_1 === 'xx' || p.iso_639_1 === null || p.iso_639_1 === ''; 
                    });
                    if (textless.length) {
                        textlessPoster = textless[0].file_path;
                    }
                }
                tmdbPath = textlessPoster || data.poster_path || data.backdrop_path;
            } else {
                tmdbPath = data.backdrop_path || data.poster_path;
            }
        }

        if (tmdbPath) {
            var originalUrl = "https://image.tmdb.org/t/p/original" + tmdbPath;
            render.find('.cardify-custom-bg').remove();
            
            var customBg = $('<div class="cardify-custom-bg"></div>');
            var tempImg = new Image();
            tempImg.onload = function () {
                customBg.css('background-image', 'url(' + originalUrl + ')');
                customBg.addClass('loaded');
            };
            tempImg.src = originalUrl;
            render.prepend(customBg);
        }
    }

    // 2. Встановлюємо Логотип замість тексту
    function applyLogoAndTitle(render, data, e) {
        var images = data.images || (e.data && e.data.images) || (e.object && e.object.card && e.object.card.images);
        if (!images || !images.logos || !images.logos.length) return;

        var logos = images.logos;
        var logoUk = logos.filter(function(l) { return l.iso_639_1 === 'uk'; })[0];
        var logoEn = logos.filter(function(l) { return l.iso_639_1 === 'en'; })[0];
        var logoToUse = logoUk || logoEn || logos[0];

        if (logoToUse) {
            var locTitle = data.title || data.name || "";
            var origTitle = data.original_title || data.original_name || "";
            var subTitleText = (logoToUse.iso_639_1 === 'uk') ? origTitle : locTitle;

            var titleContainer = render.find('.full-start-new__title');
            var logoUrl = "https://image.tmdb.org/t/p/w500" + logoToUse.file_path;
            
            var html = '<img src="' + logoUrl + '" class="cardify-logo" alt="Logo"/>';
            if (subTitleText) {
                html += '<div class="cardify-sub-title">' + subTitleText + '</div>';
            }
            titleContainer.html(html);
        }
    }

    // 3. Обробка UI та ЖОРСТКЕ видалення рамок Lampa
    function applyCardifyUI(e) {
        var render = e.object.activity.render();
        var component = e.object.activity.component;
        var data = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card ? e.object.card : null);        

        var details = render.find(".full-start-new__details");
        if (details.length) {
            var nextEpisodeSpan = null;
            details.children("span").each(function () {
                var $span = $(this);
                if (!$span.hasClass("full-start-new__split") && $span.text().indexOf("/") !== -1) {
                    nextEpisodeSpan = $span;
                    return false;
                }
            });
            if (nextEpisodeSpan) {
                var prevSplit = nextEpisodeSpan.prev(".full-start-new__split");
                var nextSplit = nextEpisodeSpan.next(".full-start-new__split");
                nextEpisodeSpan.detach();
                if (prevSplit.length && nextSplit.length) nextSplit.remove();
                else { prevSplit.remove(); nextSplit.remove(); }
                nextEpisodeSpan.css("width", "100%");
                details.append(nextEpisodeSpan);
            }
        }

        render.find(".full-start__pg, .full-start__status, .full-start__tag, .full-start__background").hide();
        if (!Lampa.Storage.field("cardify_show_rating")) {
            render.find(".full-start-new__rate-line.rate-fix").hide();
        }

        if (data) {
            loadOriginalPoster(e, render, data);
            applyLogoAndTitle(render, data, e);
        }

        if (component && component.rows && component.items && component.scroll && component.emit) {
            var add = component.rows.slice(component.items.length);
            if (add.length) {
                component.fragment = document.createDocumentFragment();
                add.forEach(function (row) { component.emit("createAndAppend", row); });
                component.scroll.append(component.fragment);
                if (Lampa.Layer) Lampa.Layer.visible(component.scroll.render());
            }
        }
    }
    // 4. Ініціалізація HTML-шаблону
    function initTemplatesAndStyles() {
        Lampa.Template.add(
            "full_start_new",
            `<div class="full-start-new cardify">
        <div class="full-start-new__body">
            <div class="full-start-new__left hide">
                <div class="full-start-new__poster">
                    <img class="full-start-new__img full--poster" />
                </div>
            </div>

            <div class="full-start-new__right">
                
                <div class="cardify__left">
                    <div class="full-start-new__head"></div>
                    <div class="full-start-new__title">{title}</div>

                    <div class="full-start-new__rate-line rate-fix">
                        <div class="full-start__rate rate--tmdb"><div>{rating}</div><div class="source--name">TMDB</div></div>
                        <div class="full-start__rate rate--imdb hide"><div></div><div>IMDB</div></div>
                        <div class="full-start__rate rate--kp hide"><div></div><div>KP</div></div>
                        <div class="full-start__rate rate--cub hide"><div></div><div>CUB</div></div>
                    </div>

                    <div class="cardify__details">
                        <div class="full-start-new__details"></div>
                    </div>

                    <div class="cardify-buttons-scroll">
                        <div class="full-start-new__buttons full-start__buttons">
                            <div class="full-start__button selector button--play">
                                <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>
                                    <path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>
                                </svg>
                                <span>#{title_watch}</span>
                            </div>

                            <div class="full-start__button selector button--book">
                                <svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>
                                </svg>
                                <span>#{settings_input_links}</span>
                            </div>

                            <div class="full-start__button selector button--reaction">
                                <svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>
                                    <path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>
                                </svg>
                                <span>#{title_reactions}</span>
                            </div>

                            <div class="full-start__button selector button--options">
                                <svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>
                                    <circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>
                                    <circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>
                                </svg>
                            </div>

                            <div class="hide buttons--container" style="display:flex; gap:0.6em;">
                                <div class="full-start__button view--torrent hide">
                                    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 50 50" width="50px" height="50px">
                                        <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>
                                    </svg>
                                    <span>#{full_torrents}</span>
                                </div>
                                <div class="full-start__button selector view--trailer">
                                    <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"></path>
                                    </svg>
                                    <span>#{full_trailers}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cardify__right">
                    <div class="full-start-new__reactions selector">
                        <div>#{reactions_none}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
        );
    }
    // 5. Запуск плагіна, CSS та підключення до ядра
    function startPlugin() {
        initTemplatesAndStyles();

        // АНТИКЕШ: Перезаписуємо стилі напряму в head, щоб Lampa не підтягувала старе
        $('#cardify-mobile-styles').remove();
        var style = `
        <style id="cardify-mobile-styles">
        .cardify{-webkit-transition:all .3s;-o-transition:all .3s;-moz-transition:all .3s;transition:all .3s}
        .cardify .full-start-new__body{height:80vh; position: relative; z-index: 2;}
        .cardify .full-start-new__right{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;-moz-box-align:end;-ms-flex-align:end;align-items:flex-end}
        .cardify .full-start-new__title{text-shadow:0 0 .1em rgba(0,0,0,0.3); display:flex; flex-direction:column; align-items:flex-start; width:100%;}
        .cardify__left{-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1}
        .cardify__right{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;position:relative}
        .cardify__details{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}
        .cardify .full-start-new__reactions{margin:0;margin-right:-2.8em}
        .cardify .full-start-new__reactions:not(.focus){margin:0}
        .cardify .full-start-new__reactions:not(.focus)>div:not(:first-child){display:none}
        .cardify .full-start-new__reactions:not(.focus) .reaction{position:relative}
        .cardify .full-start-new__reactions:not(.focus) .reaction__count{position:absolute;top:28%;left:95%;font-size:1.2em;font-weight:500}
        .cardify .full-start-new__rate-line.rate-fix{margin: 1em 0 1.7em 0}
        .full-start-new__details{margin:0 0 1.4em -0.3em;}
        .full-start-new__rate-line{margin:0;margin-left:3.5em}
        .cardify .full-start-new__rate-line>*:last-child{margin-right:0 !important}
        .cardify.nodisplay{-webkit-transform:translate3d(0,50%,0);-moz-transform:translate3d(0,50%,0);transform:translate3d(0,50%,0);opacity:0}

        /* Логотипи та субтитри */
        .cardify-logo { max-width: 45%; max-height: 40px; object-fit: contain; margin-bottom: 0.5em; filter: drop-shadow(0px 2px 8px rgba(0,0,0,0.8)); }
        .cardify-sub-title { font-size: 0.55em; font-weight: 500; opacity: 0.75; margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 1px; }

        /* Приховуємо вікові обмеження, 4K та інше */
        .full-start__tag, .full-start__pg, .full-start__status { display: none !important; }

        /* ТВ ВЕРСІЯ (Залишаємо як було) */
        .cardify-custom-bg {
            position: absolute; top: 0; left: 0; right: 0; height: 100vh;
            background-size: cover; background-position: center top; z-index: 0; opacity: 0; transition: opacity 0.5s ease;
            -webkit-mask-image: linear-gradient(to bottom, white 50%, rgba(255,255,255,0) 100%);
            mask-image: linear-gradient(to bottom, white 50%, rgba(255,255,255,0) 100%);
        }
        .cardify-custom-bg.loaded { opacity: 1; }

        /* АДАПТАЦІЯ ДЛЯ ТЕЛЕФОНІВ */
        @media (max-width: 768px) {
            
            /* 1. РОЗШИРЮЄМО НА ВЕСЬ ЕКРАН */
            body, html, .activity, .activity__body {
                overflow-x: hidden !important;
                width: 100vw !important;
                max-width: 100vw !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            .activity[data-component="full"] .activity__body > .scroll__item {
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                width: 100vw !important;
                box-sizing: border-box !important;
            }

            /* 2. ЗНИЩУЄМО ВЕРХНЮ ПЛАШКУ LAMPA */
            .activity[data-component="full"] .activity__body > .scroll__item:first-child,
            .full-start__wrapper, .full-start__bg, .full-start-new, .cardify {
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                margin: 0 !important;
            }

            /* 3. УСІ НИЖНІ БЛОКИ (Актори, Схожі) НА ТЕМНОМУ ФОНІ */
            .activity[data-component="full"] .activity__body > .scroll__item:not(:first-child) {
                background: rgba(20,20,20,0.85) !important;
                padding: 1.5em !important;
            }
            
            .cardify .full-start-new__left { display: none !important; }
            
            /* 4. ФІКСОВАНИЙ ФОН: Чистий постер без плівки */
            .cardify-custom-bg {
                position: fixed !important;
                top: 0 !important; left: 0 !important;
                height: 100vh !important;
                width: 100vw !important;
                background-position: top center !important;
                -webkit-mask-image: none !important;
                mask-image: none !important;
                z-index: -2 !important;
            }
            .cardify-custom-bg::after { display: none !important; }

            /* 5. ГРАДІЄНТ НА РУХОМОМУ БЛОЦІ: ВЕРХ 100% ПРОЗОРИЙ */
            .cardify .full-start-new__body {
                height: auto !important;
                min-height: 85vh;
                flex-direction: column;
                justify-content: flex-end;
                padding-top: 45vh !important;
                padding-bottom: 1.5em !important;
                box-sizing: border-box;
                width: 100vw !important;
                /* Зверху 0%, з середини починає темніти до 85% */
                background: linear-gradient(to bottom, rgba(20,20,20,0) 0%, rgba(20,20,20,0) 25%, rgba(20,20,20,0.5) 60%, rgba(20,20,20,0.85) 100%) !important;
            }
            
            .cardify .full-start-new__right {
                flex-direction: column;
                align-items: flex-start;
                width: 100vw !important;
                padding: 0 1.2em !important;
                box-sizing: border-box;
            }
            
            .cardify__left { width: 100%; position: relative; z-index: 2; }
            .cardify__right { width: 100%; margin-top: 1em; justify-content: flex-start; }
            
            .full-start-new__title { font-size: 2.2em !important; }
            
            /* 6. ГОРИЗОНТАЛЬНИЙ СКРОЛЛ КНОПОК */
            .cardify-buttons-scroll {
                display: flex;
                overflow-x: auto;
                overflow-y: hidden;
                width: 100%;
                padding-bottom: 10px; 
                margin-top: 1em;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
            }
            .cardify-buttons-scroll::-webkit-scrollbar { display: none; }
            .cardify-buttons-scroll .full-start__buttons,
            .cardify-buttons-scroll .buttons--container {
                display: flex;
                flex-wrap: nowrap !important;
                gap: 0.6em;
            }
            .cardify-buttons-scroll .full-start__button {
                flex-shrink: 0;
                white-space: nowrap;
                margin: 0 !important;
            }
        }
        </style>`;
        $('head').append(style);

        var icon = '<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <rect x="1.5" y="1.5" width="33" height="25" rx="3.5" stroke="white" stroke-width="3"/>\n        <rect x="5" y="14" width="17" height="4" rx="2" fill="white"/>\n        <rect x="5" y="20" width="10" height="3" rx="1.5" fill="white"/>\n        <rect x="25" y="20" width="6" height="3" rx="1.5" fill="white"/>\n    </svg>';
        
        Lampa.SettingsApi.addComponent({
            component: "cardify",
            icon: icon,
            name: "Cardify"
        });
        
        Lampa.SettingsApi.addParam({
            component: "cardify",
            param: { name: "cardify_show_rating", type: "trigger", default: true },
            field: { name: "Показывать рейтинг" }
        });

        Lampa.Listener.follow("full", function (e) {
            if (e.type == "complite") {
                applyCardifyUI(e);
            }
        });
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow("app", function (e) {
            if (e.type == "ready") startPlugin();
        });
    }

})();
