export const StatCard = ({ label, value, trend }) => (
  <div className="stat-card">
    <span className="label">{label}</span>
    <span className="value">{value}</span>
    {trend ? <span className="trend">{trend}</span> : null}
  </div>
);
