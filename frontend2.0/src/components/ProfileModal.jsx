import { useState, useEffect } from 'react';

const BADGE_COLORS = (pct) => {
  if (pct >= 75) return { color: '#059669', bg: '#D1FAE5' };
  if (pct >= 50) return { color: '#D97706', bg: '#FEF3C7' };
  if (pct >= 25) return { color: '#EA580C', bg: '#FFEDD5' };
  return           { color: '#DC2626', bg: '#FEE2E2' };
};

export default function ProfileModal({ apiUrl, userId, userName, userData, onClose }) {
  const [activeTab, setActiveTab]     = useState('resumen');
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const totalStreak  = Object.values(userData.streaks).reduce((a, b) => a + b, 0);
  const totalHoy     = Object.values(userData.preguntasHoy).reduce((a, b) => a + b, 0);
  const correctasHoy = Object.values(userData.correctasHoy).reduce((a, b) => a + b, 0);

  useEffect(() => {
    fetch(`${apiUrl}/estadisticas/${userId}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const shareProgress = () => {
    const fmt = v => `${v || 0} ${(v || 0) === 1 ? 'día' : 'días'}`;
    const text =
      `🔥 ¡Mi entrenamiento en Reto PAES está en llamas! 🚀\n\n` +
      `🎯 Aciertos de hoy: ${correctasHoy}/${totalHoy}\n` +
      `🏆 Puntaje total de rachas: ${totalStreak}\n\n` +
      `Mis rachas activas:\n` +
      `📐 M1: ${fmt(userData.streaks.M1)}\n` +
      `📊 M2: ${fmt(userData.streaks.M2)}\n` +
      `📖 Lectora: ${fmt(userData.streaks.Lectora)}\n` +
      `🔬 Ciencias: ${fmt(userData.streaks.Ciencias)}\n` +
      `🏛️ Historia: ${fmt(userData.streaks.Historia)}\n\n` +
      `¡Entrena gratis conmigo! 👇\nhttps://reto-paes-mvp.vercel.app`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="overlay-modal">
      <div className="profile-card">
        {/* Hero header */}
        <div className="profile-hero">
          <button className="profile-close-btn" onClick={onClose} aria-label="Cerrar">×</button>

          <div className="profile-avatar">🎓</div>
          <p className="profile-name">{userName}</p>
          <p className="profile-plan">✨ Plan Gratuito</p>

          <div className="profile-tabs">
            <button
              className={`tab-btn${activeTab === 'resumen' ? ' active' : ''}`}
              onClick={() => setActiveTab('resumen')}
            >
              Resumen
            </button>
            <button
              className={`tab-btn${activeTab === 'analisis' ? ' active' : ''}`}
              onClick={() => setActiveTab('analisis')}
            >
              Análisis
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'resumen' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-emoji">🏆</span>
                  <span className="stat-number">{totalStreak}</span>
                  <span className="stat-label">Puntaje Rachas</span>
                </div>
                <div className="stat-card">
                  <span className="stat-emoji">🎯</span>
                  <span className="stat-number">{correctasHoy}/{totalHoy}</span>
                  <span className="stat-label">Aciertos Hoy</span>
                </div>
              </div>

              <p className="streaks-title">Rachas Activas</p>
              <div className="individual-streaks">
                {[
                  { label: 'M1',  key: 'M1' },
                  { label: 'M2',  key: 'M2' },
                  { label: 'LEC', key: 'Lectora' },
                  { label: 'CIE', key: 'Ciencias' },
                  { label: 'HIS', key: 'Historia' },
                ].map(s => (
                  <div key={s.key} className="streak-item">
                    <span className="streak-item-label">{s.label}</span>
                    <span className="streak-item-value">🔥 {userData.streaks[s.key] || 0}</span>
                  </div>
                ))}
              </div>

              <div className="profile-actions">
                <button className="btn-whatsapp" onClick={shareProgress}>
                  📲 Compartir en WhatsApp
                </button>
                <button
                  className="btn-premium"
                  onClick={() => alert('Próximamente: Integración con Flow')}
                >
                  ⭐ Ser Premium — Preguntas Ilimitadas
                </button>
              </div>
            </>
          )}

          {activeTab === 'analisis' && (
            <div>
              {statsLoading && <p className="loading-text">⏳ Calculando tus estadísticas...</p>}
              {!statsLoading && (!stats || Object.keys(stats).length === 0) && (
                <p className="loading-text">Aún no hay datos. ¡Sigue entrenando!</p>
              )}
              {!statsLoading && stats && Object.entries(stats).map(([materia, categorias]) => (
                <div key={materia} className="analysis-subject">
                  <span className="analysis-subject-header">{materia}</span>
                  {categorias.map(cat => {
                    const { color, bg } = BADGE_COLORS(cat.porcentaje);
                    return (
                      <div key={cat.categoria} className="analysis-row">
                        <span className="analysis-cat-name">{cat.categoria}</span>
                        <span className="analysis-badge" style={{ color, background: bg }}>
                          {cat.porcentaje}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
