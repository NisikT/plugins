(function () {
	"use strict";

	Lampa.Platform.tv();

	if (typeof Lampa === "undefined") return;
	if (!Lampa.Maker || !Lampa.Maker.map) return;
	if (window.plugin_interface_clean_infopanel) return;

	window.plugin_interface_clean_infopanel = true;

	var globalInfoCache = {};

	var mainMaker = Lampa.Maker.map("Main");
	if (!mainMaker || !mainMaker.Items || !mainMaker.Create) return;

	// -----------------------------
	// STATE
	// -----------------------------
	function getOrCreateState(createInstance) {
		if (createInstance.__infoState) return createInstance.__infoState;

		var state = createState(createInstance);
		createInstance.__infoState = state;
		return state;
	}

	function createState(mainInstance) {
		var infoPanel = new InfoPanel();
		infoPanel.create();

		return {
			main: mainInstance,
			info: infoPanel,
			infoElement: null,
			attached: false,

			attach: function () {
				if (this.attached) return;

				var container = mainInstance.render(true);
				if (!container) return;

				var infoElement = infoPanel.render(true);
				this.infoElement = infoElement;

				container.insertBefore(infoElement, container.firstChild || null);

				mainInstance.scroll.minus(infoElement);

				this.attached = true;
			},

			update: function (data) {
				if (!data) return;
				infoPanel.update(data);
			},

			reset: function () {
				infoPanel.empty();
			},

			destroy: function () {
				infoPanel.destroy();

				if (this.infoElement && this.infoElement.parentNode) {
					this.infoElement.parentNode.removeChild(this.infoElement);
				}

				this.attached = false;
			}
		};
	}

	// -----------------------------
	// HOOKS
	// -----------------------------
	wrapMethod(mainMaker.Create, "onCreate", function (originalMethod, args) {
		if (originalMethod) originalMethod.apply(this, args);

		var state = getOrCreateState(this);
		state.attach();
	});

	wrapMethod(mainMaker.Items, "onAppend", function (originalMethod, args) {
		if (originalMethod) originalMethod.apply(this, args);

		var element = args && args[0];
		var data = args && args[1];

		if (element && data) {
			handleLineAppend(this, element, data);
		}
	});

	wrapMethod(mainMaker.Items, "onDestroy", function (originalMethod, args) {
		if (this.__infoState) {
			this.__infoState.destroy();
			delete this.__infoState;
		}

		if (originalMethod) originalMethod.apply(this, args);
	});

	// -----------------------------
	// LINE + CARD
	// -----------------------------
	function handleLineAppend(items, line) {
		if (line.__infoLine) return;
		line.__infoLine = true;

		var state = getOrCreateState(items);

		function processCard(card) {
			handleCard(state, card);
		}

		line.use({
			onInstance: function (instance) {
				processCard(instance);
			},
			onActive: function (card, results) {
				var data = getCardData(card, results);
				if (data) state.update(data);
			},
			onToggle: function () {
				setTimeout(function () {
					var focused = getFocusedCard(line);
					if (focused) state.update(focused);
				}, 30);
			},
			onMore: function () {
				state.reset();
			},
			onDestroy: function () {
				state.reset();
				delete line.__infoLine;
			}
		});

		if (Array.isArray(line.items)) {
			line.items.forEach(processCard);
		}
	}

	function handleCard(state, card) {
		if (!card || card.__infoCard) return;
		if (typeof card.use !== "function" || !card.data) return;

		card.__infoCard = true;

		card.use({
			onFocus: function () {
				state.update(card.data);
			},
			onHover: function () {
				state.update(card.data);
			},
			onTouch: function () {
				state.update(card.data);
			},
			onDestroy: function () {
				delete card.__infoCard;
			}
		});
	}

	// -----------------------------
	// HELPERS
	// -----------------------------
	function getCardData(card, results) {
		if (card && card.data) return card.data;
		if (results && Array.isArray(results.results)) {
			return results.results[0];
		}
		return null;
	}

	function getFocusedCard(items) {
		var container =
			items && typeof items.render === "function" ? items.render(true) : null;

		if (!container) return null;

		var focused =
			container.querySelector(".selector.focus") ||
			container.querySelector(".focus");

		return findCardData(focused);
	}

	function findCardData(element) {
		var node = element;
		while (node && !node.card_data) {
			node = node.parentNode;
		}
		return node ? node.card_data : null;
	}

	function wrapMethod(object, methodName, wrapper) {
		if (!object) return;

		var original =
			typeof object[methodName] === "function" ? object[methodName] : null;

		object[methodName] = function () {
			return wrapper.call(this, original, arguments);
		};
	}

	// -----------------------------
	// INFO PANEL
	// -----------------------------
	function InfoPanel() {
		this.html = null;
		this.network = new Lampa.Reguest();
		this.loaded = globalInfoCache;
		this.currentUrl = null;
	}

	InfoPanel.prototype.create = function () {
		this.html = $(`
			<div class="new-interface-info" style="padding:1.5em;">
				<div class="new-interface-info__title" style="font-size:2.5em;font-weight:600;"></div>
				<div class="new-interface-info__details" style="margin-top:0.5em;"></div>
				<div class="new-interface-info__description" style="margin-top:1em;max-width:60%;"></div>
			</div>
		`);
	};

	InfoPanel.prototype.render = function (asElement) {
		return asElement ? this.html[0] : this.html;
	};

	InfoPanel.prototype.update = function (data) {
		if (!data || !this.html) return;

		this.html.find(".new-interface-info__title").text(
			data.title || data.name || ""
		);

		this.html
			.find(".new-interface-info__description")
			text(data.overview || "");

		this.load(data);
	};

	InfoPanel.prototype.load = function (data) {
		if (!data || !data.id) return;

		var type = data.name ? "tv" : "movie";
		var url = Lampa.TMDB.api(
			type +
				"/" +
				data.id +
				"?api_key=" +
				Lampa.TMDB.key() +
				"&language=ru"
		);

		this.currentUrl = url;

		if (this.loaded[url]) {
			this.draw(this.loaded[url]);
			return;
		}

		var self = this;

		this.network.silent(url, function (response) {
			self.loaded[url] = response;
			if (self.currentUrl === url) {
				self.draw(response);
			}
		});
	};

	InfoPanel.prototype.draw = function (data) {
		if (!data || !this.html) return;

		var year = (data.release_date || data.first_air_date || "").slice(0, 4);
		var rating = parseFloat(data.vote_average || 0).toFixed(1);

		var details = [];

		if (rating > 0) details.push("⭐ " + rating);
		if (year) details.push(year);

		this.html.find(".new-interface-info__details").text(details.join(" • "));
	};

	InfoPanel.prototype.empty = function () {
		if (!this.html) return;
		this.html.find(".new-interface-info__details").text("");
	};

	InfoPanel.prototype.destroy = function () {
		this.network.clear();
		if (this.html) this.html.remove();
	};

})();
