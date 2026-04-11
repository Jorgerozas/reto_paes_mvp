import { useState } from 'react';

// Recibimos la propiedad "type"
export default function UpsellModal({ userId, type, onClose, onUpgrade }) {
  const [loading, setLoading] = useState(false);

  const handleVolversePremium = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://reto-paes-mvp.onrender.com/api/upgrade/${userId}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        onUpgrade();
      } else {
        alert("Hubo un problema al intentar actualizar tu cuenta.");
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Evaluamos de qué tipo es el bloqueo
  const isAll = type === 'all';
  const titulo = isAll ? '¡Reto Diario Completado!' : '¡Límite Alcanzado!';
  const texto = isAll
    ? '¡Increíble! Terminaste todas tus preguntas gratuitas de hoy en todas las materias. Vuelve mañana para mantener tus rachas, o suscríbete al plan Premium para entrenar sin límites.'
    : 'Ya completaste tus 3 preguntas gratuitas de hoy para esta materia. Pásate a Premium para seguir practicando de forma ilimitada, o entrena otra materia para subir tu puntaje de racha.';

  return (
    <div className="overlay-modal">
      <div className="glass-card">
        <div className="upsell-card">
          <span className="upsell-emoji">{isAll ? '🎉' : '🔒'}</span>
          <h2 className="upsell-title">{titulo}</h2>
          <p className="upsell-text">{texto}</p>
          <div className="upsell-actions">
            <button
              className="btn-premium"
              onClick={handleVolversePremium}
              disabled={loading}
            >
              {loading ? 'Procesando...' : '⭐ Ser Premium — Preguntas Ilimitadas'}
            </button>
            <button className="btn-ghost" onClick={onClose} disabled={loading}>
              Volver al tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
