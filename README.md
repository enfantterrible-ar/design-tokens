# @enfantterrible-ar/design-tokens

Design token pipeline for the Enfant Terrible news site design system. Manages primitive, semantic, and typography tokens and merges them into a single file for Figma variable import.

## Structure

```
.
├── bin/
│   └── merge.js          # Build script
├── src/
│   ├── tokens.primitives.json
│   ├── tokens.semantic.json
│   └── tokens.typography.json
├── build/
│   └── tokens.figma.json # Generated — do not edit manually
└── package.json
```

## Token collections

### Primitives
Raw values. No references to other tokens.

- `color` — red, gold, blue, grey, green scales (50–950)
- `spacing` — Tailwind-based 4px scale (0–96)
- `border-radius` — none, sm, md, lg, xl, 2xl, full
- `border-width` — 0, 1, 2, 4
- `font-family` — display (Anybody), body (Inter), mono
- `font-weight` — regular, medium, semibold, bold, extrabold
- `font-size` — 12 named steps, each with `min` (320px viewport) and `max` (1440px viewport) values
- `line-height` — none, tight, snug, normal, relaxed, loose
- `shadow` — per-axis tokens (x, y, blur, spread, color) for sm → 2xl + inner
- `breakpoint` — min (320), max (1440)

### Semantics
UI role tokens. References primitives. Each token has explicit `/light` and `/dark` variants — apply manually in Figma depending on the mockup context.

- `surface` — page, subtle, card, overlay, inverse, brand, brand-subtle, breaking, scrim
- `text` — default, muted, subtle, inverted, heading, link, link-hover, link-visited, breaking, on-brand, on-inverse
- `border` — default, subtle, strong, focus, brand, breaking
- `action` — primary, secondary, ghost, disabled states
- `feedback` — success, warning, info, danger (surface, border, text, icon per state)

### Typography
Named type styles. References primitives. Each style has explicit `/min` and `/max` variants matching the breakpoint scale.

- Styles: display, headline-1–4, subhead, body-lg, body, body-sm, caption, label, overline
- Properties per style: `fontSize`, `fontFamily`, `fontWeight`, `lineHeight`

## Usage

### Build once
```bash
npm run tokens
```

Merges `src/` token files into `build/tokens.figma.json`.

### Watch mode
```bash
npm run tokens:watch
```

Rebuilds automatically whenever any file in `src/` changes.

### Importing into Figma
1. Run `npm run tokens` to generate `build/tokens.figma.json`
2. In Figma, open the Variables panel
3. Drag `tokens.figma.json` into the panel
4. Figma will create three collections: **Primitives**, **Semantics**, **Typography**

Import order matters if re-importing individual files — always import Primitives first so references resolve correctly.

## Notes

- Light/dark and min/max variants are explicit named tokens, not Figma modes (free plan compatible)
- Editorial tokens are not included here — those depend on article layout decisions and will be added after wireframing