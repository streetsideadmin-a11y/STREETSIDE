/**
 * Neighbor counter
 * -----------------
 * Two related but distinct displays, both driven by the same real
 * signup count from window.STREETSIDE_CONFIG.neighborCounter —
 * never an invented number:
 *
 *   [data-counter-value]     -> the raw "N neighbors on board" count
 *                                (used in the Neighborhood section)
 *   [data-spots-remaining]   -> Founding 250 spots left, computed as
 *                                foundingOffer.spotsTotal - count
 *                                (used in the hero)
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

  function renderSpotsCopy(remaining) {
    var noteEl = document.querySelector("[data-counter-note]");
    if (!noteEl) return;
    if (remaining <= 0) {
      noteEl.textContent = "Founding spots are full — join the regular waitlist!";
    } else if (remaining <= 25) {
      noteEl.textContent = "Almost gone — lock in your rate now.";
    } else {
      noteEl.textContent = "Lock in founding pricing before spots run out.";
    }
  }

  function render(count) {
    var rawEls = document.querySelectorAll("[data-counter-value]");
    rawEls.forEach(function (el) { animateCount(el, count); });

    var spotsEls = document.querySelectorAll("[data-spots-remaining]");
    if (spotsEls.length) {
      var founding = (window.STREETSIDE_CONFIG || {}).foundingOffer || {};
      var total = typeof founding.spotsTotal === "number" ? founding.spotsTotal : null;
      if (total !== null) {
        var remaining = Math.max(total - count, 0);
        spotsEls.forEach(function (el) { animateCount(el, remaining); });
        renderSpotsCopy(remaining);
      }
    }
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
