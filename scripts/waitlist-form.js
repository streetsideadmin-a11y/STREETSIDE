/**
 * Waitlist form + "check your address" mini-form.
 * ---------------------------------------------------------------
 * IMPORTANT — read this before launch:
 *
 * Neither form has a real backend connected yet. There is no
 * database behind this site. Submitting the form will:
 *
 *   1. Validate the fields in the browser.
 *   2. If window.STREETSIDE_CONFIG.waitlistForm.endpoint is set,
 *      POST the data there as JSON and show success/error based on
 *      the real response.
 *   3. If no endpoint is configured, the form clearly tells the
 *      person that signups aren't being collected yet — it never
 *      claims to have saved or received their information.
 *
 * To go live: pick a form backend (Formspree, Getform, Basin, your
 * own serverless function, etc.), put the endpoint URL into
 * config/site-config.js under waitlistForm.endpoint, and this file
 * needs no further changes.
 */
(function () {
  // When this page finished loading — sent with each submission so the
  // server can ignore bots that "fill out" a form in a split second.
  var pageLoadedAt = Date.now();

  // --- Where did this visitor come from? -----------------------------
  // Saves ad/campaign tags from the link they arrived on (?utm_source=...
  // ?fbclid=...) the first time they land, so it can still be attached to
  // their signup after they scroll, click around, or come back later.
  // Everything is wrapped in try/catch because browser storage can be
  // blocked (private windows, strict privacy settings) — that must never
  // affect the signup itself.
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      var found = [];
      ATTR_KEYS.forEach(function (k) {
        var v = (params.get(k) || "").replace(/[^A-Za-z0-9 _.\-+%]/g, "").slice(0, 60);
        if (v) found.push(k.replace("utm_", "") + "=" + v);
      });
      if (params.get("fbclid")) found.push("fbclid=yes");
      if (found.length) {
        try { localStorage.setItem("streetside_attribution", found.join("&")); } catch (e) { /* storage blocked */ }
        return found.join("&");
      }
    } catch (e) { /* URLSearchParams unavailable */ }
    return "";
  }
  var attributionFromThisVisit = captureAttribution();
  function getAttribution() {
    if (attributionFromThisVisit) return attributionFromThisVisit;
    try { return localStorage.getItem("streetside_attribution") || ""; } catch (e) { return ""; }
  }

  function serializeForm(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (data[key] !== undefined) {
        data[key] = [].concat(data[key], value);
      } else {
        data[key] = value;
      }
    });
    return data;
  }

  function showStatus(el, message, type) {
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  // When an address-check comes back with no route yet, we still want a
  // way to reach that person later — but the address-check form itself
  // never asks for a name/email/phone. So instead of only saying "we'll
  // be in touch," carry over what they already typed into the full
  // waitlist form below and invite them to finish it.
  function prefillWaitlistForm(addressForm) {
    var waitlistForm = document.querySelector("#waitlist-form");
    if (!waitlistForm) return;

    var fieldMap = {
      streetAddress: "#wl-street",
      city: "#wl-city",
      zip: "#wl-zip",
    };

    Object.keys(fieldMap).forEach(function (name) {
      var sourceField = addressForm.querySelector('[name="' + name + '"]');
      var targetField = waitlistForm.querySelector(fieldMap[name]);
      if (sourceField && targetField && sourceField.value) {
        targetField.value = sourceField.value;
      }
    });
  }

  // After a real waitlist signup, prompt them to bring a neighbor
  // along too — routes only open once there's enough interest nearby,
  // so this turns one signup into a chance at several.
  function showNeighborShare(form) {
    var existing = document.querySelector("[data-neighbor-share]");
    if (existing) existing.remove();

    var shareText =
      "I just asked Streetside for a quote — they take your bins to the curb and back, clear your snow, and more. The more neighbors who sign up, the sooner a route opens!";
    var shareUrl = "https://streetsideoh.com/#waitlist";

    var wrap = document.createElement("div");
    wrap.className = "neighbor-share";
    wrap.setAttribute("data-neighbor-share", "");
    wrap.innerHTML =
      "<p class=\"neighbor-share__prompt\">Know a neighbor who'd want this too? Routes open faster with more neighbors nearby.</p>" +
      "<button type=\"button\" class=\"btn btn-outline-brand neighbor-share__btn\">Share With a Neighbor</button>" +
      "<p class=\"neighbor-share__copied\" data-copied-msg hidden>Link copied — paste it in a text!</p>";

    var statusEl = document.querySelector("#waitlist-form-status");
    if (statusEl && statusEl.parentNode) {
      statusEl.parentNode.insertBefore(wrap, statusEl.nextSibling);
    } else {
      form.parentNode.appendChild(wrap);
    }

    var btn = wrap.querySelector(".neighbor-share__btn");
    btn.addEventListener("click", async function () {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Streetside", text: shareText, url: shareUrl });
          return;
        } catch (err) {
          // Person cancelled the native share sheet, or it's not
          // supported for this content — fall back to copying below.
        }
      }
      try {
        await navigator.clipboard.writeText(shareText + " " + shareUrl);
        var copiedMsg = wrap.querySelector("[data-copied-msg]");
        if (copiedMsg) {
          copiedMsg.hidden = false;
          setTimeout(function () {
            copiedMsg.hidden = true;
          }, 4000);
        }
      } catch (err) {
        console.warn("[streetside] Could not copy share text:", err);
      }
    });
  }

  async function handleSubmit(form, statusEl, formType) {
    var config = (window.STREETSIDE_CONFIG || {}).waitlistForm || {};
    var payload = serializeForm(form);
    payload.formType = formType; // "waitlist" or "address-check"
    payload.submittedAt = new Date().toISOString();
    payload.formLoadedAt = pageLoadedAt;
    var attribution = getAttribution();
    if (attribution) payload.attribution = attribution;

    // The waitlist form has one combined "email or phone" field —
    // split it back into the email/phone fields the backend, the
    // Sheets sync, and the confirmation email all expect, based on
    // whether it looks like an email address.
    if (payload.emailOrPhone) {
      var contact = String(payload.emailOrPhone).trim();
      if (contact.indexOf("@") !== -1) {
        payload.email = contact;
      } else {
        payload.phone = contact;
      }
      delete payload.emailOrPhone;
    }

    if (formType === "waitlist") {
      // Which services they ticked — always sent as a list.
      payload.services = payload.services === undefined ? [] : [].concat(payload.services);
      if (!payload.services.length) {
        showStatus(statusEl, "Please choose at least one service you're interested in.", "error");
        return;
      }
      var emailOk = !payload.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(payload.email).trim());
      var phoneDigits = String(payload.phone || "").replace(/\D/g, "");
      var phoneOk = !payload.phone || phoneDigits.length === 10 || (phoneDigits.length === 11 && phoneDigits.charAt(0) === "1");
      if (!emailOk || !phoneOk) {
        showStatus(
          statusEl,
          !emailOk
            ? "That email address doesn't look quite right — please double-check it."
            : "That phone number doesn't look quite right — please enter all 10 digits, or use your email instead.",
          "error"
        );
        return;
      }
    }

    if (!config.endpoint) {
      showStatus(
        statusEl,
        "Thanks for the details — signups aren't connected to a live system yet, so nothing has been saved. (Site owner: set waitlistForm.endpoint in config/site-config.js to start collecting real submissions.)",
        "error"
      );
      console.info("[streetside] Waitlist submission captured locally only (no endpoint configured):", payload);
      return;
    }

    var submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      var res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        var errBody = {};
        try { errBody = await res.json(); } catch (e) { /* not JSON */ }
        if ((res.status === 400 || res.status === 429) && errBody && errBody.error) {
          showStatus(statusEl, errBody.error, "error");
          return;
        }
        throw new Error("Form endpoint responded with " + res.status);
      }

      var data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        // Some form backends (e.g. Formspree) don't return JSON we
        // control — that's fine, we just fall back to the generic
        // waitlist message below.
      }

      if (formType === "address-check") {
        if (data.available === true) {
          showStatus(
            statusEl,
            "Good news — Streetside already serves your area! Call (740) 640-6628 or request a quote below and we'll get you set up.",
            "success"
          );
        } else {
          prefillWaitlistForm(form);
          statusEl.classList.remove("is-error");
          statusEl.classList.add("is-success");

          var nearby = data.nearbyCount || 0;
          var intro =
            nearby > 0
              ? nearby +
                (nearby === 1 ? " neighbor" : " neighbors") +
                " near you have already asked about service, but that's not quite enough yet to open a route."
              : "There aren't any routes in your area yet.";

          statusEl.innerHTML =
            intro +
             " <strong>Call (740) 640-6628 or request a quote below</strong> and we'll reach out as soon as one opens near you. " +
            '<a href="#waitlist-form" class="form-status__link">Jump to the form &darr;</a>';
        }
      } else {
        showStatus(
          statusEl,
          data.duplicate
            ? "We already have your request — no need to send it again! We'll be in touch soon."
            : "Thanks — we got your request! We'll call or email you with your quote soon.",
          "success"
        );
        showNeighborShare(form);

        // Tells Meta this visitor became a real lead, not just a page
        // view — this is what actually lets ad campaigns optimize
        // toward people who convert, not just people who click.
        // Guarded because fbq won't exist if the Pixel script is
        // blocked (ad blockers, browser privacy settings, etc.) —
        // that should never break the signup itself.
        if (typeof fbq === "function" && !data.duplicate) {
          fbq("track", "Lead");
        }
      }

      form.reset();
    } catch (err) {
      console.error("[streetside] Waitlist submission failed:", err);
      showStatus(
        statusEl,
        "Something went wrong sending that — please try again, or just call us at (740) 640-6628.",
        "error"
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // --- Live input formatting ---------------------------------------
  // Cleans up the two fields people most often type inconsistently —
  // phone numbers and city names — as they go, so what actually gets
  // saved already looks right instead of needing cleanup later.

  // Turns raw typed digits into a standard "(614) 555-1234" shape as
  // the person types. Caps at 10 digits (US numbers); anything typed
  // past that is ignored rather than silently truncating what's
  // already there.
  function formatPhoneDigits(digits) {
    digits = digits.slice(0, 10);
    var len = digits.length;
    if (len === 0) return "";
    if (len < 4) return "(" + digits;
    if (len < 7) return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
  }

  // The waitlist form has one combined "Email or Phone" field, so
  // this only kicks in once it's clear the person is typing a phone
  // number rather than an email address — specifically, once the
  // field has no letters or "@" in it yet and starts with a digit.
  // The moment an "@" or a letter shows up, formatting backs off
  // completely and leaves the field alone, so typing an email never
  // fights the phone formatter.
  function looksLikePhoneInProgress(value) {
    return value.length > 0 && !/[a-zA-Z@]/.test(value);
  }

  function initPhoneFormatting(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", function () {
      var value = input.value;
      if (!looksLikePhoneInProgress(value)) return; // let email typing through untouched
      var digits = value.replace(/\D/g, "");
      input.value = formatPhoneDigits(digits);
    });
  }

  // Capitalizes each word of a city name ("new lexington" ->
  // "New Lexington", "o'fallon" -> "O'Fallon") without needing the
  // person to remember to do it themselves. Runs on blur rather than
  // every keystroke so it never fights mid-word typing or moves the
  // cursor while they're still typing.
  function titleCaseCity(value) {
    return value.toLowerCase().replace(/\b[a-z]/g, function (c) {
      return c.toUpperCase();
    });
  }

  function initCityCapitalization(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("blur", function () {
      if (input.value.trim()) input.value = titleCaseCity(input.value);
    });
  }

  // Promo / referral code: uppercased as typed so "spring25" and
  // "SPRING25" always count as the same code, and pre-filled from a
  // ?ref= or ?promo= link (e.g. streetsideoh.com/?ref=SMITH) so a
  // shared link tracks where signups came from with zero typing.
  function initPromoCode(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", function () {
      var pos = input.selectionStart;
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      try { input.setSelectionRange(pos, pos); } catch (e) { /* not supported on some inputs */ }
    });
    // Show whether the code is one of ours. The list comes from
    // scripts/promo-codes.js (live list from the admin page).
    var statusEl = input.parentNode.querySelector("[data-promo-status]");
    var P = window.STREETSIDE_PROMO;
    function norm(v) { return String(v || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""); }
    function showPromoStatus() {
      if (!statusEl) return;
      var code = norm(input.value);
      var known = P ? P.codes : null; // null until the list loads (or if it can't load)
      if (!code || known === null) { statusEl.hidden = true; statusEl.className = "field-hint promo-status"; return; }
      var match = P.find(code);
      statusEl.hidden = false;
      if (match) {
        var msg = "\u2713 Code " + code + " accepted: " + P.words(match) + " your first bill.";
        var picked = Array.prototype.map.call(
          document.querySelectorAll('#waitlist-form input[name="services"]:checked'),
          function (b) { return b.value; }
        );
        if (match.appliesTo && match.appliesTo.length &&
            !match.appliesTo.some(function (s) { return picked.indexOf(s) !== -1; })) {
          msg += " This code is for " + match.appliesTo.map(function (s) { return P.names[s] || s; }).join(" / ") + " \u2014 tick it above to use it.";
        }
        statusEl.textContent = msg;
        statusEl.className = "field-hint promo-status promo-status--ok";
      } else if (code.length >= 2) {
        statusEl.textContent = "We don't recognize that code. Double-check the spelling \u2014 or if a friend referred you, that's fine, we'll note it.";
        statusEl.className = "field-hint promo-status promo-status--unknown";
      } else {
        statusEl.hidden = true;
      }
    }
    input.addEventListener("input", showPromoStatus);
    document.addEventListener("change", function (e) {
      if (e.target && e.target.name === "services") showPromoStatus();
    });
    document.addEventListener("streetside:promos", showPromoStatus);
    showPromoStatus();

    try {
      var params = new URLSearchParams(window.location.search);
      var fromLink = params.get("ref") || params.get("promo");
      if (fromLink && !input.value) {
        input.value = fromLink.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
        showPromoStatus();
        // lets the price boxes pick the code up too
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } catch (e) { /* URLSearchParams unavailable — field just stays blank */ }
  }

  // The "Which Bin Valet plan?" menu only matters when Bin Valet is ticked:
  // hide it (and stop requiring it) when it isn't.
  function initServicePicks() {
    var form = document.querySelector("#waitlist-form");
    if (!form) return;
    var valet = form.querySelector('input[name="services"][value="bin-valet"]');
    var planWraps = form.querySelectorAll("[data-valet-plan]");
    var binsBox = form.querySelector("#wl-bins");
    var plan = form.querySelector("#wl-package");
    if (!valet || !planWraps.length || !plan) return;
    function sync() {
      var on = valet.checked;
      Array.prototype.forEach.call(planWraps, function (w) { w.hidden = !on; });
      if (binsBox) binsBox.disabled = !on;
      plan.required = false;
      plan.disabled = !on;
    }
    form.querySelectorAll('input[name="services"]').forEach(function (box) {
      box.addEventListener("change", sync);
    });
    form.addEventListener("reset", function () { setTimeout(function () { sync(); syncSnow(); updateSnowLabel(); }, 0); });
    sync();

    // Snow Removal: show the square-feet box only when Snow Removal is ticked.
    var snow = form.querySelector('input[name="services"][value="snow-removal"]');
    var snowWrap = form.querySelector("[data-snow-size]");
    var snowInput = form.querySelector("#wl-snow-sqft");
    var snowLabel = form.querySelector("#wl-snow-label");
    var snowHint = form.querySelector("[data-snow-form-price]");
    var baseHint = snowHint ? snowHint.innerHTML : "";
    var snowMath = window.STREETSIDE_SNOW;
    function updateSnowLabel() {
      if (!snowInput || !snowLabel) return;
      var lbl = snowMath ? snowMath.label(parseFloat(snowInput.value)) : "";
      snowLabel.value = lbl;
      if (snowHint) {
        snowHint.innerHTML = lbl
          ? "<strong>Estimate: " + lbl.split(" \u2014 about ")[1].replace("/visit", " per visit") + ".</strong> We'll confirm the size and price before service begins."
          : baseHint;
      }
    }
    function syncSnow() {
      if (!snow || !snowWrap || !snowInput || !snowLabel) return;
      snowWrap.hidden = !snow.checked;
      snowInput.disabled = !snow.checked;
      snowLabel.disabled = !snow.checked;
    }
    if (snow && snowWrap && snowInput && snowLabel) {
      snowInput.addEventListener("input", updateSnowLabel);
      snow.addEventListener("change", syncSnow);
      syncSnow();
      updateSnowLabel();
    }
  }

  function initForm(formSelector, statusSelector, formType) {
    var form = document.querySelector(formSelector);
    if (!form) return;
    var statusEl = document.querySelector(statusSelector);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      handleSubmit(form, statusEl, formType);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initForm("#waitlist-form", "#waitlist-form-status", "waitlist");
    initForm("#address-check-form", "#address-check-status", "address-check");

    initServicePicks();
    initPromoCode("wl-promo");
    initPhoneFormatting("wl-contact");
    initCityCapitalization("wl-city");
    initCityCapitalization("ac-city");
  });
})();
