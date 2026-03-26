import { useState } from 'react';

export default function AuthModal({ apiUrl, onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const toggle = () => { setIsLoginMode(m => !m); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !password) {
      setError('Por favor, completa correctamente todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = isLoginMode ? '/login' : '/registro';
    const payload  = isLoginMode
      ? { email, password }
      : { email, nombre: name, password };

    try {
      const res  = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Error en la autenticación.');
        return;
      }

      const displayName = isLoginMode ? data.nombre : name;
      localStorage.setItem('retoPaes_userId', data.usuario_id);
      localStorage.setItem('retoPaes_userName', displayName);

      const progresoRes = await fetch(`${apiUrl}/progreso/${data.usuario_id}`);
      const progreso    = progresoRes.ok ? await progresoRes.json() : null;

      onLogin(data.usuario_id, displayName, progreso || {
        streaks:      { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
        preguntasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
        correctasHoy: { M1: 0, M2: 0, Lectora: 0, Ciencias: 0, Historia: 0 },
      });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay-modal">
      <div className="glass-card">
        <div className="auth-card">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-logo">🚀</div>
            <h2 className="auth-title">
              {isLoginMode ? 'Bienvenido a Reto PAES' : 'Crea tu Cuenta'}
            </h2>
            <p className="auth-subtitle">
              {isLoginMode
                ? 'Ingresa para guardar tu progreso'
                : 'Únete y asegura tu puntaje PAES'}
            </p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input
                className="auth-input"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                className="auth-input"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading
                ? 'Cargando...'
                : isLoginMode
                ? 'Comenzar a entrenar →'
                : 'Registrarme →'}
            </button>
          </form>

          <p className="auth-toggle">
            {isLoginMode ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <a onClick={toggle}>
              {isLoginMode ? 'Regístrate aquí' : 'Inicia sesión'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
