/* Paul & Me — shared site behavior
   - Site settings (theme, hands, contrast, animations, hero variant),
     managed on cms.html and persisted via localStorage
   - Mobile nav drawer
   - Scroll reveal
*/

(function () {
  /* ---------- Site settings ---------- */
  var SETTING_DEFAULTS = {
    theme: "light",     // "light" (cream) | "dark" (navy)
    hands: "on",        // hand illustrations
    contrast: "on",     // WCAG-AA text contrast
    motion: "on",       // scroll reveal + hover lifts
    hero: "A"           // homepage hero variant A | B | C
  };
  var LS_KEY = "pam-settings";

  var settings = {};
  Object.keys(SETTING_DEFAULTS).forEach(function (k) { settings[k] = SETTING_DEFAULTS[k]; });
  try {
    var saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    Object.keys(SETTING_DEFAULTS).forEach(function (k) {
      if (saved[k] !== undefined) settings[k] = saved[k];
    });
  } catch (e) { /* ignore */ }

  function applySettings() {
    var root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.hands = settings.hands;
    root.dataset.contrast = settings.contrast;
    root.dataset.motion = settings.motion;
    root.dataset.hero = settings.hero;
  }
  function persistSettings() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  /* Public API for the mini CMS (cms.html) */
  window.PamSettings = {
    defaults: SETTING_DEFAULTS,
    get: function (key) { return settings[key]; },
    set: function (key, value) {
      if (!(key in SETTING_DEFAULTS)) return;
      settings[key] = value;
      applySettings();
      persistSettings();
    },
    reset: function () {
      Object.keys(SETTING_DEFAULTS).forEach(function (k) { settings[k] = SETTING_DEFAULTS[k]; });
      applySettings();
      persistSettings();
    }
  };

  applySettings();

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
    initNav();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
