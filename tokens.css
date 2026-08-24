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

  function formatPrice(n) {
    var fixed = Number(n).toFixed(2);
    return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
  }

  function renderPricing() {
    var mount = document.querySelector("[data-pricing-grid]");
    var config = window.STREETSIDE_CONFIG || {};
    var tiers = config.pricingTiers || [];
    var oneTime = config.oneTimeService;
    var founding = config.foundingOffer;
    if (!mount || !tiers.length) return;

    tiers.forEach(function (tier) {
      var classes = "price-card reveal-item";
      if (tier.featured) classes += " price-card--featured";
      if (tier.comingSoon) classes += " price-card--coming-soon";
      var card = el("div", classes);

      if (tier.featured) {
        card.appendChild(el("span", "price-card__tag", "Most popular"));
      } else if (tier.comingSoon) {
        card.appendChild(el("span", "price-card__tag price-card__tag--soon", "Coming soon"));
      }

      card.appendChild(el("h3", null, tier.name));
      card.appendChild(el("p", "price-card__desc", tier.description));

      if (tier.comingSoon || tier.price === null || tier.price === undefined) {
        card.appendChild(el("div", "price-card__value", "TBD"));
      } else if (founding && founding.enabled) {
        var discounted = formatPrice(tier.price * (1 - founding.discountPercent / 100));
        var valueEl = el(
          "div",
          "price-card__value",
          "$" + discounted +
            ' <span class="price-card__strike">$' + formatPrice(tier.price) + '</span>' +
            ' <span class="unit">first month</span>'
        );
        card.appendChild(valueEl);
        card.appendChild(el("p", "price-card__then", "Then $" + formatPrice(tier.price) + " / " + tier.billingUnit + " — rate locked for " + founding.lockYears + " years"));
      } else {
        card.appendChild(
          el("div", "price-card__value", "$" + formatPrice(tier.price) + ' <span class="unit">/ ' + tier.billingUnit + "</span>")
        );
      }

      var list = el("ul");
      tier.features.forEach(function (f) {
        list.appendChild(el("li", null, checkIcon() + "<span>" + f + "</span>"));
      });
      card.appendChild(list);

      if (tier.comingSoon) {
        var notifyBtn = el("a", "btn btn-primary btn-block", "Notify Me");
        notifyBtn.setAttribute("href", "#waitlist");
        card.appendChild(notifyBtn);
      } else {
        var cta = el("a", "btn btn-primary btn-block", "Join the Waitlist");
        cta.setAttribute("href", "#waitlist");
        card.appendChild(cta);
      }

      mount.appendChild(card);
    });

    // --- One-time service card ---
    if (oneTime) {
      var otCard = el("div", "price-card reveal-item");
      otCard.appendChild(el("h3", null, oneTime.name));
      otCard.appendChild(el("p", "price-card__desc", oneTime.description));

      var priceText =
        oneTime.priceLow != null && oneTime.priceHigh != null
          ? "$" + oneTime.priceLow + "\u2013$" + oneTime.priceHigh
          : "TBD";
      otCard.appendChild(el("div", "price-card__value", priceText));

      var otList = el("ul");
      ["No subscription required", "Great for a one-off need", "Same reliable service"].forEach(
        function (f) {
          otList.appendChild(el("li", null, checkIcon() + "<span>" + f + "</span>"));
        }
      );
      otCard.appendChild(otList);

      var otCta = el("a", "btn btn-primary btn-block", "Join the Waitlist");
      otCta.setAttribute("href", "#waitlist");
      otCard.appendChild(otCta);
      mount.appendChild(otCard);
    }

    // --- Founding 250 promo banner, rendered separately above/below the cards ---
    var bannerMount = document.querySelector("[data-founding-offer]");
    if (founding && founding.enabled && bannerMount) {
      bannerMount.innerHTML =
        '<h3>' + founding.headline + '</h3>' +
        '<p>' + founding.description + '</p>';
      bannerMount.style.display = "block";
    } else if (bannerMount) {
      bannerMount.style.display = "none";
    }
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
