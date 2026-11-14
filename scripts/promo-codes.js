/**
 * Promo codes (shared by the price boxes and the quote form).
 * ---------------------------------------------------------------
 * Loads the live code list from /api/promo-codes (managed on the admin
 * page, admin-promos.html). If that can't be reached it uses the starter
 * list in config/promo-codes.json, so codes keep working either way.
 *
 * window.STREETSIDE_PROMO
 *   .norm(text)                 -> capitals/numbers only
 *   .find(code)                 -> the matching code, or null
 *   .apply(code, service, amt)  -> { match, applies, price, saved } | null
 *   .words(match)               -> "50% off" / "$5 off"
 * Fires a "streetside:promos" event on document once the list has loaded.
 */
(function () {
  var NAMES = { "bin-valet": "Bin Valet", "bin-cleaning": "Bin Cleaning", "snow-removal": "Snow Removal" };

  var P = (window.STREETSIDE_PROMO = {
    codes: null, // null until loaded (or if it can't be loaded)
    names: NAMES,
    norm: function (v) {
      return String(v || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
    },
    find: function (code) {
      code = P.norm(code);
      if (!code || !P.codes) return null;
      for (var i = 0; i < P.codes.length; i++) {
        if (P.norm(P.codes[i].code) === code) return P.codes[i];
      }
      return null;
    },
    words: function (m) {
      var amt = Number(m.amount) || 0;
      if (m.kind === "dollars") {
        var s = amt.toFixed(2);
        return "$" + (s.slice(-3) === ".00" ? s.slice(0, -3) : s) + " off";
      }
      return amt + "% off";
    },
    // Works out the discounted first bill. `applies` is false when the code is
    // real but meant for a different service.
    apply: function (code, service, amount) {
      var m = P.find(code);
      if (!m) return null;
      var applies = !m.appliesTo || !m.appliesTo.length || m.appliesTo.indexOf(service) !== -1;
      var price = amount;
      if (applies) {
        var amt = Number(m.amount) || 0;
        price = m.kind === "dollars" ? amount - amt : amount * (1 - amt / 100);
        price = Math.max(0, Math.round(price * 100) / 100);
      }
      return { match: m, applies: applies, price: price, saved: Math.round((amount - price) * 100) / 100 };
    },
  });

  function done(list) {
    P.codes = Array.isArray(list) ? list : [];
    try { document.dispatchEvent(new Event("streetside:promos")); } catch (e) { /* old browser */ }
  }

  function loadFile() {
    return fetch("config/promo-codes.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { done((d && d.codes) || []); });
  }

  try {
    fetch("/api/promo-codes", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { done((d && d.codes) || []); })
      .catch(function () { return loadFile(); })
      .catch(function () { /* no list available — codes just won't be recognized */ });
  } catch (e) { /* fetch unavailable */ }
})();
