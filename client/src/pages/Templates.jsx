import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getCredits } from '../services/api';
import { TEMPLATES } from '../config/templates';
import { Check, ArrowRight, Lock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

const Templates = () => {
  const [selected, setSelected] = useState('modern');
  const [creating, setCreating] = useState(false);
  const [plan, setPlan] = useState('free');
  const { createResume } = useResume();
  const navigate = useNavigate();

  useEffect(() => {
    getCredits().then((data) => setPlan(data?.plan || 'free')).catch(() => {});
  }, []);

  const isPremiumUser = plan === 'pro' || plan === 'premium';

  const handleSelect = (template) => {
    if (template.premium && !isPremiumUser) {
      toast.error('Upgrade to Pro to unlock premium templates');
      return;
    }
    setSelected(template.id);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const resume = await createResume(selected);
      if (resume?.id) {
        navigate(`/builder/${resume.id}`);
      }
    } catch (err) {
      toast.error('Failed to create resume. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="templates-page">
      <div className="templates-container">
        <div className="templates-header">
          <h1>Choose a template</h1>
          <p>Pick a design that fits your style. You can always change it later.</p>
        </div>

        <div className="templates-grid animate-stagger">
          {TEMPLATES.map((template) => {
            const locked = template.premium && !isPremiumUser;
            return (
              <button
                key={template.id}
                className={`template-card ${selected === template.id ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}`}
                onClick={() => handleSelect(template)}
              >
                {/* Mini preview */}
                <div className="template-preview" style={{ borderTopColor: template.accent }}>
                  <div className={`template-mock mock-${template.archetype}`}>
                    {template.archetype === 'sidebar' ? (
                      <div className="mock-cols">
                        <div className="mock-sidebar" style={{ backgroundColor: template.sidebarBg || template.accent }} />
                        <div className="mock-main">
                          <div className="mock-name" style={{ backgroundColor: template.accent }} />
                          <div className="mock-line w-75" />
                          <div className="mock-gap" />
                          <div className="mock-section-title" style={{ backgroundColor: template.accent, opacity: 0.3 }} />
                          <div className="mock-line w-90" />
                          <div className="mock-line w-80" />
                        </div>
                      </div>
                    ) : (
                      <>
                        {template.archetype === 'header-band' && (
                          <div className="mock-band" style={{ backgroundColor: template.accent }} />
                        )}
                        <div className="mock-name" style={{ backgroundColor: template.accent }} />
                        <div className="mock-line w-50" />
                        <div className="mock-gap" />
                        <div className="mock-section-title" style={{ backgroundColor: template.accent, opacity: 0.3 }} />
                        <div className="mock-line w-90" />
                        <div className="mock-line w-75" />
                        <div className="mock-line w-85" />
                        <div className="mock-gap" />
                        <div className="mock-section-title" style={{ backgroundColor: template.accent, opacity: 0.3 }} />
                        <div className="mock-line w-80" />
                        <div className="mock-line w-60" />
                      </>
                    )}
                  </div>

                  {selected === template.id && !locked && (
                    <div className="template-check">
                      <Check size={16} />
                    </div>
                  )}

                  {locked && (
                    <div className="template-lock-overlay">
                      <Lock size={20} />
                      <span>Pro</span>
                    </div>
                  )}
                </div>

                <div className="template-info">
                  <h3>
                    {template.name}
                    {template.premium && <Crown size={12} className="template-crown" />}
                  </h3>
                  <p>{template.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="templates-action">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <span className="spinner" />
            ) : (
              <>
                Use this template
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Templates;
