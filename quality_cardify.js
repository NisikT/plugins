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

      // Перевірка на українську локалізацію
      if (/(ukr|укр|ua)/.test(title)) {
          best.ukr = true;
      }

      var foundRes = null;
      if (/(4k|2160|uhd)/.test(title)) foundRes = '4K';
      else if (/(2k|1440)/.test(title)) foundRes = '2K';
      else if (/(1080|fhd|full hd)/.test(title)) foundRes = 'FULL HD';
      else if (/(720|hd)/.test(title)) foundRes = 'HD';

      if (foundRes && (!best.resolution || resOrder.indexOf(foundRes) > resOrder.indexOf(best.resolution))) {
          best.resolution = foundRes;
      }

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
            
            if (res && (!best.resolution || resOrder.indexOf(res) > resOrder.indexOf(best.resolution))) {
              best.resolution = res;
            }
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
      
      if (/(vision|dovi)/.test(title)) best.dolbyVision = true;
      if (/(hdr)/.test(title)) best.hdr = true;
      if (/(dub|дубл)/.test(title)) best.dub = true;
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
    // Додаємо прапорець першим у списку
    if (best.ukr) badges.push(createBadgeImg('UKR', true, badges.length));
    if (best.resolution) badges.push(createBadgeImg(best.resolution, true, badges.length));
    if (best.hdr) badges.push(createBadgeImg('HDR', true, badges.length));
    if (best.audio) badges.push(createBadgeImg(best.audio, true, badges.length));
    if (best.dub) badges.push(createBadgeImg('DUB', true, badges.length));
    if (best.dolbyVision) badges.push(createBadgeImg('Dolby Vision', true, badges.length));
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

  Lampa.Listener.follow('full', function(e) {
    if (e.type !== 'complite') return;
    var details = $('.full-start-new__details');
    if (details.length) {
        if (!$('.quality-badges-container').length) details.after('<div class="quality-badges-container"></div>');
        Lampa.Parser.get({ search: e.data.movie.title || e.data.movie.name, movie: e.data.movie, page: 1 }, function(response) {
            if (response && response.Results) {
                var best = getBest(response.Results);
                var badges = [];
                if (best.ukr) badges.push(createBadgeImg('UKR', false, badges.length));
                if (best.resolution) badges.push(createBadgeImg(best.resolution, false, badges.length));
                if (best.hdr) badges.push(createBadgeImg('HDR', false, badges.length));
                if (best.audio) badges.push(createBadgeImg(best.audio, false, badges.length));
                if (best.dub) badges.push(createBadgeImg('DUB', false, badges.length));
                if (best.dolbyVision) badges.push(createBadgeImg('Dolby Vision', false, badges.length));
                $('.quality-badges-container').html(badges.join(''));
            }
        });
    }
  });

  setInterval(processCards, 3000);

  var style = '<style>\
    .quality-badges-container { display: flex; gap: 0.3em; margin: 0 0 0.4em 0; min-height: 1.2em; pointer-events: none; position: fixed; right: 1em; bottom: 1em; z-index: 9999; }\
    .quality-badge { height: 1.2em; opacity: 0; transform: translateY(8px); animation: qb_in 0.4s ease forwards; }\
    .card-quality-badges { position: fixed; bottom: 1em; right: 1em; display: flex; flex-direction: row; gap: 0.2em; pointer-events: none; z-index: 5; }\
    .card-quality-badge { height: 0.9em; opacity: 0; transform: translateY(5px); animation: qb_in 0.3s ease forwards; }\
    @keyframes qb_in { to { opacity: