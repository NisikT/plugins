/* ======================================================
   TV Quality Badge System
   Android TV / WebView Optimized
   Version: 2.0
   ====================================================== */

(function () {
  "use strict";

  /* ===============================
     CONFIG
  =============================== */

  const CONFIG = {
    containerSelector: "#tv-quality-badges", // можна змінити
    autoObserve: true,
    observeSelector: "body"
  };

  /* ===============================
     UTIL
  =============================== */

  function normalize(text = "") {
    return text.toLowerCase().replace(/\s+/g, ".");
  }

  function detectResolution(t) {
    if (/4320p|8k/.test(t)) return "8K";
    if (/2160p|4k/.test(t)) return "4K";
    if (/1440p/.test(t)) return "1440p";
    if (/1080p/.test(t)) return "1080p";
    if (/720p/.test(t)) return "720p";
    return null;
  }

  function detectHDR(t) {
    return /hdr10\+?|hdr/.test(t);
  }

  function detectDolbyVision(t) {
    return /dolby.?vision|\bdv\b/.test(t);
  }

  function detectAtmos(t) {
    return /atmos/.test(t);
  }

  function detectAudio(t) {
    if (/7\.1/.test(t)) return "7.1";
    if (/5\.1|dd5\.1|dts/.test(t)) return "5.1";
    return null;
  }

  function detectUA(t) {
    return /\bukr\b|\bua\b|україн/.test(t);
  }

  function analyze(title = "") {
    const t = normalize(title);

    return {
      resolution: detectResolution(t),
      hdr: detectHDR(t),
      dv: detectDolbyVision(t),
      atmos: detectAtmos(t),
      audio: detectAudio(t),
      ua: detectUA(t)
    };
  }

  /* ===============================
     BADGE UI
  =============================== */

  function createBadge(text, type) {
    const el = document.createElement("div");
    el.className = "tv-badge tv-" + type;
    el.textContent = text;
    return el;
  }

  function render(title) {
    let container = document.querySelector(CONFIG.containerSelector);

    if (!container) {
      container = document.createElement("div");
      container.id = CONFIG.containerSelector.replace("#", "");
      container.className = "tv-badge-container";
      document.body.appendChild(container);
    }

    container.innerHTML = "";

    const info = analyze(title);

    if (info.resolution)
      container.appendChild(createBadge(info.resolution, "res"));

    if (info.hdr)
      container.appendChild(createBadge("HDR", "hdr"));

    if (info.dv)
      container.appendChild(createBadge("Dolby Vision", "dv"));

    if (info.atmos)
      container.appendChild(createBadge("Atmos", "atmos"));

    if (info.audio)
      container.appendChild(createBadge(info.audio, "audio"));

    if (info.ua)
      container.appendChild(createBadge("UA", "ua"));
  }

  /* ===============================
     TV STYLES
  =============================== */

  function injectStyles() {
    if (document.getElementById("tv-quality-style")) return;

    const style = document.createElement("style");
    style.id = "tv-quality-style";

    style.innerHTML = `
      .tv-badge-container {
        position: fixed;
        right: 60px;
        bottom: 80px;
        display: flex;
        gap: 14px;
        z-index: 9999;
      }

      .tv-badge {
        padding: 10px 18px;
        font-size: 22px;
        font-weight: 700;
        border-radius: 10px;
        background: rgba(255,255,255,0.12);
        backdrop-filter: blur(6px);
        color: #fff;
        border: 2px solid rgba(255,255,255,0.25);
      }

      .tv-res { background: #1e7f3f; }
      .tv-hdr { background: #005bbb; }
      .tv-dv { background: #4b2dbd; }
      .tv-atmos { background: #37474f; }
      .tv-audio { background: #b71c1c; }
      .tv-ua { background: #ffd500; color: #000; }
    `;

    document.head.appendChild(style);
  }

  /* ===============================
     AUTO OBSERVER (SPA support)
  =============================== */

  function observe() {
    const target = document.querySelector(CONFIG.observeSelector);
    if (!target) return;

    const observer = new MutationObserver(() => {
      const title = document.title || document.body.innerText.slice(0, 200);
      render(title);
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  /* ===============================
     INIT
  =============================== */

  function init(title) {
    injectStyles();
    render(title || document.title);
    if (CONFIG.autoObserve) observe();
  }

  /* ===============================
     EXPORT
  =============================== */

  window.TVQualityBadges = {
    init,
    render,
    analyze
  };

})();