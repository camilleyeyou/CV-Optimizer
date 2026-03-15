import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { Check, ArrowRight } from 'lucide-react';
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
];

const Templates = () => {
  const [selected, setSelected] = useState('modern');
  const [creating, setCreating] = useState(false);
  const { createResume } = useResume();
  const navigate = useNavigate();

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

        <div className="templates-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={`template-card ${selected === template.id ? 'is-selected' : ''}`}
              onClick={() => setSelected(template.id)}
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

                {selected === template.id && (
                  <div className="template-check">
                    <Check size={16} />
                  </div>
                )}
              </div>

              <div className="template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
            </button>
          ))}
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
