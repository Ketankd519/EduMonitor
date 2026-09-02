export default function ClassPicker({ classes, selectedId, onSelect }) {
  return (
    <div className="form-field" style={{ maxWidth: 320 }}>
      <label className="form-label">Select Class</label>
      <select
        className="form-input"
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Choose a class...
        </option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.subjectCode} — {c.subjectTitle} (Sec {c.section})
          </option>
        ))}
      </select>
    </div>
  );
}
