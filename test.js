(function () {
  'use strict';

  // Функція для відключення вікового рейтингу всередині карток
  function disableAgeRating() {
    // Перевіряємо всі картки та ховаємо віковий рейтинг
    $('.card__age-rating').each(function () {
      $(this).hide(); // Приховуємо віковий рейтинг
    });
    console.log('[DisableAgeRating] Віковий рейтинг вимкнено всередині карток');
  }

  // Спостерігаємо за картками, щоб на кожному етапі відключати віковий рейтинг
  Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complite') return;
    disableAgeRating();  // Вимикаємо віковий рейтинг, якщо картка відкрита
  });

  // Оновлюємо віковий рейтинг для карток після їх завантаження
  setInterval(function() {
    disableAgeRating(); // Перевіряємо і вимикаємо віковий рейтинг на нових картках
  }, 2000); // Перевірка кожні 2 секунди

  console.log('[DisableAgeRating] Плагін активовано для Lampa 3.1.6');
})();