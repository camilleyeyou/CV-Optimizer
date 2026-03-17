# AI Creator Page — Design Overrides

> Overrides MASTER.md for the AI Creator page.

## Layout
- Max-width: `800px`, centered
- Header: Sparkles icon + h1 + subtitle (centered)
- Progress indicator below header
- Single-step card below progress

## Progress Bar
- 3 steps: "Paste Job" → "Answer Questions" → "Generate"
- Horizontal flex, centered
- Each step: numbered dot + label
- States: default (gray border), active (primary fill + glow), done (green fill + checkmark)
- Mobile: hide step labels, show dots only

## Step 1: Job Description
- White card, `--radius-xl`, `--shadow-sm`
- Large textarea (12 rows, min-height 200px)
- Placeholder with example text
- "Analyze & Continue" primary button with Sparkles icon

## Step 2: Questions
- Job badge pill at top (primary-light bg, primary text, Sparkles icon)
- Question cards: numbered circle + question text + input/textarea
- Answered questions: green-tinted border and background
- Counter: "X/Y answered" text
- "Generate My Resume" enabled only when ≥3 answered

## Step 3: Generating
- Centered spinner (40px) + heading + subtitle
- Animated step list that progresses through stages:
  - "Analyzing job requirements..."
  - "Matching your experience..."
  - "Writing achievement bullets..."
  - "Optimizing for ATS..."
  - Each step activates sequentially (not all static)

## Step 4: Done
- Success header: green Check icon + "Your resume is ready!"
- Preview card: name, title, summary excerpt, stats pills
- "Regenerate" secondary button + "Edit in Builder" primary button

## Specific Rules
- Back button on steps 2 and 4 to return to previous step
- All API calls disable buttons + show spinners
- Error on API failure returns to previous step with toast
