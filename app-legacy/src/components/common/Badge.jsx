export const Badge = ({ children, tone = 'default' }) => {
  const toneClass = tone === 'neutral' ? 'badge neutral' : tone === 'success' ? 'badge success' : tone === 'danger' ? 'badge danger' : 'badge';
  return <span className={toneClass}>{children}</span>;
};
