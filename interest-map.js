/**
 * Header / navigation behavior:
 * - toggles the mobile menu
 * - closes the mobile menu on link click or Escape
 * - marks the active nav link based on scroll position
 */
(function () {
  function init() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!toggle || !menu) return;

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      menu.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // Active link highlighting via IntersectionObserver
    var sections = Array.prototype.slice.call(
      document.querySelectorAll("main section[id]")
    );
    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll(".primary-nav a[href^='#']")
    );

    if ("IntersectionObserver" in window && sections.length && navLinks.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            navLinks.forEach(function (link) {
              var isMatch = link.getAttribute("href") === "#" + entry.target.id;
              link.toggleAttribute("aria-current", isMatch);
              if (isMatch) link.setAttribute("aria-current", "true");
              else link.removeAttribute("aria-current");
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach(function (s) { observer.observe(s); });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
