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
    var best = { resolution: null, hdr: false, ukr: false };
    var resOrder = ['HD', 'FULL HD', '2K', '4K'];
    
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

      if (foundRes && (!best.resolution || resOrder.indexOf(foundRes) > resOrder.indexOf(best.resolution))) {
          best.resolution = foundRes;
      }

      if (title.indexOf('hdr') >= 0) best.hdr = true;
    }

    return best;
  }

  function createBadgeImg(type) {
    var iconPath = svgIcons[type];
    if (!iconPath) return '';
    return '<div class="card-quality-badge"><img src="' + iconPath + '" draggable="false" oncontextmenu="return false;"></div>';
  }

  function addCardBadges(card, best) {
    if (card.find('.card-quality-badges-row').length) return;

    var badges = [];
    if (best.ukr) badges.push(createBadgeImg('UKR'));
    if (best.resolution) badges.push(createBadgeImg(best.resolution));
    if (best.hdr) badges.push(createBadgeImg('HDR'));

    // Витягаємо віковий рейтинг і статус з картки
    var ageRating = card.find('.card__age').length ? card.find('.card__age').html() : '';
    var status = card.find('.card__status').length ? card.find('.card__status').html() : '';

    // Створюємо новий рядок
    var rowHtml = '<div class="card-quality-badges-row">' +
                    badges.join('') +
                    (ageRating ? '<span class="card-age-rating">' + ageRating + '</span>' : '') +
                    (status ? '<span class="card-status">' + status + '</span>' : '') +
                  '</div>';

    card.find('.card__view').prepend(rowHtml);
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
    .card-quality-badges-row { display: flex; align-items: center; gap: 0.25em; margin-bottom: 0.25em; }\
    .card-quality-badge { height: 0.9em; }\
    .card-quality-badge img { height: 100%; width: auto; display: block; filter: drop-shadow(0 1px 2px #000); }\
    .card-age-rating, .card-status { margin-left: 0.25em; font-size: 0.85em; color: #fff; text-shadow: 0 1px 2px #000; }\
    @media (max-width: 768px) { .card-quality-badges-row { gap: 0.15em; } .card-quality-badge { height: 0.7em; } }\
  </style>';
  $('body').append(style);

  console.log('[QualityBadges] Лінія бейджів перероблена');

})();
