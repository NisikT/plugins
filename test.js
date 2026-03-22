(function () {
    "use strict";

    if (typeof Lampa === "undefined") return;

    var panel;

    function createPanel() {
        panel = $(`
            <div class="simple-info-panel" style="
                position:absolute;
                top:0;
                left:0;
                width:100%;
                z-index:9999;
                padding:1.5em;
                background:linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
            ">
                <div class="title" style="font-size:2em;font-weight:600;"></div>
                <div class="details" style="margin-top:0.5em;font-size:1.2em;"></div>
                <div class="desc" style="margin-top:1em;max-width:60%;"></div>
            </div>
        `);

        $("body").append(panel);
    }

    function updatePanel(data) {
        if (!data || !panel) return;

        panel.find(".title").text(data.title || data.name || "");
        panel.find(".desc").text(data.overview || "");

        var details = [];

        if (data.vote_average) {
            details.push("⭐ " + parseFloat(data.vote_average).toFixed(1));
        }

        if (data.release_date) {
            details.push(data.release_date.slice(0, 4));
        }

        panel.find(".details").text(details.join(" • "));
    }

    function getCardData(element) {
        var node = element;
        while (node && !node.card_data) {
            node = node.parentNode;
        }
        return node ? node.card_data : null;
    }

    function init() {
        createPanel();

        Lampa.Listener.follow("hover", function (e) {
            if (e.target && $(e.target).hasClass("card")) {
                var data = getCardData(e.target);
                if (data) updatePanel(data);
            }
        });

        Lampa.Listener.follow("focus", function (e) {
            if (e.target && $(e.target).hasClass("card")) {
                var data = getCardData(e.target);
                if (data) updatePanel(data);
            }
        });
    }

    init();
})();