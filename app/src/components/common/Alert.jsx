export const Alert = ({ tone = 'info', title, message }) => {
  const toneClass = tone === 'danger' ? 'alert danger' : 'alert';
  return (
    <div className={toneClass} role="status">
      {title ? <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong> : null}
      <span>{message}</span>
    </div>
  );
};
