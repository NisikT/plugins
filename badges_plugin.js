(function () {
    'use strict';

    let currentTorrentName = '';

    function detectBadges(title) {
        if (!title) return {};

        title = title.toLowerCase();

        return {
            is4K: /2160p|4k|uhd/.test(title),
            isHDR: /hdr/.test(title),
            isDV: /dolby.?vision| dv /.test(title),
            is51: /5\.1|ddp5\.1|ac3/.test(title),
            isUA: /ukr|ua|ukrainian/.test(title)
        };
    }

    function createBadge(text, extraClass = '') {
        return `<div class="qb-badge ${extraClass}">${text}</div>`;
    }

    function renderBadges(data) {
        let container = document.querySelector('.qb-container');
        if (container) container.remove();

        let infoBlock = document.querySelector('.full-start-new__buttons');
        if (!infoBlock) return;

        let badges = document.createElement('div');
        badges.className = 'qb-container';

        badges.innerHTML += data.is4K ? createBadge('4K') : '';
        badges.innerHTML += data.isHDR ? createBadge('HDR') : '';
        badges.innerHTML += data.isDV ? createBadge('Dolby Vision', 'dolby') : '';
        badges.innerHTML += data.is51 ? createBadge('5.1') : '';
        badges.innerHTML += data.isUA ? createBadge('UA') : '';
        badges.innerHTML += createBadge('17+');
        badges.innerHTML += createBadge('Випущено', 'released');

        infoBlock.appendChild(badges);
    }

    function injectStyles() {
        let style = document.createElement('style');
        style.innerHTML = `
            .qb-container {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                flex-wrap: wrap;
            }

            .qb-badge {
                padding: 6px 14px;
                border-radius: 10px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.4);
                font-size: 16px;
                font-weight: 600;
                color: #fff;
            }

            .qb-badge.dolby {
                font-weight: 700;
                letter-spacing: 0.5px;
            }

            .qb-badge.released {
                background: rgba(255,255,255,0.15);
            }
        `;
        document.head.appendChild(style);
    }

    function listenTorrents() {
        Lampa.Listener.follow('torrent', function (e) {
            if (e.type === 'select') {
                currentTorrentName = e.data.title;
                let detected = detectBadges(currentTorrentName);
                renderBadges(detected);
            }
        });
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            setTimeout(() => {
                if (currentTorrentName) {
                    renderBadges(detectBadges(currentTorrentName));
                }
            }, 500);
        }
    });

    injectStyles();
    listenTorrents();
})();