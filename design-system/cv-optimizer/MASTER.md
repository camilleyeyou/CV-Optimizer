# Design System — CV Optimizer

> **LOGIC:** When building a specific page, first check `design-system/cv-optimizer/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** CV Optimizer
**Updated:** 2026-03-15
**Category:** SaaS / Productivity Tool
**Style:** Clean Minimal with Micro-interactions
**Icon Set:** Lucide React (consistent across all pages)

---

## Color Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `--primary` | `#2563eb` | Buttons, links, active states, accents |
| Primary Hover | `--primary-hover` | `#1d4ed8` | Button hover, link hover |
| Primary Light | `--primary-light` | `#eff6ff` | Selected cards, active nav bg, badges |
| Primary 50 | `--primary-50` | `#dbeafe` | Focus rings, tag backgrounds |
| Accent | `--accent` | `#7c3aed` | Gradient endpoints, avatar, secondary accents |
| Accent Light | `--accent-light` | `#f3e8ff` | Accent badge backgrounds |
| Text Primary | `--text-primary` | `#0f172a` | Headings, body text, primary labels |
| Text Secondary | `--text-secondary` | `#475569` | Descriptions, form labels, muted body (min contrast) |
| Text Muted | `--text-muted` | `#94a3b8` | Hints, timestamps, placeholders ONLY (not body text) |
| Background Page | `--bg-page` | `#f1f5f9` | Page backgrounds |
| Background Primary | `--bg-primary` | `#ffffff` | Cards, panels, modals |
| Background Secondary | `--bg-secondary` | `#f8fafc` | Hover states, secondary panels |
| Border | `--border` | `#e2e8f0` | Card borders, dividers, input borders |
| Border Light | `--border-light` | `#f1f5f9` | Subtle separators |
| Success | `--success` | `#059669` | Success states, positive indicators |
| Success Light | `--success-light` | `#d1fae5` | Success badge bg |
| Warning | `--warning` | `#d97706` | Warning states, caution indicators |
| Warning Light | `--warning-light` | `#fef3c7` | Warning badge bg |
| Error | `--error` | `#dc2626` | Errors, destructive actions |
| Error Light | `--error-light` | `#fee2e2` | Error badge bg |

### Color Rules
- **NEVER** use `--text-muted` for body text or descriptions — contrast ratio is only ~2.7:1 on white
- **ALWAYS** use `--text-secondary` (4.6:1 ratio) or darker for readable body text
- `--text-muted` is only for: hints, timestamps, placeholders, supplementary labels
- Focus rings: `0 0 0 3px rgba(37, 99, 235, 0.15)` (`--shadow-glow`)
- Gradient accent: `linear-gradient(135deg, var(--primary), var(--accent))`

---

## Typography

**Font:** Inter (already loaded in the app)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Page Title (h1) | `1.75rem` (28px) | 800 | 1.25 | `-0.02em` |
| Section Title (h2) | `1.5rem` (24px) | 700 | 1.25 | `-0.01em` |
| Card Title (h3) | `1.125rem` (18px) | 700 | 1.25 | `-0.01em` |
| Subtitle (h4) | `1rem` (16px) | 600 | 1.35 | `-0.01em` |
| Body | `0.9375rem` (15px) | 400 | 1.6 | normal |
| Body Small | `0.875rem` (14px) | 400–500 | 1.5 | normal |
| Caption/Label | `0.75rem` (12px) | 500–600 | 1.4 | normal |
| Tiny | `0.625rem` (10px) | 600 | 1.3 | `0.04em` (uppercase only) |

### Typography Rules
- Max line length for body text: 65–75 characters (`max-width: 640px`)
- Use weight 800 only for page-level h1 headings
- Use weight 700 for section headings (h2, h3)
- Use weight 600 for labels, nav items, badges, card titles
- Use weight 500 for form labels, secondary text
- Use weight 400 for body paragraphs

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `0.25rem` (4px) | Tight inline gaps |
| `--space-2` | `0.5rem` (8px) | Icon gaps, button padding, tag spacing |
| `--space-3` | `0.75rem` (12px) | Small component padding |
| `--space-4` | `1rem` (16px) | Standard padding, form group margins |
| `--space-5` | `1.25rem` (20px) | Card padding, section gaps |
| `--space-6` | `1.5rem` (24px) | Card inner padding, container padding |
| `--space-8` | `2rem` (32px) | Section padding top/bottom |
| `--space-10` | `2.5rem` (40px) | Large section gaps |
| `--space-12` | `3rem` (48px) | Page section margins |
| `--space-16` | `4rem` (64px) | Hero padding, empty states |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.5rem` (8px) | Badges, small elements |
| `--radius-md` | `0.625rem` (10px) | Inputs, buttons |
| `--radius-lg` | `0.875rem` (14px) | Cards, dropdowns, alerts |
| `--radius-xl` | `1.25rem` (20px) | Large cards, panels, modals |
| `--radius-2xl` | `1.5rem` (24px) | Auth card, hero elements |
| `--radius-full` | `9999px` | Avatars, badges, pills |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle lift on inputs |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default cards, buttons |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` | Card hover, active panels |
| `--shadow-lg` | `0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)` | Dropdowns, popovers |
| `--shadow-xl` | `0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.04)` | Modals, auth card |
| `--shadow-glow` | `0 0 0 3px rgba(37, 99, 235, 0.15)` | Focus rings |

---

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease` | Hover states, color changes, opacity |
| `--transition-base` | `200ms ease` | Card hover, transform, box-shadow |
| `--transition-slow` | `300ms ease` | Panel slide, accordion, mobile nav |

### Motion Rules
- **REQUIRED:** Wrap all animations in `prefers-reduced-motion` check
- Use `transform` and `opacity` for animations — never animate `width`, `height`, `top`, `left`
- Hover lift: `translateY(-2px)` max for cards, `translateY(-0.5px)` for buttons
- Loading spinners: `animation: spin 0.6s linear infinite`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--header-height` | `64px` | Fixed header height |
| `--max-width` | `1200px` | Dashboard, general container max-width |

### Page Max-Widths
| Page | Max-Width | Reason |
|------|-----------|--------|
| Dashboard | `1200px` | Card grid needs room |
| Builder | Full width | Split-pane editor |
| Templates | `960px` | Focused selection UI |
| ATS Checker | `900px` | Single-column tool |
| AI Creator | `800px` | Guided wizard flow |
| Auth (Login/Register) | `440px` (card) | Centered form |

### Responsive Breakpoints
| Name | Width | Behavior |
|------|-------|----------|
| Mobile | `≤ 640px` | Single column, stacked layouts, full-width buttons |
| Tablet | `≤ 768px` | Collapsible nav, builder single-panel toggle |
| Desktop | `≤ 1024px` | Standard two-column layouts |
| Wide | `≤ 1440px` | Max-width containers center content |

---

## Components

### Buttons
- **Sizes:** `btn-sm` (4px 10px), default (8px 16px), `btn-lg` (12px 24px)
- **Variants:** `btn-primary` (blue fill), `btn-secondary` (white + border), `btn-ghost` (transparent), `btn-danger` (red fill)
- **Rules:** Always `cursor: pointer`. Always `disabled` during async. Always show spinner when loading. 150ms hover transition.

### Cards
- White background, `1px solid var(--border)`, `--radius-xl`
- Hover: lift `translateY(-2px)`, border darkens to `--color-gray-300`, shadow grows to `--shadow-md`
- Interactive cards: `cursor: pointer`

### Forms
- Label above input, `--text-sm` weight 500, color `--text-secondary`
- Inputs: `1px solid var(--border)`, `--radius-md`, 10px 14px padding
- Focus: blue border + `--shadow-glow` ring
- Errors: red text below input, `--text-xs`
- Two-column rows collapse to single column at 640px

### Dropdowns / Menus
- White bg, `--shadow-lg`, `--radius-xl`, `1px solid var(--border)`
- Items: `9px 16px` padding, hover bg `--bg-secondary`
- **REQUIRED:** `aria-expanded`, `role="menu"`, `role="menuitem"`, Escape to close

### Badges
- Pill shape (`--radius-full`), `3px 10px` padding
- `--text-xs` weight 600
- Semantic colors: primary-light/primary, success-light/success, etc.

### Loading States
- Spinner: 20px (default), 32px (large), blue top border
- Skeleton shimmer for content placeholders
- Button loading: disable + replace text with spinner

---

## Accessibility Requirements

These are non-negotiable for all UI code:

1. **Focus visible:** All interactive elements must have `:focus-visible` styles with `--shadow-glow` ring
2. **Color contrast:** 4.5:1 minimum for text. Never use `--text-muted` for readable content
3. **Touch targets:** Minimum 44x44px on mobile
4. **Labels:** Every input must have an associated `<label>` with `htmlFor`
5. **ARIA:** Icon-only buttons need `aria-label`. Menus need `role="menu"`, `aria-expanded`
6. **Reduced motion:** All animations must respect `prefers-reduced-motion`
7. **Keyboard nav:** Tab order matches visual order. Escape closes overlays/menus
8. **Screen reader:** Decorative icons use `aria-hidden="true"`. Status changes use `aria-live`

---

## Anti-Patterns (NEVER Do)

- Use emojis as UI icons — always use Lucide SVG icons
- Use `--text-muted` for body/description text
- Skip focus-visible styles on interactive elements
- Allow buttons to be clicked during async operations
- Animate `width`, `height`, `margin`, `padding` (use `transform`/`opacity`)
- Mix different icon libraries
- Use inline styles for layout (use CSS classes)
- Skip `prefers-reduced-motion` media query
- Use generic utility class names that could conflict (`.w-40`, `.w-60`)
- Destructive actions without confirmation
- setTimeout for dropdown close (use click-outside detection)

---

## Pre-Delivery Checklist

Before delivering any UI code:

- [ ] No emojis used as icons (Lucide SVGs only)
- [ ] All icons from Lucide React, consistent sizing
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states use smooth transitions (150–300ms)
- [ ] `:focus-visible` styles present on all interactive elements
- [ ] Text contrast meets 4.5:1 minimum (no `--text-muted` for body)
- [ ] `prefers-reduced-motion` media query present
- [ ] Buttons disabled during async with spinner
- [ ] Destructive actions have confirmation
- [ ] Responsive at 375px, 640px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed header
- [ ] No horizontal scroll on mobile
- [ ] All form inputs have associated labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Menus have ARIA roles and Escape key handler
