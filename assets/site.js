/* Paul & Me — shared site behavior
   - Site config (assets/site-config.json): presentation, banners/Störer,
     tracking pixels, integrations. Edited on cms.html, which stores a
     draft in localStorage; the draft is previewed in this browser only,
     until the exported JSON is committed as assets/site-config.json.
   - Mobile nav drawer
   - Scroll reveal
*/

(function () {
  /* ---------- Site config ---------- */
  var CONFIG_URL = "assets/site-config.json";
  var LS_DRAFT = "pam-config-draft";
  var LS_CACHE = "pam-config-cache";
  var LS_BANNERS_DISMISSED = "pam-banners-dismissed";
  var IS_CMS = /(^|\/)cms\.html$/.test(location.pathname);

  var CONFIG_DEFAULTS = {
    version: 1,
    presentation: {
      theme: "light",     // "light" (cream) | "dark" (navy)
      hands: "on",        // hand illustrations
      contrast: "on",     // WCAG-AA text contrast
      motion: "on",       // scroll reveal + hover lifts
      hero: "A"           // homepage hero variant A | B | C
    },
    banners: [],          // list of banner objects — see BANNER_DEFAULTS
    launchTodos: [],      // pre-launch checklist — see TODO_DEFAULTS; CMS-only
    tracking: {
      gtmId: "",              // GTM-XXXXXXX
      ga4Id: "",              // G-XXXXXXXXXX
      metaPixelId: "",
      linkedinPartnerId: "",
      customHeadHtml: ""      // raw HTML appended to <head>; scripts execute
    },
    integrations: {
      hubspot: {
        enabled: false,
        portalId: "",
        region: "eu1"         // "eu1" | "na1"
      }
    }
  };

  /* One entry in config.launchTodos (rendered only in the CMS) */
  var TODO_DEFAULTS = {
    id: "",
    text: "",
    done: false
  };

  /* One entry in config.banners */
  var BANNER_DEFAULTS = {
    id: "",                  // dismissals are stored per id
    enabled: true,
    style: "bar",            // "bar" (top) | "sticker" (round Störer) | "card" (corner card)
    corner: "bottom-right",  // "bottom-left" | "bottom-right" — sticker/card only
    text: "",
    ctaLabel: "",
    ctaHref: "",
    dismissible: true,
    delaySeconds: 0          // wait n seconds before showing
  };

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch (e) { return null; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* Deep-merge `extra` onto `base`; only keys the schema knows survive.
     Arrays are taken wholesale from `extra` (items sanitized separately). */
  function mergeConfig(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (k) {
      var b = base[k];
      var e = extra ? extra[k] : undefined;
      if (Array.isArray(b)) out[k] = Array.isArray(e) ? e : b;
      else if (b !== null && typeof b === "object") out[k] = mergeConfig(b, e);
      else out[k] = (e === undefined ? b : e);
    });
    return out;
  }

  /* Merge onto the schema and sanitize each list item. */
  function normalizeConfig(raw) {
    var c = mergeConfig(CONFIG_DEFAULTS, raw);
    c.banners = c.banners.map(function (b) { return mergeConfig(BANNER_DEFAULTS, b); });
    c.launchTodos = c.launchTodos.map(function (t) { return mergeConfig(TODO_DEFAULTS, t); });
    return c;
  }

  var draft = readJSON(LS_DRAFT);
  var cache = readJSON(LS_CACHE);
  var config = normalizeConfig(draft || cache);

  function applyPresentation() {
    var p = config.presentation;
    var root = document.documentElement;
    root.dataset.theme = p.theme;
    root.dataset.hands = p.hands;
    root.dataset.contrast = p.contrast;
    root.dataset.motion = p.motion;
    root.dataset.hero = p.hero;
  }

  /* ---------- Banners / Störer ---------- */
  function dismissedIds() { return readJSON(LS_BANNERS_DISMISSED) || []; }
  function addDismissed(id) {
    var ids = dismissedIds();
    if (ids.indexOf(String(id)) === -1) ids.push(String(id));
    writeJSON(LS_BANNERS_DISMISSED, ids);
  }

  function buildBannerElement(b, preview) {
    var styleClass = b.style === "sticker" ? "site-banner-sticker"
                   : b.style === "card" ? "site-banner-card"
                   : "site-banner-bar";
    var el = document.createElement("aside");
    el.className = "site-banner " + styleClass;
    el.setAttribute("aria-label", "Announcement");

    var text = document.createElement("p");
    text.className = "banner-text";
    text.textContent = b.text;
    el.appendChild(text);

    if (b.ctaLabel && b.ctaHref) {
      var cta = document.createElement("a");
      cta.className = "banner-cta";
      cta.href = b.ctaHref;
      cta.textContent = b.ctaLabel;
      if (preview) cta.tabIndex = -1;
      el.appendChild(cta);
    }

    if (b.dismissible) {
      var close = document.createElement("button");
      close.type = "button";
      close.className = "banner-close";
      close.setAttribute("aria-label", "Dismiss announcement");
      close.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
      close.addEventListener("click", function () {
        if (preview) return;
        addDismissed(b.id);
        el.remove();
      });
      el.appendChild(close);
    }
    return el;
  }

  /* Stack containers: bars share one block at the very top; corner
     banners (Störer, cards) stack in their corner without overlapping. */
  var topStack = null;
  var cornerStacks = {};
  function getTopStack() {
    if (!topStack) {
      topStack = document.createElement("div");
      topStack.className = "banner-top-stack";
      document.body.insertBefore(topStack, document.body.firstChild);
    }
    return topStack;
  }
  function getCornerStack(corner) {
    if (!cornerStacks[corner]) {
      var c = document.createElement("div");
      c.className = "banner-corner " + (corner === "bottom-left" ? "bl" : "br");
      document.body.appendChild(c);
      cornerStacks[corner] = c;
    }
    return cornerStacks[corner];
  }

  function initBanners() {
    var dismissed = dismissedIds();

    config.banners.forEach(function (b) {
      if (!b.enabled || !b.text) return;
      if (b.dismissible && dismissed.indexOf(String(b.id)) !== -1) return;

      function show() {
        var el = buildBannerElement(b, false);
        el.classList.add("banner-enter");
        if (b.style === "bar") getTopStack().appendChild(el);
        else getCornerStack(b.corner).appendChild(el);
        // double rAF so the entrance transition actually plays
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { el.classList.remove("banner-enter"); });
        });
      }

      var delay = Number(b.delaySeconds) || 0;
      if (delay > 0) setTimeout(show, delay * 1000);
      else show();
    });
  }

  /* ---------- Tracking & integrations ---------- */
  function injectScript(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  /* Append raw HTML to <head>. Script tags set via innerHTML never run,
     so they are re-created as live elements first. */
  function injectHeadHTML(html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    Array.prototype.slice.call(tpl.content.querySelectorAll("script")).forEach(function (old) {
      var s = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
      s.text = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
    document.head.appendChild(tpl.content);
  }

  function initTracking() {
    var t = config.tracking;
    var hs = config.integrations.hubspot;

    if (t.gtmId) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      injectScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(t.gtmId));
    }
    if (t.ga4Id) {
      injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(t.ga4Id));
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", t.ga4Id);
    }
    if (t.metaPixelId && !window.fbq) {
      var n = window.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      injectScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", t.metaPixelId);
      window.fbq("track", "PageView");
    }
    if (t.linkedinPartnerId) {
      window._linkedin_partner_id = t.linkedinPartnerId;
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(t.linkedinPartnerId);
      injectScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
    }
    if (t.customHeadHtml) injectHeadHTML(t.customHeadHtml);

    if (hs.enabled && hs.portalId) {
      var host = (hs.region && hs.region !== "na1") ? "js-" + hs.region : "js";
      injectScript("https://" + host + ".hs-scripts.com/" + encodeURIComponent(hs.portalId) + ".js",
        { id: "hs-script-loader", defer: "defer" });
    }
  }

  /* ---------- Draft badge (unpublished CMS draft in this browser) ---------- */
  function initDraftBadge() {
    if (!draft) return;
    var el = document.createElement("a");
    el.className = "draft-badge";
    el.href = "cms.html";
    el.textContent = "Draft preview · CMS";
    // joins the bottom-right stack so it never overlaps corner banners
    getCornerStack("bottom-right").appendChild(el);
  }

  /* Public API for the mini CMS (cms.html) */
  window.PamConfig = {
    defaults: CONFIG_DEFAULTS,
    bannerDefaults: BANNER_DEFAULTS,
    todoDefaults: TODO_DEFAULTS,
    url: CONFIG_URL,
    merge: mergeConfig,
    normalize: normalizeConfig,
    buildBannerElement: buildBannerElement,
    getDraft: function () { return draft; },
    setDraft: function (d) {
      draft = d || null;
      if (draft) writeJSON(LS_DRAFT, draft);
      else { try { localStorage.removeItem(LS_DRAFT); } catch (e) {} }
      config = normalizeConfig(draft || cache);
      applyPresentation();
    },
    active: function () { return config; }
  };

  applyPresentation();   // synchronous first paint from draft/cache

  /* Fetch the published config, then wire up banners + tracking once. */
  fetch(CONFIG_URL, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (published) {
      if (published) { cache = published; writeJSON(LS_CACHE, published); }
      config = normalizeConfig(draft || cache);
      applyPresentation();
      if (!IS_CMS) {
        initBanners();
        initTracking();
        initDraftBadge();
      }
    });

  /* ---------- Mobile nav drawer ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var drawer = document.querySelector(".nav-drawer");
    if (!toggle || !drawer) return;
    var close = drawer.querySelector(".drawer-close");

    // Mark the closed drawer as inert + hidden so its links can't be
    // tabbed into or read by screen readers while it's off-screen.
    function setClosed() {
      drawer.dataset.open = "false";
      drawer.setAttribute("aria-hidden", "true");
      drawer.inert = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    function openDrawer() {
      drawer.dataset.open = "true";
      drawer.setAttribute("aria-hidden", "false");
      drawer.inert = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = drawer.querySelector("a, button");
      if (first) first.focus();
    }
    function closeDrawer() {
      setClosed();
      toggle.focus();   // return focus to the trigger
    }

    if (drawer.id) toggle.setAttribute("aria-controls", drawer.id);
    setClosed();   // establish the inert/closed baseline on load

    toggle.addEventListener("click", openDrawer);
    if (close) close.addEventListener("click", closeDrawer);
    // close (without stealing focus) when a link is followed
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", setClosed); });
    // Esc closes and restores focus to the toggle
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.dataset.open === "true") closeDrawer();
    });
  }

  /* ---------- Scroll reveal (settings: motion) ----------
     Elements get [data-reveal]; CSS (scoped to html[data-motion="on"]
     and prefers-reduced-motion: no-preference) hides them until
     .is-revealed is added. Rect-based (scroll/resize + init check) so
     it works everywhere; if JS fails, no attribute is set and
     everything stays visible. */
  function initReveal() {
    var sel = ".section-head, .feature-block, .card, .more-card, .contact-card, .cat-card, .plan, .steps > *, .pricing-teaser > *, .cta-band";
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    if (!els.length) return;

    els.forEach(function (el) {
      var parent = el.parentElement;
      var i = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", ((Math.max(0, i) % 6) * 70) + "ms");
    });

    function reveal(el) {
      el.classList.add("is-revealed");
      // after the reveal finishes, drop the attr so hover
      // transitions run without the stagger delay
      setTimeout(function () {
        el.removeAttribute("data-reveal");
        el.style.removeProperty("--reveal-delay");
      }, 1000);
    }

    function revealVisible() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els = els.filter(function (el) {
        var r = el.getBoundingClientRect();
        var inView = r.top < vh * 0.96 && r.bottom > 0;
        if (inView) reveal(el);
        return !inView;
      });
      if (!els.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }

    var throttled = false;
    function onScroll() {
      if (throttled) return;
      throttled = true;
      revealVisible();
      setTimeout(function () { throttled = false; revealVisible(); }, 120);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // reveal above-the-fold content just after tagging so the
    // entrance transition can play on load
    setTimeout(revealVisible, 0);

    // safety net: recurring check so content can never stay hidden,
    // even where scroll events are throttled
    var watchdog = setInterval(function () {
      revealVisible();
      if (!els.length) clearInterval(watchdog);
    }, 700);
  }

  function init() {
    // slab .back spans duplicate the label purely for sizing the
    // offset shadow — hide them from assistive technology so screen
    // readers don't announce every button twice
    document.querySelectorAll(".slab .back").forEach(function (b) {
      b.setAttribute("aria-hidden", "true");
    });
    initNav();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
