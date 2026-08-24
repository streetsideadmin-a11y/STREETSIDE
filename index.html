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
          prefillWaitlistForm(form);
          statusEl.classList.remove("is-error");
          statusEl.classList.add("is-success");

          var nearby = data.nearbyCount || 0;
          var intro =
            nearby > 1
              ? nearby +
                " neighbors near you are already interested, but that's not quite enough yet to open a route."
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
