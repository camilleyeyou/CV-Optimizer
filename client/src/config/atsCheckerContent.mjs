/**
 * All copy for the free ATS checker landing page, shared verbatim between the
 * React page (pages/FreeAtsChecker.jsx) and the prerenderer
 * (scripts/prerender.mjs). The page exists to rank, so the HTML a crawler
 * receives and the DOM after hydration must say exactly the same things —
 * one module, zero drift. Keep it free of Vite defines, JSX and imports so
 * plain Node can load it.
 *
 * Every factual claim here is backed by the scoring engine
 * (server/src/services/atsScoring.js). The weights and score bands are the
 * real ones — if the engine changes, change this file in the same commit.
 */

export const ATS_CHECKER_PATH = '/free-ats-resume-checker';

export const ATS_CHECKER_TITLE = 'Free ATS Resume Checker — Score Your Resume Instantly | CV Optimizer';

export const ATS_CHECKER_DESCRIPTION = 'Paste your resume and target job title to get an ATS compatibility '
  + 'score out of 100, plus the keywords you are missing. Free, instant, no account or card required.';

/* Mirrors the weights in atsScoring.js (keywords 40 / formatting 25 /
   content 20 / completeness 15, when a target role is given). */
export const SCORE_FACTORS = [
  {
    name: 'Keyword match',
    weight: '40%',
    detail: 'Whether your resume mentions the skills and terms hiring systems associate with your target role. Missing keywords are listed with your score.',
  },
  {
    name: 'Formatting',
    weight: '25%',
    detail: 'How cleanly the text parses: standard section headings, readable bullets, no structures that trip automated parsers.',
  },
  {
    name: 'Content quality',
    weight: '20%',
    detail: 'Strength of the writing itself — action verbs, measurable results, bullet length in the range recruiters expect.',
  },
  {
    name: 'Completeness',
    weight: '15%',
    detail: 'Whether the sections an ATS looks for are present: contact details, experience, education and skills.',
  },
];

export const ATS_EXPLAINER = [
  'An applicant tracking system (ATS) is the software most employers use to collect and filter job applications. Before a recruiter reads your resume, the ATS parses it into structured data — name, roles, dates, skills — and often ranks it against the job description. Estimates vary by study, but the large majority of mid-size and enterprise employers filter applications this way.',
  'A resume that parses badly or misses the vocabulary of the posting can be ranked out of consideration before any human sees it. That is what this checker measures: how readable your resume is to that first, automated reader — not how good you are at your job.',
];

export const IMPROVE_TIPS = [
  {
    title: 'Mirror the language of the posting',
    detail: 'If the role asks for "stakeholder management" and your resume says "worked with teams", the match is missed. Use the exact terms for skills you genuinely have — never ones you do not.',
  },
  {
    title: 'Use standard section headings',
    detail: 'Experience, Education, Skills. Parsers are built for the common patterns; creative headings like "My journey" can send content to the wrong field or drop it.',
  },
  {
    title: 'Lead bullets with verbs and numbers',
    detail: '"Reduced onboarding time 40% by rebuilding the training program" scores better than "responsible for training" — with software and with humans.',
  },
  {
    title: 'Keep the layout parseable',
    detail: 'Tables, text boxes and multi-column layouts scramble many parsers. If you want a designed look, use a template built to stay machine-readable.',
  },
  {
    title: 'Complete every core section',
    detail: 'Missing contact details or an absent skills section costs points with an ATS and looks unfinished to a recruiter.',
  },
];

export const ATS_CHECKER_FAQS = [
  {
    q: 'Is this ATS checker really free?',
    a: 'Yes. Paste your resume, get your score and missing keywords — no account, no credit card and no paywall on the result.',
  },
  {
    q: 'Do you store my resume?',
    a: 'Nothing you paste here is saved to an account. The text is scored when you submit it and the score is returned to your browser.',
  },
  {
    q: 'What does my score mean?',
    a: '70 or above means your resume should pass automated screening for the role. 50 to 69 means it parses but is missing keywords or structure worth fixing. Below 50 means an ATS is likely filtering you out before a person reads it.',
  },
  {
    q: 'How is the score calculated?',
    a: 'Four weighted checks: keyword match against your target role (40%), formatting and parse-ability (25%), content quality such as action verbs and measurable results (20%), and completeness of core sections (15%). It is the same engine that powers the full CV Optimizer app.',
  },
  {
    q: 'Will a high score get me interviews?',
    a: 'A high score means the software will not filter you out — that is all any ATS checker can promise. Interviews depend on your actual experience matching the role. The score removes an obstacle; it does not replace substance.',
  },
  {
    q: 'Can I upload a PDF instead of pasting text?',
    a: 'This free checker takes pasted text. A free account lets you import your existing resume, rebuild it in an ATS-friendly template and export unlimited PDF and DOCX files.',
  },
];

/** JSON-LD for the checker page — same no-invented-data rule as everywhere. */
export function atsCheckerJsonLd(siteUrl) {
  const url = `${siteUrl}${ATS_CHECKER_PATH}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Free ATS Resume Checker',
      description: ATS_CHECKER_DESCRIPTION,
      url,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Résumé Checker',
      operatingSystem: 'Web browser',
      inLanguage: 'en',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to use — no account or card required.',
      },
      publisher: { '@type': 'Organization', name: 'CV Optimizer', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ATS_CHECKER_FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Free ATS resume checker', item: url },
      ],
    },
  ];
}
