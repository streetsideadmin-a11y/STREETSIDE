/**
 * Renders the config-driven parts of the page: pricing cards, FAQ list,
 * the waitlist form's "how did you hear about us" options, and footer
 * contact/social placeholders. Keeping this data-driven means pricing
 * and FAQ answers can be updated in config/site-config.js without
 * touching markup.
 */
(function () {
  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function checkIcon() {
    return (
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 8.5L6.2 11.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  function renderPricing() {
    var mount = document.querySelector("[data-pricing-grid]");
    var items = ((window.STREETSIDE_CONFIG || {}).pricing) || [];
    if (!mount || !items.length) return;

    items.forEach(function (plan) {
      var card = el("div", "price-card" + (plan.featured ? " price-card--featured reveal-item" : " reveal-item"));

      if (plan.featured) {
        card.appendChild(el("span", "price-card__tag", "Most popular"));
      }

      card.appendChild(el("h3", null, plan.name));
      card.appendChild(el("p", "price-card__desc", plan.description));

      if (plan.price === null || plan.price === undefined) {
        card.appendChild(
          el("span", "price-config-note", "Pricing set before launch")
        );
        card.appendChild(el("div", "price-card__value", "TBD"));
      } else {
        card.appendChild(
          el(
            "div",
            "price-card__value",
            "$" + plan.price + ' <span class="unit">/ ' + plan.billingUnit + "</span>"
          )
        );
      }

      var list = el("ul");
      plan.features.forEach(function (f) {
        var li = el("li", null, checkIcon() + "<span>" + f + "</span>");
        list.appendChild(li);
      });
      card.appendChild(list);

      card.appendChild(
        el(
          "a",
          "btn btn-primary btn-block",
          "Join the Waitlist"
        )
      );
      card.querySelector("a").setAttribute("href", "#waitlist");

      mount.appendChild(card);
    });
  }

  function renderFAQ() {
    var mount = document.querySelector("[data-faq-list]");
    var items = ((window.STREETSIDE_CONFIG || {}).faq) || [];
    if (!mount || !items.length) return;

    items.forEach(function (item, index) {
      var details = el("details", "faq-item");
      if (index === 0) details.open = true;

      var summary = el(
        "summary",
        "faq-item__q",
        "<span>" + item.q + "</span><span class='faq-item__icon' aria-hidden='true'></span>"
      );
      details.appendChild(summary);

      var answerWrap = el("div", "faq-item__a");
      if (item.a) {
        answerWrap.appendChild(el("p", null, item.a));
      }
      if (item.placeholder) {
        answerWrap.appendChild(el("span", "faq-placeholder", item.placeholder));
      }
      details.appendChild(answerWrap);

      mount.appendChild(details);
    });
  }

  function renderHearAboutUs() {
    var select = document.querySelector("[data-hear-about-us]");
    var options = ((window.STREETSIDE_CONFIG || {}).waitlistForm || {}).hearAboutUsOptions || [];
    if (!select || !options.length) return;
    options.forEach(function (label) {
      var opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      select.appendChild(opt);
    });
  }

  function renderFooterContact() {
    var business = ((window.STREETSIDE_CONFIG || {}).business) || {};
    var emailEl = document.querySelector("[data-contact-email]");
    var phoneEl = document.querySelector("[data-contact-phone]");

    if (emailEl) {
      if (business.contactEmail) {
        emailEl.textContent = business.contactEmail;
        emailEl.href = "mailto:" + business.contactEmail;
        emailEl.classList.remove("contact-placeholder");
      } else {
        emailEl.textContent = "Contact email — coming soon";
        emailEl.removeAttribute("href");
      }
    }

    if (phoneEl) {
      if (business.contactPhone) {
        phoneEl.textContent = business.contactPhone;
        phoneEl.href = "tel:" + business.contactPhone.replace(/[^\d+]/g, "");
        phoneEl.classList.remove("contact-placeholder");
      } else {
        phoneEl.textContent = "Phone — coming soon";
        phoneEl.removeAttribute("href");
      }
    }

    var socialWrap = document.querySelector("[data-social-links]");
    if (socialWrap && business.socialLinks) {
      var anyLink = false;
      socialWrap.querySelectorAll("[data-social]").forEach(function (link) {
        var url = business.socialLinks[link.getAttribute("data-social")];
        if (url) {
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.display = "";
          anyLink = true;
        } else {
          link.style.display = "none";
        }
      });
      socialWrap.style.display = anyLink ? "" : "none";
    }
  }

  function setYear() {
    var yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderPricing();
    renderFAQ();
    renderHearAboutUs();
    renderFooterContact();
    setYear();
  });
})();
