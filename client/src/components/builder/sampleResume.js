// Representative resume content used to render real template thumbnails on the
// Templates page (so each card shows what the template actually looks like).
export const SAMPLE_RESUME = {
  personal_info: {
    first_name: 'Alex',
    last_name: 'Morgan',
    job_title: 'Senior Product Designer',
    email: 'alex.morgan@email.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan',
    website: 'alexmorgan.design',
  },
  summary:
    'Product designer with 8+ years crafting intuitive digital experiences for fast-growing SaaS teams. Led design systems adopted across 12 product squads.',
  work_experience: [
    {
      id: 1,
      position: 'Senior Product Designer',
      company: 'Northwind Labs',
      location: 'San Francisco, CA',
      start_date: '2021-03',
      end_date: '',
      current: true,
      description: [
        'Owned end-to-end design for the flagship analytics suite used by 40k+ users.',
        'Built and shipped a unified design system, cutting handoff time by 35%.',
      ],
    },
    {
      id: 2,
      position: 'Product Designer',
      company: 'Brightwave',
      location: 'Remote',
      start_date: '2018-06',
      end_date: '2021-02',
      current: false,
      description: [
        'Redesigned onboarding, lifting activation rate from 48% to 71%.',
      ],
    },
  ],
  education: [
    {
      id: 1,
      degree: 'B.A. Interaction Design',
      institution: 'Rhode Island School of Design',
      location: 'Providence, RI',
      start_date: '2010-09',
      end_date: '2014-05',
    },
  ],
  skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Accessibility', 'HTML/CSS'],
  projects: [
    { id: 1, name: 'Pulse Design Kit', description: 'Open-source component library with 4k+ GitHub stars.' },
  ],
  certifications: [],
  languages: [{ id: 1, name: 'English', level: 'Native' }, { id: 2, name: 'Spanish', level: 'Professional' }],
};
