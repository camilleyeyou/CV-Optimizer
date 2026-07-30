import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download, Check, Loader, Eye, Edit3, PanelRightClose, PanelRightOpen,
  FileText, Wand2, Languages, LayoutTemplate, AlertTriangle, ArrowLeft, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResume } from '../context/ResumeContext';
import { usePlan } from '../hooks/usePlan';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/builder/ResumePreview';
import ATSScoreWidget from '../components/builder/ATSScoreWidget';
import TailorModal from '../components/builder/TailorModal';
import TranslateModal from '../components/builder/TranslateModal';
import TemplateSwitcher from '../components/builder/TemplateSwitcher';
import { generatePDF, generateDOCX } from '../services/api';
import Spotlight from '../components/onboarding/Spotlight';
import { tours } from '../components/onboarding/tourSteps';
import './Builder.css';

/**
 * Autosave state, said accurately.
 *
 * The previous badge rendered a green "Saved" whenever a write was not in
 * flight — including immediately after one had failed. In an editor holding
 * someone's career history that is the single worst thing to be wrong about,
 * so a failure is now sticky and offers a retry.
 */
const SaveState = ({ status, savedAt, onRetry }) => {
  if (status === 'saving') {
    return (
      <span className="bd-save" data-state="saving">
        <Loader size={12} className="spin" aria-hidden="true" /> Saving…
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="bd-save" data-state="error" role="status">
        <AlertTriangle size={12} aria-hidden="true" /> Not saved
        <button type="button" className="bd-save-retry" onClick={onRetry}>Retry</button>
      </span>
    );
  }

  if (status === 'saved') {
    const at = new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (
      <span className="bd-save" data-state="saved" role="status">
        <Check size={12} aria-hidden="true" /> Saved <span className="bd-save-time">{at}</span>
      </span>
    );
  }

  // Nothing has been written this session. Saying "Saved" here would be a
  // guess; saying nothing is honest and quiet.
  return <span className="bd-save" data-state="idle">Autosaves as you type</span>;
};

const Builder = () => {
  const { id } = useParams();
  const {
    resumeData, loadResume, createResume, saveResume, saveStatus, savedAt, loading,
  } = useResume();
  const { isPro, loading: planLoading } = usePlan();
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState('edit'); // 'edit' | 'preview'
  const [tailorOpen, setTailorOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [exporting, setExporting] = useState(null); // null | 'pdf' | 'docx'

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoadError(false);
      try {
        if (id && id !== resumeData?.id) {
          await loadResume(id);
        } else if (!id && !resumeData?.id) {
          await createResume('modern');
        }
      } catch {
        // Don't fall through to a blank/stale editor on a failed load — that
        // could autosave over the wrong resume. Show an error state instead.
        if (!cancelled) setLoadError(true);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [id, loadResume, createResume, resumeData?.id]);

  const handleExport = async (format) => {
    if (!resumeData) {
      toast.error('No resume to export.');
      return;
    }

    setExporting(format);
    try {
      const template = resumeData.template || 'modern';
      const blob = format === 'docx'
        ? await generateDOCX(resumeData, template)
        : await generatePDF(resumeData, template);
      const url = window.URL.createObjectURL(blob);
      const firstName = resumeData.personal_info?.first_name || 'Resume';
      const lastName = resumeData.personal_info?.last_name || '';
      const filename = `${firstName}${lastName ? `_${lastName}` : ''}_Resume.${format}`;

      // iOS Safari ignores the anchor `download` attribute for blob URLs, so a
      // normal "download" silently does nothing. Open the file instead so the
      // user can save/share it through the native viewer.
      const isIOS =
        /iP(hone|ad|od)/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        const win = window.open(url, '_blank');
        if (!win) window.location.href = url; // popup blocked — last resort
        toast.success(`${format.toUpperCase()} ready — tap share to save`);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`${format.toUpperCase()} downloaded`);
      }

      // Revoke after a delay — revoking immediately can abort the transfer on
      // some mobile browsers that read the blob asynchronously.
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      toast.error(err.serverError || `Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <span>Loading your resume…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="empty-state bd-error">
        <span className="empty-state-icon">
          <FileText size={22} aria-hidden="true" />
        </span>
        <h1 className="empty-state-title">This resume could not be opened</h1>
        <p className="empty-state-description">
          It may have been deleted, or belong to another account. Your other
          resumes are untouched.
        </p>
        <div className="empty-state-actions">
          <Link to="/dashboard" className="btn btn-primary btn-lg">Back to your resumes</Link>
        </div>
      </div>
    );
  }

  const title = resumeData?.title
    || (resumeData?.personal_info?.first_name
      ? `${resumeData.personal_info.first_name}'s resume`
      : 'Untitled resume');

  // Translation is Pro-only (requirePlan on /api/ai/translate-resume). Show the
  // lock up front rather than letting the request go out and 403.
  const translateLocked = !planLoading && !isPro;

  return (
    <div className="bd">
      <div className="bd-bar">
        <div className="bd-bar-main">
          <Link to="/dashboard" className="bd-back" aria-label="Back to your resumes">
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <div className="bd-titles">
            <h1 className="bd-title">{title}</h1>
            <SaveState
              status={saveStatus}
              savedAt={savedAt}
              onRetry={() => saveResume(resumeData)}
            />
          </div>
        </div>

        <div className="bd-bar-actions">
          {/* Edit / preview switch — phone only, where the panes cannot sit
              side by side. */}
          <div className="segmented bd-switch" role="tablist" aria-label="Builder view">
            <button
              type="button"
              role="tab"
              className="segmented-item"
              aria-selected={mobileView === 'edit'}
              onClick={() => setMobileView('edit')}
            >
              <Edit3 size={14} aria-hidden="true" /> Edit
            </button>
            <button
              type="button"
              role="tab"
              className="segmented-item"
              aria-selected={mobileView === 'preview'}
              onClick={() => setMobileView('preview')}
            >
              <Eye size={14} aria-hidden="true" /> Preview
            </button>
          </div>

          <div className="bd-tools">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTemplateOpen(true)}
              data-tour="builder-template"
            >
              <LayoutTemplate size={14} aria-hidden="true" />
              <span className="bd-label">Template</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTailorOpen(true)}
              data-tour="builder-tailor"
            >
              <Wand2 size={14} aria-hidden="true" />
              <span className="bd-label">Tailor</span>
            </button>

            {/* Never a dead button: locked, it still opens — the modal explains
                what Pro unlocks instead of firing a request that will 403. */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTranslateOpen(true)}
              data-tour="builder-translate"
              data-locked={translateLocked || undefined}
            >
              {translateLocked
                ? <Lock size={14} aria-hidden="true" />
                : <Languages size={14} aria-hidden="true" />}
              <span className="bd-label">Translate</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm bd-panel-toggle"
            onClick={() => setPreviewCollapsed((c) => !c)}
            aria-pressed={previewCollapsed}
            title={previewCollapsed ? 'Show preview' : 'Hide preview'}
          >
            {previewCollapsed
              ? <PanelRightOpen size={16} aria-hidden="true" />
              : <PanelRightClose size={16} aria-hidden="true" />}
            <span className="sr-only">{previewCollapsed ? 'Show preview' : 'Hide preview'}</span>
          </button>

          <div className="bd-exports">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('docx')}
              disabled={!!exporting}
              data-loading={exporting === 'docx' || undefined}
            >
              <FileText size={14} aria-hidden="true" />
              <span className="bd-label">DOCX</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              data-loading={exporting === 'pdf' || undefined}
              data-tour="builder-export"
            >
              <Download size={14} aria-hidden="true" />
              <span className="bd-label">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`bd-panes${previewCollapsed ? ' is-collapsed' : ''}`} data-view={mobileView}>
        <div className="bd-pane bd-pane-edit" data-tour="builder-form">
          <div className="bd-pane-inner">
            <div data-tour="builder-ats">
              <ATSScoreWidget />
            </div>
            <ResumeForm />
          </div>
        </div>

        {!previewCollapsed && (
          /* tabIndex: a scrollable region must be reachable by keyboard, or the
             only way to scroll the preview is a pointer. */
          <div
            className="bd-pane bd-pane-preview"
            data-tour="builder-preview"
            tabIndex={0}
            role="region"
            aria-label="Resume preview"
          >
            <div className="bd-preview-scroll">
              {/* nameTag: the page heading is the resume's title. The preview
                  renders the candidate name, which as an <h1> would give the
                  page two — and one per paginated page after that. */}
              <ResumePreview nameTag="div" />
            </div>
          </div>
        )}
      </div>

      <TailorModal open={tailorOpen} onClose={() => setTailorOpen(false)} />
      <TranslateModal open={translateOpen} onClose={() => setTranslateOpen(false)} />
      <TemplateSwitcher open={templateOpen} onClose={() => setTemplateOpen(false)} />
      <Spotlight tour={tours.builder} />
    </div>
  );
};

export default Builder;
