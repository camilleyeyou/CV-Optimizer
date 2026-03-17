import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getCredits } from '../services/api';
import { Check, ArrowRight, Lock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean layout with a blue accent. Great for tech and creative roles.',
    color: '#2563eb',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional layout that works for any industry. ATS-optimized.',
    color: '#374151',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant. Lets your content do the talking.',
    color: '#059669',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Stand out with a bold design. Perfect for designers and marketers.',
    color: '#d97706',
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Structured for engineers. Highlights skills and projects.',
    color: '#7c3aed',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Polished and sophisticated. Ideal for senior leadership roles.',
    color: '#1e3a5f',
  },
  // Premium templates
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined serif typography with a luxury feel. Perfect for consulting.',
    color: '#78350f',
    premium: true,
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Bold and energetic. Shows you move fast and build things.',
    color: '#db2777',
    premium: true,
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Detailed layout for research, publications, and teaching.',
    color: '#0369a1',
    premium: true,
  },
  {
    id: 'nordic',
    name: 'Nordic',
    description: 'Scandinavian-inspired clean design with soft tones.',
    color: '#64748b',
    premium: true,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-contrast design that commands attention instantly.',
    color: '#18181b',
    premium: true,
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Modern gradient accents. Stands out in creative industries.',
    color: '#7c3aed',
    premium: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Fits more content in less space. Great for experienced professionals.',
    color: '#047857',
    premium: true,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Two-column layout with a colored sidebar for key info.',
    color: '#1d4ed8',
    premium: true,
  },
  {
    id: 'infographic',
    name: 'Infographic',
    description: 'Visual skill bars and icons. Makes data pop for recruiters.',
    color: '#ea580c',
    premium: true,
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Sleek dark theme. Memorable and unique for digital roles.',
    color: '#334155',
    premium: true,
  },
];

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
                <div className="template-preview" style={{ borderTopColor: template.color }}>
                  <div className="template-mock">
                    <div className="mock-header" style={{ backgroundColor: template.color, opacity: 0.15 }} />
                    <div className="mock-name" style={{ backgroundColor: template.color }} />
                    <div className="mock-line w-50" />
                    <div className="mock-gap" />
                    <div className="mock-section-title" style={{ backgroundColor: template.color, opacity: 0.3 }} />
                    <div className="mock-line w-90" />
                    <div className="mock-line w-75" />
                    <div className="mock-line w-85" />
                    <div className="mock-gap" />
                    <div className="mock-section-title" style={{ backgroundColor: template.color, opacity: 0.3 }} />
                    <div className="mock-line w-80" />
                    <div className="mock-line w-60" />
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
