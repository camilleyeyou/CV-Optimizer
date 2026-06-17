import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getCredits } from '../services/api';
import { TEMPLATES } from '../config/templates';
import TemplateThumbnail from '../components/builder/TemplateThumbnail';
import { SAMPLE_RESUME } from '../components/builder/sampleResume';
import { ArrowRight, Lock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

const Templates = () => {
  const [creatingId, setCreatingId] = useState(null);
  const [plan, setPlan] = useState('free');
  const { createResume } = useResume();
  const navigate = useNavigate();

  useEffect(() => {
    getCredits().then((data) => setPlan(data?.plan || 'free')).catch(() => {});
  }, []);

  const isPremiumUser = plan === 'pro' || plan === 'premium';

  // A single click on a template starts building with it — no separate
  // confirm button to miss.
  const handleUse = async (template) => {
    if (creatingId) return;
    if (template.premium && !isPremiumUser) {
      toast.error('Upgrade to Pro to unlock premium templates');
      return;
    }
    setCreatingId(template.id);
    try {
      const resume = await createResume(template.id);
      if (resume?.id) {
        navigate(`/builder/${resume.id}`);
      } else {
        setCreatingId(null);
      }
    } catch (err) {
      toast.error('Failed to create resume. Please try again.');
      setCreatingId(null);
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
            const isCreating = creatingId === template.id;
            return (
              <button
                key={template.id}
                className={`template-card ${locked ? 'is-locked' : ''} ${isCreating ? 'is-creating' : ''}`}
                onClick={() => handleUse(template)}
                disabled={!!creatingId}
                aria-label={locked ? `${template.name} (Pro)` : `Use the ${template.name} template`}
              >
                {/* Real, scaled-down preview of the template */}
                <div className="template-preview" style={{ borderTopColor: template.accent }}>
                  <TemplateThumbnail templateId={template.id} data={SAMPLE_RESUME} height={230} />

                  {!locked && (
                    <div className="template-use-overlay">
                      {isCreating ? (
                        <span className="spinner" />
                      ) : (
                        <span className="template-use-pill">
                          Use this template <ArrowRight size={15} />
                        </span>
                      )}
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
          <p className="templates-hint">
            Click any template to start building — you can switch anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Templates;
