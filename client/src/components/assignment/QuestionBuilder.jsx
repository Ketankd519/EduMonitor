const emptyQuestion = () => ({
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  marks: 1,
});

export default function QuestionBuilder({ questions, onChange }) {
  const updateQuestion = (index, field, value) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addQuestion = () => onChange([...questions, emptyQuestion()]);

  const removeQuestion = (index) => onChange(questions.filter((_, i) => i !== index));

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div>
      {questions.map((q, i) => (
        <div className="question-block" key={i}>
          <div className="question-block-header">
            <span className="question-block-title">Question {i + 1}</span>
            {questions.length > 1 && (
              <button
                type="button"
                className="question-remove-btn"
                onClick={() => removeQuestion(i)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="form-field">
            <input
              className="form-input"
              placeholder="Question text"
              value={q.questionText}
              onChange={(e) => updateQuestion(i, 'questionText', e.target.value)}
            />
          </div>

          {['A', 'B', 'C', 'D'].map((letter) => (
            <div className="option-row" key={letter}>
              <input
                type="radio"
                name={`correct-${i}`}
                checked={q.correctAnswer === letter}
                onChange={() => updateQuestion(i, 'correctAnswer', letter)}
                title={`Mark option ${letter} as correct`}
              />
              <input
                className="form-input"
                placeholder={`Option ${letter}`}
                value={q[`option${letter}`]}
                onChange={(e) => updateQuestion(i, `option${letter}`, e.target.value)}
              />
            </div>
          ))}

          <div className="marks-input-row">
            <label>Marks</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={q.marks}
              onChange={(e) => updateQuestion(i, 'marks', Number(e.target.value))}
            />
          </div>
        </div>
      ))}

      <button type="button" className="add-question-btn" onClick={addQuestion}>
        + Add Question
      </button>

      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
        Total Marks: <strong>{totalMarks}</strong> (calculated automatically from question marks)
      </p>
    </div>
  );
}

export { emptyQuestion };
