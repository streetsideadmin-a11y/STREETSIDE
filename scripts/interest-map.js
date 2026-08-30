/**
 * Service-area interest map.
 * ---------------------------------------------------------------
 * A real interactive map (Leaflet + OpenStreetMap tiles, no API key
 * needed), not a hand-drawn illustration. Earlier versions of this
 * map used a custom lat/lng-to-pixel projection built by hand, which
 * never quite matched true geography no matter how carefully it was
 * recentered — a real map doesn't have that problem, since every
 * position comes from an actual map projection instead of an
 * approximation. Real roads and the real Buckeye Lake shape come
 * from the map tiles themselves now, so there's no need to hand-trace
 * them separately anymore.
 *
 * One deliberate tradeoff worth knowing: loading real map tiles from
 * OpenStreetMap means this page now depends on an external service
 * being reachable, which wasn't true of the old illustrated map. If
 * that's ever a problem, the whole interest-map section can revert to
 * something self-contained again — but the accuracy this buys is
 * worth that tradeoff for now.
 *
 * Data comes from /api/interest-map (see api/interest-map.js), which
 * reports signups grouped by CITY ONLY — never an exact street
 * address — matched against the list of known towns below by name.
 */
(function () {
  // Real coordinates for every town in the service area, same list
  // used by the admin dashboard's map and route planner.
  var TOWNS = {
    "columbus": [39.9612, -82.9988, "city"],
    "canal winchester": [39.8395, -82.8010, "city"],
    "pickerington": [39.8892, -82.7565, "city"],
    "groveport": [39.8595, -82.8887, "city"],
    "reynoldsburg": [39.9538, -82.8071, "city"],
    "lancaster": [39.7134, -82.5993, "city"],
    "newark": [40.0581, -82.4013, "city"],
    "circleville": [39.6001, -82.9463, "city"],
    "grove city": [39.8814, -83.0930, "city"],
    "lithopolis": [39.7973, -82.8079, "town"],
    "baltimore": [39.8481, -82.6032, "town"],
    "carroll": [39.7614, -82.7182, "town"],
    "millersport": [39.8934, -82.5385, "town"],
    "lockbourne": [39.8098, -82.9985, "town"],
    "etna": [39.9412, -82.6796, "town"],
    "buckeye lake": [39.9276, -82.4835, "town"],
    "hebron": [39.9645, -82.5232, "town"],
    "obetz": [39.9060, -82.9295, "town"],
    "whitehall": [39.9701, -82.8804, "town"],
    "pataskala": [40.0064, -82.6749, "town"],
    "ashville": [39.7248, -82.9515, "town"],
    "somerset": [39.8095, -82.2985, "town"],
    "new lexington": [39.7020, -82.2085, "town"],
    "royalton": [39.6987, -82.6849, "town"],
    "walnut": [39.6673, -82.7213, "town"],
    "north berne": [39.7679, -82.5165, "town"],
    "pleasantville": [39.8993, -82.5210, "town"],
    "kirkersville": [39.9787, -82.6432, "town"],
    "heath": [40.0031, -82.4599, "town"],
    "alexandria": [40.0870, -82.5379, "town"],
    "granville": [40.0692, -82.5210, "town"],
    "welsh hills": [40.0754, -82.4929, "town"],
    "hanover": [40.0759, -82.2665, "town"],
    "thornport": [39.9420, -82.4419, "town"],
    "thornville": [39.8973, -82.4551, "town"],
    "glenford": [39.8534, -82.3488, "town"],
    "junction city": [39.7415, -82.2965, "town"],
    "wesley chapel": [39.7150, -82.6950, "town"],
    "bremen": [39.7040, -82.4290, "town"],
    "sugar grove": [39.6743, -82.5824, "town"],
    "hideaway hills": [39.6650, -82.5200, "town"],
    "stoutsville": [39.6323, -82.7818, "town"],
    "orient": [39.8443, -83.1349, "town"],
    "commercial point": [39.7970, -83.0060, "town"],
    "shawnee": [39.6034, -82.2216, "town"],
  };

  function normalizeCityKey(raw) {
    return (raw || "")
      .toLowerCase()
      .replace(/,/g, " ")
      .replace(/\boh\b/g, " ")
      .replace(/\bohio\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findTown(cityText) {
    var key = normalizeCityKey(cityText);
    if (!key) return null;
    if (TOWNS[key]) return key;
    return Object.keys(TOWNS).find(function (t) { return key.indexOf(t) !== -1; }) || null;
  }

  function heatColor(count) {
    if (count <= 0) return null;
    if (count === 1) return "#ffd65c";
    if (count <= 3) return "#ff9833";
    if (count <= 6) return "#e64a2d";
    return "#c81e2c";
  }

  function heatRadiusPx(tier, count) {
    var base = tier === "city" ? 22 : 12;
    var step = tier === "city" ? 9 : 5;
    var cap = tier === "city" ? 85 : 50;
    return Math.min(base + count * step, cap);
  }

  async function init() {
    var mapEl = document.getElementById("interest-map-el");
    var caption = document.querySelector("[data-interest-map] .map-caption");
    if (!mapEl || typeof L === "undefined") return;

    var lats = Object.values(TOWNS).map(function (t) { return t[0]; });
    var lngs = Object.values(TOWNS).map(function (t) { return t[1]; });
    var bounds = L.latLngBounds(
      [Math.min.apply(null, lats), Math.min.apply(null, lngs)],
      [Math.max.apply(null, lats), Math.max.apply(null, lngs)]
    );

    var map = L.map(mapEl, { scrollWheelZoom: false }).fitBounds(bounds, { padding: [24, 24] });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: "interest-map-tiles",
    }).addTo(map);

    var layerGroup = L.layerGroup().addTo(map);

    // Main cities always show; smaller towns stay hidden until real
    // interest lights them up, same behavior as before.
    Object.keys(TOWNS).forEach(function (name) {
      var t = TOWNS[name];
      if (t[2] !== "city") return;
      var label = name.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      L.circleMarker([t[0], t[1]], {
        radius: 6, color: "#fff", weight: 2, fillColor: "#1a2e21", fillOpacity: 1,
        className: "interest-map-city-dot",
      }).addTo(layerGroup);
      L.marker([t[0], t[1]], {
        icon: L.divIcon({ className: "interest-map-city-label", html: label, iconSize: null, iconAnchor: [-8, 4] }),
        interactive: false,
      }).addTo(layerGroup);
    });

    try {
      var res = await fetch("/api/interest-map", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("interest-map API responded with " + res.status);
      var data = await res.json();
      var cities = data.cities || [];
      var plotted = 0;

      cities.forEach(function (entry) {
        var townKey = findTown(entry.city);
        if (!townKey) return; // no known town matches — skip silently
        var t = TOWNS[townKey];
        var color = heatColor(entry.count);
        if (!color) return;

        var label = townKey.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        var tooltipText = label + ": " + entry.count + (entry.count === 1 ? " neighbor interested" : " neighbors interested");

        L.circleMarker([t[0], t[1]], {
          radius: heatRadiusPx(t[2], entry.count),
          color: color, weight: 1, fillColor: color, fillOpacity: 0.45,
          className: "interest-map-heat",
        })
          .bindTooltip(tooltipText)
          .addTo(layerGroup);

        // Reveal a label for any town with real interest, even ones
        // that don't get a permanent label by default.
        if (t[2] !== "city") {
          L.marker([t[0], t[1]], {
            icon: L.divIcon({ className: "interest-map-town-label", html: label, iconSize: null, iconAnchor: [-8, 4] }),
            interactive: false,
          }).addTo(layerGroup);
        }

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
