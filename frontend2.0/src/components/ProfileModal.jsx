import { useState, useEffect } from 'react';

const BADGE_COLORS = (pct) => {
  if (pct >= 75) return { color: '#059669', bg: '#D1FAE5' };
  if (pct >= 50) return { color: '#D97706', bg: '#FEF3C7' };
  if (pct >= 25) return { color: '#EA580C', bg: '#FFEDD5' };
  return           { color: '#DC2626', bg: '#FEE2E2' };
};

const SUBJECT_MAP = [
  { key: 'M1',       label: 'M1',       fullLabel: 'Matemática M1',  emoji: '📐', barColor: '#4F46E5' },
  { key: 'M2',       label: 'M2',       fullLabel: 'Matemática M2',  emoji: '📊', barColor: '#10B981' },
  { key: 'Lectora',  label: 'Lectora',  fullLabel: 'Comp. Lectora',  emoji: '📖', barColor: '#F59E0B' },
  { key: 'Ciencias', label: 'Ciencias', fullLabel: 'Ciencias',       emoji: '🔬', barColor: '#0EA5E9' },
  { key: 'Historia', label: 'Historia', fullLabel: 'Historia',       emoji: '🏛️', barColor: '#A855F7' },
];

/* ── Radar chart helpers ── */
const CX = 120, CY = 120, R = 90;
const ANGLES = SUBJECT_MAP.map((_, i) => (Math.PI / 2) + (2 * Math.PI * i) / 5);

const polarToXY = (angle, radius) => ({
  x: CX + radius * Math.cos(angle),
  y: CY - radius * Math.sin(angle),
});

const polygonPoints = (values) =>
  values.map((v, i) => {
    const { x, y } = polarToXY(ANGLES[i], (v / 100) * R);
    return `${x},${y}`;
  }).join(' ');

const gridPolygon = (scale) =>
  ANGLES.map(a => {
    const { x, y } = polarToXY(a, R * scale);
    return `${x},${y}`;
  }).join(' ');

function RadarChart({ subjectPcts }) {
  const values = SUBJECT_MAP.map(s => subjectPcts[s.key] ?? 0);

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 240 240" className="radar-svg">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={gridPolygon(scale)}
            fill="none"
            stroke="rgba(79,70,229,0.1)"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {ANGLES.map((a, i) => {
          const { x, y } = polarToXY(a, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(79,70,229,0.08)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon
          points={polygonPoints(values)}
          fill="rgba(79,70,229,0.15)"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {values.map((v, i) => {
          const { x, y } = polarToXY(ANGLES[i], (v / 100) * R);
          return <circle key={i} cx={x} cy={y} r="4" fill="#4F46E5" stroke="#fff" strokeWidth="1.5" />;
        })}
        {/* Labels */}
        {SUBJECT_MAP.map((s, i) => {
          const { x, y } = polarToXY(ANGLES[i], R + 20);
          return (
            <text
              key={s.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="700"
              fill="#6B7280"
            >
              {s.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function SubjectBars({ subjectPcts, subjectTotals }) {
  return (
    <div className="subject-bars">
      {SUBJECT_MAP.map(s => {
        const pct = subjectPcts[s.key] ?? 0;
        const totals = subjectTotals[s.key] ?? { correctas: 0, total: 0 };
        const { color, bg } = BADGE_COLORS(pct);
        return (
          <div key={s.key} className="subject-bar-row">
            <span className="subject-bar-emoji">{s.emoji}</span>
            <div className="subject-bar-info">
              <div className="subject-bar-top">
                <span className="subject-bar-name">{s.fullLabel}</span>
                <span className="subject-bar-stats">
                  <span className="subject-bar-counts">{totals.correctas}/{totals.total}</span>
                  <span className="subject-bar-pct-badge" style={{ color, background: bg }}>{pct}%</span>
                </span>
              </div>
              <div className="subject-bar-track">
                <div
                  className="subject-bar-fill"
                  style={{ width: `${pct}%`, background: s.barColor }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Aggregate stats from API response ── */
function aggregateStats(stats) {
  const subjectPcts = {};
  const subjectTotals = {};
  let globalCorrectas = 0;
  let globalTotal = 0;

  if (!stats) return { subjectPcts, subjectTotals, globalCorrectas, globalTotal };

  for (const [materia, categorias] of Object.entries(stats)) {
    let correctas = 0;
    let total = 0;
    for (const cat of categorias) {
      const parts = cat.texto.split('/');
      correctas += parseInt(parts[0]) || 0;
      total += parseInt(parts[1]) || 0;
    }
    const key = SUBJECT_MAP.find(s => materia.toLowerCase().includes(s.key.toLowerCase()))?.key
      || SUBJECT_MAP.find(s => materia.toLowerCase().includes(s.label.toLowerCase()))?.key
      || materia;
    subjectPcts[key] = total > 0 ? Math.round((correctas / total) * 100) : 0;
    subjectTotals[key] = { correctas, total };
    globalCorrectas += correctas;
    globalTotal += total;
  }

  return { subjectPcts, subjectTotals, globalCorrectas, globalTotal };
}

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

  const { subjectPcts, subjectTotals, globalCorrectas, globalTotal } = aggregateStats(stats);
  const globalPct = globalTotal > 0 ? Math.round((globalCorrectas / globalTotal) * 100) : 0;

  const downloadAnalysis = () => {
    if (!stats || Object.keys(stats).length === 0) return;

    const today = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

    // Build radar SVG for the report
    const radarValues = SUBJECT_MAP.map(s => subjectPcts[s.key] ?? 0);
    const radarGridRings = [0.25, 0.5, 0.75, 1].map(scale =>
      `<polygon points="${gridPolygon(scale)}" fill="none" stroke="rgba(79,70,229,0.12)" stroke-width="1"/>`
    ).join('');
    const radarAxes = ANGLES.map((a, i) => {
      const { x, y } = polarToXY(a, R);
      return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="rgba(79,70,229,0.08)" stroke-width="1"/>`;
    }).join('');
    const radarPoly = `<polygon points="${polygonPoints(radarValues)}" fill="rgba(79,70,229,0.18)" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`;
    const radarDots = radarValues.map((v, i) => {
      const { x, y } = polarToXY(ANGLES[i], (v / 100) * R);
      return `<circle cx="${x}" cy="${y}" r="4.5" fill="#4F46E5" stroke="#fff" stroke-width="2"/>`;
    }).join('');
    const radarLabels = SUBJECT_MAP.map((s, i) => {
      const { x, y } = polarToXY(ANGLES[i], R + 22);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="#6B7280" font-family="system-ui, sans-serif">${s.label}</text>`;
    }).join('');
    const radarSVG = `<svg viewBox="0 0 240 240" width="280" height="280" xmlns="http://www.w3.org/2000/svg">${radarGridRings}${radarAxes}${radarPoly}${radarDots}${radarLabels}</svg>`;

    // Build subject bars HTML
    const subjectBarsHTML = SUBJECT_MAP.map(s => {
      const pct = subjectPcts[s.key] ?? 0;
      const totals = subjectTotals[s.key] ?? { correctas: 0, total: 0 };
      const { color, bg } = BADGE_COLORS(pct);
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:22px;width:30px;text-align:center;">${s.emoji}</span>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <span style="font-size:14px;font-weight:600;color:#1F2937;">${s.fullLabel}</span>
              <span style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:13px;color:#6B7280;font-weight:600;">${totals.correctas}/${totals.total}</span>
                <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;color:${color};background:${bg};">${pct}%</span>
              </span>
            </div>
            <div style="height:7px;background:#E5E7EB;border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${s.barColor};border-radius:99px;"></div>
            </div>
          </div>
        </div>`;
    }).join('');

    // Build category breakdown HTML
    const categoryHTML = Object.entries(stats).map(([materia, categorias]) => {
      const rows = categorias.map(cat => {
        const { color, bg } = BADGE_COLORS(cat.porcentaje);
        return `
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#1F2937;border-bottom:1px solid #F3F4F6;">${cat.categoria}</td>
            <td style="padding:8px 12px;font-size:13px;color:#6B7280;text-align:center;border-bottom:1px solid #F3F4F6;">${cat.texto}</td>
            <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #F3F4F6;">
              <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;color:${color};background:${bg};">${cat.porcentaje}%</span>
            </td>
          </tr>`;
      }).join('');
      return `
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:800;color:#4F46E5;text-transform:uppercase;letter-spacing:0.8px;padding:8px 12px;background:#EEF2FF;border-radius:8px;margin-bottom:4px;">${materia}</div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:8px 12px;font-size:11px;color:#6B7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Categoría</th>
                <th style="padding:8px 12px;font-size:11px;color:#6B7280;text-align:center;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Aciertos</th>
                <th style="padding:8px 12px;font-size:11px;color:#6B7280;text-align:center;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">%</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Análisis Reto PAES - ${userName}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body style="margin:0;padding:40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1F2937;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:20px;padding:28px 32px;margin-bottom:28px;color:#fff;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.75;">Reporte de Análisis</p>
      <h1 style="margin:0 0 4px;font-size:26px;font-weight:800;">Reto PAES</h1>
      <p style="margin:0;font-size:14px;opacity:0.8;">${userName} &mdash; ${today}</p>
    </div>

    <!-- Global accuracy -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#EEF2FF,#F5F3FF);border:2px solid rgba(79,70,229,0.15);border-radius:20px;padding:20px 40px;">
        <div style="font-size:44px;font-weight:900;color:#4F46E5;line-height:1;">${globalPct}%</div>
        <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Precisión Global</div>
        <div style="font-size:13px;color:#6B7280;margin-top:2px;">${globalCorrectas} de ${globalTotal} preguntas</div>
      </div>
    </div>

    <!-- Radar -->
    <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B7280;margin:0 0 12px;">Rendimiento por Materia</h2>
    <div style="text-align:center;margin-bottom:24px;">${radarSVG}</div>

    <!-- Subject bars -->
    <div style="margin-bottom:28px;">${subjectBarsHTML}</div>

    <!-- Category detail -->
    <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B7280;margin:0 0 12px;">Detalle por Categoría</h2>
    ${categoryHTML}

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;">
      <p style="font-size:12px;color:#9CA3AF;">Generado por Reto PAES &mdash; reto-paes-mvp.vercel.app</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-reto-paes-${userName.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              {!statsLoading && stats && Object.keys(stats).length > 0 && (
                <>
                  {/* Global summary */}
                  <div className="global-summary">
                    <div className="global-accuracy">
                      <span className="global-accuracy-number">{globalPct}%</span>
                      <span className="global-accuracy-label">Precisión global</span>
                      <span className="global-accuracy-sub">{globalCorrectas} de {globalTotal} preguntas</span>
                    </div>
                  </div>

                  {/* Radar chart */}
                  <p className="section-title-analysis">Rendimiento por materia</p>
                  <RadarChart subjectPcts={subjectPcts} />

                  {/* Subject bars */}
                  <SubjectBars subjectPcts={subjectPcts} subjectTotals={subjectTotals} />

                  {/* Download button */}
                  <button className="btn-download-analysis" onClick={downloadAnalysis}>
                    📄 Descargar Análisis
                  </button>

                  {/* Category breakdown */}
                  <p className="section-title-analysis" style={{ marginTop: 20 }}>Detalle por categoría</p>
                  {Object.entries(stats).map(([materia, categorias]) => (
                    <div key={materia} className="analysis-subject">
                      <span className="analysis-subject-header">{materia}</span>
                      {categorias.map(cat => {
                        const { color, bg } = BADGE_COLORS(cat.porcentaje);
                        return (
                          <div key={cat.categoria} className="analysis-row">
                            <span className="analysis-cat-name">{cat.categoria}</span>
                            <span className="analysis-counts">{cat.texto}</span>
                            <span className="analysis-badge" style={{ color, background: bg }}>
                              {cat.porcentaje}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
