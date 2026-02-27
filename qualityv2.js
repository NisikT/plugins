// Quality Badges inline before age rating
// Працює при увімкненому парсері

(function () {
  'use strict';

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
    'UKR': pluginPath + 'UKR.svg'
  };

  function getBest(results) {
    var best = { resolution: null, hdr: false, dolbyVision: false, audio: null, dub: false, ukr: false };
    var resOrder = ['HD', 'FULL HD', '2K', '4K'];
    var audioOrder = ['2.0', '4.0', '5.1', '7.1'];

    var limit = Math.min(results.length, 20);

    for (var i = 0; i < limit; i++) {
      var item = results[i];
      var title = (item.Title || '').toLowerCase();

      if (title.includes('ukr') || title.includes('укр') || title.includes('ua'))
        best.ukr = true;

      var foundRes = null;

      if (title.includes('4k') || title.includes('2160') || title.includes('uhd')) foundRes = '4K';
      else if (title.includes('2k') || title.includes('1440')) foundRes = '2K';
      else if (title.includes('1080') || title.includes('fhd') || title.includes('full hd')) foundRes = 'FULL HD';
      else if (title.includes('720') || title.includes('hd')) foundRes = 'HD';

      if (foundRes && (!best.resolution || resOrder.indexOf(foundRes) > resOrder.indexOf(best.resolution)))
        best.resolution = foundRes;

      if (title.includes('vision') || title.includes('dovi')) best.dolbyVision = true;
      if (title.includes('hdr')) best.hdr = true;
      if (title.includes('dub') || title.includes('дубл')) best.dub = true;
    }

    if (best.dolbyVision) best.hdr = true;
    return best;
  }

  function createBadge(type) {
    var iconPath = svgIcons[type];
    if (!iconPath) return '';
    return '<div class="quality-badge-inline"><img src="' + iconPath + '" draggable="false"></div>';
  }

  function renderInlineBadges(movie) {
    if (!movie || !Lampa.Storage.field('parser_use')) return;

    Lampa.Parser.get({
      search: movie.title || movie.name,
      movie: movie,
      page: 1
    }, function (response) {

      if (!response || !response.Results) return;

      var best = getBest(response.Results);
      var badges = [];

      if (best.ukr) badges.push(createBadge('UKR'));
      if (best.resolution) badges.push(createBadge(best.resolution));
      if (best.hdr) badges.push(createBadge('HDR'));
      if (best.audio) badges.push(createBadge(best.audio));
      if (best.dub) badges.push(createBadge('DUB'));
      if (best.dolbyVision) badges.push(createBadge('Dolby Vision'));

      if (!badges.length) return;

      // шукаємо блок метаданих (де 16+ і статус)
      var meta = $('.full-start-new__details, .full-start__details').first();
      if (!meta.length) return;

      // не дублюємо
      if (meta.find('.quality-inline-container').length) return;

      // створюємо контейнер
      var container = $('<div class="quality-inline-container">' + badges.join('') + '</div>');

      // вставляємо ПЕРЕД першим span (де зазвичай 16+)
      var firstMetaItem = meta.find('span').first();
      if (firstMetaItem.length) {
        container.insertBefore(firstMetaItem);
      } else {
        meta.prepend(container);
      }
    });
  }

  Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complite') return;
    renderInlineBadges(e.data.movie);
  });

  var style = '<style>\
    .quality-inline-container {\
      display:inline-flex;\
      align-items:center;\
      gap:0.35em;\
      margin-right:0.7em;\
      vertical-align:middle;\
    }\
    .quality-badge-inline {\
      height:1.2em;\
      display:flex;\
      align-items:center;\
    }\
    .quality-badge-inline img {\
      height:100%;\
      width:auto;\
      display:block;\
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));\
    }\
  </style>';

  $('body').append(style);

  console.log('[QualityBadges INLINE] Запущено');

})();