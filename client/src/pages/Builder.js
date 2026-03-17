import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/builder/ResumePreview';
import ATSScoreWidget from '../components/builder/ATSScoreWidget';
import TailorModal from '../components/builder/TailorModal';
import TranslateModal from '../components/builder/TranslateModal';
import { Download, CheckCircle, Loader, Eye, Edit3, ChevronLeft, ChevronRight, FileText, Wand2, Languages } from 'lucide-react';
import { generatePDF, generateDOCX } from '../services/api';
import toast from 'react-hot-toast';
import Spotlight from '../components/onboarding/Spotlight';
import { tours } from '../components/onboarding/tourSteps';
import './Builder.css';

const Builder = () => {
  const { id } = useParams();
  const { resumeData, loadResume, createResume, saving, loading } = useResume();
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState('edit'); // 'edit' | 'preview'
  const [tailorOpen, setTailorOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (id && id !== resumeData?.id) {
        await loadResume(id);
      } else if (!id && !resumeData?.id) {
        await createResume('modern');
      }
    };
    init();
  }, [id, loadResume, createResume, resumeData?.id]);

  const [exporting, setExporting] = useState(null); // null | 'pdf' | 'docx'

  const handleExport = async (format) => {
    if (!resumeData) {
      toast.error('No resume to export');
      return;
    }

    setExporting(format);
    try {
      const template = resumeData.template || 'modern';
      const blob = format === 'docx'
        ? await generateDOCX(resumeData, template)
        : await generatePDF(resumeData, template);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const firstName = resumeData.personal_info?.first_name || 'Resume';
      const lastName = resumeData.personal_info?.last_name || '';
      a.download = `${firstName}${lastName ? '_' + lastName : ''}_Resume.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      toast.error(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="builder-loading">
        <div className="spinner spinner-lg" />
        <span>Loading resume...</span>
      </div>
    );
  }

  return (
    <div className="builder">
      {/* Toolbar */}
      <div className="builder-toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">
            {resumeData?.personal_info?.first_name
              ? `${resumeData.personal_info.first_name}'s Resume`
              : 'New Resume'}
          </h2>
          <span className="toolbar-status">
            {saving ? (
              <><Loader size={12} className="spin" /> Saving...</>
            ) : (
              <><CheckCircle size={12} /> Saved</>
            )}
          </span>
        </div>

        <div className="toolbar-actions">
          {/* Mobile toggle */}
          <div className="toolbar-mobile-toggle">
            <button
              className={`btn btn-sm ${mobileView === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMobileView('edit')}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              className={`btn btn-sm ${mobileView === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMobileView('preview')}
            >
              <Eye size={14} /> Preview
            </button>
          </div>

          <button className="btn btn-secondary btn-sm desktop-only" onClick={() => setPreviewCollapsed(!previewCollapsed)}>
            {previewCollapsed ? <><ChevronLeft size={14} /> Show Preview</> : <><ChevronRight size={14} /> Hide Preview</>}
          </button>

          <button className="btn btn-accent btn-sm" onClick={() => setTailorOpen(true)} data-tour="builder-tailor">
            <Wand2 size={14} /> Tailor
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => setTranslateOpen(true)} data-tour="builder-translate">
            <Languages size={14} /> Translate
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('docx')} disabled={!!exporting}>
            {exporting === 'docx' ? <><Loader size={14} className="spin" /> Exporting...</> : <><FileText size={14} /> DOCX</>}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExport('pdf')} disabled={!!exporting} data-tour="builder-export">
            {exporting === 'pdf' ? <><Loader size={14} className="spin" /> Exporting...</> : <><Download size={14} /> PDF</>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`builder-layout ${previewCollapsed ? 'preview-collapsed' : ''}`}>
        <div className={`builder-form-panel ${mobileView === 'preview' ? 'mobile-hidden' : ''}`} data-tour="builder-form">
          <div data-tour="builder-ats">
            <ATSScoreWidget />
          </div>
          <ResumeForm />
        </div>

        {!previewCollapsed && (
          <div className={`builder-preview-panel ${mobileView === 'edit' ? 'mobile-hidden' : ''}`} data-tour="builder-preview">
            <div className="preview-container">
              <ResumePreview />
            </div>
          </div>
        )}
      </div>
      <TailorModal open={tailorOpen} onClose={() => setTailorOpen(false)} />
      <TranslateModal open={translateOpen} onClose={() => setTranslateOpen(false)} />
      <Spotlight tour={tours.builder} />
    </div>
  );
};

export default Builder;
