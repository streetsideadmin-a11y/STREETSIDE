/**
 * Service-area interest map.
 * ---------------------------------------------------------------
 * This is a simple illustrated map, not a real interactive map
 * library — every town's position is drawn directly in index.html's
 * inline SVG, positioned from real coordinates but simplified into
 * a flat illustration. That's intentional: it has no external
 * dependency (no map tiles, no CDN, nothing that can silently fail
 * to load), so the one thing it does — show real demand as a heat
 * overlay — works reliably every time.
 *
 * Instead of a growing pin, each town has a soft "heat blob" behind
 * it (a blurred circle) whose size and color scale with real signup
 * count for that city — more interest reads as a bigger, hotter
 * (more red) glow, same visual language as a real heatmap. A town
 * with zero interest shows no glow at all, just its plain dot.
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

  // Heat blob radius grows with interest but caps out so one very
  // popular town doesn't swallow its neighbors on the map. Smaller
  // towns get a smaller zone at every interest level, matching the
  // smaller dot/text treatment they already get — keeps a cluster
  // of small towns from reading as visually louder than the main
  // cities even if several light up at once.
  function heatRadius(count, tier) {
    if (tier === "city") {
      return Math.min(22 + count * 9, 85);
    }
    return Math.min(12 + count * 5, 50);
  }

  // Cool yellow at low interest, ramping through orange to the
  // brand's hot red at high interest — standard heatmap color
  // language, using the site's own accent red as the "hottest" color
  // so it still feels on-brand rather than a generic red/blue scale.
  function heatColor(count) {
    if (count <= 0) return null;
    if (count === 1) return "rgba(255, 214, 92, 0.55)"; // soft yellow
    if (count <= 3) return "rgba(255, 152, 51, 0.6)"; // orange
    if (count <= 6) return "rgba(230, 74, 45, 0.65)"; // red-orange
    return "rgba(200, 30, 44, 0.75)"; // hot — brand accent red
  }

  function baseRadius(tier) {
    return tier === "city" ? 7 : 4;
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
        var blob = svg.querySelector('.map-heat-blob[data-city="' + key + '"]');
        var dot = svg.querySelector('.map-town-dot[data-city="' + key + '"]');
        if (!blob || !dot) return; // no dot on file yet for this town — skip silently

        var color = heatColor(entry.count);
        if (color) {
          var tier = dot.getAttribute("data-tier");
          blob.setAttribute("r", heatRadius(entry.count, tier));
          blob.setAttribute("fill", color);
          blob.setAttribute(
            "aria-label",
            entry.city + ": " + entry.count + (entry.count === 1 ? " neighbor interested" : " neighbors interested")
          );
        }

        // The dot itself brightens slightly on top of the glow, but
        // stays a fixed small size — the heat blob carries the "how
        // much demand" signal now, not the dot growing.
        dot.classList.add("map-town-dot--active");

        // Reveal a label for any town with real interest, even ones
        // that don't get a permanent label by default.
        var label = svg.querySelector('[data-city-label="' + key + '"]');
        if (label) label.classList.add("map-town-label--visible");

        plotted += 1;
      });

      if (caption) {
        caption.textContent =
          plotted > 0
            ? "Warmer colors show more neighbor interest so far."
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
