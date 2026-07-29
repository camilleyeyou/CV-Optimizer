import { useMemo } from 'react';
import { useResumeOptional } from '../../context/ResumeContext';
import {
  getTemplate, getLayout, PAGE, SEPARATORS, isPredominantlyRTL,
} from '../../config/templates';
import { templateVars, ensurePreviewCss } from '../../config/previewTheme';
import usePagination, { ptToPx } from './usePagination';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';
import './preview.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = String(dateStr).split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const name = months[parseInt(month, 10) - 1];
  // Matches pdfService._formatDate: a year-only value renders as just the year.
  return name ? `${name} ${year}` : `${year}`;
};

const formatRange = (start, end, current) => {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} - ${e}`;
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
const asBullets = (v) => (Array.isArray(v)
  ? v.filter(Boolean)
  : typeof v === 'string'
    ? v.split('\n').map((s) => s.trim()).filter(Boolean)
    : []);

// Sections that move into the colored sidebar for the "sidebar" archetype.
const SIDEBAR_SECTIONS = ['skills', 'languages'];

/**
 * Live resume preview.
 *
 * Geometry (page box, margins, fonts, type scale, spacing) comes from
 * template-registry.json, the same source the PDF renderer reads, so the line
 * wrapping and page count on screen are the ones the download will have.
 *
 * `data`/`templateId` let this render arbitrary content (e.g. a scaled template
 * thumbnail); it falls back to the live builder context otherwise.
 * `paginate={false}` renders a single unbroken sheet, for thumbnails.
 *
 * `nameTag` sets the element used for the candidate's name. It is an <h1> by
 * default, which is right when the resume is the page's subject. Embedding a
 * preview as decoration — the landing-page hero, a template thumbnail — would
 * then put a second <h1> in the host document, so those callers pass "div".
 * Styling keys off .preview-name, not the tag, so nothing else moves.
 */
const ResumePreview = ({
  data: dataProp, templateId, paginate = true, nameTag: NameTag = 'h1',
} = {}) => {
  ensurePreviewCss();

  const ctx = useResumeOptional();
  const data = dataProp || ctx?.resumeData || {};
  const p = data.personal_info || {};
  const tpl = getTemplate(templateId || data.template);
  const layout = getLayout(tpl.archetype);

  const styleVars = useMemo(() => templateVars(tpl), [tpl]);
  const contentHeightPt = PAGE.height - layout.margins.top - layout.margins.bottom;
  // The header band starts at the sheet edge, so page 1 of that archetype has
  // the top margin's worth of extra room - exactly as the PDF lays it out.
  const isBand = tpl.archetype === 'header-band';
  const firstPageHeightPt = isBand ? PAGE.height - layout.margins.bottom : contentHeightPt;

  const hasContact = p.email || p.phone || p.location || p.linkedin || p.website;
  const hasName = p.first_name || p.last_name;
  const skills = asArray(data.skills).filter(Boolean);
  const experience = asArray(data.work_experience);
  const isSidebar = tpl.archetype === 'sidebar';

  const rootClass = [
    'preview-doc',
    `tpl-${tpl.id}`,
    `arch-${tpl.archetype}`,
    `sectitle-${tpl.sectionTitle}`,
    `skills-${tpl.skillsStyle}`,
    `family-${tpl.fontFamily === 'serif' ? 'serif' : 'sans'}`,
    // Mirrors theme.headerRule in pdfService: templates aiming for a maximally
    // plain document draw no divider under the header.
    tpl.headerRule === false ? 'no-header-rule' : '',
    // Only a whole-document RTL resume gets right-aligned, matching the PDF.
    isPredominantlyRTL(data) ? 'rtl-doc' : '',
  ].filter(Boolean).join(' ');

  // ---- Section renderers ---------------------------------------------------
  const SectionTitle = ({ children }) => (
    <h2 className="preview-section-title"><span>{children}</span></h2>
  );

  const renderContact = () => hasContact && (
    <div className="preview-contact">
      {p.email && <a className="contact-item contact-link" href={`mailto:${p.email}`}><Mail /> {p.email}</a>}
      {p.phone && <a className="contact-item contact-link" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone /> {p.phone}</a>}
      {p.location && <span className="contact-item"><MapPin /> {p.location}</span>}
      {p.linkedin && <a className="contact-item contact-link" href={toHref(p.linkedin)} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a>}
      {p.website && <a className="contact-item contact-link" href={toHref(p.website)} target="_blank" rel="noopener noreferrer"><Globe /> {friendlyUrl(p.website)}</a>}
    </div>
  );

  /**
   * Heading for a section, honouring the template's own naming - an academic
   * CV calls the projects section "Publications". Mirrors pdfService._section.
   */
  const label = (key, fallback) => tpl.sectionLabels?.[key] || fallback;

  // `inSidebar` matters for skills/languages: the PDF stacks them one per line
  // inside the sidebar band regardless of the template's skillsStyle.
  const renderSection = (key, inSidebar = false) => {
    switch (key) {
      case 'summary':
        return data.summary ? (
          <div className="preview-section" key="summary">
            <div data-keep-together><SectionTitle>{label('summary', 'Professional Summary')}</SectionTitle></div>
            <p className="preview-text" dir="auto">{data.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return experience.length > 0 ? (
          <div className="preview-section" key="experience">
            <div data-keep-together><SectionTitle>{label('experience', 'Experience')}</SectionTitle></div>
            {experience.map((exp, i) => (
              <div key={exp.id || i} className="preview-entry">
                <div data-keep-together>
                  <div className="preview-entry-header">
                    <div>
                      <strong className="preview-entry-title" dir="auto">{exp.position}</strong>
                      {exp.company && (
                        <span className="preview-entry-subtitle" dir="auto">
                          {SEPARATORS.entryTitle}{exp.company}
                        </span>
                      )}
                    </div>
                    <span className="preview-entry-date">
                      {formatRange(exp.start_date, exp.end_date, exp.current)}
                    </span>
                  </div>
                  {exp.location && <p className="preview-entry-location">{exp.location}</p>}
                </div>
                {asBullets(exp.description).length > 0 && (
                  <ul className="preview-bullets">
                    {asBullets(exp.description).map((bullet, bi) => <li key={bi} dir="auto">{bullet}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case 'education':
        return asArray(data.education).length > 0 ? (
          <div className="preview-section" key="education">
            <div data-keep-together><SectionTitle>{label('education', 'Education')}</SectionTitle></div>
            {asArray(data.education).map((edu, i) => (
              <div key={edu.id || i} className="preview-entry preview-entry-education" data-keep-together>
                <div className="preview-entry-header">
                  <div>
                    <strong className="preview-entry-title" dir="auto">{edu.degree}</strong>
                    {edu.field_of_study && <span className="preview-entry-subtitle"> in {edu.field_of_study}</span>}
                  </div>
                  <span className="preview-entry-date">{formatRange(edu.start_date, edu.end_date)}</span>
                </div>
                <p className="preview-education-meta">
                  {[edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join(SEPARATORS.educationMeta)}
                </p>
              </div>
            ))}
          </div>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <div className="preview-section" key="skills">
            <div data-keep-together><SectionTitle>{label('skills', 'Skills')}</SectionTitle></div>
            {/* The infographic template used to draw a proficiency bar here whose
                fill came from the skill's index in the list, inventing a rating
                the user never entered. It renders as an accent chip instead, which
                matches what the PDF exporter now draws. */}
            {tpl.skillsStyle === 'inline' && !inSidebar ? (
              // The PDF renders inline skills as one joined string. Per-item
              // spans with a CSS separator wrap at different points, so join
              // here too and keep the double spaces from collapsing.
              <div className="preview-skills preview-joined" dir="auto">{skills.join(SEPARATORS.inlineSkills)}</div>
            ) : (
              <div className="preview-skills">
                {skills.map((skill, i) => (
                  <span key={i} className="preview-skill" dir="auto">{skill}</span>
                ))}
              </div>
            )}
          </div>
        ) : null;

      case 'projects':
        return asArray(data.projects).length > 0 ? (
          <div className="preview-section" key="projects">
            <div data-keep-together><SectionTitle>{label('projects', 'Projects')}</SectionTitle></div>
            {asArray(data.projects).map((proj, i) => (
              <div key={proj.id || i} className="preview-entry preview-entry-project">
                <div data-keep-together>
                  <strong className="preview-entry-title" dir="auto">{proj.name}</strong>
                  {proj.url && (
                    <a className="preview-entry-link" href={toHref(proj.url)} target="_blank" rel="noopener noreferrer">
                      {friendlyProjectUrl(proj.url)}
                    </a>
                  )}
                </div>
                {proj.description && <p className="preview-project-description" dir="auto">{proj.description}</p>}
                {proj.technologies && <p className="preview-entry-tech">Tech: {proj.technologies}</p>}
              </div>
            ))}
          </div>
        ) : null;

      case 'certifications':
        return asArray(data.certifications).length > 0 ? (
          <div className="preview-section" key="certifications">
            <div data-keep-together><SectionTitle>{label('certifications', 'Certifications')}</SectionTitle></div>
            {asArray(data.certifications).map((cert, i) => (
              <div key={cert.id || i} className="preview-entry preview-entry-compact" data-keep-together>
                <div>
                  <strong className="preview-cert-name" dir="auto">{cert.name}</strong>
                  {cert.issuer && <span className="preview-cert-issuer">{SEPARATORS.certIssuer}{cert.issuer}</span>}
                </div>
                {cert.date && <div className="preview-cert-date">{formatDate(cert.date)}</div>}
              </div>
            ))}
          </div>
        ) : null;

      case 'languages':
        return asArray(data.languages).length > 0 ? (
          <div className="preview-section" key="languages">
            <div data-keep-together><SectionTitle>{label('languages', 'Languages')}</SectionTitle></div>
            {/* Joined the same way the PDF joins them, for identical wrapping -
                except in the sidebar, where the PDF stacks one per line. */}
            {inSidebar ? (
              <div className="preview-languages">
                {asArray(data.languages).map((l, i) => (
                  <span key={i} className="preview-language" dir="auto">
                    {l.proficiency ? `${l.name} (${l.proficiency})` : l.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="preview-languages preview-joined" dir="auto">
                {asArray(data.languages)
                  .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
                  .join(SEPARATORS.languages)}
              </div>
            )}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const Header = () => (
    <div className="preview-header" data-keep-together>
      {hasName
        ? <NameTag className="preview-name">{p.first_name} {p.last_name}</NameTag>
        : <NameTag className="preview-name preview-placeholder">Your Name</NameTag>}
      {p.job_title && <p className="preview-job-title">{p.job_title}</p>}
      {renderContact()}
    </div>
  );

  const isEmpty = !hasName && !data.summary && !experience.length;
  const emptyState = (
    <div className="preview-empty">
      <p>Start filling in your information on the left to see your resume take shape here.</p>
    </div>
  );

  // The sidebar band carries its own content on page 1 only; the flowing part
  // that paginates is the main column.
  const sidebarKeys = isSidebar ? tpl.sectionOrder.filter((k) => SIDEBAR_SECTIONS.includes(k)) : [];
  const mainKeys = isSidebar ? tpl.sectionOrder.filter((k) => !SIDEBAR_SECTIONS.includes(k)) : tpl.sectionOrder;

  const flowContent = isEmpty ? emptyState : mainKeys.map((k) => renderSection(k, false));
  const flow = (
    <>
      {!isSidebar && <Header />}
      {flowContent}
    </>
  );

  const sidebarAside = (withContent) => (
    <aside className="preview-sidebar">
      {withContent && (
        <>
          <div className="preview-sidebar-name">
            <NameTag className="preview-name">{hasName ? `${p.first_name} ${p.last_name}` : 'Your Name'}</NameTag>
            {p.job_title && <p className="preview-job-title">{p.job_title}</p>}
          </div>
          {renderContact()}
          {sidebarKeys.map((k) => renderSection(k, true))}
        </>
      )}
    </aside>
  );

  const { measureRef, offsets, pageCount } = usePagination({
    contentHeightPt,
    firstPageHeightPt,
    enabled: paginate,
    deps: [data, tpl.id],
  });

  // Each sheet shows exactly [offsets[i], offsets[i+1]). Using the full page
  // capacity instead would re-show the gap left when a break is pulled up to
  // keep a block whole.
  const sliceHeight = (i) => (i < offsets.length - 1
    ? offsets[i + 1] - offsets[i]
    : ptToPx(i === 0 ? firstPageHeightPt : contentHeightPt));

  // Thumbnails and other embedded uses want a single continuous sheet.
  if (!paginate) {
    return (
      <div className={`${rootClass} preview-sheet`} style={styleVars}>
        {isSidebar ? (
          <div className="preview-flow">
            <div className="preview-sidebar-layout">
              {sidebarAside(true)}
              <main className="preview-main">{flowContent}</main>
            </div>
          </div>
        ) : (
          <div className="preview-flow">{flow}</div>
        )}
      </div>
    );
  }

  return (
    <div className="preview-pages">
      {/* Hidden measurement pass: identical box, never painted. */}
      <div className={`${rootClass} preview-measure`} style={styleVars} aria-hidden="true">
        {isSidebar ? (
          // The aside carries real content, so it is rendered here too; only the
          // main column is measured for pagination since only it flows.
          <div className="preview-sidebar-layout">
            {sidebarAside(true)}
            <main className="preview-main"><div ref={measureRef}>{flowContent}</div></main>
          </div>
        ) : (
          <div className="preview-flow"><div ref={measureRef}>{flow}</div></div>
        )}
      </div>

      {offsets.map((offset, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div className="preview-page-wrap" key={i}>
          <div className={`${rootClass} preview-sheet`} style={styleVars}>
            {isSidebar ? (
              <div className="preview-sidebar-layout">
                {sidebarAside(i === 0)}
                <main className="preview-main">
                  <div className="preview-clip" style={{ height: sliceHeight(i) }}>
                    <div style={{ marginTop: -offset }}>{flowContent}</div>
                  </div>
                </main>
              </div>
            ) : (
              <div className="preview-flow" style={isBand && i === 0 ? { paddingTop: 0 } : undefined}>
                <div className="preview-clip" style={{ height: sliceHeight(i) }}>
                  <div style={{ marginTop: -offset }}>{flow}</div>
                </div>
              </div>
            )}
            {i < pageCount - 1 && (
              <div
                className="preview-break-line"
                style={{
                  top: ptToPx(isBand && i === 0 ? 0 : layout.margins.top) + sliceHeight(i),
                }}
              />
            )}
          </div>
          <div className="preview-page-badge">Page {i + 1} of {pageCount}</div>
        </div>
      ))}
    </div>
  );
};

export default ResumePreview;
