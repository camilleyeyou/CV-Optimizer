import { useResume } from '../../context/ResumeContext';
import { getTemplate } from '../../config/templates';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';
import './preview.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

const friendlyUrl = (url) => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const friendlyProjectUrl = (url) => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (parsed.hostname.includes('github.com')) {
      return `GitHub: ${parsed.pathname.replace(/^\//, '').replace(/\/$/, '')}`;
    }
    return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
};

const toHref = (url) => (url.startsWith('http') ? url : `https://${url}`);

// Real saved resumes don't always store list fields as arrays (e.g. a bullet
// description may be a plain string). Normalize defensively so the preview
// never crashes on unexpected shapes.
const asArray = (v) => (Array.isArray(v) ? v : []);
const asBullets = (v) =>
  Array.isArray(v)
    ? v.filter(Boolean)
    : typeof v === 'string'
      ? v.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

// Sections that move into the colored sidebar for the "sidebar" archetype.
const SIDEBAR_SECTIONS = ['skills', 'languages'];

// `data`/`templateId` props let this render arbitrary resume content (e.g. a
// scaled thumbnail of a specific template), falling back to the live builder
// context when used as the main editor preview.
const ResumePreview = ({ data: dataProp, templateId } = {}) => {
  const { resumeData } = useResume();
  const data = dataProp || resumeData || {};
  const p = data.personal_info || {};
  const tpl = getTemplate(templateId || data.template);

  const hasContact = p.email || p.phone || p.location || p.linkedin || p.website;
  const hasName = p.first_name || p.last_name;
  const skills = asArray(data.skills).filter(Boolean);
  const experience = asArray(data.work_experience);

  // CSS variables let one stylesheet theme every template by accent/font.
  const styleVars = {
    '--tpl-accent': tpl.accent,
    '--tpl-accent-2': tpl.accent2 || tpl.accent,
    '--tpl-sidebar-bg': tpl.sidebarBg || tpl.accent,
    '--tpl-sidebar-text': tpl.sidebarText || '#ffffff',
    '--tpl-body-font':
      tpl.fontFamily === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Inter', system-ui, sans-serif",
    '--tpl-heading-font':
      tpl.headingFamily === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Inter', system-ui, sans-serif",
  };

  const rootClass = [
    'preview-page',
    `tpl-${tpl.id}`,
    `arch-${tpl.archetype}`,
    `sectitle-${tpl.sectionTitle}`,
    `skills-${tpl.skillsStyle}`,
  ].join(' ');

  // ---- Section renderers ---------------------------------------------------
  const SectionTitle = ({ children }) => (
    <h2 className="preview-section-title"><span>{children}</span></h2>
  );

  const renderContact = () =>
    hasContact && (
      <div className="preview-contact">
        {p.email && <a className="contact-item contact-link" href={`mailto:${p.email}`}><Mail size={11} /> {p.email}</a>}
        {p.phone && <a className="contact-item contact-link" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={11} /> {p.phone}</a>}
        {p.location && <span className="contact-item"><MapPin size={11} /> {p.location}</span>}
        {p.linkedin && <a className="contact-item contact-link" href={toHref(p.linkedin)} target="_blank" rel="noopener noreferrer"><Linkedin size={11} /> LinkedIn</a>}
        {p.website && <a className="contact-item contact-link" href={toHref(p.website)} target="_blank" rel="noopener noreferrer"><Globe size={11} /> {friendlyUrl(p.website)}</a>}
      </div>
    );

  const renderSection = (key) => {
    switch (key) {
      case 'summary':
        return data.summary ? (
          <div className="preview-section" key="summary">
            <SectionTitle>Professional Summary</SectionTitle>
            <p className="preview-text">{data.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return experience.length > 0 ? (
          <div className="preview-section" key="experience">
            <SectionTitle>Experience</SectionTitle>
            {experience.map((exp, i) => (
              <div key={exp.id || i} className="preview-entry">
                <div className="preview-entry-header">
                  <div>
                    <strong className="preview-entry-title">{exp.position}</strong>
                    {exp.company && <span className="preview-entry-subtitle"> &middot; {exp.company}</span>}
                  </div>
                  <span className="preview-entry-date">
                    {formatDate(exp.start_date)}
                    {(exp.start_date || exp.end_date || exp.current) && ' - '}
                    {exp.current ? 'Present' : formatDate(exp.end_date)}
                  </span>
                </div>
                {exp.location && <p className="preview-entry-location">{exp.location}</p>}
                {asBullets(exp.description).length > 0 && (
                  <ul className="preview-bullets">
                    {asBullets(exp.description).map((bullet, bi) => <li key={bi}>{bullet}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case 'education':
        return asArray(data.education).length > 0 ? (
          <div className="preview-section" key="education">
            <SectionTitle>Education</SectionTitle>
            {asArray(data.education).map((edu, i) => (
              <div key={edu.id || i} className="preview-entry">
                <div className="preview-entry-header">
                  <div>
                    <strong className="preview-entry-title">{edu.degree}</strong>
                    {edu.field_of_study && <span className="preview-entry-subtitle"> in {edu.field_of_study}</span>}
                  </div>
                  <span className="preview-entry-date">
                    {formatDate(edu.start_date)}
                    {(edu.start_date || edu.end_date) && ' - '}
                    {formatDate(edu.end_date)}
                  </span>
                </div>
                <p className="preview-entry-location">
                  {edu.institution}
                  {edu.gpa && <span> - GPA: {edu.gpa}</span>}
                </p>
              </div>
            ))}
          </div>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <div className="preview-section" key="skills">
            <SectionTitle>Skills</SectionTitle>
            <div className="preview-skills">
              {skills.map((skill, i) => (
                <span key={i} className="preview-skill">
                  {skill}
                  {tpl.skillsStyle === 'bars' && (
                    <span className="preview-skill-bar"><span style={{ width: `${70 + ((i * 7) % 30)}%` }} /></span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'projects':
        return asArray(data.projects).length > 0 ? (
          <div className="preview-section" key="projects">
            <SectionTitle>Projects</SectionTitle>
            {asArray(data.projects).map((proj, i) => (
              <div key={proj.id || i} className="preview-entry">
                <div className="preview-entry-header">
                  <strong className="preview-entry-title">{proj.name}</strong>
                </div>
                {proj.url && <a className="preview-entry-link" href={toHref(proj.url)} target="_blank" rel="noopener noreferrer">{friendlyProjectUrl(proj.url)}</a>}
                {proj.description && <p className="preview-text">{proj.description}</p>}
                {proj.technologies && <p className="preview-entry-tech">Tech: {proj.technologies}</p>}
              </div>
            ))}
          </div>
        ) : null;

      case 'certifications':
        return asArray(data.certifications).length > 0 ? (
          <div className="preview-section" key="certifications">
            <SectionTitle>Certifications</SectionTitle>
            {asArray(data.certifications).map((cert, i) => (
              <div key={cert.id || i} className="preview-entry preview-entry-compact">
                <strong className="preview-entry-title">{cert.name}</strong>
                <span className="preview-entry-subtitle">
                  {cert.issuer && ` - ${cert.issuer}`}
                  {cert.date && ` (${formatDate(cert.date)})`}
                </span>
              </div>
            ))}
          </div>
        ) : null;

      case 'languages':
        return asArray(data.languages).length > 0 ? (
          <div className="preview-section" key="languages">
            <SectionTitle>Languages</SectionTitle>
            <div className="preview-languages">
              {asArray(data.languages).map((lang, i) => (
                <span key={i} className="preview-language">
                  {lang.name} <span className="lang-level">({lang.proficiency})</span>
                </span>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const Header = ({ withContact = true }) => (
    <div className="preview-header">
      {hasName ? (
        <h1 className="preview-name">{p.first_name} {p.last_name}</h1>
      ) : (
        <h1 className="preview-name preview-placeholder">Your Name</h1>
      )}
      {p.job_title && <p className="preview-job-title">{p.job_title}</p>}
      {withContact && renderContact()}
    </div>
  );

  const isEmpty = !hasName && !data.summary && !experience.length;
  const emptyState = (
    <div className="preview-empty">
      <p>Start filling in your information on the left to see your resume take shape here.</p>
    </div>
  );

  // ---- Layout per archetype ------------------------------------------------
  if (tpl.archetype === 'sidebar') {
    const sidebarKeys = tpl.sectionOrder.filter((k) => SIDEBAR_SECTIONS.includes(k));
    const mainKeys = tpl.sectionOrder.filter((k) => !SIDEBAR_SECTIONS.includes(k));
    return (
      <div className={rootClass} style={styleVars}>
        <div className="preview-sidebar-layout">
          <aside className="preview-sidebar">
            <div className="preview-sidebar-name">
              <h1 className="preview-name">{hasName ? `${p.first_name} ${p.last_name}` : 'Your Name'}</h1>
              {p.job_title && <p className="preview-job-title">{p.job_title}</p>}
            </div>
            {renderContact()}
            {sidebarKeys.map(renderSection)}
          </aside>
          <main className="preview-main">
            {isEmpty ? emptyState : mainKeys.map(renderSection)}
          </main>
        </div>
      </div>
    );
  }

  // header-band, classic-*, formal-left, compact, infographic all share a
  // single-column flow; the band/header styling is CSS-driven off the archetype class.
  return (
    <div className={rootClass} style={styleVars}>
      <Header />
      {isEmpty ? emptyState : tpl.sectionOrder.map(renderSection)}
    </div>
  );
};

export default ResumePreview;
