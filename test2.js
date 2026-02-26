(function () {
  'use strict';

  // Вимикаємо віковий рейтинг для всіх карток
  function disableAgeRating() {
    $('.card__age-rating').each(function () {
      $(this).hide(); // Сховати віковий рейтинг
    });
    console.log('[DisableAgeRating] Віковий рейтинг вимкнено');
  }

  // Викликаємо функцію для відключення вікового рейтингу
  disableAgeRating();

})();