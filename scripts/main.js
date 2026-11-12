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
      var total = typeof founding.spotsTotal === "number" ? founding.spotsTotal : null;
      bannerMount.innerHTML =
        '<div class="founding-offer__stamp" aria-hidden="true">' +
          '<span class="founding-offer__pct">' + founding.discountPercent + '%</span>' +
          '<span class="founding-offer__off">OFF</span>' +
          '<span class="founding-offer__sub">first month</span>' +
        '</div>' +
        '<div class="founding-offer__body">' +
          '<span class="founding-offer__eyebrow">' + founding.name + '</span>' +
          '<h3>' + founding.headline + '</h3>' +
          '<ul class="founding-offer__perks">' +
            '<li>' + founding.discountPercent + '% off your first month</li>' +
            '<li>Rate locked for ' + founding.lockYears + ' years</li>' +
            (total !== null ? '<li>First ' + total + ' households only</li>' : '') +
          '</ul>' +
          '<p class="founding-offer__fine">' + founding.description + '</p>' +
        '</div>' +
        (total !== null
          ? '<div class="founding-offer__meter">' +
              '<div class="founding-offer__spots"><strong data-spots-remaining>' + total + '</strong><span>of ' + total + ' founding spots left</span></div>' +
              '<div class="founding-offer__bar" role="presentation"><span data-spots-bar></span></div>' +
              '<p class="founding-offer__note" data-spots-note></p>' +
              '<a href="#waitlist" class="btn btn-accent btn-block">Claim my founding spot <span class="btn-icon" aria-hidden="true">→</span></a>' +
            '</div>'
          : '') ;
      bannerMount.style.display = "grid";
    } else if (bannerMount) {
      bannerMount.style.display = "none";
    }
  }

  function renderServices() {
    var mount = document.querySelector("[data-services]");
    var services = ((window.STREETSIDE_CONFIG || {}).services) || [];
    var section = document.getElementById("services");
    if (!mount || !section) return;

    if (!services.length) {
      section.style.display = "none";
      return;
    }

    services.forEach(function (service) {
      var soon = service.status === "coming-soon";
      var card = el("div", "service-card reveal-item" + (soon ? " service-card--coming-soon" : " service-card--available"));
      card.appendChild(el("span", "service-card__badge" + (soon ? "" : " service-card__badge--live"), soon ? "Coming Soon" : "Signups Open"));
      card.appendChild(el("h3", null, service.name));
      card.appendChild(el("p", "service-card__desc", service.description));
      if (service.priceNote) card.appendChild(el("p", "service-card__price", service.priceNote));
      var link = el("a", "service-card__cta", (service.cta || "I'm interested") + " \u2192");
      link.href = service.ctaHref || "#waitlist";
      if (!service.ctaHref) link.setAttribute("data-pick-service", service.id);
      link.setAttribute("aria-label", (service.cta || "I'm interested") + " \u2014 " + service.name);
      card.appendChild(link);
      mount.appendChild(card);
    });

    // Tapping a card's button ticks that service on the signup form
    // (the page then scrolls to the form through the normal #waitlist link).
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("[data-pick-service]") : null;
      if (!a) return;
      var box = document.querySelector('#waitlist-form input[name="services"][value="' + a.getAttribute("data-pick-service") + '"]');
      if (box && !box.checked) {
        box.checked = true;
        box.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // Snow Removal price estimator. Customers type their total square feet,
  // or open "Help me measure" and add each area as length x width.
  function renderSnowPricing() {
    var mount = document.querySelector("[data-snow-pricing]");
    var snow = window.STREETSIDE_SNOW;
    var cfg = snow && snow.cfg;
    if (!mount || !cfg || !cfg.ratePerSqft) return;

    var includes = (cfg.includes || [])
      .map(function (i) { return "<li>" + i + "</li>"; })
      .join("");

    var areaTypes = ["Driveway", "Sidewalk", "Walkway", "Patio", "Steps", "Other"];

    mount.innerHTML =
      '<div class="snow-pricing__inner">' +
        '<div class="snow-pricing__copy">' +
          '<div class="snow-stat"><span class="snow-stat__big">$' + cfg.ratePerSqft.toFixed(2) + '</span><span class="snow-stat__unit">per square foot, per visit</span></div>' +
          "<p>" + snow.money(cfg.minimumPrice) + " minimum, which covers up to " + cfg.minimumSqft.toLocaleString("en-US") + " sq ft.</p>" +
          '<p class="snow-pricing__includes-label">Every visit includes:</p>' +
          '<ul class="snow-pricing__includes">' + includes + "</ul>" +
          '<ol class="snow-steps">' +
            "<li><strong>Enter your size.</strong> Type your square feet or use the measuring helper.</li>" +
            "<li><strong>Tell us you're in.</strong> Join the list and choose Snow Removal.</li>" +
            "<li><strong>We confirm.</strong> We check the size and price with you before service begins.</li>" +
          "</ol>" +
        "</div>" +
        '<div class="snow-pricing__calc">' +
          '<label for="snow-sqft">Total square feet to clear</label>' +
          '<div class="snow-pricing__input"><input id="snow-sqft" type="number" inputmode="numeric" min="1" max="1000000" step="1" placeholder="e.g. 1,800" /><span>sq ft</span></div>' +
          '<details class="snow-measure">' +
            "<summary>Not sure? Help me measure</summary>" +
            '<p class="snow-measure__help">Add each area you want cleared — driveway, sidewalk, walkway, patio, steps. Enter its length and width in feet (a rough guess is fine, a step or stride is about 2.5 ft). We\'ll add it up for you.</p>' +
            '<div class="snow-measure__rows" data-measure-rows></div>' +
            '<button type="button" class="snow-measure__add" data-measure-add>+ Add another area</button>' +
            '<p class="snow-measure__total">Measured total: <strong data-measure-total>0 sq ft</strong></p>' +
          "</details>" +
          '<div class="snow-pricing__result" aria-live="polite">' +
            '<span class="snow-pricing__result-label">Estimated price</span>' +
            '<span class="snow-pricing__result-price" data-snow-price>&mdash;</span>' +
            '<span class="snow-pricing__result-note" data-snow-note>Enter your square feet to see your price per visit.</span>' +
          "</div>" +
          '<p class="snow-pricing__fine">This is an estimate based on the square footage you enter. We\'ll confirm the size and price before service begins.</p>' +
          '<a class="btn btn-primary btn-block" href="#waitlist" data-pick-service="snow-removal">I\'m interested in Snow Removal</a>' +
        "</div>" +
      "</div>";

    var input = mount.querySelector("#snow-sqft");
    var rowsEl = mount.querySelector("[data-measure-rows]");
    var totalEl = mount.querySelector("[data-measure-total]");
    var priceEl = mount.querySelector("[data-snow-price]");
    var noteEl = mount.querySelector("[data-snow-note]");
    var formInput = function () { return document.getElementById("wl-snow-sqft"); };

    function updateResult() {
      var sqft = parseFloat(input.value);
      var price = snow.price(sqft);
      if (price === null) {
        priceEl.innerHTML = "&mdash;";
        noteEl.textContent = "Enter your square feet to see your price per visit.";
      } else {
        priceEl.innerHTML = snow.money(price) + " <small>per visit</small>";
        noteEl.textContent = sqft * cfg.ratePerSqft < cfg.minimumPrice
          ? "Minimum price applies. Salting included."
          : Math.round(sqft).toLocaleString("en-US") + " sq ft \u00d7 $" + cfg.ratePerSqft.toFixed(2) + ". Salting included.";
      }
      var f = formInput();
      if (f && f.value !== input.value) {
        f.value = input.value;
        f.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    input.addEventListener("input", updateResult);

    // Typing in the signup form's box updates this estimator too.
    document.addEventListener("input", function (e) {
      if (e.target && e.target.id === "wl-snow-sqft" && input.value !== e.target.value) {
        input.value = e.target.value;
        updateResult();
      }
    });

    function addRow() {
      var row = el("div", "snow-measure__row");
      var opts = areaTypes.map(function (t) { return "<option>" + t + "</option>"; }).join("");
      row.innerHTML =
        '<select aria-label="Area type">' + opts + "</select>" +
        '<input type="number" inputmode="decimal" min="0" step="any" placeholder="Length" aria-label="Length in feet" />' +
        '<span class="snow-measure__x">&times;</span>' +
        '<input type="number" inputmode="decimal" min="0" step="any" placeholder="Width" aria-label="Width in feet" />' +
        '<span class="snow-measure__ft">ft</span>' +
        '<span class="snow-measure__sub">0 sq ft</span>' +
        '<button type="button" class="snow-measure__remove" aria-label="Remove this area">&times;</button>';
      row.querySelector(".snow-measure__remove").addEventListener("click", function () {
        row.remove();
        recalc();
      });
      row.addEventListener("input", recalc);
      rowsEl.appendChild(row);
    }

    function recalc() {
      var total = 0;
      rowsEl.querySelectorAll(".snow-measure__row").forEach(function (row) {
        var nums = row.querySelectorAll("input");
        var area = (parseFloat(nums[0].value) || 0) * (parseFloat(nums[1].value) || 0);
        if (area < 0) area = 0;
        row.querySelector(".snow-measure__sub").textContent = Math.round(area).toLocaleString("en-US") + " sq ft";
        total += area;
      });
      total = Math.round(total);
      totalEl.textContent = total.toLocaleString("en-US") + " sq ft";
      input.value = total > 0 ? String(total) : "";
      updateResult();
    }

    mount.querySelector("[data-measure-add]").addEventListener("click", addRow);
    addRow();

    // "I'm interested" carries the size into the signup form.
    mount.querySelector("[data-pick-service]").addEventListener("click", function () {
      var f = formInput();
      if (f && input.value) {
        f.value = input.value;
        f.dispatchEvent(new Event("input", { bubbles: true }));
      }
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
    renderServices();
    renderSnowPricing();
    renderFAQ();
    renderHearAboutUs();
    renderFooterContact();
    renderPackageOptions();
    setYear();
    initPackagePreselect();
  });
})();
