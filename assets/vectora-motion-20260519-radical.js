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
    ".status-board",
    ".vectora-hero-command",
    ".vectora-command-card",
    ".vectora-command-step"
  ].join(",");
  var primaryPaths = [
    {
      eyebrow: "Start Here",
      title: "Check a token",
      text: "Paste a mint or contract. Read the first source, route, and control signals.",
      href: "./index.html#trust-check",
      accent: "cyan"
    },
    {
      eyebrow: "Public Proof",
      title: "Join Proof Hunt",
      text: "Submit a token claim that does not line up clearly.",
      href: "./proof-hunt.html",
      accent: "green"
    },
    {
      eyebrow: "Official Route",
      title: "Buy & verify $VTRAI",
      text: "Match the mint first, then open the official route.",
      href: "./buy-and-verify.html",
      accent: "gold"
    }
  ];
  var menuGroups = [
    {
      title: "Do",
      links: [
        ["Home", "./index.html", "Main page"],
        ["Check Token", "./index.html#trust-check", "Paste a token"],
        ["Watchlist", "./watchlist.html", "Re-check later"],
        ["Buy & Verify", "./buy-and-verify.html", "Official route"]
      ]
    },
    {
      title: "Verify",
      links: [
        ["Proof Hunt", "./proof-hunt.html", "Submit a proof gap"],
        ["Proof Pack", "./proof.html", "Project references"],
        ["Token Info", "./token-info.html", "Mint and links"],
        ["Token Role", "./token-role.html", "$VTRAI purpose"]
      ]
    },
    {
      title: "Learn",
      links: [
        ["Safety Basics", "./education.html", "Five checks"],
        ["Public Proof Guide", "./public-proof-before-trading.html", "Verification guide"],
        ["Guides Hub", "./guides.html", "All guides"]
      ]
    },
    {
      title: "Project",
      links: [
        ["Updates", "./updates.html", "Latest changes"],
        ["About", "./about.html", "Affiliation"],
        ["Whitepaper", "./whitepaper.html", "Thesis"],
        ["Contact", "./contact.html", "Reach us"]
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

  function createTextEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function setSearchText(el, values) {
    el.setAttribute("data-vectora-search", values.join(" ").toLowerCase());
  }

  function createCommandCard(item) {
    var link = document.createElement("a");
    link.className = "vectora-command-card";
    link.href = item.href;
    link.setAttribute("data-vectora-menu-link", "");
    link.setAttribute("data-vectora-accent", item.accent || "cyan");
    setSearchText(link, [item.eyebrow, item.title, item.text, item.href]);

    link.appendChild(createTextEl("span", "vectora-command-card-kicker", item.eyebrow));
    link.appendChild(createTextEl("strong", "", item.title));
    link.appendChild(createTextEl("small", "", item.text));
    if (isCurrentMenuLink(link)) {
      link.setAttribute("aria-current", "page");
    }
    return link;
  }

  function createMenuLink(item) {
    var link = document.createElement("a");
    link.href = item[1];
    link.setAttribute("data-vectora-menu-link", "");
    setSearchText(link, [item[0], item[2] || "", item[1]]);

    var title = createTextEl("span", "menu-link-title", item[0]);
    var desc = createTextEl("span", "menu-link-desc", item[2] || "");
    link.appendChild(title);
    if (item[2]) link.appendChild(desc);

    if (isCurrentMenuLink(link)) {
      link.setAttribute("aria-current", "page");
    }
    return link;
  }

  function focusMenuInput(details) {
    var input = details.querySelector(".vectora-command-input");
    if (!input) return;
    window.setTimeout(function () {
      input.focus({ preventScroll: true });
      input.select();
    }, 30);
  }

  function filterMenu(panel) {
    var input = panel.querySelector(".vectora-command-input");
    var query = input ? input.value.trim().toLowerCase() : "";
    var anyVisible = false;

    panel.querySelectorAll("[data-vectora-menu-link]").forEach(function (link) {
      var haystack = link.getAttribute("data-vectora-search") || "";
      var visible = !query || haystack.indexOf(query) !== -1;
      link.hidden = !visible;
      if (visible) anyVisible = true;
    });

    panel.querySelectorAll(".menu-group").forEach(function (group) {
      group.hidden = !group.querySelector("[data-vectora-menu-link]:not([hidden])");
    });

    var empty = panel.querySelector(".vectora-command-empty");
    if (empty) empty.hidden = anyVisible;
  }

  function buildMenuPanel(panel) {
    panel.textContent = "";
    panel.setAttribute("data-vectora-menu-panel", "");

    var head = document.createElement("div");
    head.className = "vectora-command-head";
    var copy = document.createElement("div");
    copy.appendChild(createTextEl("span", "vectora-command-kicker", "Menu"));
    copy.appendChild(createTextEl("strong", "vectora-command-title", "Choose one path"));
    head.appendChild(copy);
    head.appendChild(createTextEl("span", "vectora-command-hint", "Search or Esc"));
    panel.appendChild(head);

    var searchWrap = document.createElement("label");
    searchWrap.className = "vectora-command-search";
    var searchLabel = createTextEl("span", "", "Search");
    var input = document.createElement("input");
    input.className = "vectora-command-input";
    input.type = "search";
    input.placeholder = "Check, proof, buy, guide...";
    input.setAttribute("aria-label", "Search Vectora navigation");
    searchWrap.appendChild(searchLabel);
    searchWrap.appendChild(input);
    panel.appendChild(searchWrap);

    var primary = document.createElement("div");
    primary.className = "vectora-command-primary";
    primaryPaths.forEach(function (item) {
      primary.appendChild(createCommandCard(item));
    });
    panel.appendChild(primary);

    var groupsWrap = document.createElement("div");
    groupsWrap.className = "vectora-command-groups";

    menuGroups.forEach(function (group) {
      var groupEl = document.createElement("div");
      groupEl.className = "menu-group";

      var title = document.createElement("span");
      title.className = "menu-group-title";
      title.textContent = group.title;
      groupEl.appendChild(title);

      group.links.forEach(function (item) {
        groupEl.appendChild(createMenuLink(item));
      });

      groupsWrap.appendChild(groupEl);
    });

    panel.appendChild(groupsWrap);
    var empty = createTextEl("div", "vectora-command-empty", "No match. Try check, proof, buy, guide, or contact.");
    empty.hidden = true;
    panel.appendChild(empty);

    input.addEventListener("input", function () {
      filterMenu(panel);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      var link = panel.querySelector("[data-vectora-menu-link]:not([hidden])");
      if (!link) return;
      event.preventDefault();
      link.click();
    });
  }

  function createMenu() {
    var details = document.createElement("details");
    details.className = "site-menu";
    var summary = document.createElement("summary");
    summary.setAttribute("aria-label", "Open Vectora command menu");
    summary.setAttribute("aria-haspopup", "dialog");
    summary.setAttribute("aria-expanded", "false");
    summary.setAttribute("role", "button");
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

  function setMenuOpenClass(isOpen) {
    document.body.classList.toggle("vectora-menu-open", isOpen);
    document.documentElement.classList.toggle("vectora-menu-open", isOpen);
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

      summary.innerHTML = '<span class="vectora-menu-icon" aria-hidden="true"></span><span class="vectora-menu-label">Menu</span><span class="vectora-menu-shortcut" aria-hidden="true">⌘K</span>';
      summary.setAttribute("aria-label", "Open Vectora command menu");
      summary.setAttribute("aria-haspopup", "dialog");
      summary.setAttribute("aria-expanded", "false");
      summary.setAttribute("role", "button");
      buildMenuPanel(panel);
      alignMenu(details);

      details.addEventListener("toggle", function () {
        alignMenu(details);
        summary.setAttribute("aria-expanded", details.open ? "true" : "false");
        if (details.open) {
          menus.forEach(function (other) {
            if (other !== details) other.removeAttribute("open");
          });
          setMenuOpenClass(true);
          focusMenuInput(details);
        } else if (!document.querySelector(".site-menu[open]")) {
          setMenuOpenClass(false);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest(".site-menu")) return;
      menus.forEach(function (details) {
        details.removeAttribute("open");
      });
      setMenuOpenClass(false);
    });

    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        var firstMenu = menus[0];
        if (!firstMenu) return;
        firstMenu.open = true;
        alignMenu(firstMenu);
        setMenuOpenClass(true);
        focusMenuInput(firstMenu);
        return;
      }
      if (event.key !== "Escape") return;
      menus.forEach(function (details) {
        details.removeAttribute("open");
      });
      setMenuOpenClass(false);
    });

    window.addEventListener("resize", function () {
      menus.forEach(alignMenu);
    });
  }

  function initDepthSurfaces() {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".hero-banner, .vectora-hero-command, .hero-visual, .buy-panel, .trust-tool, .status-board").forEach(function (el) {
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
