(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var localOrigin = window.location.origin;
  var surfaceSelector = [
    "main > section",
    "main > article",
    "main > .nav",
    "main > .top",
    "header.top",
    ".topbar",
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
  var menuGroups = [
    {
      title: "Start",
      links: [
        ["Home", "./index.html"],
        ["Check Token", "./index.html#trust-check"],
        ["Watchlist", "./watchlist.html"],
        ["Buy & Verify", "./buy-and-verify.html"]
      ]
    },
    {
      title: "Verify",
      links: [
        ["Proof Hunt", "./proof-hunt.html"],
        ["Proof Pack", "./proof.html"],
        ["Token Info", "./token-info.html"],
        ["Updates", "./updates.html"]
      ]
    },
    {
      title: "Learn",
      links: [
        ["Safety Basics", "./education.html"],
        ["Guides Hub", "./guides.html"],
        ["Solana Checker", "./solana-token-checker.html"],
        ["DexScreener Guide", "./dexscreener-token-checker.html"]
      ]
    },
    {
      title: "Project",
      links: [
        ["About", "./about.html"],
        ["Whitepaper", "./whitepaper.html"],
        ["Build Log", "./lab.html"],
        ["Contact", "./contact.html"]
      ]
    }
  ];

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

  function buildMenuPanel(panel) {
    panel.textContent = "";
    panel.setAttribute("data-vectora-menu-panel", "");

    menuGroups.forEach(function (group) {
      var groupEl = document.createElement("div");
      groupEl.className = "menu-group";

      var title = document.createElement("span");
      title.className = "menu-group-title";
      title.textContent = group.title;
      groupEl.appendChild(title);

      group.links.forEach(function (item) {
        var link = document.createElement("a");
        link.href = item[1];
        link.textContent = item[0];
        if (isCurrentMenuLink(link)) {
          link.setAttribute("aria-current", "page");
        }
        groupEl.appendChild(link);
      });

      panel.appendChild(groupEl);
    });
  }

  function createMenu() {
    var details = document.createElement("details");
    details.className = "site-menu";
    var summary = document.createElement("summary");
    summary.setAttribute("aria-label", "Open site menu");
    details.appendChild(summary);
    details.appendChild(document.createElement("div"));
    return details;
  }

  function isCurrentMenuLink(link) {
    var linkUrl = new URL(link.href, window.location.href);
    var current = window.location.pathname.replace(/\/$/, "/index.html");
    var target = linkUrl.pathname.replace(/\/$/, "/index.html");
    if (target !== current) return false;
    if (linkUrl.hash && linkUrl.hash !== window.location.hash) return false;
    return true;
  }

  function alignMenu(details) {
    var summary = details.querySelector("summary");
    if (!summary) return;
    var rect = summary.getBoundingClientRect();
    details.setAttribute("data-vectora-menu-align", rect.left > window.innerWidth / 2 ? "right" : "left");
  }

  function initMenus() {
    var menus = Array.prototype.slice.call(document.querySelectorAll(".site-menu"));
    if (!menus.length) {
      var host = document.querySelector(".nav-actions") ||
        document.querySelector(".top-actions") ||
        document.querySelector("main > .nav") ||
        document.querySelector("main > .top") ||
        document.querySelector("header.top") ||
        document.querySelector(".topbar");
      if (host) {
        host.appendChild(createMenu());
        menus = Array.prototype.slice.call(document.querySelectorAll(".site-menu"));
      }
    }

    if (!menus.length) return;
    document.body.classList.add("vectora-menu-ready");

    menus.forEach(function (details) {
      var summary = details.querySelector("summary") || details.appendChild(document.createElement("summary"));
      var panel = details.querySelector(".menu-panel") || details.querySelector("div") || details.appendChild(document.createElement("div"));
      panel.classList.add("menu-panel");

      summary.innerHTML = '<span class="vectora-menu-icon" aria-hidden="true"></span><span class="vectora-menu-label">Menu</span>';
      summary.setAttribute("aria-label", "Open site menu");
      buildMenuPanel(panel);
      alignMenu(details);

      details.addEventListener("toggle", function () {
        alignMenu(details);
        if (details.open) {
          menus.forEach(function (other) {
            if (other !== details) other.removeAttribute("open");
          });
          document.body.classList.add("vectora-menu-open");
        } else if (!document.querySelector(".site-menu[open]")) {
          document.body.classList.remove("vectora-menu-open");
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest(".site-menu")) return;
      menus.forEach(function (details) {
        details.removeAttribute("open");
      });
      document.body.classList.remove("vectora-menu-open");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      menus.forEach(function (details) {
        details.removeAttribute("open");
      });
      document.body.classList.remove("vectora-menu-open");
    });

    window.addEventListener("resize", function () {
      menus.forEach(alignMenu);
    });
  }

  function initDepthSurfaces() {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".hero-banner, .hero-visual, .buy-panel, .trust-tool, .status-board").forEach(function (el) {
      if (!el.hasAttribute("data-vectora-depth")) {
        el.setAttribute("data-vectora-depth", "true");
      }
    });
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
    initMenus();
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
