(function () {
  'use strict';

  // Функція для приховування вікових рейтингів
  function hideAgeRating() {
    // Селектори для вікових рейтингів на картках та в деталях
    var ageRatings = [
      '.card__age',               // Для карток фільмів
      '.full-start-new__age',     // Для сторінки фільму
      '.quality-rating',          // Інші можливі місця для вікових рейтингів
      '.card__year',              // Додатково, якщо є року в картках
    ];

    // Проходимо по всіх елементах і ховаємо їх
    ageRatings.forEach(function(selector) {
      $(selector).each(function() {
        $(this).hide();
      });
    });
  }

  // Перевірка на повне завантаження сторінки
  Lampa.Listener.follow('full', function(e) {
    if (e.type !== 'complite') return;
    hideAgeRating(); // Приховуємо рейтинг після завантаження сторінки
  });

  // Перевірка карток на вікові рейтинги через інтервал
  setInterval(function() {
    $('.card:not(.age-rating-processed)').addClass('age-rating-processed').each(function() {
      hideAgeRating(); // Приховуємо рейтинг на картках
    });
  }, 3000);

  console.log('[AgeRatingDisable] Плагін для відключення вікового рейтингу активований.');
})();