export default function Button({ children, loading, variant = 'primary', ...props }) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
