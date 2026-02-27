(function () {
  'use strict';

  var cardBadgesCache = {};
  var pluginPath = 'https://crowley38.github.io/Icons/';

  var svgIcons = {
    '4K': pluginPath + '4K.svg',
    '2K': pluginPath + '2K.svg',
    'FULL HD': pluginPath + 'FULL HD.svg',
    'HD': pluginPath + 'HD.svg',
    'HDR': pluginPath + 'HDR.svg',
    'Dolby Vision': pluginPath + 'Dolby Vision.svg',
    '7.1': pluginPath + '7.1.svg',
    '5.1': pluginPath + '5.1.svg',
    '4.0': pluginPath + '4.0.svg',
    '2.0': pluginPath + '2.0.svg',
    'DUB': pluginPath + 'DUB.svg',
    'UKR': pluginPath + 'UKR.svg' // Твоя нова іконка
  };

  function getBest(results) {
    var best = { resolution: null, hdr: false, dolbyVision: false, audio: null, dub: false, ukr: false };
    var resOrder = ['HD', 'FULL HD', '2K', '4K'];
    var audioOrder = ['2.0', '4.0', '5.1', '7.1'];

    var limit = Math.min(results.length, 20);
    for (var i = 0; i < limit; i++) {
      var item = results[i];
      var title = (item.Title || '').toLowerCase();

      if (title.indexOf('ukr') >= 0 || title.indexOf('укр') >= 0 || title.indexOf('ua') >= 0) best.ukr = true;

      var foundRes = null;
      if (title.indexOf('4k') >= 0 || title.indexOf('2160') >= 0 || title.indexOf('uhd') >= 0) foundRes = '4K';
      else if (title.indexOf('2k') >= 0 || title.indexOf('1440') >= 0) foundRes = '2K';
      else if (title.indexOf('1080') >= 0 || title.indexOf('fhd') >= 0 || title.indexOf('full hd') >= 0) foundRes = 'FULL HD';
      else if (title.indexOf('720') >= 0 || title.indexOf('hd') >= 0) foundRes = 'HD';

      if (foundRes && (!best.resolution || resOrder.indexOf(foundRes) > resOrder.indexOf(best.resolution))) best.resolution = foundRes;

      if (item.ffprobe && Array.isArray(item.ffprobe)) {
        item.ffprobe.forEach(function(stream) {
          if (stream.codec_type === 'video') {
            var h = parseInt(stream.height || 0);
            var w = parseInt(stream.width || 0);
            var res = null;
            if (h >= 2160 || w >= 3840) res = '4K';
            else if (h >= 1440 || w >= 2560) res = '2K';
            else if (h >= 1080 || w >= 1920) res = 'FULL HD';
            else if (h >= 720 || w >= 1280) res = 'HD';

            if (res && (!best.resolution || resOrder.indexOf(res) > resOrder.indexOf(best.resolution))) best.resolution = res;
            if (stream.side_data_list && JSON.stringify(stream.side_data_list).indexOf('Vision') >= 0) best.dolbyVision = true;
            if (stream.color_transfer === 'smpte2084' || stream.color_transfer === 'arib-std-b67') best.hdr = true;
          }
          if (stream.codec_type === 'audio' && stream.channels) {
            var ch = parseInt(stream.channels);
            var aud = (ch >= 8) ? '7.1' : (ch >= 6) ? '5.1' : (ch >= 4) ? '4.0' : '2.0';
            if (!best.audio || audioOrder.indexOf(aud) > audioOrder.indexOf(best.audio)) best.audio = aud;
          }
        });
      }

      if (title.indexOf('vision') >= 0 || title.indexOf('dovi') >= 0) best.dolbyVision = true;
      if (title.indexOf('hdr') >= 0) best.hdr = true;
      if (title.indexOf('dub') >= 0 || title.indexOf('дубл') >= 0) best.dub = true;
    }

    if (best.dolbyVision) best.hdr = true;
    return best;
  }

  function createBadgeImg(type, isCard, index) {
    var iconPath = svgIcons[type];
    if (!iconPath) return '';
    var className = isCard ? 'card-quality-badge' : 'quality-badge';
    var delay = (index * 0.08) + 's';
    return '<div class="' + className + '" style="animation-delay: ' + delay + '"><img src="' + iconPath + '" draggable="false" oncontextmenu="return false;"></div>';
  }

  function addCardBadges(card, best) {
    if (card.find('.card-quality-badges').length) return;
    var badges = [];

    // Горизонтальний порядок: [UKR] [4K] [HDR]
    if (best.ukr) badges.push(createBadgeImg('UKR', true, badges.length));
    if (best.resolution) badges.push(createBadgeImg(best.resolution, true, badges.length));
    if (best.hdr) badges.push(createBadgeImg('HDR', true, badges.length));

    // Можна додати додаткові бейджі тут, якщо потрібно (audio, dub, Dolby Vision)

    if (badges.length) card.find('.card__view').append('<div class="card-quality-badges">' + badges.join('') + '</div>');
  }

  function processCards() {
    $('.card:not(.qb-processed)').addClass('qb-processed').each(function() {
      var card = $(this);
      var movie = card.data('item');
      if (movie && Lampa.Storage.field('parser_use')) {
        Lampa.Parser.get({ search: movie.title || movie.name, movie: movie, page: 1 }, function(response) {
          if (response && response.Results) addCardBadges(card, getBest(response.Results));
        });
      }
    });
  }

  setInterval(processCards, 3000);

  var style = '<style>\
    .card-quality-badges { \
      position: absolute; \
      top: 0.5rem; \
      left: 0.5rem; \
      display: flex; \
      flex-direction: row; \
      gap: 0.3em; \
      z-index: 10; \
    }\
    .card-quality-badge { \
      height: 1em; \
      width: auto; \
    }\
    .card-quality-badge img { \
      height: 100%; \
      width: auto; \
      display: block; \
      filter: drop-shadow(0 1px 2px #000); \
    }\
    @media (max-width: 768px) { \
      .card-quality-badges { top: 0.3rem; left: 0.3rem; gap: 0.25em; } \
      .card-quality-badge { height: 0.9em; } \
    }\
  </style>';
  $('body').append(style);

  console.log('[QualityBadges] Горизонтальне розташування для UKR + 4K + HDR запущено');
})();
