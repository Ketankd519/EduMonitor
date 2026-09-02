export default function FormInput({ label, error, ...inputProps }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className={`form-input ${error ? 'form-input-error' : ''}`} {...inputProps} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
