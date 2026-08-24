/**
 * Restrained scroll-reveal: fades/slides elements in once as they enter
 * the viewport. Respects prefers-reduced-motion by revealing everything
 * immediately (handled by the CSS media query disabling the transition,
 * plus this script still adds the class so content is never hidden).
 */
(function () {
  function init() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll(".reveal, .reveal-group")
    );
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach(function (t) { observer.observe(t); });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
