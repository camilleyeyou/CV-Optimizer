# Dashboard Page — Design Overrides

> Overrides MASTER.md for the Dashboard page only.

## Layout
- Max-width: `1200px` (uses `--max-width`)
- Top section: Greeting (h1) + subtitle + "New Resume" button aligned right
- Below: Card grid `auto-fill, minmax(280px, 1fr)` with `1.25rem` gap
- Mobile (< 640px): Single column, full-width "New Resume" button

## Resume Cards
- White bg, `--radius-xl`, border
- **Preview area:** Light gradient bg with miniature resume mock (placeholder lines)
  - Template badge (top-right): frosted glass pill, uppercase, 10px font
  - Should reflect template accent color
- **Body area:** Title (truncated), relative date, progress bar
- **Progress bar:** Thin (4px), gradient fill `var(--primary)` → `var(--accent)`
- **Hover:** lift 2px, border darkens, shadow grows
- **Menu:** MoreVertical icon (top-left), opens dropdown with Edit/Duplicate/Delete
  - Delete option must show confirmation before executing

## Add Card
- Dashed border `2px dashed var(--color-gray-300)`
- Min-height matches resume cards
- Hover: border turns primary blue, bg turns primary-light, text turns primary

## Empty State
- Centered: gradient icon circle + heading + description + CTA button
- Icon circle: `linear-gradient(135deg, var(--primary-light), var(--accent-light))`

## Loading State
- 3 skeleton cards matching resume card layout structure
- Shimmer animation on skeletons
