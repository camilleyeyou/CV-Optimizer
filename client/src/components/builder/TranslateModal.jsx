import { useState } from 'react';
import { Languages, Loader, X, Check } from 'lucide-react';
import { translateResume } from '../../services/api';
import { useResume } from '../../context/ResumeContext';
import toast from 'react-hot-toast';
import './TranslateModal.css';

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean',
  'Arabic', 'Hindi', 'Turkish', 'Russian', 'Ukrainian',
  'Vietnamese', 'Thai', 'Indonesian', 'Malay',
];

const TranslateModal = ({ open, onClose }) => {
  const { resumeData, updateResume } = useResume();
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTranslate = async () => {
    if (!language) {
      toast.error('Select a target language');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await translateResume(resumeData, language);
      setResult(data);
    } catch {
      toast.error('Failed to translate resume');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;

    const updates = {};

    if (result.summary) updates.summary = result.summary;

    if (result.skills?.length) updates.skills = result.skills;

    if (result.work_experience?.length) {
      const currentExp = [...(resumeData.work_experience || [])];
      result.work_experience.forEach((te, i) => {
        if (currentExp[i]) {
          if (te.position) currentExp[i] = { ...currentExp[i], position: te.position };
          if (te.description) currentExp[i] = { ...currentExp[i], description: Array.isArray(te.description) ? te.description : currentExp[i].description };
        }
      });
      updates.work_experience = currentExp;
    }

    if (result.education?.length) {
      const currentEdu = [...(resumeData.education || [])];
      result.education.forEach((te, i) => {
        if (currentEdu[i]) {
          if (te.degree) currentEdu[i] = { ...currentEdu[i], degree: te.degree };
          if (te.field_of_study) currentEdu[i] = { ...currentEdu[i], field_of_study: te.field_of_study };
        }
      });
      updates.education = currentEdu;
    }

    if (Object.keys(updates).length > 0) {
      updateResume(updates);
      toast.success(`Resume translated to ${language}`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="translate-overlay" onClick={onClose}>
      <div className="translate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="translate-header">
          <div className="translate-header-title">
            <Languages size={18} />
            <span>Translate Resume</span>
          </div>
          <button className="tailor-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!result && !loading && (
          <div className="translate-body">
            <p className="translate-desc">
              Translate your resume content to another language. Company names, school names, and certifications will be kept as-is.
            </p>

            <div className="translate-field">
              <label>Target Language</label>
              <select
                className="form-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Select language...</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary translate-btn"
              onClick={handleTranslate}
              disabled={!language}
            >
              <Languages size={16} /> Translate to {language || '...'}
            </button>
          </div>
        )}

        {loading && (
          <div className="translate-loading">
            <Loader size={28} className="spin" />
            <p>Translating to {language}...</p>
          </div>
        )}

        {result && !loading && (
          <div className="translate-result">
            <div className="translate-preview">
              <h4>Preview — {language}</h4>

              {result.summary && (
                <div className="translate-preview-section">
                  <span className="translate-preview-label">Summary</span>
                  <p>{result.summary}</p>
                </div>
              )}

              {result.skills?.length > 0 && (
                <div className="translate-preview-section">
                  <span className="translate-preview-label">Skills</span>
                  <div className="translate-preview-tags">
                    {result.skills.slice(0, 10).map((s, i) => (
                      <span key={i} className="translate-tag">{s}</span>
                    ))}
                    {result.skills.length > 10 && <span className="translate-tag more">+{result.skills.length - 10}</span>}
                  </div>
                </div>
              )}

              {result.work_experience?.length > 0 && (
                <div className="translate-preview-section">
                  <span className="translate-preview-label">Experience</span>
                  {result.work_experience.map((exp, i) => (
                    <div key={i} className="translate-preview-exp">
                      <strong>{exp.position}</strong>
                      {exp.description?.slice(0, 2).map((d, j) => (
                        <p key={j}>- {d}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="translate-footer">
              <button className="btn btn-ghost" onClick={() => setResult(null)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleApply}>
                <Check size={14} /> Apply Translation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslateModal;
