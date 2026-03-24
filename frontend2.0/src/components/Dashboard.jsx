const SUBJECTS = [
  { key: 'M1',       label: 'Matemática M1',          emoji: '📐', color: '#EEF2FF', iconColor: '#4F46E5' },
  { key: 'M2',       label: 'Matemática M2',          emoji: '📊', color: '#F0FDF4', iconColor: '#10B981' },
  { key: 'Lectora',  label: 'Comp. Lectora',          emoji: '📖', color: '#FFF7ED', iconColor: '#F59E0B' },
  { key: 'Ciencias', label: 'Ciencias',               emoji: '🔬', color: '#F0F9FF', iconColor: '#0EA5E9' },
  { key: 'Historia', label: 'Historia y Cs. Sociales',emoji: '🏛️', color: '#FDF4FF', iconColor: '#A855F7' },
];

export default function Dashboard({ userName, userData, isLoggedIn, onSubjectClick, onProfileClick, onLogoutClick }) {
  const totalHoy     = Object.values(userData.preguntasHoy).reduce((a, b) => a + b, 0);
  const correctasHoy = Object.values(userData.correctasHoy).reduce((a, b) => a + b, 0);
  const totalStreak  = Object.values(userData.streaks).reduce((a, b) => a + b, 0);

  return (
    <div className="app-container">
      {/* ── Header Card ── */}
      <div className="header-card">
        <div className="header-top">
          <div>
            <p className="header-greeting">¡Bienvenido de vuelta!</p>
            <h1 className="header-name">{userName} 👋</h1>
            <p className="header-subtitle">¿Qué entrenaremos hoy?</p>
          </div>
          {isLoggedIn && (
            <div className="header-actions">
              <button
                className="avatar-btn"
                onClick={onProfileClick}
                title="Mi Perfil"
                aria-label="Mi Perfil"
              >
                🎓
              </button>
              <button
                className="logout-btn-header"
                onClick={onLogoutClick}
              >
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
          </div>
        )}
      </div>

      {/* ── Subject Cards ── */}
      <p className="section-label">Materias</p>
      <div className="subject-grid">
        {SUBJECTS.map(s => {
          const count  = userData.preguntasHoy[s.key] || 0;
          const streak = userData.streaks[s.key] || 0;
          const isDone = count >= 3;
          const pct    = Math.min((count / 3) * 100, 100);

          return (
            <div
              key={s.key}
              className={`subject-card${isDone ? ' completed' : ''}`}
              onClick={() => onSubjectClick(s.key)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSubjectClick(s.key)}
            >
              <div
                className="subject-icon-wrap"
                style={{ background: s.color }}
              >
                {s.emoji}
              </div>

              <div className="subject-body">
                <p className="subject-name">{s.label}</p>
                <div className="subject-meta">
                  <span className="streak-pill">🔥 {streak}</span>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill${isDone ? ' done' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`status-chip ${isDone ? 'chip-done' : 'chip-pending'}`}>
                    {isDone ? '✓ Listo' : `${count}/3`}
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
