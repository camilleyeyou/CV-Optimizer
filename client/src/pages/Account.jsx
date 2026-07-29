import { useState } from 'react';
import Seo from '../components/common/Seo';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Loader, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { exportMyData, deleteMyAccount } from '../services/api';
import './Account.css';

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportMyData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv-optimizer-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Your data has been downloaded.');
    } catch {
      toast.error('Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success('Your account and data have been deleted.');
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="account-page">
      <Seo
        title="Account & Data — CV Optimizer"
        description="Manage your CV Optimizer account, billing, and data."
        noindex
      />

      <h1>Account &amp; Data</h1>
      <p className="account-email">{user?.email}</p>

      <section className="card account-section">
        <h2>Export your data</h2>
        <p>
          Download a copy of everything we hold about you — your profile, resumes,
          job applications, and ATS scores — as a JSON file.
        </p>
        <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? <><Loader size={16} className="spin" /> Preparing…</> : <><Download size={16} /> Download my data</>}
        </button>
      </section>

      <section className="card account-section account-danger">
        <h2><ShieldAlert size={18} /> Delete account</h2>
        <p>
          Permanently delete your account and all associated data — resumes, applications,
          scores, and share links. Any active subscription will be cancelled. <strong>This
          cannot be undone.</strong>
        </p>
        <label className="form-label" htmlFor="confirm-delete">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          id="confirm-delete"
          className="form-input account-confirm-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
        >
          {deleting ? <><Loader size={16} className="spin" /> Deleting…</> : <><Trash2 size={16} /> Delete my account</>}
        </button>
      </section>
    </div>
  );
};

export default Account;
