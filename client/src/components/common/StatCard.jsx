export default function StatCard({ label, value, muted }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-value${muted ? ' muted' : ''}`}>{value}</div>
    </div>
  );
}
