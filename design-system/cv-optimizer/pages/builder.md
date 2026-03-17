# Builder Page — Design Overrides

> Overrides MASTER.md for the Builder page only.

## Layout
- **Full viewport height** — `calc(100vh - var(--header-height))`, no scroll on outer container
- **Split-pane:** 50/50 grid on desktop, single-panel toggle on mobile (< 768px)
- **Toolbar:** Sticky, frosted glass bg, border-bottom, flex-shrink: 0
- **Form panel:** Scrollable, `--bg-page` background
- **Preview panel:** Scrollable, light gradient background, border-left

## Preview Panel
- A4 document mock: `width: 210mm` with `transform: scale()` to fit panel width
- Paper shadow: `--shadow-md`
- Serif font (Georgia) for document preview vs. sans-serif for UI
- Preview should update in real-time as form fields change

## Form Panel
- **Accordion sections** — collapsed by default except Personal Info and Summary
- Each section: white card, `--radius-xl`, border
- Section header: clickable, shows Lucide icon + label + count badge + chevron
- Open section: border darkens, subtle shadow
- Max content width: `640px`

## Toolbar
- Left: Resume title + save status (spinner when saving, checkmark when saved)
- Right: Edit/Preview toggle (mobile), Show/Hide Preview (desktop), Export PDF button
- Export PDF button disables + shows spinner during export

## Specific Rules
- Auto-save debounced (2s after last edit)
- Save status indicator always visible in toolbar
- AI-powered buttons (Generate Summary, Enhance, Suggest Skills) show loading state and are disabled during generation
