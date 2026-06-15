// Client-side loader for the shared template registry (repo-root template-registry.json).
// The same file drives the server PDF/DOCX renderers, so the preview and the
// downloaded document stay in sync. Vite serves the root file via server.fs.allow: ['..'].
import registry from '../../../template-registry.json';

export const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

const FALLBACK = {
  id: 'modern',
  name: 'Modern',
  premium: false,
  archetype: 'classic-centered',
  accent: '#2563eb',
  fontFamily: 'sans',
  headingFamily: 'sans',
  sectionTitle: 'underline',
  skillsStyle: 'tags',
};

export const TEMPLATES = registry.templates;

const byId = new Map(registry.templates.map((t) => [t.id, t]));

export function getTemplate(id) {
  const t = byId.get(id) || FALLBACK;
  return { ...t, sectionOrder: t.sectionOrder || DEFAULT_SECTION_ORDER };
}
