export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="overlay-modal">
      <div className="glass-card">
        <div className="logout-card">
          <div className="logout-icon">🚪</div>
          <h3 className="logout-title">¿Cerrar sesión?</h3>
          <p className="logout-text">
            Tendrás que volver a ingresar tu correo y contraseña la próxima vez.
          </p>
          <div className="logout-actions">
            <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
            <button className="btn-danger" onClick={onConfirm}>Sí, salir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
