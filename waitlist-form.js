/**
 * Neighbor counter
 * -----------------
 * Renders the real "N neighbors on board" value from
 * window.STREETSIDE_CONFIG.neighborCounter. Never invents a number.
 *
 * - source: "manual" -> uses config.count as-is (today's mode).
 * - source: "api"    -> fetches config.apiEndpoint, expects { count }.
 *   If the fetch fails, falls back to config.count and logs a warning
 *   rather than showing a fake or stale number silently.
 */
(function () {
  function animateCount(el, target) {
    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced || target === 0) {
      el.textContent = String(target);
      return;
    }

    var start = 0;
    var duration = 900;
    var startTime = null;

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(start + (target - start) * eased);
      el.textContent = String(value);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function renderCopy(count) {
    var noteEl = document.querySelector("[data-counter-note]");
    if (!noteEl) return;
    if (count <= 0) {
      noteEl.textContent = "Be one of the first neighbors on board.";
    } else {
      noteEl.textContent = "Thank you to our growing community of neighbors!";
    }
  }

  function render(count) {
    var numberEls = document.querySelectorAll("[data-counter-value]");
    numberEls.forEach(function (el) { animateCount(el, count); });
    renderCopy(count);
  }

  async function init() {
    var config = (window.STREETSIDE_CONFIG || {}).neighborCounter;
    if (!config) return;

    if (config.source === "api" && config.apiEndpoint) {
      try {
        var res = await fetch(config.apiEndpoint, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Neighbor count API responded with " + res.status);
        var data = await res.json();
        if (typeof data.count !== "number") throw new Error("Neighbor count API returned no count");
        render(data.count);
        return;
      } catch (err) {
        console.warn(
          "[streetside] Could not load live neighbor count, falling back to config.count:",
          err
        );
      }
    }

    render(config.count || 0);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
