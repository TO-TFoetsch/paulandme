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
| `cms.html` | **Mini CMS** — site presentation settings (not linked from the public nav) |

## Mini CMS (`cms.html`)

Site-wide presentation settings, persisted in `localStorage` and applied on
every page by `assets/site.js`:

- **Theme** — Cream (default) / Navy
- **Hand illustrations** — show / hide
- **Text contrast** — Accessible (WCAG AA, default) / Original brand pink
- **Animations** — scroll reveals + hover lifts on/off (`prefers-reduced-motion` always wins)
- **Hero variant** — homepage hero A / B / C

## Assets

- `assets/tokens.css` — design tokens (colors, type, spacing, radii, motion)
- `assets/styles.css` — shared components (nav, drawer, slab buttons, cards, footer, contrast + motion modes)
- `assets/site.js` — settings application, mobile drawer (keyboard-accessible), scroll reveal
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
