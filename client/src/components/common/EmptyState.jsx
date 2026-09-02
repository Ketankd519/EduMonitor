export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {actionLabel && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
