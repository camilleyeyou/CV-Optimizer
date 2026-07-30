import { useState } from 'react';
import { Languages, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { translateResume } from '../../services/api';
import { useResume } from '../../context/ResumeContext';
import { usePlan } from '../../hooks/usePlan';
import Modal from '../ui/Modal';
import UpgradeNotice from '../ui/UpgradeNotice';
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
  const { isPro, loading: planLoading } = usePlan();
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTranslate = async () => {
    if (!language) {
      toast.error('Select a target language.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await translateResume(resumeData, language);
      setResult(data);
    } catch (err) {
      // The server's own message is more useful than a generic one — it names
      // the plan requirement or the credit limit.
      toast.error(err.response?.data?.error || 'Failed to translate this resume.');
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
          if (te.description) {
            currentExp[i] = {
              ...currentExp[i],
              description: Array.isArray(te.description) ? te.description : currentExp[i].description,
            };
          }
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
      toast.success(`Resume translated to ${language}.`);
      onClose();
    }
  };

  const close = () => {
    onClose();
    // Reset only after the dialog is gone, so the content does not visibly
    // change while it animates out.
    setTimeout(() => { setResult(null); setLanguage(''); }, 200);
  };

  /* Translation is Pro-only — requirePlan(['pro','premium']) guards
     /api/ai/translate-resume. Previously a free user could pick a language,
     wait through a spinner and get "Failed to translate resume" from a 403. */
  const locked = !planLoading && !isPro;

  return (
    <Modal
      open={open}
      onClose={close}
      title={locked ? 'Translate is part of Pro' : 'Translate this resume'}
      description={
        locked
          ? undefined
          : 'Company names, schools and certifications are left as they are. You review the result before anything is applied.'
      }
      size={result ? 'lg' : 'md'}
      footer={
        result && !loading ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setResult(null)}>
              <ArrowLeft size={14} aria-hidden="true" /> Choose another language
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply}>
              <Check size={14} aria-hidden="true" /> Apply translation
            </button>
          </>
        ) : undefined
      }
    >
      {locked && (
        <UpgradeNotice
          title="Apply for jobs in another language"
          description="Translate rewrites your summary, role titles and bullets into 23 languages, keeping names and dates intact."
          bullets={[
            'Resume translation into 23 languages',
            'Unlimited AI credits',
            'Every template, including the premium set',
          ]}
          onDismiss={close}
        />
      )}

      {!locked && !result && !loading && (
        <div className="tr-body">
          <div className="form-group">
            <label className="form-label" htmlFor="translate-language">Target language</label>
            <select
              id="translate-language"
              className="form-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">Select a language…</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleTranslate}
            disabled={!language}
          >
            <Languages size={15} aria-hidden="true" />
            {language ? `Translate to ${language}` : 'Translate'}
          </button>
        </div>
      )}

      {loading && (
        <div className="tr-loading" role="status">
          <span className="spinner spinner-lg" />
          <p>Translating to {language}…</p>
          <p className="tr-loading-hint">This usually takes under a minute.</p>
        </div>
      )}

      {result && !loading && (
        <div className="tr-result">
          <p className="tr-result-lead">
            Review the {language} version below. Nothing changes until you apply it.
          </p>

          {result.summary && (
            <section className="tr-section">
              <h4 className="tr-section-title">Summary</h4>
              <p>{result.summary}</p>
            </section>
          )}

          {result.skills?.length > 0 && (
            <section className="tr-section">
              <h4 className="tr-section-title">Skills</h4>
              <div className="tr-tags">
                {result.skills.slice(0, 10).map((s) => (
                  <span key={s} className="badge">{s}</span>
                ))}
                {result.skills.length > 10 && (
                  <span className="badge">+{result.skills.length - 10} more</span>
                )}
              </div>
            </section>
          )}

          {result.work_experience?.length > 0 && (
            <section className="tr-section">
              <h4 className="tr-section-title">Experience</h4>
              {result.work_experience.map((exp, i) => (
                <div key={`${exp.position}-${i}`} className="tr-exp">
                  <strong>{exp.position}</strong>
                  <ul>
                    {(Array.isArray(exp.description) ? exp.description : [])
                      .slice(0, 2)
                      .map((d, j) => <li key={`${i}-${j}`}>{d}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TranslateModal;
