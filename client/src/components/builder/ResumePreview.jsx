import { useResume } from '../../context/ResumeContext';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';
import './preview.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

const ResumePreview = () => {
  const { resumeData } = useResume();
  const p = resumeData?.personal_info || {};
  const hasContact = p.email || p.phone || p.location || p.linkedin || p.website;
  const hasName = p.first_name || p.last_name;

  return (
    <div className="preview-page">
      {/* Header */}
      <div className="preview-header">
        {hasName ? (
          <h1 className="preview-name">
            {p.first_name} {p.last_name}
          </h1>
        ) : (
          <h1 className="preview-name preview-placeholder">Your Name</h1>
        )}

        {p.job_title && <p className="preview-job-title">{p.job_title}</p>}

        {hasContact && (
          <div className="preview-contact">
            {p.email && <span className="contact-item"><Mail size={11} /> {p.email}</span>}
            {p.phone && <span className="contact-item"><Phone size={11} /> {p.phone}</span>}
            {p.location && <span className="contact-item"><MapPin size={11} /> {p.location}</span>}
            {p.linkedin && <span className="contact-item"><Linkedin size={11} /> {p.linkedin}</span>}
            {p.website && <span className="contact-item"><Globe size={11} /> {p.website}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {resumeData.summary && (
        <div className="preview-section">
          <h2 className="preview-section-title">Professional Summary</h2>
          <p className="preview-text">{resumeData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resumeData.work_experience?.length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Experience</h2>
          {resumeData.work_experience.map((exp, i) => (
            <div key={exp.id || i} className="preview-entry">
              <div className="preview-entry-header">
                <div>
                  <strong className="preview-entry-title">{exp.position}</strong>
                  {exp.company && (
                    <span className="preview-entry-subtitle">
                      {' '}&middot; {exp.company}
                    </span>
                  )}
                </div>
                <span className="preview-entry-date">
                  {formatDate(exp.start_date)}
                  {(exp.start_date || exp.end_date || exp.current) && ' - '}
                  {exp.current ? 'Present' : formatDate(exp.end_date)}
                </span>
              </div>
              {exp.location && <p className="preview-entry-location">{exp.location}</p>}
              {exp.description?.filter(Boolean).length > 0 && (
                <ul className="preview-bullets">
                  {exp.description.filter(Boolean).map((bullet, bi) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resumeData.education?.length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Education</h2>
          {resumeData.education.map((edu, i) => (
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
                {edu.gpa && <span> &middot; GPA: {edu.gpa}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resumeData.skills?.filter(Boolean).length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Skills</h2>
          <div className="preview-skills">
            {resumeData.skills.filter(Boolean).map((skill, i) => (
              <span key={i} className="preview-skill">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData.projects?.length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Projects</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={proj.id || i} className="preview-entry">
              <div className="preview-entry-header">
                <strong className="preview-entry-title">{proj.name}</strong>
                {proj.url && <span className="preview-entry-link">{proj.url}</span>}
              </div>
              {proj.description && <p className="preview-text">{proj.description}</p>}
              {proj.technologies && (
                <p className="preview-entry-tech">Tech: {proj.technologies}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {resumeData.certifications?.length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Certifications</h2>
          {resumeData.certifications.map((cert, i) => (
            <div key={cert.id || i} className="preview-entry preview-entry-compact">
              <strong className="preview-entry-title">{cert.name}</strong>
              <span className="preview-entry-subtitle">
                {cert.issuer && ` - ${cert.issuer}`}
                {cert.date && ` (${formatDate(cert.date)})`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {resumeData.languages?.length > 0 && (
        <div className="preview-section">
          <h2 className="preview-section-title">Languages</h2>
          <div className="preview-languages">
            {resumeData.languages.map((lang, i) => (
              <span key={i} className="preview-language">
                {lang.name} <span className="lang-level">({lang.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasName && !resumeData.summary && !resumeData.work_experience?.length && (
        <div className="preview-empty">
          <p>Start filling in your information on the left to see your resume take shape here.</p>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
