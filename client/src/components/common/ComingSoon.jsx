export default function ComingSoon({ title, phase, message }) {
  return (
    <div>
      <h1 className="dashboard-welcome">{title}</h1>
      <div className="empty-state">
        <p className="empty-state-message">
          {message || `This feature is built in ${phase} of the project roadmap — it isn't implemented yet.`}
        </p>
      </div>
    </div>
  );
}
