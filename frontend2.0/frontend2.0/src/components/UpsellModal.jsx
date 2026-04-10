import { useState } from 'react';

export default function UpsellModal({ userId, onClose, onUpgrade }) {
  const [loading, setLoading] = useState(false);

  const handleVolversePremium = async () => {
    setLoading(true);
    try {
      // Llamamos al nuevo endpoint de FastAPI
      const res = await fetch(`https://reto-paes-mvp.onrender.com/api/upgrade/${userId}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        onUpgrade(); // Le avisa a App.jsx que el usuario ahora es Premium
      } else {
        alert("Hubo un problema al intentar actualizar tu cuenta.");
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay-modal">
      <div className="glass-card">
        <div className="upsell-card">
          <span className="upsell-emoji">🎉</span>
          <h2 className="upsell-title">¡Reto Diario Completado!</h2>
          <p className="upsell-text">
            ¡Increíble! Terminaste todas tus preguntas gratuitas de hoy.
            Vuelve mañana para mantener tu racha, o suscríbete al plan
            Premium para entrenar sin límites.
          </p>
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
