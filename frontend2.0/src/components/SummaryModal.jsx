import { useState } from 'react';
import FlashcardsView from './FlashcardsView';

const SUBJECTS = [
  { key: 'M1',       label: 'Matemática M1',           emoji: '📐', color: '#EEF2FF', iconColor: '#4F46E5' },
  { key: 'M2',       label: 'Matemática M2',           emoji: '📊', color: '#F0FDF4', iconColor: '#10B981' },
  { key: 'Lectora',  label: 'Comp. Lectora',           emoji: '📖', color: '#FFF7ED', iconColor: '#F59E0B' },
  { key: 'Ciencias', label: 'Ciencias',                emoji: '🔬', color: '#F0F9FF', iconColor: '#0EA5E9' },
  { key: 'Historia', label: 'Historia y Cs. Sociales', emoji: '🏛️', color: '#FDF4FF', iconColor: '#A855F7' },
];

const COLORS = {
  blue:   { bg: '#EEF2FF', border: '#C7D2FE', accent: '#4F46E5' },
  green:  { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A' },
  purple: { bg: '#FAF5FF', border: '#E9D5FF', accent: '#9333EA' },
  orange: { bg: '#FFF7ED', border: '#FED7AA', accent: '#EA580C' },
  rose:   { bg: '#FFF1F2', border: '#FECDD3', accent: '#E11D48' },
  cyan:   { bg: '#ECFEFF', border: '#A5F3FC', accent: '#0891B2' },
  amber:  { bg: '#FFFBEB', border: '#FDE68A', accent: '#D97706' },
};

const M1_SUMMARY = [
  {
    title: 'Porcentajes y Proporcionalidad',
    color: 'orange',
    note: 'Para calcular variaciones de precio, descuentos y comparaciones.',
    formulas: [
      { label: 'Porcentaje de un valor', formula: 'p% de X = (p / 100) · X' },
      { label: 'Aumento porcentual', formula: 'X final = X · (1 + p/100)' },
      { label: 'Descuento porcentual', formula: 'X final = X · (1 − p/100)' },
      { label: 'Variación porcentual', formula: '((final − inicial) / inicial) · 100' },
    ],
    extras: [
      { label: 'Proporcionalidad directa', formula: 'y = k · x     →   a/b = c/d' },
      { label: 'Proporcionalidad inversa', formula: 'y = k / x     →   x · y = constante' },
    ],
  },
  {
    title: 'Potencias y Raíces',
    color: 'blue',
    note: 'Reglas para simplificar expresiones con exponentes.',
    formulas: [
      { label: 'Multiplicación', formula: 'aᵐ · aⁿ  =  aᵐ⁺ⁿ' },
      { label: 'División', formula: 'aᵐ / aⁿ  =  aᵐ⁻ⁿ' },
      { label: 'Potencia de potencia', formula: '(aᵐ)ⁿ  =  aᵐ·ⁿ' },
      { label: 'Distributiva', formula: '(a · b)ⁿ  =  aⁿ · bⁿ' },
      { label: 'Exponente cero', formula: 'a⁰  =  1     (a ≠ 0)' },
      { label: 'Exponente negativo', formula: 'a⁻ⁿ  =  1 / aⁿ' },
    ],
    extras: [
      { label: 'Raíz de producto', formula: '√(a · b)  =  √a · √b' },
      { label: 'Raíz de cuadrado', formula: '√(a²)  =  |a|' },
    ],
  },
  {
    title: 'Productos Notables',
    color: 'purple',
    note: 'Atajos para multiplicar expresiones algebraicas sin distribuir paso a paso.',
    formulas: [
      { label: 'Cuadrado de suma', formula: '(a + b)²  =  a² + 2ab + b²' },
      { label: 'Cuadrado de diferencia', formula: '(a − b)²  =  a² − 2ab + b²' },
      { label: 'Suma por diferencia', formula: '(a + b)(a − b)  =  a² − b²' },
    ],
  },
  {
    title: 'Factorización',
    color: 'purple',
    note: 'El proceso inverso a los productos notables: descomponer en factores.',
    formulas: [
      { label: 'Factor común', formula: 'ab + ac  =  a(b + c)' },
      { label: 'Diferencia de cuadrados', formula: 'a² − b²  =  (a + b)(a − b)' },
      { label: 'Trinomio cuadrado perfecto', formula: 'a² + 2ab + b²  =  (a + b)²' },
      { label: 'Trinomio x² + bx + c', formula: '(x + p)(x + q)   donde  p + q = b,  p · q = c' },
    ],
  },
  {
    title: 'Ecuación Cuadrática (Bhaskara)',
    color: 'rose',
    note: 'Permite encontrar las soluciones de cualquier ecuación de grado 2.',
    formulas: [
      { label: 'Forma general', formula: 'ax² + bx + c = 0' },
      { label: 'Fórmula', formula: 'x = (−b ± √(b² − 4ac)) / 2a', highlight: true },
      { label: 'Discriminante', formula: 'D = b² − 4ac' },
    ],
    extras: [
      { label: 'D > 0', formula: '2 soluciones reales distintas' },
      { label: 'D = 0', formula: '1 solución real (raíz doble)' },
      { label: 'D < 0', formula: 'Sin solución en los reales' },
    ],
  },
  {
    title: 'Función Lineal (la recta)',
    color: 'green',
    note: 'Describe una línea recta en el plano. La pendiente indica cuánto sube o baja.',
    formulas: [
      { label: 'Ecuación', formula: 'y  =  m · x + n', highlight: true },
      { label: 'Pendiente', formula: 'm  =  (y₂ − y₁) / (x₂ − x₁)' },
      { label: 'Corte con eje Y', formula: 'Punto (0, n)' },
      { label: 'Corte con eje X', formula: 'Punto (−n/m, 0)' },
    ],
    extras: [
      { label: 'Rectas paralelas', formula: 'm₁ = m₂' },
      { label: 'Rectas perpendiculares', formula: 'm₁ · m₂ = −1' },
    ],
  },
  {
    title: 'Función Cuadrática (Parábola)',
    color: 'green',
    note: 'Genera una curva en forma de U. El vértice es su punto más alto o más bajo.',
    formulas: [
      { label: 'Forma general', formula: 'f(x) = ax² + bx + c' },
      { label: 'Eje de simetría', formula: 'x  =  −b / 2a', highlight: true },
      { label: 'Vértice', formula: 'V = ( −b/2a ,  f(−b/2a) )', highlight: true },
      { label: 'Corte con eje Y', formula: 'f(0) = c' },
    ],
    extras: [
      { label: 'Si a > 0', formula: 'Abre hacia arriba  →  vértice es mínimo' },
      { label: 'Si a < 0', formula: 'Abre hacia abajo  →  vértice es máximo' },
    ],
  },
  {
    title: 'Ángulos',
    color: 'cyan',
    formulas: [
      { label: 'Suplementarios', formula: 'α + β  =  180°' },
      { label: 'Complementarios', formula: 'α + β  =  90°' },
      { label: 'Triángulo (suma interior)', formula: 'α + β + γ  =  180°' },
      { label: 'Polígono de n lados', formula: 'Suma interior  =  (n − 2) · 180°' },
    ],
  },
  {
    title: 'Pitágoras y Triángulos Especiales',
    color: 'cyan',
    note: 'Solo aplica en triángulos rectángulos (con un ángulo de 90°).',
    formulas: [
      { label: 'Teorema de Pitágoras', formula: 'c²  =  a² + b²', highlight: true },
    ],
    extras: [
      { label: 'Ternas comunes', formula: '(3, 4, 5)    (5, 12, 13)    (8, 15, 17)' },
      { label: 'Triángulo 30-60-90', formula: 'Catetos: a  y  a√3   |   Hipotenusa: 2a' },
      { label: 'Triángulo 45-45-90', formula: 'Catetos: a  y  a      |   Hipotenusa: a√2' },
    ],
  },
  {
    title: 'Áreas y Perímetros',
    color: 'amber',
    formulas: [
      { label: 'Rectángulo', formula: 'A = b · h          P = 2(b + h)' },
      { label: 'Triángulo', formula: 'A = (b · h) / 2' },
      { label: 'Trapecio', formula: 'A = (B + b) · h / 2' },
      { label: 'Rombo', formula: 'A = (D · d) / 2' },
      { label: 'Círculo', formula: 'A = π r²          P = 2πr' },
      { label: 'Cilindro (volumen)', formula: 'V = π r² h' },
    ],
  },
  {
    title: 'Teorema de Thales',
    color: 'amber',
    note: 'Si rectas paralelas cortan a dos rectas transversales, los segmentos que se forman son proporcionales.',
    formulas: [
      { label: 'Proporción de Thales', formula: 'a / b  =  c / d', highlight: true },
    ],
    extras: [
      { label: 'Se lee como', formula: '"a es a b,  como c es a d"' },
      { label: 'Para encontrar un valor', formula: 'a · d  =  b · c    (producto cruzado)' },
    ],
  },
  {
    title: 'Semejanza de Triángulos',
    color: 'amber',
    note: 'Dos triángulos son semejantes si tienen la misma forma (ángulos iguales) aunque distinto tamaño. Sus lados son proporcionales.',
    formulas: [
      { label: 'Razón de semejanza', formula: 'a₁/a₂ = b₁/b₂ = c₁/c₂ = k', highlight: true },
      { label: 'Relación de áreas', formula: 'A₁ / A₂  =  k²' },
    ],
    extras: [
      { label: 'Criterio AA', formula: '2 ángulos iguales  →  son semejantes' },
      { label: 'Criterio SAS', formula: '2 lados proporcionales y ángulo entre ellos igual' },
      { label: 'Criterio SSS', formula: '3 lados proporcionales  →  son semejantes' },
    ],
  },
  {
    title: 'Estadística y Probabilidad',
    color: 'blue',
    note: 'En PAES M1 solo entra el promedio (media aritmética). Mediana y moda son de M2.',
    formulas: [
      { label: 'Media (promedio)', formula: 'x̄  =  (x₁ + x₂ + ... + xₙ) / n', highlight: true },
      { label: 'Con tabla de frecuencias', formula: 'x̄  =  Σ(xᵢ · fᵢ) / Σfᵢ' },
    ],
    extras: [
      { label: 'Probabilidad clásica', formula: 'P(A) = casos favorables / casos posibles' },
      { label: 'Complemento', formula: 'P(A\') = 1 − P(A)' },
      { label: 'Unión (no excluyentes)', formula: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B)' },
      { label: 'Independientes', formula: 'P(A ∩ B) = P(A) · P(B)' },
    ],
  },
];

function FormulaCard({ label, formula, highlight }) {
  return (
    <div className={`formula-row${highlight ? ' formula-highlight' : ''}`}>
      <span className="formula-label">{label}</span>
      <span className="formula-value">{formula}</span>
    </div>
  );
}

function SectionCard({ section, index = 0 }) {
  const c = COLORS[section.color] || COLORS.blue;
  return (
    <div
      className="summary-section"
      style={{ borderColor: c.border, background: c.bg, animationDelay: `${index * 0.04}s` }}
    >
      <div className="summary-section-header">
        <div className="summary-section-dot" style={{ background: c.accent }} />
        <h4 className="summary-section-title" style={{ color: c.accent }}>{section.title}</h4>
        <span className="summary-section-count" style={{ color: c.accent, background: `${c.accent}15` }}>
          {section.formulas.length + (section.extras?.length || 0)}
        </span>
      </div>
      {section.note && <p className="summary-note">{section.note}</p>}
      <div className="formula-group">
        {section.formulas.map((f, i) => <FormulaCard key={i} {...f} />)}
      </div>
      {section.extras && (
        <div className="formula-extras">
          <span className="formula-extras-label">Datos clave</span>
          {section.extras.map((f, i) => <FormulaCard key={i} {...f} />)}
        </div>
      )}
    </div>
  );
}

export default function SummaryModal({ onClose, isPage }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showFlashcards, setShowFlashcards] = useState(false);

  if (showFlashcards) {
    return <FlashcardsView onBack={() => setShowFlashcards(false)} />;
  }

  if (selectedSubject === 'M1') {
    return (
      <div className={isPage ? 'page-view' : 'overlay-modal'}>
        <div className={isPage ? 'summary-card page-card' : 'summary-card'}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="summary-back-btn" onClick={() => setSelectedSubject(null)}>←</button>
              <h3>📐 Resumen M1</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="fc-evaluate-btn" onClick={() => setShowFlashcards(true)}>
                🧠 Evalúate
              </button>
              {!isPage && <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>}
            </div>
          </div>
          {/* Topic quick-nav pills */}
          <div className="summary-topic-nav">
            {M1_SUMMARY.map((section, i) => {
              const c = COLORS[section.color] || COLORS.blue;
              return (
                <button
                  key={i}
                  className="summary-topic-pill"
                  style={{ background: c.bg, color: c.accent, borderColor: c.border }}
                  onClick={() => {
                    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {section.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
          <div className="modal-body summary-body">
            <div className="summary-formula-count">
              <span>📊</span> {M1_SUMMARY.reduce((acc, s) => acc + s.formulas.length + (s.extras?.length || 0), 0)} fórmulas en {M1_SUMMARY.length} temas
            </div>
            {M1_SUMMARY.map((section, i) => (
              <div key={i} id={`section-${i}`}>
                <SectionCard section={section} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedSubject) {
    const subj = SUBJECTS.find(s => s.key === selectedSubject);
    return (
      <div className={isPage ? 'page-view' : 'overlay-modal'}>
        <div className={isPage ? 'summary-card page-card' : 'summary-card'}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="summary-back-btn" onClick={() => setSelectedSubject(null)}>←</button>
              <h3>{subj?.emoji} {subj?.label}</h3>
            </div>
            {!isPage && <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>}
          </div>
          <div className="modal-body">
            <div className="summary-wip">
              <div className="summary-wip-emoji-row">
                <span className="summary-wip-icon">{subj?.emoji}</span>
                <span className="summary-wip-icon-plus">+</span>
                <span className="summary-wip-icon">📝</span>
              </div>
              <p className="summary-wip-title">Estamos preparando este resumen</p>
              <p className="summary-wip-text">El resumen de {subj?.label} estará disponible pronto con todas las fórmulas y contenidos clave.</p>
              <div className="summary-wip-progress">
                <div className="summary-wip-bar">
                  <div className="summary-wip-bar-fill" />
                </div>
                <span className="summary-wip-bar-label">En progreso...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isPage ? 'page-view' : 'overlay-modal'}>
      <div className={isPage ? 'summary-card page-card' : 'summary-card'}>
        <div className="modal-header">
          <h3>📚 Resúmenes</h3>
          {!isPage && <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>}
        </div>
        <div className="modal-body">
          {/* Hero section */}
          <div className="summary-hero">
            <div className="summary-hero-icon">📖</div>
            <h4 className="summary-hero-title">Tu biblioteca de fórmulas</h4>
            <p className="summary-hero-sub">Todo lo que necesitas para la PAES, resumido y organizado.</p>
          </div>

          {/* Flashcards CTA */}
          <button className="summary-flashcard-cta" onClick={() => setShowFlashcards(true)}>
            <div className="summary-cta-left">
              <span className="summary-cta-icon">🧠</span>
              <div>
                <span className="summary-cta-title">Evalúate con Flashcards</span>
                <span className="summary-cta-sub">Pon a prueba tu memoria con tarjetas interactivas</span>
              </div>
            </div>
            <span className="summary-cta-arrow">→</span>
          </button>

          {/* Subject grid */}
          <p className="summary-section-label">Elige una materia</p>
          <div className="summary-subject-grid">
            {SUBJECTS.map((s, i) => {
              const available = s.key === 'M1';
              return (
                <button
                  key={s.key}
                  className={`summary-subject-card${available ? ' summary-subject-available' : ''}`}
                  onClick={() => setSelectedSubject(s.key)}
                  style={{ '--card-color': s.iconColor, '--card-bg': s.color, animationDelay: `${i * 0.05}s` }}
                >
                  <div className="summary-subject-emoji">{s.emoji}</div>
                  <span className="summary-subject-name">{s.label}</span>
                  {available ? (
                    <span className="summary-subject-badge available">Disponible</span>
                  ) : (
                    <span className="summary-subject-badge coming">Pronto</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
