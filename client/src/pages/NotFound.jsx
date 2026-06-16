import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
    <Helmet>
      <title>Page not found — CV Optimizer</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <FileQuestion size={56} style={{ color: 'var(--primary)' }} aria-hidden="true" />
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
