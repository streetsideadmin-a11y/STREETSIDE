/**
 * Service-area interest map.
 * ---------------------------------------------------------------
 * Draws a real map (via Leaflet + OpenStreetMap — both free, no API
 * key or account needed) and drops one pin per city/town that has
 * shown interest, sized by how many people signed up from there.
 * Never plots individual street addresses — only the general town
 * location, from config/city-coordinates.js.
 *
 * Requires /api/interest-map (see api/interest-map.js), so this only
 * shows real markers once deployed on Vercel with the database
 * connected. On a plain static host, or before that's wired up, it
 * falls back to the plain placeholder graphic already in the page —
 * it never fakes data.
 */
(function () {
  var REGION_CENTER = [39.6, -82.4]; // roughly the middle of Southeastern Ohio
  var REGION_ZOOM = 8;

  function showFallback(container, message) {
    var note = container.querySelector(".map-caption");
    if (note && message) note.textContent = message;
  }

  function radiusForCount(count) {
    // Modest, readable scaling — not a precise formula, just keeps a
    // single signup visible and a busier town visibly bigger.
    return Math.min(10 + count * 3, 32);
  }

  async function init() {
    var container = document.querySelector("[data-interest-map]");
    if (!container) return;

    if (typeof L === "undefined") {
      // Leaflet didn't load (offline, blocked script, etc.) — leave
      // the existing placeholder graphic in place rather than a
      // blank box.
      showFallback(container, "Map couldn't load — check your connection and refresh.");
      return;
    }

    var mapEl = document.createElement("div");
    mapEl.style.width = "100%";
    mapEl.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(mapEl);

    var map = L.map(mapEl, { scrollWheelZoom: false }).setView(REGION_CENTER, REGION_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 15,
    }).addTo(map);

    var coords = window.STREETSIDE_CITY_COORDS || {};
    var interestEndpoint = "/api/interest-map";

    try {
      var res = await fetch(interestEndpoint, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("interest-map API responded with " + res.status);
      var data = await res.json();
      var cities = data.cities || [];

      var plotted = 0;
      cities.forEach(function (entry) {
        var key = (entry.city || "").trim().toLowerCase();
        var latLng = coords[key];
        if (!latLng) return; // no coordinates on file yet for this town — skip silently

        L.circleMarker(latLng, {
          radius: radiusForCount(entry.count),
          color: "#c81e2c",
          weight: 2,
          fillColor: "#16311a",
          fillOpacity: 0.75,
        })
          .addTo(map)
          .bindPopup(
            "<strong>" + entry.city + "</strong><br>" +
            entry.count + (entry.count === 1 ? " neighbor interested" : " neighbors interested")
          );
        plotted += 1;
      });
    } catch (err) {
      console.warn("[streetside] Could not load interest map data:", err);
      // Map itself still renders (region view) — just without pins yet.
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
