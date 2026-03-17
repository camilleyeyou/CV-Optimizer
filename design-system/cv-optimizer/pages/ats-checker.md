# ATS Checker Page — Design Overrides

> Overrides MASTER.md for the ATS Checker page.

## Layout
- Max-width: `900px`, centered
- Header: centered h1 + subtitle
- Single-column flow: Upload → Form → Results

## Upload Dropzone
- Dashed border (2px), `--radius-xl`, white bg
- Hover: border turns primary, bg turns primary-light, subtle lift
- File selected: solid primary border, primary-light bg, shows filename + size
- Must accept PDF only, max 5MB
- Needs `role="button"`, `aria-label`, and keyboard activation

## Results Section
- **Score Ring:** SVG circle (140x140), animated stroke-dashoffset
  - Green (≥80), Yellow (≥60), Red (<60)
  - Score number centered inside ring (2rem, weight 800)
  - Animation should respect `prefers-reduced-motion`
- **Section Breakdown:** Expandable score bars (accordion pattern)
  - Color-coded fill bars: green/yellow/red gradients
  - Click to expand feedback text
- **Keywords:** Two-column grid (found/missing)
  - Pill tags with semantic colors (green for found, red for missing)
- **Improvements:** Priority-tagged cards (high/medium/low)
  - AlertTriangle icon color matches priority
- **Strengths:** CheckCircle icon list

## Loading State
- Centered spinner + "Analyzing..." text + "This may take a few seconds" hint
- Replace upload panel content, not overlay

## Specific Rules
- "Start Over" button only appears after results are shown
- Analyze button disabled until both file and job title are provided
