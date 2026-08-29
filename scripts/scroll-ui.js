/**
 * Sticky mobile "Join the Waitlist" bar + back-to-top button.
 * ---------------------------------------------------------------
 * Both are shown/hidden based on scroll position using plain scroll
 * events (throttled via requestAnimationFrame) rather than a library
 * — this page is already dependency-free and these are simple show/
 * hide toggles, not worth pulling in anything for.
 */
(function () {
  var stickyBar = document.querySelector("[data-sticky-cta]");
  var backToTop = document.querySelector("[data-back-to-top]");
  var heroCta = document.querySelector(".hero .btn-accent");
  var waitlistSection = document.querySelector("#waitlist");

  if (!stickyBar && !backToTop) return;

  var ticking = false;

  function update() {
    ticking = false;
    var scrollY = window.scrollY || window.pageYOffset;

    // Back-to-top: show once scrolled down a bit.
    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollY > 600);
    }

    // Sticky CTA: show once the hero's own CTA has scrolled out of
    // view, hide again once the real waitlist form comes into view
    // (no point showing a floating button right on top of the form
    // it points to).
    if (stickyBar) {
      var heroCtaBottom = heroCta ? heroCta.getBoundingClientRect().bottom : -1;
      var waitlistTop = waitlistSection
        ? waitlistSection.getBoundingClientRect().top
        : Infinity;
      var pastHero = heroCtaBottom < 0;
      var reachedWaitlist = waitlistTop < window.innerHeight * 0.6;
      stickyBar.classList.toggle("is-visible", pastHero && !reachedWaitlist);
    }
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
