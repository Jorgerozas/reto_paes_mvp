export default function UpsellModal({ onClose }) {
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
              onClick={() => alert('Próximamente: Integración con pagos (Flow/Stripe)')}
            >
              ⭐ Ser Premium — Preguntas Ilimitadas
            </button>
            <button className="btn-ghost" onClick={onClose}>
              Volver al tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
