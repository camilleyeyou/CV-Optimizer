// Long-form copy for the public template pages.
//
// Kept out of template-registry.json on purpose: the registry is the rendering
// contract both renderers obey, and mixing marketing prose into it would mean
// every copy edit touches the file that controls PDF geometry. This module is
// presentation content only - nothing here is read by a renderer.
//
// Everything stated here must be true of the template as it actually renders.
// No usage counts, no ratings, no "used by N recruiters" - the pages carry
// SoftwareApplication structured data, and inventing review or rating fields
// there is both a lie and a manual action from Google.
import { getTemplate, TEMPLATES } from './templates';

const ARCHETYPE_LABEL = {
  'classic-centered': 'Single column, centred header',
  'classic-left': 'Single column, left-aligned header',
  'formal-left': 'Single column, left-aligned serif header',
  'header-band': 'Single column under a full-width colour band',
  sidebar: 'Two columns with a coloured sidebar',
  compact: 'Single column, condensed spacing',
  infographic: 'Single column with chip-style skills',
};

const HEADING_LABEL = {
  underline: 'Accent underline',
  rule: 'Thin rule',
  plain: 'Plain text, no rule',
  pill: 'Filled accent pill',
  bracket: 'Hash prefix',
  smallcaps: 'Letter-spaced small caps',
  bar: 'Accent bar',
};

const SKILLS_LABEL = {
  tags: 'Outlined tags',
  inline: 'One comma-separated line',
  bars: 'Two-column accent chips',
};

/** Factual spec rows, read straight off the rendering contract. */
export function templateFacts(id) {
  const t = getTemplate(id);
  return [
    ['Layout', ARCHETYPE_LABEL[t.archetype] || t.archetype],
    ['Section headings', HEADING_LABEL[t.sectionTitle] || t.sectionTitle],
    ['Skills', SKILLS_LABEL[t.skillsStyle] || t.skillsStyle],
    ['Typeface', t.fontFamily === 'serif' ? 'Serif (Noto Serif)' : 'Sans-serif (Noto Sans)'],
    ['Page size', 'A4'],
    ['Exports', 'PDF and DOCX'],
    ['Plan', t.premium ? 'Pro' : 'Free'],
  ];
}

// Questions that are true of every template, appended after the specific ones.
const SHARED_FAQS = (name) => [
  {
    q: `Is the ${name} template ATS-friendly?`,
    a: 'Yes. Text is drawn as real, selectable text rather than an image, so applicant '
      + 'tracking systems can parse it. Every template uses conventional section headings '
      + '(Experience, Education, Skills) and exports to both PDF and DOCX, which are the '
      + 'two formats job applications normally accept. If you want the most conservative '
      + 'possible structure, the ATS-Max template is single column with no rules, tags or '
      + 'colour blocks at all.',
  },
  {
    q: 'Can I switch templates after I start writing?',
    a: 'Yes, at any time. The template is stored separately from your résumé content, so '
      + 'switching only changes the design — nothing is reordered, rewritten or lost. You '
      + 'can move between all templates from the builder toolbar and watch the page count '
      + 'update as you go.',
  },
  {
    q: 'Does it support non-English characters?',
    a: 'Yes. Latin, Greek, Cyrillic, Hebrew, Arabic and Chinese/Japanese/Korean text all '
      + 'render in both the on-screen preview and the exported PDF, with right-to-left '
      + 'scripts laid out in the correct direction.',
  },
];

/**
 * Per-template positioning, audience and questions.
 *
 * `tagline` is a single sentence used in the page title and meta description,
 * so keep it under about 110 characters.
 */
const CONTENT = {
  modern: {
    tagline: 'A clean, centred résumé template with a blue accent — the safe default for most applications.',
    intro: [
      'Modern is the template most people should start with. A centred name and title, a single '
      + 'accent rule under the header, and one column of content underneath — nothing that '
      + 'competes with what you actually wrote.',
      'Because it is a single-column layout with standard headings, it parses cleanly in applicant '
      + 'tracking systems while still looking considered rather than generic.',
    ],
    bestFor: ['Software and product roles', 'Career changers who want a neutral canvas', 'Anyone unsure which template to pick'],
    faqs: [{
      q: 'Is Modern too plain for a design role?',
      a: 'It is deliberately restrained. If you want more personality while keeping an '
        + 'ATS-safe structure, Creative Serif and Creative both keep a single-column layout '
        + 'with more distinctive typography.',
    }],
  },
  professional: {
    tagline: 'Traditional serif résumé template with full-width rules — at home in any industry.',
    intro: [
      'Professional pairs a serif body with full-width section rules, the layout most people '
      + 'picture when they think of a résumé. It reads as considered and conventional.',
      'It works particularly well when your experience is the selling point and you want the '
      + 'document to get out of the way.',
    ],
    bestFor: ['Finance, law and consulting', 'Corporate and public-sector roles', 'Senior applicants with a long track record'],
    faqs: [],
  },
  minimal: {
    tagline: 'A minimal résumé template with generous whitespace and no heavy rules.',
    intro: [
      'Minimal strips the document to left-aligned headings and space. There are no rules, '
      + 'bars or fills — the hierarchy comes from spacing and weight alone.',
      'Choose it when your content is dense and you want the page to feel calm rather than busy.',
    ],
    bestFor: ['Design and editorial roles', 'Academic and research applications', 'Dense résumés that need breathing room'],
    faqs: [],
  },
  creative: {
    tagline: 'A centred résumé template with bold accent pills for section headings.',
    intro: [
      'Creative keeps a conventional single-column structure but sets each section heading in a '
      + 'filled accent pill, which gives the page a clear rhythm as you scan it.',
      'It is the most colourful of the free templates while keeping the parse-safe structure '
      + 'that matters when your application goes through a tracking system first.',
    ],
    bestFor: ['Marketing and brand roles', 'Design and content roles', 'Agency applications'],
    faqs: [],
  },
  technical: {
    tagline: 'An engineer-focused résumé template that pulls skills and projects to the top.',
    intro: [
      'Technical reorders the document so your stack and your projects appear before your '
      + 'employment history — the order most engineering reviewers actually read in.',
      'Section headings are prefixed with a hash, a small nod to the audience without turning '
      + 'the page into a novelty.',
    ],
    bestFor: ['Software engineers', 'Data and infrastructure roles', 'Applicants whose projects outweigh their job titles'],
    faqs: [{
      q: 'How is Technical different from Tech Grid?',
      a: 'Both lead with skills. Technical then goes to experience, keeping projects third, and '
        + 'renders skills as outlined tags. Tech Grid puts projects second — directly after '
        + 'skills and ahead of experience — and gives repository and portfolio links their own '
        + 'line, so it suits applicants whose public work is the strongest evidence.',
    }],
  },
  executive: {
    tagline: 'A polished serif résumé template with small-caps headings for senior leadership.',
    intro: [
      'Executive uses letter-spaced small caps and a serif face throughout, which reads as '
      + 'senior without resorting to ornament.',
      'It suits documents where scope and accountability matter more than a list of tools.',
    ],
    bestFor: ['Director and VP-level roles', 'Board and advisory applications', 'Long careers presented concisely'],
    faqs: [],
  },
  elegant: {
    tagline: 'A refined serif résumé template with generous spacing, built for consulting.',
    intro: [
      'Elegant sets a left-aligned serif header over a dense but well-spaced single column. It '
      + 'is the most typographically restrained template in the library.',
      'It works well for documents that run long and need to stay readable throughout.',
    ],
    bestFor: ['Management consulting', 'Law and professional services', 'Applicants with detailed engagement histories'],
    faqs: [],
  },
  startup: {
    tagline: 'A high-energy résumé template with a full-width colour band header.',
    intro: [
      'Startup opens with a full-bleed colour band carrying your name and contact details in '
      + 'reverse, then drops into a conventional single column.',
      'The band gives the page immediate identity while everything below it stays parse-safe.',
    ],
    bestFor: ['Early-stage and scale-up roles', 'Growth, ops and generalist roles', 'Applicants who want presence without clutter'],
    faqs: [],
  },
  academic: {
    tagline: 'A detailed serif résumé template for research, publications and teaching.',
    intro: [
      'Academic leads with education, then experience and projects, in the order scholarly '
      + 'readers expect. It is set in serif throughout with thin section rules.',
      'For a publications-first document that is explicitly designed to run long, see the '
      + 'Academic CV template.',
    ],
    bestFor: ['Postgraduate and postdoctoral applications', 'Teaching and lecturing roles', 'Research positions'],
    faqs: [],
  },
  nordic: {
    tagline: 'A Scandinavian-inspired two-column résumé template in soft slate tones.',
    intro: [
      'Nordic puts contact details, skills and languages in a pale slate sidebar and leaves the '
      + 'main column for your history. The palette is deliberately muted.',
      'The two-column layout reads well on screen; if your application is going through an '
      + 'automated parser first, a single-column template is the more conservative choice.',
    ],
    bestFor: ['Design and product roles', 'Applications reviewed by humans first', 'Résumés with a lot of skills and languages'],
    faqs: [],
  },
  bold: {
    tagline: 'A high-contrast résumé template with a black band header that commands attention.',
    intro: [
      'Bold is the most assertive template in the library: a near-black band across the top of '
      + 'page one, reversed-out name and contact line, then a clean single column.',
      'It suits applications where you are competing for attention in a large pile.',
    ],
    bestFor: ['Sales and business development', 'Creative direction', 'Competitive, high-volume applications'],
    faqs: [],
  },
  gradient: {
    tagline: 'A modern résumé template with a gradient band header for creative industries.',
    intro: [
      'Gradient carries a two-colour band across the header, then a conventional single column '
      + 'underneath. It is the most contemporary-looking template in the set.',
      'The gradient is drawn as a vector fill, so it stays crisp at any print size.',
    ],
    bestFor: ['Digital and creative agencies', 'Product design roles', 'Portfolio-led applications'],
    faqs: [],
  },
  compact: {
    tagline: 'A dense résumé template with tight leading and two-column skills, for long careers.',
    intro: [
      'Compact reduces type size and leading and narrows the margins, so a career that would '
      + 'otherwise spill onto a third page fits into fewer. Skills sit in two columns rather '
      + 'than one long line.',
      'It is the template to reach for when you have fifteen years of history and refuse to cut '
      + 'any of it — without dropping to an unreadable type size.',
    ],
    bestFor: ['Senior candidates with long histories', 'Roles that expect a two-page maximum', 'Résumés with many roles or certifications'],
    faqs: [{
      q: 'Will Compact really fit my résumé on fewer pages?',
      a: 'It gives you roughly a page of extra room compared with the standard templates, '
        + 'through smaller body type, tighter line spacing, narrower margins and two-column '
        + 'skills. How much you gain depends on your content — the builder shows a live page '
        + 'count as you type, so you can see the effect immediately.',
    }],
  },
  sidebar: {
    tagline: 'A two-column résumé template with a solid colour sidebar for contact and skills.',
    intro: [
      'Sidebar moves contact details, skills and languages into a full-height coloured band on '
      + 'the left, leaving the main column for your history.',
      'If the sidebar runs longer than the page, the overflow continues in the main column '
      + 'rather than being silently cut.',
    ],
    bestFor: ['Roles with a long skills list', 'Multilingual applicants', 'Applications reviewed by humans first'],
    faqs: [],
  },
  infographic: {
    tagline: 'A visual résumé template with two-column accent chips for skills.',
    intro: [
      'Infographic renders each skill as an accent-tinted chip in two columns, which makes a '
      + 'long stack scannable at a glance.',
      'The chips deliberately carry no rating or percentage. A proficiency bar you never filled '
      + 'in is invented data, and this template does not present any.',
    ],
    bestFor: ['Roles with a broad tool stack', 'Design and marketing applications', 'Résumés reviewed on screen'],
    faqs: [{
      q: 'Does Infographic show skill ratings or percentages?',
      a: 'No. Earlier versions drew a proficiency bar per skill whose fill was derived from the '
        + 'skill\'s position in your list — a number you never entered, presented as if you had. '
        + 'That was removed. Skills now render as plain accent chips that assert nothing beyond '
        + 'the words you typed.',
    }],
  },
  dark: {
    tagline: 'A sleek résumé template with a dark navy sidebar, memorable for digital roles.',
    intro: [
      'Dark Mode pairs a deep navy sidebar with a bright accent, keeping the main column on '
      + 'white so the document still prints sensibly.',
      'It is the most distinctive of the sidebar templates without becoming hard to read.',
    ],
    bestFor: ['Developer and digital roles', 'Applications shared as a screen PDF', 'Portfolios and personal sites'],
    faqs: [{
      q: 'Will the dark sidebar use a lot of ink if printed?',
      a: 'The sidebar is a solid fill, so a printed copy will use noticeably more toner than a '
        + 'light template. If the résumé is likely to be printed, Nordic gives you the same '
        + 'two-column structure with a pale sidebar.',
    }],
  },
  'ats-max': {
    tagline: 'The most conservative résumé template: one column, standard headings, no graphics.',
    intro: [
      'ATS-Max is built to be parsed, not admired. One column, conventional headings — '
      + 'Summary, Experience, Education, Skills — plain text section titles with no rules, '
      + 'skills as a single comma-separated line, and no tags, chips, bars, sidebars or '
      + 'colour blocks anywhere on the page.',
      'Applicant tracking systems read the text layer of your file. Multi-column layouts, text '
      + 'boxes and tables are what tend to confuse that extraction. This template has none of '
      + 'them, which makes it the safest choice when you know nothing about the system on the '
      + 'other end.',
    ],
    bestFor: ['Large-employer application portals', 'Government and public-sector applications', 'Anyone who has been silently rejected and suspects parsing'],
    faqs: [{
      q: 'What makes ATS-Max safer to parse than the other templates?',
      a: 'Three things: it is a single column, so there is no left-to-right ambiguity about '
        + 'reading order; its section headings are the conventional ones parsers look for; and '
        + 'it draws no decorative elements at all — no tags, chips, rules, bands or sidebars. '
        + 'Every template in the library exports real selectable text, but this one removes '
        + 'everything a parser could trip over.',
    }, {
      q: 'Does using ATS-Max guarantee my résumé will pass?',
      a: 'No, and be wary of any tool that promises that. Systems differ, and most rejections '
        + 'come down to content rather than layout. What this template does is remove layout as '
        + 'a variable. Use the built-in ATS score checker to work on the content side.',
    }],
  },
  'academic-cv': {
    tagline: 'A publications-forward academic CV template, multi-page by design.',
    intro: [
      'Academic CV renames and reorders the document for scholarly applications: education '
      + 'first, then Publications, then Research & Teaching, then Grants & Awards. It is set in '
      + 'serif with letter-spaced small-caps headings.',
      'Unlike a résumé, an academic CV is expected to run long. This template is laid out on the '
      + 'assumption that it will.',
    ],
    bestFor: ['Faculty and postdoctoral applications', 'Grant and fellowship submissions', 'Researchers with a publication record'],
    faqs: [{
      q: 'How do I add publications?',
      a: 'The Publications section is the builder\'s projects section, renamed for this template. '
        + 'Add each publication as an entry — title, venue or journal in the technologies field, '
        + 'a DOI or link in the URL field, and the citation in the description. Research & '
        + 'Teaching works the same way from your experience entries.',
    }, {
      q: 'How is this different from the Academic template?',
      a: 'Academic is a general scholarly layout that keeps the standard résumé section names '
        + 'and order. Academic CV renames the sections for scholarly use and puts publications '
        + 'ahead of employment, which is the convention for faculty applications.',
    }],
  },
  europass: {
    tagline: 'A clean two-column CV template following European conventions, built for EU applications.',
    intro: [
      'Europass-style follows the conventions European employers expect: a two-column layout '
      + 'with a pale sidebar for contact details, skills and languages, and section names in '
      + 'European phrasing — Personal Statement, Work Experience, Education & Training.',
      'It pairs with the built-in translation tool, which converts your résumé content into '
      + 'another language while leaving company names, institutions and certifications intact.',
    ],
    bestFor: ['Applications to EU employers', 'Multilingual candidates', 'Roles requiring a European-format CV'],
    faqs: [{
      q: 'Is this the official Europass CV?',
      a: 'No. This is a template in the Europass style, not the official document generated by '
        + 'the European Commission\'s Europass platform. It follows the same conventions — '
        + 'two columns, a prominent languages section, European section naming — and is '
        + 'appropriate wherever a European-format CV is expected. If an employer specifically '
        + 'requires a file produced by the official Europass service, use that service.',
    }, {
      q: 'Does it include a photo?',
      a: 'No. Photos are customary on CVs in parts of Europe but are not currently supported '
        + 'anywhere in the builder, so this template does not reserve space for one.',
    }],
  },
  'creative-serif': {
    tagline: 'An editorial serif résumé template for design and marketing, on an ATS-safe structure.',
    intro: [
      'Creative Serif sets a centred serif header with letter-spaced small-caps section titles '
      + '— an editorial look closer to a magazine masthead than a form.',
      'The structure underneath is deliberately conventional: one column, standard sections, '
      + 'real selectable text. You get the typographic personality without giving up parseability.',
    ],
    bestFor: ['Design and art direction', 'Marketing, brand and copywriting', 'Editorial and publishing roles'],
    faqs: [{
      q: 'Is an editorial template risky for applicant tracking systems?',
      a: 'The risk with expressive templates is usually structural — multiple columns, text in '
        + 'boxes, headings drawn as images. This template has none of those. The personality is '
        + 'entirely in the typeface and heading treatment, over a single-column layout with '
        + 'conventional section names.',
    }],
  },
  'tech-grid': {
    tagline: 'A projects-forward developer résumé template with repository links up front.',
    intro: [
      'Tech Grid reorders the document for developers: your stack first, then Projects & '
      + 'Repositories, then employment history. Each project carries its repository or portfolio '
      + 'link on its own line, and those links survive into both the PDF and the DOCX export.',
      'Skills render as two columns of accent chips, so a broad stack stays scannable instead of '
      + 'running into one long line.',
    ],
    bestFor: ['Developers with public repositories', 'Open-source contributors', 'Junior applicants whose projects outweigh their job history'],
    faqs: [{
      q: 'Where do the repository links appear?',
      a: 'Each project entry renders its URL directly beneath the project name, in the accent '
        + 'colour, as a clickable link in the PDF. The same URL is written into the DOCX export '
        + 'as text, so it survives if a recruiter converts or copies the file.',
    }],
  },
};

/** Copy for a template id, with the shared questions appended. */
export function templateContent(id) {
  const tpl = getTemplate(id);
  const c = CONTENT[id] || {};
  return {
    tagline: c.tagline || tpl.description,
    intro: c.intro || [tpl.description],
    bestFor: c.bestFor || [],
    faqs: [...(c.faqs || []), ...SHARED_FAQS(tpl.name)],
  };
}

/** Templates that have a public page, in registry order. */
export const PUBLIC_TEMPLATES = TEMPLATES;

/** True when the id maps to a real template (guards the :slug route). */
export const isTemplateSlug = (slug) => TEMPLATES.some((t) => t.id === slug);
