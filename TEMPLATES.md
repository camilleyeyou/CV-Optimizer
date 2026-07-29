# Template contract

Everything that defines a résumé template lives in **`template-registry.json`** at
the repo root. It is the single source of truth for three renderers:

| Renderer | Entry point | Reads the registry through |
| --- | --- | --- |
| Live preview (browser) | `client/src/components/builder/ResumePreview.jsx` | `client/src/config/templates.js`, `client/src/config/previewTheme.js` |
| PDF export | `server/src/services/pdfService.js` | `server/src/templateRegistry.js` |
| DOCX export | `server/src/services/docxService.js` | `server/src/templateRegistry.js` |

The preview and the PDF must paginate **identically** — same page box, margins,
font metrics, type scale and block spacing. That is why none of these values may
be hardcoded in either renderer: a margin that differs by 2pt is how a résumé
looks like 2 pages on screen and exports as 3. `server/__tests__/previewParity.test.js`
fails the build if a literal leaks back into either side.

Adding a template means **adding an entry to `templates[]`** — nothing else. If a
design cannot be expressed with the fields below, add a new *archetype* (shared
layout code both renderers implement), never a per-template branch in a renderer.

---

## 1. Registry structure

```
template-registry.json
├─ archetypes    documentation only: id → prose description of the layout
├─ page          the sheet: { size, width, height } in PostScript points
├─ fonts         families (TTF/OTF files), metrics, web font path/format
├─ layout        margins + archetype geometry, keyed by layout group
├─ typography    31 named type roles (size / family / weight / colour token)
├─ spacing       every gap, pad and rule width, in points
├─ separators    exact join strings for list content
└─ templates[]   the templates themselves ← this is what you add to
```

`page`, `fonts`, `layout`, `typography`, `spacing` and `separators` are the
**shared layout contract**. They are global, not per-template. Changing one
changes every template, so treat edits there as a breaking change and re-run the
validator across the whole library.

All distances are PostScript points (1pt = 1/72"). The preview converts with
`PX_PER_PT = 96/72`.

---

## 2. What a template must define

### Required fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable, kebab/lowercase. **Persisted on the résumé row** — never rename a shipped id. |
| `name` | string | Shown in the picker and the switcher. |
| `description` | string | One line, shown under the name. |
| `premium` | boolean | Tier gate. See §6. |
| `archetype` | enum | Layout family. See §3. |
| `accent` | hex | Primary accent colour. |
| `fontFamily` | `"sans"` \| `"serif"` | Body face. |
| `headingFamily` | `"sans"` \| `"serif"` | Heading face. |
| `sectionTitle` | enum | Section-heading style. See §4. |
| `skillsStyle` | enum | Skills rendering. See §4. |
| `maxPages` | number | Page budget against the stress fixture. See §5. |

### Optional fields

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `sectionOrder` | string[] | `DEFAULT_SECTION_ORDER` | Order and subset of sections. Honoured by all three renderers. |
| `sectionLabels` | object | `{}` | Per-section heading overrides, keyed by section id — e.g. `{"projects": "Publications"}`. DOCX uppercases them to match its house style. |
| `headerRule` | boolean | `true` | `false` draws no divider under the header. For templates aiming at a maximally plain document. |
| `accent2` | hex | `accent` | Secondary accent (gradients, chip tints). |
| `sidebarBg` | hex | `accent` | Sidebar band fill. `sidebar` archetype only. |
| `sidebarText` | hex | `#ffffff` | Text on the sidebar band. `sidebar` archetype only. |

`sectionLabels` renames a section without changing what it holds, which is how a
template targets a segment using the existing data model: an academic CV shows
the projects section as "Publications" and experience as "Research & Teaching".
It does **not** create new sections — an unknown key is ignored. The résumé
content and the builder form are unchanged; only the heading differs.

A spill-over heading beats a label: when a sidebar's skills run past the band,
the continuation in the main column is titled "Additional Skills" regardless of
`sectionLabels`, because that heading describes position, not content.

`DEFAULT_SECTION_ORDER` is
`['summary','experience','education','skills','projects','certifications','languages']`
and is defined in **both** `server/src/templateRegistry.js` and
`client/src/config/templates.js`. Any section key you use must be one a renderer
implements — an unknown key renders nothing, silently.

### Colour tokens

Only four colours are per-template: `accent`, `accent2`, `sidebarBg`,
`sidebarText`. The ink colours are **fixed across the whole library** and defined
in both renderers (`pdfService._buildTheme`, `previewTheme.templateVars`):

| Token | Value | Used for |
| --- | --- | --- |
| `name` | `#111827` | Name, section titles, entry titles |
| `text` | `#374151` | Body copy, bullets |
| `muted` | `#6b7280` | Dates, locations, contact line |

A typography role names a token (`"color": "accent"`), and each renderer resolves
it against the template's palette. To use a colour outside this set you must add
a token to **both** renderers — that is a contract change, not a template change.

---

## 3. Archetypes

The archetype selects which top-level layout function runs. `pdfService.generatePDF`
dispatches on it; the preview mirrors the dispatch with an `arch-<archetype>` root
class plus matching CSS.

| Archetype | Layout group | Layout |
| --- | --- | --- |
| `classic-centered` | `default` | Centred header, single column |
| `classic-left` | `default` | Left header, single column |
| `formal-left` | `default` | Left serif header, dense single column |
| `header-band` | `default` | Full-bleed colour band, single column below |
| `infographic` | `default` | Single column, two-column accent chips |
| `sidebar` | `sidebar` | Two columns; band carries contact/skills/languages |
| `compact` | `compact` | Dense single column, smaller type |

**Margins come from the layout group, not the archetype.**
`templateRegistry.layoutKeyFor()` maps archetype → group:

```js
sidebar  → 'sidebar'
compact  → 'compact'
*        → 'default'
```

A new archetype therefore inherits `layout.default` margins unless you extend
`layoutKeyFor()` **in both** `server/src/templateRegistry.js` and
`client/src/config/templates.js`. `previewParity.test.js` asserts the two
mappings agree.

Two archetypes change the usable page height and both renderers must agree:

- `sidebar` — `layout.sidebar.margins.left` (224) must exceed `sidebarWidth`
  (200) so the main column clears the painted band.
- `header-band` — the band starts at the sheet edge, so **page 1** has
  `PAGE.height - margins.bottom` of usable height instead of
  `PAGE.height - margins.top - margins.bottom`.

`compact` additionally sets `theme.compact`, which switches body roles to their
`*Compact` variants (`summaryCompact`, `bulletCompact`, `nameCompact`,
`sectionGapCompact`, `entryGapCompact`).

---

## 4. Style enums

| `sectionTitle` | Rendering |
| --- | --- |
| `underline` | Accent text + accent rule under it |
| `rule` | Ink text + light rule |
| `plain` | Text only, no rule |
| `pill` | White text on a filled accent pill |
| `bracket` | `# ` prefix, then the label |
| `smallcaps` | Title Case, accent, letter-spaced |
| `bar` | Accent vertical bar to the left of the label |

| `skillsStyle` | Rendering |
| --- | --- |
| `tags` | Rounded outlined tags that wrap and paginate |
| `inline` | One paragraph joined with `separators.inlineSkills` |
| `bars` | Two-column accent chips (**no proficiency bars — see §8**) |

Adding a value to either enum means implementing it in `pdfService._sectionTitle`
/ the skills renderer **and** in `preview.css` (`.sectitle-<value>`,
`.skills-<value>`). Both, or the preview and the PDF disagree.

---

## 5. `maxPages`

The page budget for `STRESS_RESUME` (`server/__tests__/fixtures/stressResume.js`):
8 jobs, 30 skills, 2 degrees, 2 projects, 3 certifications, 5 languages, with
Polish, Turkish, Cyrillic, Hebrew, Arabic and CJK text throughout.

It is a **hard ceiling the validator enforces**, not a hint, and it is never read
at runtime — it exists purely so a pagination regression fails loudly instead of
shipping. Pick the smallest number the design actually achieves, including for
templates that are "long by design": the fixture is a fixed yardstick, so a jump
from 3 pages to 5 on identical content is a regression whatever the template is
for.

Current library: all 21 templates render the stress fixture in 3 pages and a
typical résumé in 1.

Two pagination bugs this budget has caught, both of which produced pages of
near-empty output: the infographic skill renderer advancing absolute Y with no
page breaks (13 pages for a normal résumé), and `fontService`'s mixed-script
layout path running past the page bottom and opening a page per token.

---

## 6. Tier and gating

`premium: true` puts a template behind the paywall. Enforcement is layered:

- **Server (authoritative)** — `server/src/middleware/templateAccess.js` blocks
  PDF/DOCX export of a premium template for a non-`pro`/`premium` plan with a
  403. It *fails open* on a profile-lookup error so a glitch never blocks a
  paying customer.
- **Client** — `client/src/pages/Templates.jsx` (picker) and
  `client/src/components/builder/TemplateSwitcher.jsx` (switcher) show a lock
  badge and route to the upgrade prompt.

Both sides are opt-in and currently **off**: server `TEMPLATE_PAYWALL_ENABLED`,
client `VITE_TEMPLATE_PAYWALL_ENABLED`. When off, every template is selectable
and exportable. A new template needs no gating code — only the `premium` flag.

Nothing else needs updating to make a template appear in the UI: the picker and
the switcher both map over `TEMPLATES` from the registry.

---

## 7. What each renderer consumes

### Preview — `ResumePreview.jsx`

Reads `getTemplate`, `getLayout`, `PAGE`, `SEPARATORS`. `templateVars(tpl)` emits
the per-template custom properties (`--tpl-accent`, `--tpl-sidebar-bg`,
`--pg-mt/mb/ml/mr`, `--pg-content-w/h`, sidebar and band geometry). The document
root carries `tpl-<id> arch-<archetype> sectitle-<style> skills-<style>
family-<sans|serif>`, which is the whole styling surface for `preview.css`.
Pagination is measured off a hidden copy by `usePagination`, honouring
`[data-keep-together]` blocks — the preview's mirror of `pdfService._ensureSpace`.

### PDF — `pdfService.js`

Consumes **every** template field. Dispatches on `archetype`, builds the palette
in `_buildTheme`, resolves all type through `_type(role, theme)` so no size or
colour is written literally. Manually positioned blocks (tags, chips, pills,
entry headers) bypass PDFKit's auto-pagination and must call `_ensureSpace`
before drawing. Fonts are bound by `fontService.attach()` before anything is
drawn; without it PDFKit silently drops every non-Latin-1 codepoint.

### DOCX — `docxService.js`

Consumes `accent`, `headingFamily`, `fontFamily`, `sectionTitle`, `sectionOrder`
and `sectionLabels`. `_bodySection(key, ...)` emits one section, and the caller
walks `spec.sectionOrder` — the same shape as `pdfService._section`, so all three
renderers agree on what a section is called and where it sits.

It still ignores `archetype`, `skillsStyle`, `headerRule`, `maxPages`,
`sidebarBg`, `sidebarText` and `accent2`. Fonts map to Word system faces
(`serif → Georgia`, `sans → Calibri`), not the embedded Noto files.

Consequence you must design around: **a template whose identity depends on
`archetype` or `skillsStyle` will look like a generic single-column document in
DOCX.** Order, naming, content and accent colour survive; two-column layouts,
sidebars and chips do not.

DOCX is a fallback format for ATS uploads and hand-editing; the PDF is the
fidelity target. Do not add per-template branching to `docxService` to narrow the
gap — extend it for all templates, or leave it.

---

## 8. Rules

1. **Registry-driven only.** No `if (template.id === 'x')` in any renderer.
   Layout code branches on *archetype* and the style enums, never on an id.
2. **No fabricated data.** Never render a number, percentage, rating, bar or
   metric the user did not enter. The `bars` skills style is named for history:
   it draws accent chips, because the previous version invented proficiency
   percentages. `pdfService.test.js` asserts no digits appear in a skills
   section for a résumé whose skills contain none.
3. **Both renderers or neither.** Any new enum value, section key, colour token
   or layout group must land in the preview and the PDF in the same change.
4. **Fonts are fixed.** `fontFamily`/`headingFamily` choose sans or serif; the
   Hebrew, Arabic and CJK faces are routed automatically per text run by
   `fontService`. Do not reference a font file from a template.
5. **Never rename a shipped `id`.** It is stored on every résumé row that uses it.

---

## 9. Shipping gate

```bash
npm run validate:templates            # every template, full check
npm run validate:templates -- --templates=my-new-one
npm run validate:templates -- --no-preview   # skip Chromium (PDF + DOCX only)
```

Runs every registry template against the stress fixture and asserts:

| # | Assertion |
| --- | --- |
| 1 | **No content drawn out of bounds** — every text span and vector drawing lies inside the page box, measured from the rendered PDF with PyMuPDF |
| 2 | **Page count ≤ `maxPages`** |
| 3 | **Non-Latin text renders** — Polish, Turkish, Cyrillic, Hebrew, Arabic and CJK samples are all present *and extractable* from the PDF (which is also what an ATS parser sees) |
| 4 | **Preview page count === PDF page count** — the preview is rendered in Chromium and its pagination compared to the PDF's |
| 5 | **DOCX exports, retains content, and honours `sectionOrder`** — the document opens, all résumé text including non-Latin survives, and sections appear in the declared order |

Dates are excluded from the DOCX content check: every renderer reformats
`2022-01` to `Jan 2022`, so the raw value is absent by design.

A new template must pass all of it before it ships. Requires `playwright` (client
devDependency), local Chrome, and `python3` with `pymupdf` for the geometry pass.
`--no-preview` drops assertion 4 and the Chromium requirement.

---

## 10. The library

21 templates: 8 free, 13 premium. The picker and the switcher both map over the
registry, so this table is the whole list.

| Template | Tier | Archetype | Aimed at |
| --- | --- | --- | --- |
| Modern | free | classic-centered | General; the default |
| Professional | free | classic-centered | Corporate, finance |
| Minimal | free | classic-left | General, understated |
| Creative | free | classic-centered | Creative roles |
| Technical | free | classic-left | Engineers; skills-first |
| Executive | free | classic-centered | Senior leadership |
| **Compact** | **free** | compact | Senior candidates with long histories |
| **ATS-Max** | **free** | classic-left | Strict ATS; plainest possible parse |
| Elegant | premium | formal-left | Consulting, law |
| Startup | premium | header-band | Startup roles |
| Academic | premium | formal-left | General scholarly |
| Nordic | premium | sidebar | Design-led, light sidebar |
| Bold | premium | header-band | High-contrast statement |
| Gradient | premium | header-band | Modern, gradient band |
| Sidebar | premium | sidebar | Two-column, dark band |
| Infographic | premium | infographic | Visual, chip-based skills |
| Dark | premium | sidebar | Dark sidebar |
| **Academic CV** | premium | formal-left | Researchers; publications-forward |
| **Europass-style** | premium | sidebar | EU applications; pairs with translate |
| **Creative Serif** | premium | classic-centered | Design/marketing; editorial serif |
| **Tech Grid** | premium | classic-left | Developers; projects and repos first |

Bold entries are the current expansion. `Compact` and `Academic` predate it:
`Compact` was retargeted (and moved to free) rather than duplicated, while
`Academic CV` ships alongside `Academic` because the two differ in kind — the
former is publications-forward with renamed sections, the latter a general
scholarly layout.

### Deliberately not built

**Europass photo slot.** The Europass convention allows a portrait, but the
résumé data model has no photo field anywhere — adding one means storage,
upload UI, and image embedding in three renderers, plus fetching user-supplied
URLs server-side during PDF generation (an SSRF surface on a 60s serverless
function). `Europass-style` ships as the two-column EU layout without it. Adding
a photo later is a data-model change, not a template change.
