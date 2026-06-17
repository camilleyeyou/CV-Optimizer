export const tours = {
  dashboard: {
    id: 'dashboard',
    steps: [
      {
        target: '[data-tour="dashboard-welcome"]',
        title: 'Welcome to CV Optimizer 👋',
        content:
          "Whatever your field — nursing, teaching, sales, trades, design, engineering — we'll help you build a resume that gets noticed. Here's a quick 30-second tour.",
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-create"]',
        title: 'Create your resume',
        content:
          'Pick a professional template and fill in your details — we guide you step by step. No design or writing skills needed.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-import"]',
        title: 'Already have a resume?',
        content:
          "Upload your existing PDF and we'll fill everything in automatically. Then you just polish it.",
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-nav"]',
        title: 'Your full toolkit',
        content:
          'Check your resume score, write cover letters and emails, track your job applications, and practice for interviews — all from this menu.',
        placement: 'bottom',
      },
    ],
  },
  builder: {
    id: 'builder',
    steps: [
      {
        target: '[data-tour="builder-form"]',
        title: 'Your editor',
        content:
          'Add your details section by section. Everything saves automatically — there\'s no save button to worry about.',
        placement: 'right',
      },
      {
        target: '[data-tour="builder-preview"]',
        title: 'Live preview',
        content:
          'Your resume updates as you type. What you see here is exactly what your download will look like.',
        placement: 'left',
        minWidth: 769,
      },
      {
        target: '[data-tour="builder-ats"]',
        title: 'Beat the resume screeners',
        content:
          "Most employers use software (called an “ATS”) to filter resumes before a person ever reads them. Paste a job post here to see your match score and the keywords to add.",
        placement: 'right',
      },
      {
        target: '[data-tour="builder-tailor"]',
        title: 'Tailor it to any job',
        content:
          'Let AI rewrite your resume to match a specific job posting. You review every change before it’s applied.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="builder-translate"]',
        title: 'Work in any language',
        content:
          'Translate your whole resume into 20+ languages in one click, keeping names and companies intact.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="builder-export"]',
        title: 'Download & apply',
        content:
          "When you're happy, download a polished PDF or Word file — ready to send to employers. That's it!",
        placement: 'bottom-end',
      },
    ],
  },
};
