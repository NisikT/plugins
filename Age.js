(function () {
  'use strict';

  // Перевірка на наявність настройки у сховищі Lampa
  const settingKey = 'disable_age_rating';

  // Якщо в налаштуваннях вже є значення для цього параметра
  const currentSetting = Lampa.Storage.field(settingKey) || false;

  // Додаємо пункт до налаштувань
  Lampa.Settings.add({
    name: 'Відключити віковий рейтинг',
    type: 'switch',
    value: currentSetting,
    callback: function (value) {
      // Зберігаємо стан в сховищі
      Lampa.Storage.field(settingKey, value);
      // Оновлюємо відображення вікового рейтингу
      updateAgeRatingVisibility(value);
    }
  });

  // Функція для оновлення видимості вікового рейтингу
  function updateAgeRatingVisibility(isDisabled) {
    if (isDisabled) {
      // Сховати віковий рейтинг, якщо відключено
      $('.card__age-rating').hide();
    } else {
      // Показати віковий рейтинг, якщо увімкнено
      $('.card__age-rating').show();
    }
  }

  // Встановлюємо початковий стан відображення вікового рейтингу
  updateAgeRatingVisibility(currentSetting);

  console.log('[DisableAgeRating] Плагін активовано');

})();
