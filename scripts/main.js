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
      var classes = "price-card reveal-item reveal-item--from-right";
      if (tier.featured) classes += " price-card--featured";
      var card = el("div", classes);

      if (tier.featured) {
        card.appendChild(el("span", "price-card__tag", "Most popular"));
      }

      if (founding && founding.enabled && tier.price !== null && tier.price !== undefined) {
        var ribbonClip = el(
          "div",
          "price-card__ribbon-clip",
          '<span class="price-card__save">Save ' + founding.discountPercent + '%</span>'
        );
        card.appendChild(ribbonClip);
      }

      card.appendChild(el("h3", null, tier.name));
      card.appendChild(el("p", "price-card__desc", tier.description));

      if (tier.price === null || tier.price === undefined) {
        card.appendChild(el("div", "price-card__value", "TBD"));
      } else if (founding && founding.enabled) {
        var discounted = formatPrice(tier.price * (1 - founding.discountPercent / 100));
        var valueEl = el(
          "div",
          "price-card__value price-card__value--deal",
          '<span class="price-card__big">$' + discounted + '</span>' +
            '<span class="price-card__strike">$' + formatPrice(tier.price) + '</span>' +
            '<span class="unit">first month</span>'
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

      var cta = el("a", "btn btn-primary btn-block", "Join the Waitlist");
      cta.setAttribute("href", "#waitlist");
      cta.setAttribute("data-package", tier.id);
      card.appendChild(cta);

      mount.appendChild(card);
    });

    // --- One-time service card ---
    if (oneTime) {
      var otCard = el("div", "price-card reveal-item reveal-item--from-right");
      otCard.appendChild(el("h3", null, oneTime.name));
      otCard.appendChild(el("p", "price-card__desc", oneTime.description));

      var priceText = oneTime.price != null ? "$" + formatPrice(oneTime.price) : "TBD";
      otCard.appendChild(el("div", "price-card__value", priceText));

      var otList = el("ul");
      (oneTime.features || ["No subscription required", "Great for a one-off need", "Same reliable service"]).forEach(
        function (f) {
          otList.appendChild(el("li", null, checkIcon() + "<span>" + f + "</span>"));
        }
      );
      otCard.appendChild(otList);

      var otCta = el("a", "btn btn-primary btn-block", "Join the Waitlist");
      otCta.setAttribute("href", "#waitlist");
      otCta.setAttribute("data-package", "one-time");
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

  // When someone clicks "Join the Waitlist" from a specific pricing
  // card, pre-select that plan in the waitlist form below — one less
  // thing for them to fill in, and gives you real data on which plan
  // people are actually interested in.
  function initPackagePreselect() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-package]");
      if (!link) return;
      var select = document.querySelector("#wl-package");
      if (!select) return;
      var value = link.getAttribute("data-package");
      var optionExists = Array.prototype.some.call(select.options, function (o) {
        return o.value === value;
      });
      if (optionExists) select.value = value;
    });
  }

  // Shows real prices right in the plan dropdown — someone landing
  // straight on the waitlist form (from an ad, a shared link, etc.)
  // shouldn't have to go hunting for the pricing section to know what
  // each option actually costs. Pulls from the same config as the
  // pricing cards, so it can never drift out of sync with them.
  function renderPackageOptions() {
    var select = document.querySelector("#wl-package");
    var config = window.STREETSIDE_CONFIG || {};
    var tiers = config.pricingTiers || [];
    var oneTime = config.oneTimeService;
    var founding = config.foundingOffer;
    if (!select) return;

    function priceLabel(price) {
      if (price === null || price === undefined) return "TBD";
      if (founding && founding.enabled) {
        var discounted = formatPrice(price * (1 - founding.discountPercent / 100));
        return "$" + discounted + " first mo., then $" + formatPrice(price) + "/mo";
      }
      return "$" + formatPrice(price) + "/mo";
    }

    var options = ['<option value="" disabled selected>Select a plan</option>'];

    tiers.forEach(function (tier) {
      options.push(
        '<option value="' + tier.id + '">' + tier.name + " — " + priceLabel(tier.price) + "</option>"
      );
    });

    if (oneTime) {
      var otPrice = oneTime.price != null ? "$" + formatPrice(oneTime.price) : "TBD";
      options.push('<option value="one-time">' + oneTime.name + " — " + otPrice + "</option>");
    }

    options.push('<option value="not-sure">Not sure yet</option>');

    select.innerHTML = options.join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderPricing();
    renderFAQ();
    renderHearAboutUs();
    renderFooterContact();
    renderPackageOptions();
    setYear();
    initPackagePreselect();
  });
})();
