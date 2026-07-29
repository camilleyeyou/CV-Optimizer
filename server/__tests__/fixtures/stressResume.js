// Shared fixtures for the PDF renderer tests.
//
// The stress resume is deliberately hostile: far more content than a real CV,
// unbroken long tokens, and every script the product's translate feature can
// emit. It exists to catch layout regressions (content drawn off-page, runaway
// pagination) and silent glyph loss.

/** The exact strings named in the non-Latin acceptance criteria. */
const SCRIPT_SAMPLES = {
  polish: 'Zażółć gęślą jaźń',
  turkish: 'Ünlü müdür',
  cyrillic: 'Привет',
  hebrew: 'שלום',
  arabic: 'مرحبا',
  cjk: '履歷',
};

const ALL_SCRIPT_SAMPLE = Object.values(SCRIPT_SAMPLES).join(' · ');

const SKILLS_30 = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL',
  'Terraform', 'Redis', 'Elasticsearch', 'RabbitMQ', 'gRPC',
  'CI/CD Pipeline Architecture and Release Engineering', // deliberately long
  'Go', 'Rust', 'Django', 'FastAPI',
  'Zażółć gęślą jaźń', 'Привет', 'مرحبا', 'שלום', '履歷',
  'Distributed Systems', 'Observability', 'Kafka', 'Svelte', 'WebAssembly',
];

const buildJobs = (n = 8) => Array.from({ length: n }, (_, i) => ({
  position: i === 0
    ? 'Principal Software Engineer and Technical Lead for Platform Infrastructure'
    : `Senior Software Engineer ${i + 1}`,
  company: i === 1
    ? 'Internationale Softwareentwicklungsgesellschaft für Unternehmenslösungen mbH'
    : `Company ${i + 1} ${SCRIPT_SAMPLES.cyrillic}`,
  location: i === 2 ? SCRIPT_SAMPLES.cjk : 'San Francisco, California, United States',
  start_date: `${2024 - (i + 1) * 2}-01`,
  end_date: `${2024 - i * 2}-12`,
  current: i === 0,
  description: [
    'Led the migration of a monolithic application to a distributed microservice architecture, cutting p99 latency by 60% across all customer-facing endpoints.',
    `Managed a team of engineers across three time zones. ${ALL_SCRIPT_SAMPLE}`,
    'Introduced automated regression testing that reduced production incidents quarter over quarter.',
    'Owned the observability stack and the on-call rotation for a fleet of several hundred services.',
  ],
}));

const STRESS_RESUME = {
  personal_info: {
    first_name: 'Aleksandra-Katarzyna',
    last_name: 'Wiśniewska-Kowalczyk',
    job_title: 'Principal Software Engineer · Platform Infrastructure · Zażółć gęślą jaźń · 履歷',
    email: 'aleksandra.wisniewska-kowalczyk@internationale-softwareentwicklung.example.com',
    phone: '+48 123 456 789',
    location: 'Warszawa, Mazowieckie, Polska',
    linkedin: 'linkedin.com/in/aleksandra-wisniewska-kowalczyk',
    website: 'https://aleksandra-wisniewska-kowalczyk.example.com',
  },
  summary: `Principal engineer with over a decade of experience designing distributed systems at scale. ${ALL_SCRIPT_SAMPLE}. `
    + 'Proven record of leading cross-functional teams, setting technical direction for platform organisations, '
    + 'and shipping reliable infrastructure that serves millions of daily active users across several continents.',
  work_experience: buildJobs(8),
  education: [
    {
      degree: 'Master of Science',
      field_of_study: 'Computer Science and Artificial Intelligence',
      institution: 'Politechnika Warszawska (Warsaw University of Technology)',
      start_date: '2012-10',
      end_date: '2014-06',
      gpa: '4.9/5.0',
    },
    {
      degree: 'Bachelor of Science',
      field_of_study: 'Informatyka',
      institution: 'Uniwersytet Jagielloński',
      start_date: '2009-10',
      end_date: '2012-06',
      gpa: '4.7/5.0',
    },
  ],
  skills: SKILLS_30,
  projects: [
    {
      name: 'Distributed Tracing Platform · Привет',
      url: 'github.com/example/distributed-tracing-platform',
      description: 'An OpenTelemetry-compatible tracing backend handling several billion spans per day with sub-second query latency.',
      technologies: 'Go, ClickHouse, Kafka, Kubernetes',
    },
    {
      name: 'مرحبا Resume Toolkit',
      url: 'https://example.com/resume-toolkit',
      description: 'Open-source toolkit for generating ATS-friendly resumes in multiple languages and scripts.',
      technologies: 'TypeScript, React, PDFKit',
    },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023-04' },
    { name: 'Certified Kubernetes Administrator', issuer: 'Cloud Native Computing Foundation', date: '2022-09' },
    { name: '履歷 Professional Certification', issuer: '台灣科技公司', date: '2021' },
  ],
  languages: [
    { name: 'Polski', proficiency: 'Native' },
    { name: 'English', proficiency: 'Fluent' },
    { name: 'Русский', proficiency: 'Intermediate' },
    { name: 'العربية', proficiency: 'Basic' },
    { name: '中文', proficiency: 'Basic' },
  ],
};

/** A realistic, ordinary resume - the "typical resume" of the acceptance criteria. */
const TYPICAL_RESUME = {
  personal_info: {
    first_name: 'Jane',
    last_name: 'Doe',
    job_title: 'Senior Software Engineer',
    email: 'jane.doe@example.com',
    phone: '+1 555 123 4567',
    location: 'Austin, TX',
    linkedin: 'linkedin.com/in/janedoe',
  },
  summary: 'Senior engineer with 8 years building scalable web platforms for high-growth companies.',
  work_experience: [
    {
      position: 'Lead Engineer',
      company: 'Acme Corp',
      location: 'Austin, TX',
      start_date: '2021-01',
      current: true,
      description: [
        'Led migration to Kubernetes, reducing deploy time by 60%.',
        'Built React and Node.js services serving 2M users.',
      ],
    },
    {
      position: 'Software Engineer',
      company: 'Beta Inc',
      location: 'Remote',
      start_date: '2018-06',
      end_date: '2020-12',
      description: ['Developed REST APIs in Python and PostgreSQL.'],
    },
  ],
  education: [
    {
      degree: 'B.S.',
      field_of_study: 'Computer Science',
      institution: 'UT Austin',
      start_date: '2014-08',
      end_date: '2018-05',
    },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
  projects: [
    {
      name: 'Open Source CLI',
      url: 'github.com/janedoe/cli',
      description: 'A developer productivity tool with 3k stars.',
      technologies: 'Go',
    },
  ],
  certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022-06' }],
  languages: [{ name: 'English', proficiency: 'Native' }],
};

/** Minimal resume built entirely from the acceptance-criteria strings. */
const MULTILINGUAL_RESUME = {
  personal_info: {
    first_name: SCRIPT_SAMPLES.polish,
    last_name: SCRIPT_SAMPLES.turkish,
    job_title: SCRIPT_SAMPLES.cyrillic,
    email: 'multi@example.com',
    location: SCRIPT_SAMPLES.cjk,
  },
  summary: ALL_SCRIPT_SAMPLE,
  work_experience: [
    {
      position: SCRIPT_SAMPLES.hebrew,
      company: SCRIPT_SAMPLES.arabic,
      location: SCRIPT_SAMPLES.cjk,
      start_date: '2020-01',
      current: true,
      description: [ALL_SCRIPT_SAMPLE],
    },
  ],
  education: [{
    degree: SCRIPT_SAMPLES.cjk,
    field_of_study: SCRIPT_SAMPLES.cyrillic,
    institution: SCRIPT_SAMPLES.polish,
    start_date: '2016-09',
    end_date: '2020-06',
  }],
  skills: Object.values(SCRIPT_SAMPLES),
  languages: [{ name: SCRIPT_SAMPLES.arabic, proficiency: SCRIPT_SAMPLES.hebrew }],
};

module.exports = {
  SCRIPT_SAMPLES,
  ALL_SCRIPT_SAMPLE,
  SKILLS_30,
  STRESS_RESUME,
  TYPICAL_RESUME,
  MULTILINGUAL_RESUME,
};
