import { useState, useMemo } from 'react';

const CARD_COLORS = [
  { bg: '#EEF2FF', border: '#C7D2FE', accent: '#4F46E5', light: '#4F46E5' },
  { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A', light: '#16A34A' },
  { bg: '#FAF5FF', border: '#E9D5FF', accent: '#9333EA', light: '#9333EA' },
  { bg: '#FFF7ED', border: '#FED7AA', accent: '#EA580C', light: '#EA580C' },
  { bg: '#FFF1F2', border: '#FECDD3', accent: '#E11D48', light: '#E11D48' },
  { bg: '#ECFEFF', border: '#A5F3FC', accent: '#0891B2', light: '#0891B2' },
  { bg: '#FFFBEB', border: '#FDE68A', accent: '#D97706', light: '#D97706' },
  { bg: '#F0F9FF', border: '#BAE6FD', accent: '#0284C7', light: '#0284C7' },
];

const M1_FLASHCARDS = [
  // Porcentajes y Proporcionalidad
  { q: '¿Cómo se calcula el p% de un valor X?', a: '(p / 100) · X', cat: 'Porcentajes' },
  { q: 'Si un producto sube un 20%, ¿por cuánto multiplicas el precio original?', a: 'Por 1.20  (se multiplica por 1 + p/100)', cat: 'Porcentajes' },
  { q: '¿Cuál es la fórmula de variación porcentual?', a: '((valor final − valor inicial) / valor inicial) · 100', cat: 'Porcentajes' },
  { q: 'En proporcionalidad directa, si x se duplica, ¿qué pasa con y?', a: 'y también se duplica (y = k · x)', cat: 'Proporcionalidad' },
  { q: 'En proporcionalidad inversa, si x se triplica, ¿qué pasa con y?', a: 'y se reduce a un tercio (x · y = k)', cat: 'Proporcionalidad' },
  { q: '¿Qué se mantiene constante en la proporcionalidad directa?', a: 'El cociente y/x = k', cat: 'Proporcionalidad' },
  { q: '¿Qué se mantiene constante en la proporcionalidad inversa?', a: 'El producto x · y = k', cat: 'Proporcionalidad' },

  // Potencias y Raíces
  { q: '¿Cuánto vale cualquier número elevado a 0?', a: '1 (siempre que la base no sea 0)', cat: 'Potencias' },
  { q: '¿Qué significa un exponente negativo?', a: 'El inverso: a⁻ⁿ = 1/aⁿ', cat: 'Potencias' },
  { q: 'Al multiplicar potencias de igual base, ¿qué se hace con los exponentes?', a: 'Se suman: aᵐ · aⁿ = aᵐ⁺ⁿ', cat: 'Potencias' },
  { q: 'Al dividir potencias de igual base, ¿qué se hace con los exponentes?', a: 'Se restan: aᵐ / aⁿ = aᵐ⁻ⁿ', cat: 'Potencias' },
  { q: '¿Qué ocurre con una potencia de potencia?', a: 'Se multiplican los exponentes: (aᵐ)ⁿ = aᵐ·ⁿ', cat: 'Potencias' },
  { q: '¿Cuánto vale √(a²)?', a: '|a| (valor absoluto de a)', cat: 'Raíces' },
  { q: '¿Se puede separar la raíz de un producto?', a: 'Sí: √(a·b) = √a · √b', cat: 'Raíces' },

  // Productos Notables
  { q: '¿Cuál es el resultado de (a + b)²?', a: 'a² + 2ab + b²', cat: 'Productos Notables' },
  { q: '¿Cuál es el resultado de (a − b)²?', a: 'a² − 2ab + b²', cat: 'Productos Notables' },
  { q: '¿Cuál es el resultado de (a + b)(a − b)?', a: 'a² − b² (diferencia de cuadrados)', cat: 'Productos Notables' },
  { q: '¿Cuál es la diferencia entre (a + b)² y a² + b²?', a: 'Falta el término 2ab. (a+b)² = a² + 2ab + b²', cat: 'Productos Notables' },

  // Factorización
  { q: '¿Cómo se factoriza ab + ac?', a: 'Factor común: a(b + c)', cat: 'Factorización' },
  { q: '¿Cómo se factoriza a² − b²?', a: '(a + b)(a − b)', cat: 'Factorización' },
  { q: '¿Cómo se factoriza x² + bx + c?', a: '(x + p)(x + q) donde p + q = b y p · q = c', cat: 'Factorización' },
  { q: '¿Qué es un trinomio cuadrado perfecto?', a: 'Una expresión de la forma a² ± 2ab + b² que se factoriza como (a ± b)²', cat: 'Factorización' },

  // Ecuación Cuadrática
  { q: '¿Cuál es la fórmula de Bhaskara?', a: 'x = (−b ± √(b² − 4ac)) / 2a', cat: 'Ec. Cuadrática' },
  { q: '¿Qué es el discriminante de una ecuación cuadrática?', a: 'D = b² − 4ac. Determina cuántas soluciones reales tiene.', cat: 'Ec. Cuadrática' },
  { q: 'Si el discriminante es negativo, ¿cuántas soluciones reales hay?', a: 'Ninguna (no hay soluciones en los reales)', cat: 'Ec. Cuadrática' },
  { q: 'Si el discriminante es cero, ¿cuántas soluciones reales hay?', a: 'Exactamente una (raíz doble)', cat: 'Ec. Cuadrática' },
  { q: 'Si el discriminante es positivo, ¿cuántas soluciones reales hay?', a: 'Dos soluciones reales distintas', cat: 'Ec. Cuadrática' },

  // Función Lineal
  { q: '¿Qué representa la "m" en y = mx + n?', a: 'La pendiente: indica cuánto sube o baja la recta por cada unidad horizontal', cat: 'Función Lineal' },
  { q: '¿Qué representa la "n" en y = mx + n?', a: 'El intercepto con el eje Y (donde la recta cruza el eje vertical)', cat: 'Función Lineal' },
  { q: '¿Cómo se calcula la pendiente entre dos puntos?', a: 'm = (y₂ − y₁) / (x₂ − x₁)', cat: 'Función Lineal' },
  { q: '¿Qué condición cumplen dos rectas paralelas?', a: 'Tienen la misma pendiente: m₁ = m₂', cat: 'Función Lineal' },
  { q: '¿Qué condición cumplen dos rectas perpendiculares?', a: 'El producto de sus pendientes es −1: m₁ · m₂ = −1', cat: 'Función Lineal' },
  { q: 'Si una recta tiene pendiente positiva, ¿cómo se ve?', a: 'Sube de izquierda a derecha (crece)', cat: 'Función Lineal' },

  // Función Cuadrática
  { q: '¿Cuál es la fórmula del eje de simetría de una parábola?', a: 'x = −b / 2a', cat: 'Parábola' },
  { q: '¿Cómo se encuentra el vértice de f(x) = ax² + bx + c?', a: 'V = (−b/2a,  f(−b/2a))', cat: 'Parábola' },
  { q: 'Si a > 0 en f(x) = ax² + bx + c, ¿hacia dónde abre la parábola?', a: 'Hacia arriba (el vértice es un mínimo)', cat: 'Parábola' },
  { q: 'Si a < 0 en f(x) = ax² + bx + c, ¿hacia dónde abre la parábola?', a: 'Hacia abajo (el vértice es un máximo)', cat: 'Parábola' },
  { q: '¿Dónde corta el eje Y la función f(x) = ax² + bx + c?', a: 'En el punto (0, c)', cat: 'Parábola' },
  { q: '¿Qué representan las raíces de una función cuadrática gráficamente?', a: 'Los puntos donde la parábola corta el eje X', cat: 'Parábola' },

  // Ángulos
  { q: '¿Cuánto suman dos ángulos suplementarios?', a: '180°', cat: 'Ángulos' },
  { q: '¿Cuánto suman dos ángulos complementarios?', a: '90°', cat: 'Ángulos' },
  { q: '¿Cuánto suman los ángulos interiores de un triángulo?', a: '180°', cat: 'Ángulos' },
  { q: '¿Cuál es la fórmula para la suma de ángulos interiores de un polígono?', a: '(n − 2) · 180° donde n es el número de lados', cat: 'Ángulos' },

  // Pitágoras
  { q: '¿En qué tipo de triángulo se aplica el teorema de Pitágoras?', a: 'Solo en triángulos rectángulos (con un ángulo de 90°)', cat: 'Pitágoras' },
  { q: '¿Cómo se enuncia el teorema de Pitágoras?', a: 'c² = a² + b² (hipotenusa² = suma de catetos²)', cat: 'Pitágoras' },
  { q: 'En un triángulo 30-60-90, si el cateto menor mide a, ¿cuánto mide la hipotenusa?', a: '2a', cat: 'Pitágoras' },
  { q: 'En un triángulo 45-45-90, si los catetos miden a, ¿cuánto mide la hipotenusa?', a: 'a√2', cat: 'Pitágoras' },

  // Áreas
  { q: '¿Cuál es el área de un círculo?', a: 'A = π r²', cat: 'Áreas' },
  { q: '¿Cuál es el área de un triángulo?', a: 'A = (base · altura) / 2', cat: 'Áreas' },
  { q: '¿Cuál es el área de un trapecio?', a: 'A = (Base mayor + base menor) · altura / 2', cat: 'Áreas' },
  { q: '¿Cuál es el volumen de un cilindro?', a: 'V = π r² h', cat: 'Áreas' },
  { q: '¿Cuál es el perímetro de una circunferencia?', a: 'P = 2πr', cat: 'Áreas' },

  // Thales y Semejanza
  { q: '¿Qué dice el Teorema de Thales?', a: 'Si rectas paralelas cortan a dos transversales, los segmentos formados son proporcionales: a/b = c/d', cat: 'Thales' },
  { q: '¿Qué significa que dos triángulos sean semejantes?', a: 'Tienen la misma forma (ángulos iguales) pero pueden tener distinto tamaño. Sus lados son proporcionales.', cat: 'Semejanza' },
  { q: '¿Cuál es el criterio AA de semejanza?', a: 'Si dos triángulos tienen 2 ángulos iguales, son semejantes', cat: 'Semejanza' },
  { q: 'Si la razón de semejanza es k, ¿cuál es la razón de las áreas?', a: 'k² (se eleva al cuadrado)', cat: 'Semejanza' },

  // Estadística y Probabilidad
  { q: '¿Cómo se calcula la media aritmética (promedio)?', a: 'x̄ = suma de todos los datos / cantidad de datos', cat: 'Estadística' },
  { q: '¿Qué es la frecuencia relativa?', a: 'Frecuencia absoluta dividida por el total de datos', cat: 'Estadística' },
  { q: '¿Cuál es la fórmula de probabilidad clásica (Laplace)?', a: 'P(A) = casos favorables / casos posibles', cat: 'Probabilidad' },
  { q: '¿Cómo se calcula la probabilidad del complemento?', a: 'P(A\') = 1 − P(A)', cat: 'Probabilidad' },
  { q: 'Si dos eventos son independientes, ¿cómo se calcula P(A ∩ B)?', a: 'P(A) · P(B)', cat: 'Probabilidad' },
  { q: '¿Cuál es la fórmula de P(A ∪ B) cuando los eventos NO son mutuamente excluyentes?', a: 'P(A) + P(B) − P(A ∩ B)', cat: 'Probabilidad' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsView({ onBack }) {
  const cards = useMemo(() => shuffle(M1_FLASHCARDS), []);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const progress = ((index + 1) / cards.length) * 100;

  const next = () => {
    if (index < cards.length - 1) {
      setFlipped(false);
      setTimeout(() => setIndex(i => i + 1), 150);
    }
  };

  const prev = () => {
    if (index > 0) {
      setFlipped(false);
      setTimeout(() => setIndex(i => i - 1), 150);
    }
  };

  const restart = () => {
    setFlipped(false);
    setIndex(0);
  };

  const done = index >= cards.length - 1 && flipped;

  return (
    <div className="overlay-modal">
      <div className="summary-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="summary-back-btn" onClick={onBack}>←</button>
            <div>
              <h3>🧠 Flashcards M1</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {index + 1} / {cards.length}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onBack} aria-label="Cerrar">×</button>
        </div>

        {/* Progress bar */}
        <div className="fc-progress-wrap">
          <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
          {/* Category pill */}
          <span className="fc-cat-pill" style={{ color: color.accent, background: color.bg, borderColor: color.border }}>
            {card.cat}
          </span>

          {/* Card */}
          <div
            className={`fc-card-container${flipped ? ' fc-flipped' : ''}`}
            onClick={() => setFlipped(f => !f)}
          >
            <div className="fc-card-inner">
              {/* Front */}
              <div className="fc-card-face fc-card-front" style={{ background: color.bg, borderColor: color.border }}>
                <span className="fc-card-hint">Toca para ver la respuesta</span>
                <p className="fc-card-text">{card.q}</p>
              </div>
              {/* Back */}
              <div className="fc-card-face fc-card-back" style={{ background: color.accent }}>
                <span className="fc-card-hint" style={{ color: 'rgba(255,255,255,0.6)' }}>Respuesta</span>
                <p className="fc-card-text" style={{ color: '#fff' }}>{card.a}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="fc-nav">
            <button className="fc-nav-btn" onClick={prev} disabled={index === 0}>← Anterior</button>
            {done ? (
              <button className="fc-nav-btn fc-nav-primary" onClick={restart}>Reiniciar</button>
            ) : (
              <button className="fc-nav-btn fc-nav-primary" onClick={next} disabled={index >= cards.length - 1}>
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
