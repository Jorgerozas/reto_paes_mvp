import { useState, useEffect, useRef } from 'react';

const SUBJECT_NAMES = {
  M1:      'Matemática M1',
  M2:      'Matemática M2',
  Lectora: 'Competencia Lectora',
  Ciencias:'Ciencias',
  Historia:'Historia y Cs. Sociales',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuestionModal({ subject, question, preguntasHoy, onAnswer, onNext, onClose }) {
  const [selected, setSelected]   = useState(null);
  const [answered, setAnswered]   = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flash, setFlash]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const updatedRef = useRef(null);
  const timerRef = useRef(null);

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setFlash(false);
    setElapsed(0);
  }, [question?.id]);

  // Timer: counts up every second until the student answers
  useEffect(() => {
    if (!question || answered) {
      clearInterval(timerRef.current);
      return;
    }
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [question?.id, answered]);

  useEffect(() => {
    if (window.MathJax && question) {
      window.MathJax.typesetPromise().catch(() => {});
    }
  }, [question, answered]);

  const handleSelect = async (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    const correct = idx === question.indice_correcto;
    setIsCorrect(correct);

    if (correct) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }

    const updated = await onAnswer(correct);
    updatedRef.current = updated;
  };

  const handleNext = async () => {
    setLoading(true);
    await onNext(updatedRef.current);
    setLoading(false);
  };

  // Progress dots: shows position in the 3-question sequence
  const questionNumber = (preguntasHoy || 0) + 1;  // 1, 2, or 3
  const dots = [1, 2, 3].map(n => {
    if (n < questionNumber)        return 'done';
    if (n === questionNumber)      return 'active';
    return '';
  });

  const llegaALaMeta = (preguntasHoy || 0) === 3;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getOptionClass = (idx) => {
    if (!answered) return 'option-btn';
    if (idx === question.indice_correcto) return 'option-btn correct';
    if (idx === selected)                 return 'option-btn wrong' + (selected !== question.indice_correcto ? ' shake' : '');
    return 'option-btn';
  };

  return (
    <div className="overlay-modal">
      <div className={`question-card${flash ? ' flash-green' : ''}`}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3>{SUBJECT_NAMES[subject]}</h3>
            <div className="question-progress">
              {dots.map((state, i) => (
                <div key={i} className={`progress-dot${state ? ` ${state}` : ''}`} />
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 600 }}>
                {Math.min(questionNumber, 3)}/3
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`question-timer${answered ? ' timer-stopped' : ''}`}>
              ⏱ {formatTime(elapsed)}
            </span>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="question-text">{question.texto}</p>

          <div className="options-container">
            {question.opciones.map((opt, idx) => (
              <button
                key={idx}
                className={getOptionClass(idx)}
                onClick={() => handleSelect(idx)}
                disabled={answered}
              >
                <span className="option-letter">{LETTERS[idx]}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {answered && (
            <div className="feedback-box">
              <div className={`feedback-header ${isCorrect ? 'correct-bg' : 'wrong-bg'}`}>
                <span className="feedback-icon">{isCorrect ? '✅' : '❌'}</span>
                <span className={`feedback-title ${isCorrect ? 'correct-text' : 'wrong-text'}`}>
                  {isCorrect ? '¡Correcto! Sigue así 🔥' : 'No fue esta vez 😢'}
                </span>
              </div>
              <div className="feedback-body">
                <p className="feedback-explanation">{question.explicacion}</p>
                <button
                  className="btn-primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {loading
                    ? 'Cargando...'
                    : llegaALaMeta
                    ? '¡Materia Completada! 🏆'
                    : 'Siguiente pregunta →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
