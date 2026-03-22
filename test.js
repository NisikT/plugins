// CLEANED VERSION: UI overhaul removed, settings + logic preserved
(function () {
	"use strict";

	if (typeof Lampa === "undefined") return;
	if (!Lampa.Utils) return;
	if (window.plugin_interface_cleaned) return;

	window.plugin_interface_cleaned = true;

	// ==============================
	// ❌ REMOVED:
	// - new interface (InfoPanel)
	// - background system
	// - card resizing / netflix style
	// ==============================

	// ==============================
	// ✅ KEEP: CHILD MODE API HOOK
	// ==============================
	(function initChildModeApiHook() {
		if (!Lampa.TMDB || !Lampa.TMDB.api) return;

		var originalApi = Lampa.TMDB.api;

		Lampa.TMDB.api = function (url) {
			if (Lampa.Storage.get("child_mode", false)) {
				if (
					url.indexOf("discover/") !== -1 ||
					url.indexOf("trending/") !== -1 ||
					url.indexOf("movie/") !== -1 ||
					url.indexOf("tv/") !== -1
				) {
					if (url.indexOf("certification") === -1) {
						var separator = url.indexOf("?") !== -1 ? "&" : "?";
						url += separator + "certification_country=RU&certification.lte=16&include_adult=false";
					}
				}
				if (url.indexOf("search/") !== -1 && url.indexOf("include_adult") === -1) {
					var separator = url.indexOf("?") !== -1 ? "&" : "?";
					url += separator + "include_adult=false";
				}
			}
			return originalApi(url);
		};
	})();

	// ==============================
	// ✅ KEEP: PRELOAD SYSTEM
	// ==============================
	var globalInfoCache = {};

	function preloadData(data) {
		if (!data || !data.id) return;

		var source = data.source || "tmdb";
		if (source !== "tmdb") return;

		var mediaType = data.media_type === "tv" ? "tv" : "movie";
		var language = Lampa.Storage.get("language") || "ru";

		var apiUrl = Lampa.TMDB.api(
			mediaType + "/" + data.id + "?api_key=" + Lampa.TMDB.key() + "&language=" + language
		);

		if (!globalInfoCache[apiUrl]) {
			var network = new Lampa.Reguest();
			network.silent(apiUrl, function (response) {
				globalInfoCache[apiUrl] = response;
			});
		}
	}

	function preloadAllVisibleCards() {
		if (!Lampa.Storage.get("async_load", true)) return;

		var cards = document.querySelectorAll(".card");
		cards.forEach(function (card) {
			if (card.card_data) preloadData(card.card_data);
		});
	}

	new MutationObserver(function () {
		preloadAllVisibleCards();
	}).observe(document.body, { childList: true, subtree: true });

	// ==============================
	// ✅ KEEP: RATING COLORS
	// ==============================
	function getColor(v) {
		if (v <= 3) return "red";
		if (v < 6) return "orange";
		if (v < 7) return "cornflowerblue";
		if (v < 8) return "darkmagenta";
		return "lawngreen";
	}

	function applyRatingColors() {
		if (!Lampa.Storage.get("si_colored_ratings", true)) return;

		document.querySelectorAll(".card__vote, .full-start__rate").forEach(function (el) {
			var match = el.textContent.match(/(\d+(\.\d+)?)/);
			if (!match) return;
			var v = parseFloat(match[0]);
			el.style.color = getColor(v);
		});
	}

	new MutationObserver(applyRatingColors).observe(document.body, {
		childList: true,
		subtree: true
	});

	// ==============================
	// ✅ KEEP: SETTINGS (CLEANED)
	// ==============================
	function initializeSettings() {
		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "si_colored_ratings", type: "trigger", default: true },
			field: { name: "Цветные рейтинги" },
			onChange: applyRatingColors
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "si_rating_border", type: "trigger", default: false },
			field: { name: "Обводка рейтингов" }
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "child_mode", type: "trigger", default: false },
			field: { name: "Детский режим" },
			onChange: function () { location.reload(); }
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "async_load", type: "trigger", default: true },
			field: { name: "Асинхронная загрузка" }
		});
	}

	initializeSettings();
})();
