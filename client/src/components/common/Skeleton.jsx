import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, className = '', count = 1 }) => {
  const style = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: borderRadius || 'var(--radius-sm)',
  };

  if (count === 1) {
    return <div className={`skeleton ${className}`} style={style} />;
  }

  return (
    <div className="skeleton-group">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} style={style} />
      ))}
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton height="8rem" borderRadius="var(--radius-lg)" />
    <div className="skeleton-card-body">
      <Skeleton width="60%" height="1.2rem" />
      <Skeleton width="90%" height="0.8rem" />
      <Skeleton width="40%" height="0.8rem" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="skeleton-row">
    <Skeleton width="2.5rem" height="2.5rem" borderRadius="var(--radius-full)" />
    <div className="skeleton-row-text">
      <Skeleton width="50%" height="0.9rem" />
      <Skeleton width="80%" height="0.75rem" />
    </div>
  </div>
);

export default Skeleton;
