# Auth Pages (Login + Register) — Design Overrides

> Overrides MASTER.md for Login and Register pages.

## Layout
- Full viewport centered card on gradient background
- Background: `linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)`
- Card: max-width `440px`, white bg, `--radius-2xl`, `--shadow-lg`, `2.5rem` padding
- Mobile (< 480px): reduced padding `1.5rem`, smaller radius

## Header
- Centered text: h1 (1.5rem, weight 800) + subtitle
- Subtitle uses `--text-secondary` (NOT `--text-muted` — contrast issue)

## Form
- Input fields with Lucide icon on the left (Mail, Lock, User)
- Icon positioned absolutely, input has left padding `2.5rem`
- Submit button: full-width, `btn-primary btn-lg`, disabled + spinner when loading

## Google OAuth
- Full-width `btn-secondary btn-lg`
- Inline SVG Google logo (official 4-color G)
- Must disable + show loading state during OAuth redirect

## Divider
- "or" text between two horizontal lines
- Uppercase, `0.7rem`, `--text-muted`, letter-spacing `0.08em`

## Footer
- "Don't have an account? Create one" / "Already have an account? Sign in"
- `--text-sm`, link is `--primary` weight 600

## Specific Rules
- Password minimum 8 characters — show validation inline
- Register: confirm password field must match
- Login: "Forgot password?" link in label row (only enable if route exists)
- Redirect to `from` location after login, or `/` by default
