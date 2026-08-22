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

  async function handleSubmit(form, statusEl, formType) {
    var config = (window.STREETSIDE_CONFIG || {}).waitlistForm || {};
    var payload = serializeForm(form);
    payload.formType = formType; // "waitlist" or "address-check"
    payload.submittedAt = new Date().toISOString();

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
          showStatus(
            statusEl,
            "There aren't any routes in your area yet, but we've added you to the waitlist — more neighbors signing up is what helps us open one there.",
            "success"
          );
        }
      } else {
        showStatus(
          statusEl,
          "You're on the list! We'll be in touch about Streetside service in your neighborhood.",
          "success"
        );
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
