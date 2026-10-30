/**
 * "Contact us" pop-up (header button, floating button, mobile bar).
 * ---------------------------------------------------------------
 * Every Contact button is really a link to the #contact section at the
 * bottom of the page, so it still works if this script never runs. With
 * the script, clicking one opens a small Call / Text / Email card instead.
 * The phone number and email come from config/site-config.js
 * (business.contactPhone / business.contactEmail).
 */
(function () {
  var business = ((window.STREETSIDE_CONFIG || {}).business) || {};
  var email = business.contactEmail || "streetsideoh@gmail.com";
  var phone = business.contactPhone || "(740) 640-6628";
  var digits = phone.replace(/\D/g, "");
  var tel = "+" + (digits.length === 10 ? "1" + digits : digits);

  var ICONS = {
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    text: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>'
  };

  function esc(v) {
    return String(v).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function row(href, icon, title, sub) {
    return '<a href="' + esc(href) + '" class="contact-panel__row"><span class="contact-panel__icon">' + ICONS[icon] +
      '</span><span><strong>' + title + "</strong><small>" + esc(sub) + "</small></span></a>";
  }

  var panelHtml =
    '<p class="contact-panel__title">Contact Streetside</p>' +
    row("tel:" + tel, "phone", "Call us", phone) +
    row("sms:" + tel, "text", "Text us", phone) +
    row("mailto:" + email, "mail", "Email us", email);

  document.querySelectorAll("[data-contact-panel]").forEach(function (p) { p.innerHTML = panelHtml; });

  // Keep the section and mobile-menu buttons in step with the config too.
  document.querySelectorAll("[data-contact-call]").forEach(function (a) { a.href = "tel:" + tel; });
  document.querySelectorAll("[data-contact-text]").forEach(function (a) { a.href = "sms:" + tel; });
  document.querySelectorAll("[data-contact-mail]").forEach(function (a) { a.href = "mailto:" + email; });
  document.querySelectorAll("[data-contact-phone-label]").forEach(function (el) { el.textContent = "Call " + phone; });

  function panelFor(name) { return document.querySelector('[data-contact-panel="' + name + '"]'); }
  function togglesFor(name) { return document.querySelectorAll('[data-contact-toggle="' + name + '"]'); }

  function setOpen(name, open) {
    var panel = panelFor(name);
    if (!panel) return;
    panel.hidden = !open;
    togglesFor(name).forEach(function (t) { t.setAttribute("aria-expanded", open ? "true" : "false"); });
  }

  function closeAll(except) {
    ["header", "float"].forEach(function (n) { if (n !== except) setOpen(n, false); });
  }

  document.querySelectorAll("[data-contact-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var name = btn.getAttribute("data-contact-toggle");
      var panel = panelFor(name);
      if (!panel) return;
      var willOpen = panel.hidden;
      closeAll(name);
      setOpen(name, willOpen);
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-contact-toggle], [data-contact-panel]")) return;
    closeAll();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    ["header", "float"].forEach(function (n) {
      var panel = panelFor(n);
      if (panel && !panel.hidden) {
        setOpen(n, false);
        var t = togglesFor(n)[0];
        if (t && t.offsetParent !== null) t.focus();
      }
    });
  });

  // The pop-up from the mobile bar should disappear with the bar.
  window.addEventListener("scroll", function () {
    var bar = document.querySelector("[data-sticky-cta]");
    var fp = panelFor("float");
    if (bar && fp && !fp.hidden && getComputedStyle(bar).display !== "none" && !bar.classList.contains("is-visible") &&
        window.matchMedia("(max-width: 860px)").matches) {
      setOpen("float", false);
    }
  }, { passive: true });
})();
