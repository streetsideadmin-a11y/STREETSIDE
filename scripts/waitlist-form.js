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
      "I just joined the waitlist for Streetside — they take your trash & recycling bins to the curb and back every week so you don't have to. The more neighbors who join, the sooner a route opens!";
    var shareUrl = "https://streetsideoh.com/#waitlist";

    var wrap = document.createElement("div");
    wrap.className = "neighbor-share";
    wrap.setAttribute("data-neighbor-share", "");
    wrap.innerHTML =
      "<p class=\"neighbor-share__prompt\">Know a neighbor who'd want this too? Routes open faster with more signups nearby.</p>" +
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

      if (!res.ok) throw new Error("Form endpoint responded with " + res.status);

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
            "Good news — Streetside already serves your area! We'll be in touch to get you set up.",
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
                " near you already joined the waitlist, but that's not quite enough yet to open a route."
              : "There aren't any routes in your area yet.";

          statusEl.innerHTML =
            intro +
            " <strong>Add your contact info below</strong> and we'll reach out as soon as one opens near you. " +
            '<a href="#waitlist-form" class="form-status__link">Jump to the form &darr;</a>';
        }
      } else {
        showStatus(
          statusEl,
          "You're on the list! We'll be in touch about Streetside service in your neighborhood.",
          "success"
        );
        showNeighborShare(form);

        // Tells Meta this visitor became a real lead, not just a page
        // view — this is what actually lets ad campaigns optimize
        // toward people who convert, not just people who click.
        // Guarded because fbq won't exist if the Pixel script is
        // blocked (ad blockers, browser privacy settings, etc.) —
        // that should never break the signup itself.
        if (typeof fbq === "function") {
          fbq("track", "Lead");
        }
      }

      form.reset();
    } catch (err) {
      console.error("[streetside] Waitlist submission failed:", err);
      showStatus(
        statusEl,
        "Something went wrong sending that — please try again, or reach out to us directly.",
        "error"
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
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
  });
})();
