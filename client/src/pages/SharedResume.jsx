import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader, FileText } from 'lucide-react';
import api from '../services/api';
import './SharedResume.css';

const SharedResume = () => {
  const { token } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await api.get(`/api/share/${token}`);
        setResume(res.data.resume);
      } catch (err) {
        setError(err.response?.data?.error || 'This share link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [token]);

  if (loading) {
    return (
      <div className="shared-resume-loading">
        <Loader size={24} className="spin" />
        <span>Loading resume...</span>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="shared-resume-error">
        <h2>Resume not found</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
          Go to CV Optimizer
        </Link>
      </div>
    );
  }

  const p = resume.personal_info || {};
  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);

  const formatDateRange = (start, end, current) => {
    const fmt = (d) => {
      if (!d) return '';
      const [year, month] = d.split('-');
      if (!month) return year;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    };
    const s = fmt(start);
    const e = current ? 'Present' : fmt(end);
    if (s && e) return `${s} - ${e}`;
    return s || e || '';
  };

  return (
    <div className="shared-resume">
      <Helmet>
        <title>{name ? `${name} - Resume` : 'Shared Resume'} | CV Optimizer</title>
      </Helmet>

      <div className="shared-resume-card">
        {/* Header */}
        <div className="shared-resume-header">
          {name && <h1 className="shared-resume-name">{name}</h1>}
          {p.job_title && <p className="shared-resume-title">{p.job_title}</p>}
          {contacts.length > 0 && (
            <p className="shared-resume-contact">{contacts.join('  |  ')}</p>
          )}
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="shared-resume-section">
            <h3>Professional Summary</h3>
            <p>{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.work_experience?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Experience</h3>
            {resume.work_experience.map((exp, i) => (
              <div key={i} className="shared-resume-entry">
                <div className="shared-resume-entry-title">
                  {exp.position}{exp.company ? ` at ${exp.company}` : ''}
                </div>
                <div className="shared-resume-entry-sub">
                  {[formatDateRange(exp.start_date, exp.end_date, exp.current), exp.location].filter(Boolean).join(' | ')}
                </div>
                {exp.description?.length > 0 && (
                  <ul>
                    {exp.description.filter(Boolean).map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Education</h3>
            {resume.education.map((edu, i) => (
              <div key={i} className="shared-resume-entry">
                <div className="shared-resume-entry-title">
                  {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ')}
                </div>
                <div className="shared-resume-entry-sub">
                  {[edu.institution, formatDateRange(edu.start_date, edu.end_date), edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' | ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resume.skills?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Skills</h3>
            <div className="shared-resume-skills">
              {resume.skills.filter(Boolean).map((s) => (
                <span key={s} className="badge badge-primary">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Projects</h3>
            {resume.projects.map((proj, i) => (
              <div key={i} className="shared-resume-entry">
                <div className="shared-resume-entry-title">{proj.name}</div>
                {proj.description && <p style={{ marginTop: '0.25rem' }}>{proj.description}</p>}
                {proj.technologies && (
                  <div className="shared-resume-entry-sub">Technologies: {proj.technologies}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {resume.certifications?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Certifications</h3>
            {resume.certifications.map((cert, i) => (
              <div key={i} className="shared-resume-entry">
                <div className="shared-resume-entry-title">
                  {cert.name}{cert.issuer ? ` - ${cert.issuer}` : ''}
                </div>
                {cert.date && <div className="shared-resume-entry-sub">{cert.date}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {resume.languages?.length > 0 && (
          <div className="shared-resume-section">
            <h3>Languages</h3>
            <p>{resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(', ')}</p>
          </div>
        )}
      </div>

      <div className="shared-resume-watermark">
        <FileText size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
        Built with <Link to="/">CV Optimizer</Link>
      </div>
    </div>
  );
};

export default SharedResume;
