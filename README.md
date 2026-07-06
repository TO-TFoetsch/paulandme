# Paul & Me — Website

Production implementation of the Paul & Me marketing site, built from the
Claude Design handoff (see `../chats/` for the design decisions).

Static HTML/CSS/JS — no build step. Serve the directory with any static file
server, e.g.:

```
python3 -m http.server 8000
```

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home — hero (3 variants, selectable in the mini CMS) |
| `features.html` | Features — booking widget, channel management, guest inbox, payments & invoicing + "everything else" grid |
| `pricing.html` | Pricing — monthly/annual toggle, comparison table, mini FAQ |
| `signup.html` | 4-step signup flow (plan → account → property → goal → success) |
| `login.html` | Login, split layout |
| `help.html` | Help center — categories, grouped FAQ, search filter |
| `contact.html` | Contact — channels, form, office map |
| `legal.html` | Impressum (DE), privacy, terms, cookies with side TOC |
| `cms.html` | **Mini CMS** — site configuration (not linked from the public nav) |

## Mini CMS (`cms.html`)

Site-wide configuration, edited in the browser and published as
`assets/site-config.json`, which `assets/site.js` fetches and applies on
every page:

- **Presentation** — theme (Cream/Navy), hand illustrations, text contrast,
  animations, homepage hero variant A / B / C
- **Banner & Störer** — a site-wide announcement as a top bar or a floating
  round Störer: text, CTA, dismissible (dismissals stored per campaign ID)
- **Tracking** — Google Tag Manager, GA4, Meta Pixel, LinkedIn Insight Tag,
  plus a raw custom `<head>` HTML slot for anything else
- **Integrations** — HubSpot tracking/chat loader (portal ID + EU/US data center)

**Editing flow:** changes are stored as a *draft* in `localStorage` and only
previewed in that browser (all pages show a "Draft preview" badge while a
draft exists). To publish, export the JSON from the CMS (copy or download)
and commit it as `assets/site-config.json`. Once the published file matches
the draft, the CMS clears the draft automatically.

> **GDPR note:** tracking pixels are injected without a consent banner so
> far — gate them behind a cookie-consent solution before enabling real IDs
> in production.

## Assets

- `assets/tokens.css` — design tokens (colors, type, spacing, radii, motion)
- `assets/styles.css` — shared components (nav, drawer, slab buttons, cards, footer, banner/Störer, contrast + motion modes)
- `assets/site-config.json` — published site configuration (see Mini CMS above)
- `assets/site.js` — config loading (presentation, banner, tracking, integrations), mobile drawer (keyboard-accessible), scroll reveal
- `assets/icons.js` — self-contained inline icon set (subset of Lucide v1.23.0, ISC); replaces `<span data-lucide="…">` placeholders. No CDN dependency.

## Fonts

The brand calls for **Alphabet Soup** (display) and **Futura PT Book** (body).
`assets/tokens.css` currently loads the closest Google Fonts substitutes
(**Lilita One** and **Jost**) via `@import`. Swap in the licensed font files
there for final production use.

## Accessibility

Carried over from the design review: WCAG 2.1 AA contrast tokens, keyboard-
accessible mobile drawer (`inert`, `aria-expanded`, Esc-to-close), focus rings
that wrap the slab buttons incl. their offset shadow (white on navy surfaces),
`prefers-reduced-motion` support, correct heading hierarchy, skip links,
`role="status"` messages, `lang="de"` on German legal sections, and ≥40px
footer tap targets on mobile.
