export const tours = {
  dashboard: {
    id: 'dashboard',
    steps: [
      {
        target: '[data-tour="dashboard-welcome"]',
        title: 'Welcome to CV Optimizer!',
        content: 'This is your home base. All your resumes live here — let\'s take a quick tour.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-create"]',
        title: 'Create a Resume',
        content: 'Start from scratch by picking a template. We have free and premium designs.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-import"]',
        title: 'Import Existing Resume',
        content: 'Already have a resume? Upload a PDF and we\'ll auto-fill everything for you.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-nav"]',
        title: 'Explore More Tools',
        content: 'Check your ATS score, create with AI, track applications, prep for interviews, and more — all from the nav bar.',
        placement: 'bottom',
      },
    ],
  },
  builder: {
    id: 'builder',
    steps: [
      {
        target: '[data-tour="builder-form"]',
        title: 'Resume Editor',
        content: 'Fill in your details section by section. Everything saves automatically as you type.',
        placement: 'right',
      },
      {
        target: '[data-tour="builder-preview"]',
        title: 'Live Preview',
        content: 'Watch your resume update in real time. This is exactly how your PDF will look.',
        placement: 'left',
        minWidth: 769,
      },
      {
        target: '[data-tour="builder-ats"]',
        title: 'ATS Score Checker',
        content: 'Paste a job description to instantly see how well your resume matches — and what keywords you\'re missing.',
        placement: 'right',
      },
      {
        target: '[data-tour="builder-tailor"]',
        title: 'AI Tailor',
        content: 'Let AI rewrite your resume to perfectly match any job posting. Review changes before applying.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="builder-translate"]',
        title: 'Translate',
        content: 'Instantly translate your resume into 23+ languages while keeping names and companies intact.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="builder-export"]',
        title: 'Export Your Resume',
        content: 'Download as a polished PDF or DOCX when you\'re ready. That\'s it — you\'re all set!',
        placement: 'bottom-end',
      },
    ],
  },
};
