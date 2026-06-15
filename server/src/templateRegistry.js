// Server-side loader for the shared template registry (repo-root template-registry.json).
// Both the PDF and DOCX renderers resolve a template spec through getTemplate().
const path = require('path');
const registry = require(path.join(__dirname, '../../template-registry.json'));

const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

// Sensible fallback so any unknown id renders cleanly instead of crashing.
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

const byId = new Map(registry.templates.map((t) => [t.id, t]));

/**
 * Resolve a template id to a fully-defaulted spec.
 * @param {string} id
 */
function getTemplate(id) {
  const t = byId.get(id) || FALLBACK;
  return {
    ...t,
    sectionOrder: t.sectionOrder || DEFAULT_SECTION_ORDER,
  };
}

function listTemplates() {
  return registry.templates;
}

module.exports = { getTemplate, listTemplates, DEFAULT_SECTION_ORDER };
