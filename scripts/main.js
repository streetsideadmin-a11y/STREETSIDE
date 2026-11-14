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

  // Promo-code box inside a price estimator. It mirrors the "Promo or Referral
  // Code" box in the quote form (typing in one fills the other), and calls
  // `onChange` whenever the code or the code list changes so the price updates.
  function promoFieldHtml(id) {
    return '<label for="' + id + '">Promo code <span class="optional">(optional)</span></label>' +
      '<input id="' + id + '" class="est-promo" data-est-promo type="text" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Have a code? Enter it here" />' +
      '<p class="field-hint promo-status" data-est-promo-note hidden></p>';
  }

  function wirePromoField(mount, onChange) {
    var box = mount.querySelector("[data-est-promo]");
    var formBox = function () { return document.getElementById("wl-promo"); };
    var P = window.STREETSIDE_PROMO;
    function norm(v) { return P ? P.norm(v) : String(v || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""); }
    if (!box) return { code: function () { return ""; }, note: function () {} };
    if (formBox() && formBox().value) box.value = norm(formBox().value);

    box.addEventListener("input", function () {
      var clean = norm(box.value);
      if (box.value !== clean) box.value = clean;
      var f = formBox();
      if (f && f.value !== clean) {
        f.value = clean;
        f.dispatchEvent(new Event("input", { bubbles: true }));
      }
      onChange();
    });
    // The form's box (or a ?promo= link) fills this one too.
    document.addEventListener("input", function (e) {
      if (e.target && e.target.id === "wl-promo") {
        var clean = norm(e.target.value);
        if (box.value !== clean) box.value = clean;
        onChange();
      }
    });
    document.addEventListener("streetside:promos", onChange);

    return {
      code: function () { return norm(box.value); },
      // Shows a short message under the box.
      note: function (text, ok) {
        var el = mount.querySelector("[data-est-promo-note]");
        if (!el) return;
        el.hidden = !text;
        el.textContent = text || "";
        el.className = "field-hint promo-status" + (text ? (ok ? " promo-status--ok" : " promo-status--unknown") : "");
      },
    };
  }

  // Works out the promo for one service and tells the box what to say.
  // Returns { match, applies, price, saved } or null.
  function promoFor(field, service, amount, serviceName) {
    var P = window.STREETSIDE_PROMO;
    var code = field.code();
    var res = P && code ? P.apply(code, service, amount) : null;
    if (!code || !P || P.codes === null) {
      field.note("");
    } else if (!res) {
      field.note(code.length >= 2 ? "We don't recognize that code. Double-check the spelling, or call us and we'll help." : "");
    } else if (!res.applies) {
      field.note(code + " is for " + res.match.appliesTo.map(function (s) { return P.names[s] || s; }).join(" / ") + ", not " + serviceName + ".", false);
    } else {
      field.note("✓ " + code + " accepted: " + P.words(res.match) + " your first bill.", true);
    }
    return res && res.applies ? res : null;
  }

  // Bin Valet price estimator — pick a plan and a number of bins, see the
  // price, then jump to the quote form with those choices filled in.
  // All numbers come from config/site-config.js (pricingTiers / oneTimeService).
  function renderBinEstimator(mount, tiers, oneTime, founding) {
    var EXTRA = 10;
    var plans = tiers.map(function (t) {
      return { id: t.id, name: t.name, base: t.price, extra: EXTRA, monthly: true, blurb: t.id === "full" ? "To the curb and back" : "To the curb", featured: !!t.featured };
    });
    if (oneTime) {
      plans.push({ id: "one-time", name: oneTime.name, base: oneTime.price, extra: oneTime.additionalBinPrice != null ? oneTime.additionalBinPrice : EXTRA, monthly: false, blurb: "Just once, no subscription", featured: false });
    }
    var current = plans.filter(function (p) { return p.featured; })[0] || plans[0];
    var bins = 1;
    var founderPct = founding && founding.enabled ? founding.discountPercent : 0;
    var lowest = Math.min.apply(null, plans.filter(function (p) { return p.monthly; }).map(function (p) { return p.base; }));

    var planHtml = plans.map(function (p) {
      return '<label class="bin-plan' + (p.featured ? " is-popular" : "") + '">' +
        '<input type="radio" name="bin-plan" value="' + p.id + '"' + (p === current ? " checked" : "") + " />" +
        '<span class="bin-plan__body"><strong>' + p.name + "</strong><small>" + p.blurb + "</small></span>" +
        '<span class="bin-plan__price">$' + formatPrice(p.base) + "<small>" + (p.monthly ? "/mo" : " once") + "</small></span>" +
        (p.featured ? '<span class="bin-plan__tag">Most popular</span>' : "") +
        "</label>";
    }).join("");

    mount.className = "snow-pricing bin-pricing reveal";
    mount.innerHTML =
      '<div class="snow-pricing__inner">' +
        '<div class="snow-pricing__copy">' +
          '<div class="snow-stat"><span class="snow-stat__big">$' + formatPrice(lowest) + '</span><span class="snow-stat__unit">per month to start</span></div>' +
          "<p>One bin is included in every plan. Each extra bin (trash or recycling) is $" + EXTRA + ".</p>" +
          '<p class="snow-pricing__includes-label">Every plan includes:</p>' +
          '<ul class="snow-pricing__includes"><li>Weekly service</li><li>Trash and recycling bins</li><li>Works while you\'re away</li></ul>' +
          '<ol class="snow-steps">' +
            "<li><strong>Pick your plan.</strong> Choose a plan and your number of bins.</li>" +
            "<li><strong>Get your quote.</strong> Send us your details below, or call (740) 640-6628.</li>" +
            "<li><strong>We confirm.</strong> We go over the price and start date with you first.</li>" +
          "</ol>" +
        "</div>" +
        '<div class="snow-pricing__calc">' +
          '<fieldset class="bin-plans"><legend>Choose your plan</legend>' + planHtml + "</fieldset>" +
          '<label for="bin-count">How many bins?</label>' +
          '<div class="bin-stepper">' +
            '<button type="button" class="bin-stepper__btn" data-bin-minus aria-label="One fewer bin">&minus;</button>' +
            '<input id="bin-count" type="number" inputmode="numeric" min="1" max="10" step="1" value="1" />' +
            '<button type="button" class="bin-stepper__btn" data-bin-plus aria-label="One more bin">+</button>' +
          "</div>" +
          '<p class="bin-hint" data-bin-hint></p>' +
          promoFieldHtml("bin-promo") +
          '<div class="snow-pricing__result" aria-live="polite">' +
            '<span class="snow-pricing__result-label">Estimated price</span>' +
            '<span class="snow-pricing__result-price" data-bin-price></span>' +
            '<span class="snow-pricing__result-note" data-bin-note></span>' +
          "</div>" +
          '<p class="snow-pricing__fine">This is an estimate. We\'ll confirm the plan, price, and start date with you before service begins.</p>' +
          '<a class="btn btn-primary btn-block" href="#waitlist" data-pick-service="bin-valet" data-bin-cta>Get a Quote</a>' +
          '<p class="snow-pricing__call">or call <a href="tel:+17406406628">(740) 640-6628</a></p>' +
        "</div>" +
      "</div>";

    var countEl = mount.querySelector("#bin-count");
    var priceEl = mount.querySelector("[data-bin-price]");
    var noteEl = mount.querySelector("[data-bin-note]");
    var cta = mount.querySelector("[data-bin-cta]");
    var hintEl = mount.querySelector("[data-bin-hint]");

    var promoField = wirePromoField(mount, function () { update(); });

    function update() {
      var n = Math.max(1, Math.min(10, parseInt(countEl.value, 10) || 1));
      bins = n;
      var total = current.base + (n - 1) * current.extra;
      var binWord = n + (n === 1 ? " bin" : " bins");
      var promo = promoFor(promoField, "bin-valet", total, "Bin Valet");
      var extraN = n - 1;
      var extraTxt = extraN + " extra bin" + (extraN === 1 ? "" : "s");
      hintEl.innerHTML = "Your first bin is included. <strong>Each extra bin adds $" + formatPrice(current.extra) + (current.monthly ? " per month" : "") + ".</strong>";
      // e.g. "$25 plan + 2 extra bins x $10 = $45"
      var parts = extraN > 0
        ? "$" + formatPrice(current.base) + " plan + " + extraTxt + " \u00d7 $" + formatPrice(current.extra) + " = $" + formatPrice(total) + (current.monthly ? " / month" : "") + "."
        : binWord + " included.";
      var estimate;
      if (current.monthly) {
        if (promo) {
          priceEl.textContent = "$" + formatPrice(promo.price) + " first month";
          noteEl.textContent = parts + " " + promoField.code() + " takes " + window.STREETSIDE_PROMO.words(promo.match) + " the first month, then $" + formatPrice(total) + " / month.";
        } else {
          priceEl.textContent = "$" + formatPrice(total) + " / month";
          noteEl.textContent = parts;
        }
        estimate = current.name + " \u00b7 " + binWord + " \u00b7 about $" + formatPrice(total) + "/month" +
          (promo ? " \u00b7 with " + promoField.code() + " about $" + formatPrice(promo.price) + " first month" : "");
      } else {
        if (promo) {
          priceEl.textContent = "$" + formatPrice(promo.price) + " one time";
          noteEl.textContent = parts + " " + promoField.code() + " takes " + window.STREETSIDE_PROMO.words(promo.match) + ".";
        } else {
          priceEl.textContent = "$" + formatPrice(total) + " one time";
          noteEl.textContent = parts + " No subscription.";
        }
        estimate = current.name + " \u00b7 " + binWord + " \u00b7 about $" + formatPrice(total) + " one time" +
          (promo ? " \u00b7 with " + promoField.code() + " about $" + formatPrice(promo.price) : "");
      }
      cta.setAttribute("data-package", current.id);
      var hidden = document.getElementById("wl-valet-estimate");
      if (hidden) hidden.value = estimate;
      var sel = document.getElementById("wl-package");
      if (sel && Array.prototype.some.call(sel.options, function (o) { return o.value === current.id; })) sel.value = current.id;
    }

    mount.addEventListener("change", function (e) {
      if (e.target && e.target.name === "bin-plan") {
        current = plans.filter(function (p) { return p.id === e.target.value; })[0] || current;
        update();
      }
    });
    countEl.addEventListener("input", update);
    mount.querySelector("[data-bin-minus]").addEventListener("click", function () { countEl.value = Math.max(1, bins - 1); update(); });
    mount.querySelector("[data-bin-plus]").addEventListener("click", function () { countEl.value = Math.min(10, bins + 1); update(); });
    var planSelect = document.getElementById("wl-package");
    if (planSelect) {
      planSelect.addEventListener("change", function () {
        var hidden = document.getElementById("wl-valet-estimate");
        if (hidden && planSelect.value !== current.id) hidden.value = "";
      });
    }
    mount._binSync = update;
    update();
  }

  function renderPricing() {
    var mount = document.querySelector("[data-pricing-grid]");
    var config = window.STREETSIDE_CONFIG || {};
    var tiers = config.pricingTiers || [];
    var oneTime = config.oneTimeService;
    var founding = config.foundingOffer;
    if (!mount || !tiers.length) return;

    renderBinEstimator(mount, tiers, oneTime, founding);

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
              '<a href="#waitlist" class="btn btn-accent btn-block">Get a quote &amp; claim my spot <span class="btn-icon" aria-hidden="true">→</span></a>' +
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
            "<li><strong>Get your quote.</strong> Send us your details below, or call (740) 640-6628.</li>" +
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
          promoFieldHtml("snow-promo") +
          '<div class="snow-pricing__result" aria-live="polite">' +
            '<span class="snow-pricing__result-label">Estimated price</span>' +
            '<span class="snow-pricing__result-price" data-snow-price>&mdash;</span>' +
            '<span class="snow-pricing__result-note" data-snow-note>Enter your square feet to see your price per visit.</span>' +
          "</div>" +
          '<p class="snow-pricing__fine">This is an estimate based on the square footage you enter. We\'ll confirm the size and price before service begins.</p>' +
          '<a class="btn btn-primary btn-block" href="#waitlist" data-pick-service="snow-removal">Get a Snow Removal Quote</a>' +
          '<p class="snow-pricing__call">or call <a href="tel:+17406406628">(740) 640-6628</a></p>' +
        "</div>" +
      "</div>";

    var input = mount.querySelector("#snow-sqft");
    var rowsEl = mount.querySelector("[data-measure-rows]");
    var totalEl = mount.querySelector("[data-measure-total]");
    var priceEl = mount.querySelector("[data-snow-price]");
    var noteEl = mount.querySelector("[data-snow-note]");
    var formInput = function () { return document.getElementById("wl-snow-sqft"); };
    var promoField = wirePromoField(mount, function () { updateResult(); });

    function updateResult() {
      var sqft = parseFloat(input.value);
      var price = snow.price(sqft);
      if (price === null) {
        priceEl.innerHTML = "&mdash;";
        noteEl.textContent = "Enter your square feet to see your price per visit.";
        promoFor(promoField, "snow-removal", 0, "Snow Removal");
      } else {
        var promo = promoFor(promoField, "snow-removal", price, "Snow Removal");
        var base = sqft * cfg.ratePerSqft < cfg.minimumPrice
          ? "Minimum price applies. Salting included."
          : Math.round(sqft).toLocaleString("en-US") + " sq ft \u00d7 $" + cfg.ratePerSqft.toFixed(2) + ". Salting included.";
        if (promo) {
          priceEl.innerHTML = snow.money(promo.price) + " <small>first visit</small>";
          noteEl.textContent = "Then " + snow.money(price) + " per visit. " + promoField.code() + " takes " + window.STREETSIDE_PROMO.words(promo.match) + " the first visit. " + base;
        } else {
          priceEl.innerHTML = snow.money(price) + " <small>per visit</small>";
          noteEl.textContent = base;
        }
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

  // When someone clicks "Get a Quote" from a specific pricing
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

    var options = [];

    tiers.forEach(function (tier) {
      options.push(
        '<option value="' + tier.id + '">' + tier.name + " — " + priceLabel(tier.price) + "</option>"
      );
    });

    if (oneTime) {
      var otPrice = oneTime.price != null ? "$" + formatPrice(oneTime.price) : "TBD";
      options.push('<option value="one-time">' + oneTime.name + " — " + otPrice + "</option>");
    }

    options.push('<option value="not-sure" selected>Not sure yet</option>');

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
    var binMount = document.querySelector("[data-pricing-grid]");
    if (binMount && binMount._binSync) binMount._binSync();
    setYear();
    initPackagePreselect();
  });
})();
