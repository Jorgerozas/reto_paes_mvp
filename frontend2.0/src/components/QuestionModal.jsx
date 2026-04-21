import { useState, useEffect, useRef, useCallback } from 'react';

const SUBJECT_NAMES = {
  M1:      'Matematica M1',
  M2:      'Matematica M2',
  Lectora: 'Competencia Lectora',
  Ciencias:'Ciencias',
  Historia:'Historia y Cs. Sociales',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const ENCOURAGEMENTS = [
  'Vas muy bien! Sigue asi 🔥',
  'Excelente! Eres imparable 💪',
  'Crack! Otro acierto mas 🎯',
  'Genial! Tu esfuerzo se nota ✨',
  'Increible! Sigue sumando 🚀',
];

const MOTIVATIONS = [
  'No te preocupes, aprender del error es clave 💪',
  'Tranquilo, la proxima sera! 🎯',
  'Cada error es una leccion. Sigue! 📚',
  'Asi se aprende, no te rindas 🔥',
];

export default function QuestionModal({ subject, question, preguntasHoy, isPremium, onAnswer, onNext, onClose }) {
  const [selected, setSelected]       = useState(null);
  const [answered, setAnswered]       = useState(false);
  const [isCorrect, setIsCorrect]     = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [flash, setFlash]             = useState(false);
  const [loading, setLoading]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const updatedRef = useRef(null);
  const timerRef = useRef(null);

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setFeedbackMsg('');
    setFlash(false);
    setElapsed(0);
  }, [question?.id]);

  // Timer
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

  const handleSelect = useCallback(async (idx) => {
    if (answered || idx >= question.opciones.length) return;
    setSelected(idx);
    setAnswered(true);

    const correct = idx === question.indice_correcto;
    setIsCorrect(correct);
    setFeedbackMsg(
      correct
        ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
        : MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]
    );

    if (correct) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }

    const updated = await onAnswer(correct);
    updatedRef.current = updated;
  }, [answered, question, onAnswer]);

  // Keyboard shortcuts: A-E to select, Enter for next
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      const idx = LETTERS.indexOf(key);

      if (!answered && idx !== -1 && idx < (question?.opciones?.length || 0)) {
        e.preventDefault();
        handleSelect(idx);
      }

      if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (!loading) handleNext();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answered, loading, question, handleSelect, onClose]);

  const handleNext = async () => {
    setLoading(true);
    await onNext(updatedRef.current);
    setLoading(false);
  };

  const questionNumber = (preguntasHoy || 0) + 1;
  const maxQuestions = isPremium ? Math.max(questionNumber, 3) : 3;
  const dots = Array.from({ length: Math.min(maxQuestions, 3) }, (_, n) => {
    const num = n + 1;
    if (num < questionNumber)   return 'done';
    if (num === questionNumber) return 'active';
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
    if (idx === selected) return 'option-btn wrong' + (selected !== question.indice_correcto ? ' shake' : '');
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
                {Math.min(questionNumber, maxQuestions)}/{maxQuestions}
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
                <span className="option-letter">
                  {LETTERS[idx]}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {answered && (
            <div className="feedback-box">
              <div className={`feedback-header ${isCorrect ? 'correct-bg' : 'wrong-bg'}`}>
                <span className="feedback-icon">{isCorrect ? '✅' : '❌'}</span>
                <span className={`feedback-title ${isCorrect ? 'correct-text' : 'wrong-text'}`}>
                  {feedbackMsg}
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
                    ? 'Materia Completada! 🏆'
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
