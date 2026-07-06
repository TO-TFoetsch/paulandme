/* Paul & Me — shared site behavior
   - Mobile nav drawer
   - Tweaks panel (Light/Dark, Hands on/off)
   - Persistence via localStorage + edit-mode protocol
*/

(function () {
  /* ---------- TWEAKS state ---------- */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "hands": "on",
    "hero": "A",
    "contrast": "on",
    "motion": "on"
  }/*EDITMODE-END*/;

  const LS_KEY = "pam-tweaks";
  let tweaks = { ...TWEAK_DEFAULTS };
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    tweaks = { ...tweaks, ...saved };
  } catch (e) { /* ignore */ }

  function applyTweaks() {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.hands = tweaks.hands;
    document.documentElement.dataset.hero = tweaks.hero;
    document.documentElement.dataset.contrast = tweaks.contrast;
    document.documentElement.dataset.motion = tweaks.motion;
  }
  function persistTweaks() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(tweaks)); } catch (e) {}
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: tweaks }, "*"); } catch (e) {}
  }
  function setTweak(key, value) {
    tweaks[key] = value;
    applyTweaks();
    persistTweaks();
    renderPanel();
  }

  applyTweaks();

  /* ---------- Mobile nav drawer ---------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const drawer = document.querySelector(".nav-drawer");
    if (!toggle || !drawer) return;
    const close = drawer.querySelector(".drawer-close");

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
      const first = drawer.querySelector("a, button");
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
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", setClosed));
    // Esc closes and restores focus to the toggle
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.dataset.open === "true") closeDrawer();
    });
  }

  /* ---------- Tweaks panel UI ---------- */
  let panelOpen = false;
  let panelEl = null;

  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.id = "pam-tweaks-panel";
    panelEl.innerHTML = `
      <div class="tw-card" role="dialog" aria-label="Tweaks">
        <header class="tw-head">
          <span class="tw-title">Tweaks</span>
          <button class="tw-close" aria-label="Close">×</button>
        </header>
        <section class="tw-section">
          <div class="tw-label">Theme</div>
          <div class="tw-radio" data-tweak="theme">
            <button data-value="light">Cream</button>
            <button data-value="dark">Navy</button>
          </div>
        </section>
        <section class="tw-section">
          <div class="tw-label">Hand illustrations</div>
          <div class="tw-radio" data-tweak="hands">
            <button data-value="on">Show</button>
            <button data-value="off">Hide</button>
          </div>
        </section>
        <section class="tw-section">
          <div class="tw-label">Text contrast <span style="opacity:.55; font-weight:normal">· AA</span></div>
          <div class="tw-radio" data-tweak="contrast">
            <button data-value="on">Accessible</button>
            <button data-value="off">Original</button>
          </div>
        </section>
        <section class="tw-section">
          <div class="tw-label">Animations</div>
          <div class="tw-radio" data-tweak="motion">
            <button data-value="on">On</button>
            <button data-value="off">Off</button>
          </div>
        </section>
        <section class="tw-section" data-only-on="home">
          <div class="tw-label">Hero variant <span style="opacity:.55; font-weight:normal">· homepage only</span></div>
          <div class="tw-radio" data-tweak="hero">
            <button data-value="A">A</button>
            <button data-value="B">B</button>
            <button data-value="C">C</button>
          </div>
        </section>
        <p class="tw-hint">Click the floating <strong>Tweaks</strong> chip to reopen.</p>
      </div>
    `;
    document.body.appendChild(panelEl);

    const style = document.createElement("style");
    style.textContent = `
      html body #pam-tweaks-panel {
        position: fixed; right: 20px; bottom: 20px; top: auto !important;
        z-index: 1000;
        font-family: var(--font-body);
        display: none;
        height: auto !important;
      }
      #pam-tweaks-panel.open { display: block; }
      html body #pam-tweaks-panel .tw-card {
        background: #fff;
        color: var(--pam-navy);
        border-radius: 22px;
        padding: 16px;
        width: 244px;
        height: auto !important;
        display: block !important;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        box-shadow: 0 18px 40px rgba(0,30,80,.22);
        border: 1.5px solid var(--pam-line-2);
      }
      html body #pam-tweaks-panel .tw-card .tw-section {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        padding: 0 !important;
        flex: 0 0 auto !important;
        display: block !important;
        margin-bottom: 12px !important;
      }
      #pam-tweaks-panel .tw-section:last-of-type { margin-bottom: 0; }
      /* On phones: anchor to both edges so it can never overflow off-screen */
      @media (max-width: 520px) {
        #pam-tweaks-panel {
          right: 12px; left: 12px; bottom: 12px;
        }
        #pam-tweaks-panel .tw-card {
          width: auto;
          max-height: calc(100vh - 24px);
        }
        #pam-tweaks-panel .tw-head {
          position: sticky; top: -18px;
          background: #fff; padding-top: 4px; margin-top: -4px;
        }
      }
      #pam-tweaks-panel .tw-head {
        display:flex; align-items:center; justify-content:space-between;
        margin-bottom: 10px;
      }
      #pam-tweaks-panel .tw-title {
        font-family: var(--font-display);
        text-transform: uppercase;
        font-size: 18px;
        letter-spacing: .04em;
      }
      #pam-tweaks-panel .tw-close {
        background: transparent; border: 0;
        font-size: 24px; line-height: 1;
        color: var(--pam-navy);
        padding: 4px 8px;
        border-radius: 8px;
      }
      #pam-tweaks-panel .tw-close:hover { background: var(--pam-pink-50); color: var(--pam-pink); }
      #pam-tweaks-panel .tw-section { margin-bottom: 10px; }
      #pam-tweaks-panel .tw-label {
        font-family: var(--font-display);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: .08em;
        color: var(--fg-3);
        margin-bottom: 5px;
      }
      #pam-tweaks-panel .tw-radio {
        display:flex; gap: 0;
        background: var(--pam-cream);
        border-radius: 12px;
        padding: 4px;
      }
      #pam-tweaks-panel .tw-radio button {
        flex: 1;
        font-family: var(--font-display);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: .04em;
        padding: 7px 10px;
        border: 0;
        background: transparent;
        color: var(--pam-navy);
        border-radius: 9px;
        cursor: pointer;
        transition: background .15s, color .15s;
      }
      #pam-tweaks-panel .tw-radio button[aria-pressed="true"] {
        background: var(--pam-pink);
        color: #fff;
      }
      #pam-tweaks-panel .tw-hint {
        font-size: 11px; color: var(--fg-3);
        margin: 8px 0 0;
        line-height: 1.4;
      }
      #pam-tweaks-fab {
        position: fixed; right: 20px; bottom: 20px;
        z-index: 1000;
        background: var(--pam-navy);
        color: #fff;
        font-family: var(--font-display);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: .08em;
        padding: 12px 18px;
        border-radius: 999px;
        border: 0;
        cursor: pointer;
        box-shadow: 0 12px 30px rgba(0,30,80,.25);
        display: none;
      }
      #pam-tweaks-fab.show { display: inline-flex; align-items:center; gap: 6px; }
      #pam-tweaks-fab:hover { background: var(--pam-pink); }
    `;
    document.head.appendChild(style);

    // Wire up
    panelEl.querySelector(".tw-close").addEventListener("click", () => closePanel());
    panelEl.querySelectorAll(".tw-radio").forEach(group => {
      const key = group.dataset.tweak;
      group.addEventListener("click", e => {
        const btn = e.target.closest("button[data-value]");
        if (!btn) return;
        setTweak(key, btn.dataset.value);
      });
    });

    renderPanel();
  }

  function renderPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll(".tw-radio").forEach(group => {
      const key = group.dataset.tweak;
      group.querySelectorAll("button").forEach(b => {
        b.setAttribute("aria-pressed", b.dataset.value === tweaks[key] ? "true" : "false");
      });
    });
  }

  function openPanel() {
    panelOpen = true;
    if (!panelEl) buildPanel();
    panelEl.classList.add("open");
    const fab = document.getElementById("pam-tweaks-fab");
    if (fab) fab.classList.remove("show");
  }
  function closePanel() {
    panelOpen = false;
    if (panelEl) panelEl.classList.remove("open");
    try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
    // also show a small FAB so users can reopen on the same page
    showFab();
  }
  function showFab() {
    let fab = document.getElementById("pam-tweaks-fab");
    if (!fab) {
      fab = document.createElement("button");
      fab.id = "pam-tweaks-fab";
      fab.innerHTML = "✦ Tweaks";
      fab.addEventListener("click", openPanel);
      document.body.appendChild(fab);
    }
    fab.classList.add("show");
  }

  /* ---------- Host edit-mode protocol ---------- */
  window.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "__activate_edit_mode") openPanel();
    if (d.type === "__deactivate_edit_mode") {
      if (panelEl) panelEl.classList.remove("open");
      const fab = document.getElementById("pam-tweaks-fab");
      if (fab) fab.classList.remove("show");
      panelOpen = false;
    }
  });

  /* ---------- Scroll reveal (Tweaks: motion) ----------
     Elements get [data-reveal]; CSS (scoped to html[data-motion="on"]
     and prefers-reduced-motion: no-preference) hides them until
     .is-revealed is added. Rect-based (scroll/resize + init check) so
     it works in every embed; if JS fails, no attribute is set and
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
    // even in embeds where scroll events / rAF are throttled
    var watchdog = setInterval(function () {
      revealVisible();
      if (!els.length) clearInterval(watchdog);
    }, 700);
  }

  function init() {
    initNav();
    initReveal();
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
