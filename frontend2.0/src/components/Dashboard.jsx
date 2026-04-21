const SUBJECTS = [
  { key: 'M1',       label: 'Matematica M1',          emoji: '📐', color: '#EEF2FF', iconColor: '#4F46E5' },
  { key: 'M2',       label: 'Matematica M2',          emoji: '📊', color: '#F0FDF4', iconColor: '#10B981' },
  { key: 'Lectora',  label: 'Comp. Lectora',          emoji: '📖', color: '#FFF7ED', iconColor: '#F59E0B' },
  { key: 'Ciencias', label: 'Ciencias',               emoji: '🔬', color: '#F0F9FF', iconColor: '#0EA5E9' },
  { key: 'Historia', label: 'Historia y Cs. Sociales',emoji: '🏛️', color: '#FDF4FF', iconColor: '#A855F7' },
];

const DAILY_TIPS = [
  { icon: '💡', text: 'Responder 3 preguntas diarias por materia construye tu racha. La constancia es clave.' },
  { icon: '🧠', text: 'Leer bien la pregunta antes de responder aumenta tu precision hasta un 30%.' },
  { icon: '📈', text: 'Los estudiantes que practican a diario mejoran su puntaje PAES en promedio 50 puntos.' },
  { icon: '⏰', text: 'Estudiar 20 minutos al dia es mas efectivo que 3 horas el fin de semana.' },
  { icon: '🎯', text: 'Enfocate en tus materias mas debiles. Revisar los resumenes antes de responder ayuda.' },
  { icon: '🔥', text: 'Mantener una racha activa entrena tu disciplina. No la dejes caer!' },
  { icon: '📚', text: 'Revisa las explicaciones despues de cada pregunta, incluso si acertaste.' },
  { icon: '🤝', text: 'Agrega amigos y comparen su progreso. Estudiar en grupo motiva mas.' },
  { icon: '🏆', text: 'Cada pregunta que respondes te acerca a tu puntaje ideal. Sigue asi!' },
  { icon: '✨', text: 'La PAES evalua comprension, no memoria. Practica entender los "por que".' },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export default function Dashboard({ userName, userData, isLoggedIn, isPremium, onSubjectClick, onLogoutClick }) {
  const totalHoy     = Object.values(userData.preguntasHoy).reduce((a, b) => a + b, 0);
  const correctasHoy = Object.values(userData.correctasHoy).reduce((a, b) => a + b, 0);
  const totalStreak  = Object.values(userData.streaks).reduce((a, b) => a + b, 0);
  const tip = getDailyTip();
  const completedCount = SUBJECTS.filter(s => (userData.preguntasHoy[s.key] || 0) >= 3).length;

  return (
    <div className="app-container">
      {/* ── Header Card ── */}
      <div className="header-card">
        <div className="header-top">
          <div>
            <p className="header-greeting">Bienvenido de vuelta!</p>
            <h1 className="header-name">{userName} 👋</h1>
            <p className="header-subtitle">Que entrenaremos hoy?</p>
          </div>
          {isLoggedIn && (
            <div className="header-actions">
              <button className="logout-btn-header" onClick={onLogoutClick}>
                Salir
              </button>
            </div>
          )}
        </div>

        {isLoggedIn && (
          <div className="daily-summary">
            <div className="daily-chip">
              <span className="daily-chip-value">🎯 {correctasHoy}/{totalHoy}</span>
              <span className="daily-chip-label">Aciertos<br/>hoy</span>
            </div>
            <div className="daily-chip">
              <span className="daily-chip-value">🔥 {totalStreak}</span>
              <span className="daily-chip-label">Puntaje<br/>rachas</span>
            </div>
            <div className="daily-chip">
              <span className="daily-chip-value">✅ {completedCount}/5</span>
              <span className="daily-chip-label">Materias<br/>listas</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Daily Tip ── */}
      {isLoggedIn && (
        <div className="daily-tip">
          <span className="daily-tip-icon">{tip.icon}</span>
          <p className="daily-tip-text">{tip.text}</p>
        </div>
      )}

      {/* ── Subject Cards ── */}
      <p className="section-label">Materias</p>
      <div className="subject-grid">
        {SUBJECTS.map((s, index) => {
          const count  = userData.preguntasHoy[s.key] || 0;
          const streak = userData.streaks[s.key] || 0;
          const isDone = count >= 3;
          const pct    = Math.min((count / 3) * 100, 100);

          const cardClass = `subject-card${isDone && !isPremium ? ' completed' : ''}`;

          let chipText = `${count}/3`;
          let chipClass = 'chip-pending';
          let premiumStyle = {};

          if (isDone) {
            if (isPremium) {
              chipText = `♾️ Seguir (${count})`;
              chipClass = 'chip-pending';
              premiumStyle = { backgroundColor: '#EDE9FE', color: '#6D28D9', fontWeight: 700 };
            } else {
              chipText = '✓ Listo';
              chipClass = 'chip-done';
            }
          }

          return (
            <div
              key={s.key}
              className={cardClass}
              onClick={() => onSubjectClick(s.key)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSubjectClick(s.key)}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="subject-icon-wrap" style={{ background: s.color }}>
                {s.emoji}
              </div>

              <div className="subject-body">
                <p className="subject-name">{s.label}</p>
                <div className="subject-meta">
                  <span className={`streak-pill${streak > 0 ? ' streak-active' : ''}`}>🔥 {streak}</span>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill${isDone ? ' done' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`status-chip ${chipClass}`} style={premiumStyle}>
                    {chipText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
