import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-16) var(--space-6)',
    }}
  >
    <Seo
      title="Page not found — CV Optimizer"
      description="The page you were looking for doesn't exist."
      noindex
    />
    <FileQuestion size={56} style={{ color: 'var(--accent-fg)' }} aria-hidden="true" />
    <h1 style={{ fontSize: '2rem' }}>Page not found</h1>
    <p style={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
      The page you&apos;re looking for doesn&apos;t exist or may have moved.
    </p>
    <Link to="/" className="btn btn-primary btn-lg">
      <ArrowLeft size={16} /> Back to home
    </Link>
  </div>
);

export default NotFound;
