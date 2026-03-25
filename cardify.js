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

        // --- ЯДЕРНИЙ УДАР ПО РАМКАХ LAMPA (JS) ---
        if (window.innerWidth <= 768) {
            setTimeout(function() {
                var $render = $(render);
                
                // 1. Вбиваємо відступи головного контейнера екрану
                $render.parents('.activity__body').first().attr('style', 'padding-left: 0 !important; padding-right: 0 !important; overflow-x: hidden !important; width: 100vw !important;');
                
                // 2. Вбиваємо сірий фон, кути та відступи першого блоку (де лежить наш плагін)
                $render.parents('.scroll__item').first().attr('style', 'background: transparent !important; padding: 0 !important; margin: 0 !important; width: 100vw !important; border-radius: 0 !important; box-shadow: none !important;');
                
                // 3. Робимо всі нижні блоки (Актори, Схожі) гарантовано темними
                $render.parents('.scroll__item').first().nextAll('.scroll__item').attr('style', 'background: #141414 !important; padding: 1.5em !important; width: 100vw !important; border-radius: 0 !important;');
                
                // 4. Фізично видаляємо елементи Lampa, які малюють затемнення зверху
                $render.find('.full-start__bg').remove();
                $render.parents('.full-start__wrapper').attr('style', 'background: transparent !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important;');
            }, 50); // Виконуємо одразу після того, як Lampa побудувала сторінку
        }

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
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C