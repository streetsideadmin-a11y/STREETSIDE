/**
 * Service-area interest map.
 * ---------------------------------------------------------------
 * This is a simple illustrated map, not a real interactive map
 * library — every town's dot is drawn directly in index.html's
 * inline SVG, positioned from real coordinates but simplified into
 * a flat illustration. That's intentional: it has no external
 * dependency (no map tiles, no CDN, nothing that can silently fail
 * to load), so the one thing it does — light up and grow a town's
 * dot when real interest comes in — works reliably every time.
 *
 * Data comes from /api/interest-map (see api/interest-map.js),
 * which reports signups grouped by CITY ONLY — never an exact
 * street address — matching an existing dot in the SVG by its
 * data-city attribute. A city typed in a form that doesn't match any
 * dot on file simply doesn't light one up; it's still saved
 * everywhere else on the site (the database, the neighbor counter).
 */
(function () {
  // Normalizes a typed city name for matching against the SVG's
  // data-city attributes. People type their city all kinds of ways
  // ("Lancaster", "Lancaster, OH", "lancaster ohio") — this strips
  // common state suffixes and punctuation so those all match the
  // same dot instead of silently missing one.
  function normalizeCityKey(raw) {
    return (raw || "")
      .toLowerCase()
      .replace(/,/g, " ")
      .replace(/\boh\b/g, " ")
      .replace(/\bohio\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function baseRadius(tier) {
    return tier === "city" ? 7 : 4;
  }

  function radiusForCount(tier, count) {
    return Math.min(baseRadius(tier) + count * 2.5, 22);
  }

  async function init() {
    var svg = document.querySelector(".interest-map-svg");
    var caption = document.querySelector("[data-interest-map] .map-caption");
    if (!svg) return;

    try {
      var res = await fetch("/api/interest-map", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("interest-map API responded with " + res.status);
      var data = await res.json();
      var cities = data.cities || [];
      var plotted = 0;

      cities.forEach(function (entry) {
        var key = normalizeCityKey(entry.city);
        var dot = svg.querySelector('[data-city="' + key + '"]');
        if (!dot) return; // no dot on file yet for this town — skip silently

        var tier = dot.getAttribute("data-tier");
        dot.setAttribute("r", radiusForCount(tier, entry.count));
        dot.classList.add("map-town-dot--active");
        dot.setAttribute(
          "aria-label",
          entry.city + ": " + entry.count + (entry.count === 1 ? " neighbor interested" : " neighbors interested")
        );

        // Reveal a label for any town with real interest, even ones
        // that don't get a permanent label by default.
        var label = svg.querySelector('[data-city-label="' + key + '"]');
        if (label) label.classList.add("map-town-label--visible");

        plotted += 1;
      });

      if (caption) {
        caption.textContent =
          plotted > 0
            ? "Lit-up towns show real neighbor interest so far."
            : "Be the first neighbor to light up your town — join the waitlist above.";
      }
    } catch (err) {
      console.warn("[streetside] Could not load interest map data:", err);
      if (caption) {
        caption.textContent = "Check your address above to see where Streetside is headed next.";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
