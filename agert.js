(function () {
  'use strict';

  // Ключ для збереження налаштування в сховищі
  const settingKey = 'disable_age_rating';

  // Перевірка на наявність налаштування
  const currentSetting = Lampa.Storage.field(settingKey) || false;
  console.log('Current Setting:', currentSetting);

  try {
    // Додавання плагіну до меню налаштувань
    Lampa.Settings.add({
      name: 'Відключити віковий рейтинг',
      type: 'switch',
      value: currentSetting,
      callback: function (value) {
        console.log('Callback triggered with value:', value); // Лог для перевірки
        Lampa.Storage.field(settingKey, value); // Зберігаємо нове значення в сховищі
        // Оновлюємо видимість вікового рейтингу
        updateAgeRatingVisibility(value);
      }
    });
    console.log('Setting added to Lampa settings menu');
  } catch (e) {
    console.error('Error adding setting:', e);
  }

  // Функція для оновлення видимості вікового рейтингу
  function updateAgeRatingVisibility(isDisabled) {
    try {
      console.log('Updating age rating visibility:', isDisabled); // Лог для перевірки
      if (isDisabled) {
        // Перевірка на наявність елементів з віковим рейтингом і приховування
        $('.card__age-rating').each(function() {
          $(this).hide();
        });
        console.log('Age rating is hidden');
      } else {
        // Показати віковий рейтинг, якщо опція увімкнена
        $('.card__age-rating').each(function() {
          $(this).show();
        });
        console.log('Age rating is shown');
      }
    } catch (e) {
      console.error('Error updating age rating visibility:', e);
    }
  }

  // Встановлюємо початковий стан відображення вікового рейтингу
  updateAgeRatingVisibility(currentSetting);

  console.log('[DisableAgeRating] Плагін активовано');
})();