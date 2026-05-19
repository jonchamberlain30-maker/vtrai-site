(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var localOrigin = window.location.origin;
  var surfaceSelector = [
    "main > section",
    "main > article",
    "main > .hero",
    "main > .card",
    "main > .simple-panel",
    "main > .gecko-badge",
    ".category-grid > *",
    ".grid > *",
    ".checks > *",
    ".status-row > *",
    ".launch-grid > *",
    ".trust-meta > *",
    ".proof-panel",
    ".return",
    ".return-loop",
    ".proof-hunt-strip",
    ".coinzilla-path",
    ".checker",
    ".status-board"
  ].join(",");

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function markSurfaces() {
    var seen = [];
    document.querySelectorAll(surfaceSelector).forEach(function (el) {
      if (!el || el.closest("[data-vectora-motion-skip]")) return;
      if (seen.indexOf(el) !== -1) return;
      seen.push(el);
    });
    seen.forEach(function (el, index) {
      el.setAttribute("data-vectora-motion", "");
      el.style.setProperty("--vectora-motion-delay", Math.min(index % 7, 6) * 38 + "ms");
    });
    return seen;
  }

  function revealSurfaces(surfaces) {
    if (!("IntersectionObserver" in window)) {
      surfaces.forEach(function (el) {
        el.classList.add("vectora-motion-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("vectora-motion-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px 12% 0px",
      threshold: 0.02
    });

    surfaces.forEach(function (el) {
      observer.observe(el);
    });
  }

  function shouldTransitionLink(link, event) {
    if (!link || !link.href) return false;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var url;
    try {
      url = new URL(link.href);
    } catch (err) {
      return false;
    }
    if (url.origin !== localOrigin) return false;
    if (url.pathname === window.location.pathname && url.hash) return false;
    return /\.html$|\/$/.test(url.pathname);
  }

  function initPageTransitions() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a");
      if (!shouldTransitionLink(link, event)) return;
      event.preventDefault();
      var destination = link.href;
      document.body.classList.add("vectora-motion-leaving");
      window.setTimeout(function () {
        window.location.href = destination;
      }, 135);
    });

    window.addEventListener("pageshow", function () {
      document.body.classList.remove("vectora-motion-leaving");
    });
  }

  function initDepthSurfaces() {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll("[data-vectora-depth='true']").forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        var y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
        el.style.setProperty("--vectora-tilt-x", x.toFixed(2) + "deg");
        el.style.setProperty("--vectora-tilt-y", y.toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--vectora-tilt-x", "0deg");
        el.style.setProperty("--vectora-tilt-y", "0deg");
      });
    });
  }

  ready(function () {
    if (reduceMotion) {
      document.body.classList.add("vectora-motion-reduced");
      return;
    }
    document.body.classList.add("vectora-motion-enter");
    revealSurfaces(markSurfaces());
    initPageTransitions();
    initDepthSurfaces();
  });
})();
