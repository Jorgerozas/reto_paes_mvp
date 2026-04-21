import { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import QuestionModal from './components/QuestionModal';
import ProfileModal from './components/ProfileModal';
import UpsellModal from './components/UpsellModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import SummaryModal from './components/SummaryModal';
import FriendsModal from './components/FriendsModal';
import BottomNav from './components/BottomNav';
import ToastContainer, { toast } from './components/Toast';

const API_URL = 'https://reto-paes-mvp.onrender.com/api';

const INITIAL_USER_DATA = {
  streaks:      { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
  preguntasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
  correctasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
};

export default function App() {
  const [userId, setUserId]       = useState(null);
  const [userName, setUserName]   = useState('Estudiante');
  const [userAlias, setUserAlias] = useState('');
  const [userData, setUserData]   = useState(INITIAL_USER_DATA);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium]   = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState('home');

  // Modals (overlays that float above everything)
  const [showQuestion, setShowQuestion]           = useState(false);
  const [showUpsell, setShowUpsell]               = useState(false);
  const [upsellType, setUpsellType]               = useState('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Question state
  const [currentSubject, setCurrentSubject]   = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [cachedQuestions, setCachedQuestions]  = useState({});

  // Restore session on mount
  useEffect(() => {
    const savedId      = localStorage.getItem('retoPaes_userId');
    const savedName    = localStorage.getItem('retoPaes_userName');
    const savedAlias   = localStorage.getItem('retoPaes_userAlias');
    const savedPremium = localStorage.getItem('retoPaes_isPremium') === 'true';

    if (savedId && savedName) {
      fetch(`${API_URL}/progreso/${savedId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUserId(savedId);
            setUserName(capitalize(savedName));
            setUserAlias(savedAlias || '');
            setUserData(data);
            setIsPremium(savedPremium);
            setIsLoggedIn(true);
          }
        })
        .catch(() => {
          toast('No se pudo conectar. Revisa tu conexion.', 'error');
        })
        .finally(() => setIsRestoring(false));
    } else {
      setIsRestoring(false);
    }
  }, []);

  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // ── AUTH ──────────────────────────────────────────────────────────────
  const handleLogin = async (id, name, alias, data, premiumStatus) => {
    setUserId(id);
    setUserName(capitalize(name));
    setUserAlias(alias);
    setUserData(data);
    setIsPremium(premiumStatus);
    setIsLoggedIn(true);
    setActiveTab('home');

    localStorage.setItem('retoPaes_userId', id);
    localStorage.setItem('retoPaes_userName', name);
    localStorage.setItem('retoPaes_userAlias', alias);
    localStorage.setItem('retoPaes_isPremium', premiumStatus);

    toast('Bienvenido de vuelta!', 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUserName('Estudiante');
    setUserAlias('');
    setUserData(INITIAL_USER_DATA);
    setIsPremium(false);
    setActiveTab('home');

    localStorage.removeItem('retoPaes_userId');
    localStorage.removeItem('retoPaes_userName');
    localStorage.removeItem('retoPaes_userAlias');
    localStorage.removeItem('retoPaes_isPremium');
    setShowLogoutConfirm(false);
  };

  // ── QUESTIONS ────────────────────────────────────────────────────────
  const openQuestion = async (subject) => {
    if (!isPremium && (userData.preguntasHoy[subject] || 0) >= 3) {
      const materias = ['M1', 'M2', 'Lectora', 'Ciencias', 'Historia'];
      const todasCompletadas = materias.every(m => (userData.preguntasHoy[m] || 0) >= 3);

      if (todasCompletadas) {
        setUpsellType('all');
      } else {
        setUpsellType('subject');
      }

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
        if (res.status === 404) toast('Felicidades! Ya respondiste todas las preguntas de esta materia.', 'success');
        else toast('Hubo un error al buscar la pregunta.', 'error');
        return false;
      }
      const q = await res.json();
      setCurrentQuestion(q);
      setCachedQuestions(prev => ({ ...prev, [subject]: q }));
      return true;
    } catch {
      toast('No se pudo conectar con el servidor.', 'error');
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

    if (count === 3) {
      triggerConfetti(updatedData);
    }

    if (count === 3 || (!isPremium && count >= 3)) {
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
            setUpsellType('all');
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

  // Splash screen while restoring session
  if (isRestoring) {
    return (
      <>
        <div className="splash-screen">
          <div className="splash-logo">🚀</div>
          <h1 className="splash-title">Reto PAES</h1>
          <p className="splash-subtitle">Preparando tu entrenamiento...</p>
          <div className="splash-loader">
            <div className="splash-loader-bar" />
          </div>
        </div>
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      {/* ── Tab content ── */}
      <div className="tab-page-container">
        {activeTab === 'home' && (
          <Dashboard
            userName={userName}
            userData={userData}
            isLoggedIn={isLoggedIn}
            isPremium={isPremium}
            onSubjectClick={openQuestion}
            onLogoutClick={() => setShowLogoutConfirm(true)}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryModal onClose={() => setActiveTab('home')} isPage />
        )}

        {activeTab === 'friends' && isLoggedIn && (
          <FriendsModal
            apiUrl={API_URL}
            userId={userId}
            onClose={() => setActiveTab('home')}
            isPage
          />
        )}

        {activeTab === 'profile' && isLoggedIn && (
          <ProfileModal
            apiUrl={API_URL}
            userId={userId}
            userName={userName}
            userAlias={userAlias}
            userData={userData}
            isPremium={isPremium}
            onUpgrade={() => {
              setIsPremium(true);
              localStorage.setItem('retoPaes_isPremium', 'true');
              toast('Felicidades! Ya eres Premium.', 'success');
            }}
            onClose={() => setActiveTab('home')}
            isPage
          />
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      {isLoggedIn && (
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      )}

      {/* ── Auth modal (not logged in) ── */}
      {!isLoggedIn && (
        <AuthModal apiUrl={API_URL} onLogin={handleLogin} />
      )}

      {/* ── Overlay modals ── */}
      {showQuestion && currentQuestion && (
        <QuestionModal
          subject={currentSubject}
          question={currentQuestion}
          preguntasHoy={userData.preguntasHoy[currentSubject] || 0}
          isPremium={isPremium}
          onAnswer={handleAnswerSubmit}
          onNext={handleNextQuestion}
          onClose={closeQuestion}
        />
      )}

      {showUpsell && (
        <UpsellModal
          userId={userId}
          type={upsellType}
          onClose={() => setShowUpsell(false)}
          onUpgrade={() => {
            setIsPremium(true);
            localStorage.setItem('retoPaes_isPremium', 'true');
            setShowUpsell(false);
            toast('Felicidades! Ya eres Premium. Tienes preguntas ilimitadas.', 'success');
          }}
        />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      <ToastContainer />
    </>
  );
}
