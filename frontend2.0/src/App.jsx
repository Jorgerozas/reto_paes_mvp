import { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import QuestionModal from './components/QuestionModal';
import ProfileModal from './components/ProfileModal';
import UpsellModal from './components/UpsellModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import SummaryModal from './components/SummaryModal';

const API_URL = 'https://reto-paes-mvp.onrender.com/api';

const INITIAL_USER_DATA = {
  streaks:      { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
  preguntasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
  correctasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
};

export default function App() {
  const [userId, setUserId]       = useState(null);
  const [userName, setUserName]   = useState('Estudiante');
  const [userAlias, setUserAlias] = useState(''); // <-- NUEVO ESTADO PARA EL USERNAME
  const [userData, setUserData]   = useState(INITIAL_USER_DATA);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium]   = useState(false);

  // Modals
  const [showQuestion, setShowQuestion]           = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [showUpsell, setShowUpsell]               = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSummary, setShowSummary]             = useState(false);

  // Question state
  const [currentSubject, setCurrentSubject]   = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [cachedQuestions, setCachedQuestions]  = useState({});

  // Restore session on mount
  useEffect(() => {
    const savedId      = localStorage.getItem('retoPaes_userId');
    const savedName    = localStorage.getItem('retoPaes_userName');
    const savedAlias   = localStorage.getItem('retoPaes_userAlias'); // <-- Recuperar username
    const savedPremium = localStorage.getItem('retoPaes_isPremium') === 'true';

    if (savedId && savedName) {
      fetch(`${API_URL}/progreso/${savedId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUserId(savedId);
            setUserName(capitalize(savedName));
            setUserAlias(savedAlias || ''); // <-- Guardarlo en el estado
            setUserData(data);
            setIsPremium(savedPremium);
            setIsLoggedIn(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // ── AUTH ──────────────────────────────────────────────────────────────
  const handleLogin = async (id, name, alias, data, premiumStatus) => {
    setUserId(id);
    setUserName(capitalize(name));
    setUserAlias(alias); // <-- Actualizar estado del username
    setUserData(data);
    setIsPremium(premiumStatus);
    setIsLoggedIn(true);

    localStorage.setItem('retoPaes_userId', id);
    localStorage.setItem('retoPaes_userName', name);
    localStorage.setItem('retoPaes_userAlias', alias); // <-- Guardarlo en caché
    localStorage.setItem('retoPaes_isPremium', premiumStatus);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUserName('Estudiante');
    setUserAlias('');
    setUserData(INITIAL_USER_DATA);
    setIsPremium(false);
    
    localStorage.removeItem('retoPaes_userId');
    localStorage.removeItem('retoPaes_userName');
    localStorage.removeItem('retoPaes_userAlias');
    localStorage.removeItem('retoPaes_isPremium');
    setShowLogoutConfirm(false);
  };

  // ── QUESTIONS ────────────────────────────────────────────────────────
  const openQuestion = async (subject) => {
    if (!isPremium && (userData.preguntasHoy[subject] || 0) >= 3) {
      alert('Ya completaste tus 3 preguntas gratuitas de hoy para esta materia. ¡Hazte Premium para seguir practicando!');
      setShowUpsell(true);
      return;
    }

    setCurrentSubject(subject);

    if (cachedQuestions[subject]) {
      setCurrentQuestion(cachedQuestions[subject]);
      setShowQuestion(true);
      return;
    }
    await loadQuestion(subject);
    setShowQuestion(true);
  };

  const loadQuestion = async (subject) => {
    try {
      const res = await fetch(`${API_URL}/pregunta/${subject}/${userId}`);
      if (!res.ok) {
        if (res.status === 404) alert('¡Felicidades! Ya respondiste todas las preguntas de esta materia.');
        else alert('Hubo un error al buscar la pregunta.');
        return false;
      }
      const q = await res.json();
      setCurrentQuestion(q);
      setCachedQuestions(prev => ({ ...prev, [subject]: q }));
      return true;
    } catch {
      alert('No se pudo conectar con el servidor.');
      return false;
    }
  };

  const handleAnswerSubmit = async (isCorrect) => {
    const updated = {
      ...userData,
      preguntasHoy: {
        ...userData.preguntasHoy,
        [currentSubject]: (userData.preguntasHoy[currentSubject] || 0) + 1,
      },
      correctasHoy: {
        ...userData.correctasHoy,
        [currentSubject]: (userData.correctasHoy[currentSubject] || 0) + (isCorrect ? 1 : 0),
      },
    };

    const newCount = updated.preguntasHoy[currentSubject];
    if (newCount === 3) {
      updated.streaks = {
        ...updated.streaks,
        [currentSubject]: (updated.streaks[currentSubject] || 0) + 1,
      };
    }
    setUserData(updated);

    try {
      await fetch(`${API_URL}/respuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: userId,
          pregunta_id: currentQuestion.id,
          materia: currentSubject,
          fue_correcta: isCorrect,
        }),
      });
    } catch { /* silent */ }

    return updated;
  };

  const handleNextQuestion = async (updatedData) => {
    const count = updatedData.preguntasHoy[currentSubject] || 0;
    setCachedQuestions(prev => { const next = { ...prev }; delete next[currentSubject]; return next; });

    // Siempre celebramos si llega exactamente a 3
    if (count === 3) {
      triggerConfetti(updatedData);
    }

    if (!isPremium && count >= 3) {
      setShowQuestion(false);
    } else {
      setCurrentQuestion(null);
      await loadQuestion(currentSubject);
    }
  };

  const triggerConfetti = (updatedData) => {
    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      const materias = ['M1', 'M2', 'Lectora', 'Ciencias', 'Historia'];
      const todasCompletadas = materias.every(m => (updatedData.preguntasHoy[m] || 0) >= 3);

      if (todasCompletadas) {
        setTimeout(() => {
          const duration   = 3000;
          const end        = Date.now() + duration;
          const defaults   = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
          const interval   = setInterval(() => {
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) { clearInterval(interval); return; }
            const particleCount = 50 * (timeLeft / duration);
            window.confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
          }, 250);

          if (!isPremium) {
            setTimeout(() => setShowUpsell(true), 1000);
          }
        }, 500);
      }
    }
  };

  const closeQuestion = () => {
    setShowQuestion(false);
  };

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <Dashboard
        userName={userName}
        userData={userData}
        isLoggedIn={isLoggedIn}
        onSubjectClick={openQuestion}
        onProfileClick={() => setShowProfile(true)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        onSummaryClick={() => setShowSummary(true)}
      />

      {!isLoggedIn && (
        <AuthModal apiUrl={API_URL} onLogin={handleLogin} />
      )}

      {showQuestion && currentQuestion && (
        <QuestionModal
          subject={currentSubject}
          question={currentQuestion}
          preguntasHoy={userData.preguntasHoy[currentSubject] || 0}
          onAnswer={handleAnswerSubmit}
          onNext={handleNextQuestion}
          onClose={closeQuestion}
        />
      )}

      {showProfile && (
        <ProfileModal
          apiUrl={API_URL}
          userId={userId}
          userName={userName}
          userAlias={userAlias} // <-- AQUÍ LE PASAMOS EL USERNAME AL PERFIL
          userData={userData}
          isPremium={isPremium}
          onUpgrade={() => {
            setIsPremium(true);
            localStorage.setItem('retoPaes_isPremium', 'true');
            alert('¡Felicidades! Ya eres Premium desde tu perfil.');
          }}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showUpsell && (
        <UpsellModal
          userId={userId}
          onClose={() => setShowUpsell(false)}
          onUpgrade={() => {
            setIsPremium(true);
            localStorage.setItem('retoPaes_isPremium', 'true');
            setShowUpsell(false);
            alert('¡Felicidades! Ya eres Premium. Tienes preguntas ilimitadas.');
          }}
        />
      )}

      {showSummary && (
        <SummaryModal onClose={() => setShowSummary(false)} />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
