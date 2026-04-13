import { useState, useEffect } from 'react';

export default function FriendsModal({ apiUrl, userId, onClose }) {
  const [activeTab, setActiveTab] = useState('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendStats, setFriendStats] = useState(null);
  const [friendProgress, setFriendProgress] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load friends list
  const loadFriends = async () => {
    try {
      const res = await fetch(`${apiUrl}/amigos/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.amigos || []);
        setPendingReceived(data.pendientes_recibidas || []);
        setPendingSent(data.pendientes_enviadas || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadFriends(); }, []);

  // Search users
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${apiUrl}/usuarios/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out self
          setSearchResults(data.filter(u => String(u.id) !== String(userId)));
        }
      } catch { /* silent */ }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const sendRequest = async (targetId) => {
    try {
      const res = await fetch(`${apiUrl}/amigos/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_origen_id: parseInt(userId), usuario_destino_id: targetId }),
      });
      if (res.ok) {
        setSentRequests(prev => new Set([...prev, targetId]));
      }
    } catch { /* silent */ }
  };

  const respondRequest = async (originId, estado) => {
    try {
      const res = await fetch(`${apiUrl}/amigos/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_origen_id: originId, usuario_destino_id: parseInt(userId), estado }),
      });
      if (res.ok) {
        await loadFriends();
      }
    } catch { /* silent */ }
  };

  const viewFriendProfile = async (friend) => {
    setSelectedFriend(friend);
    setLoadingProfile(true);
    setFriendStats(null);
    setFriendProgress(null);
    try {
      const [statsRes, progressRes] = await Promise.all([
        fetch(`${apiUrl}/estadisticas/${friend.id}`),
        fetch(`${apiUrl}/progreso/${friend.id}`),
      ]);
      if (statsRes.ok) setFriendStats(await statsRes.json());
      if (progressRes.ok) setFriendProgress(await progressRes.json());
    } catch { /* silent */ }
    setLoadingProfile(false);
  };

  // Check if user is already friend or has pending request
  const getRelation = (targetId) => {
    if (friends.some(f => f.id === targetId)) return 'amigo';
    if (pendingSent.some(f => f.id === targetId)) return 'enviada';
    if (pendingReceived.some(f => f.id === targetId)) return 'recibida';
    if (sentRequests.has(targetId)) return 'enviada';
    return null;
  };

  // Friend profile view
  if (selectedFriend) {
    return (
      <div className="overlay-modal">
        <div className="friends-card">
          <div className="friends-hero">
            <button className="profile-close-btn" onClick={() => setSelectedFriend(null)} aria-label="Volver">←</button>
            <div className="profile-avatar">👤</div>
            <p className="profile-name">{selectedFriend.nombre}</p>
            <p style={{ fontSize: '14px', color: '#D1D5DB', marginTop: '-4px', marginBottom: '8px' }}>@{selectedFriend.username}</p>
            {selectedFriend.es_premium && <span className="friend-premium-tag">🌟 Premium</span>}
          </div>

          <div className="friends-body" style={{ padding: '20px 24px' }}>
            {loadingProfile && <p className="loading-text">Cargando perfil...</p>}

            {!loadingProfile && friendProgress && (
              <>
                <p className="friends-section-title">Rachas Activas</p>
                <div className="friend-streaks-grid">
                  {[
                    { label: 'M1', key: 'M1', emoji: '📐' },
                    { label: 'M2', key: 'M2', emoji: '📊' },
                    { label: 'Lectora', key: 'Lectora', emoji: '📖' },
                    { label: 'Ciencias', key: 'Ciencias', emoji: '🔬' },
                    { label: 'Historia', key: 'Historia', emoji: '🏛️' },
                  ].map(s => (
                    <div key={s.key} className="friend-streak-item">
                      <span>{s.emoji}</span>
                      <span className="friend-streak-label">{s.label}</span>
                      <span className="friend-streak-value">🔥 {friendProgress.streaks?.[s.key] || 0}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loadingProfile && friendStats && Object.keys(friendStats).length > 0 && (
              <>
                <p className="friends-section-title" style={{ marginTop: 20 }}>Rendimiento por Materia</p>
                {Object.entries(friendStats).map(([materia, categorias]) => {
                  let correctas = 0, total = 0;
                  for (const cat of categorias) {
                    const parts = cat.texto.split('/');
                    correctas += parseInt(parts[0]) || 0;
                    total += parseInt(parts[1]) || 0;
                  }
                  const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;
                  const color = pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : pct >= 25 ? '#EA580C' : '#DC2626';
                  const bg = pct >= 75 ? '#D1FAE5' : pct >= 50 ? '#FEF3C7' : pct >= 25 ? '#FFEDD5' : '#FEE2E2';
                  return (
                    <div key={materia} className="friend-stat-row">
                      <span className="friend-stat-name">{materia}</span>
                      <div className="friend-stat-bar-wrap">
                        <div className="friend-stat-bar" style={{ width: `${pct}%`, background: '#4F46E5' }} />
                      </div>
                      <span className="friend-stat-badge" style={{ color, background: bg }}>{pct}%</span>
                    </div>
                  );
                })}

                <p className="friends-section-title" style={{ marginTop: 20 }}>Detalle por Categoría</p>
                {Object.entries(friendStats).map(([materia, categorias]) => (
                  <div key={materia} className="friend-category-group">
                    <div className="friend-category-header">{materia}</div>
                    {categorias.map(cat => {
                      const color = cat.porcentaje >= 75 ? '#059669' : cat.porcentaje >= 50 ? '#D97706' : cat.porcentaje >= 25 ? '#EA580C' : '#DC2626';
                      const bg = cat.porcentaje >= 75 ? '#D1FAE5' : cat.porcentaje >= 50 ? '#FEF3C7' : cat.porcentaje >= 25 ? '#FFEDD5' : '#FEE2E2';
                      return (
                        <div key={cat.categoria} className="friend-category-row">
                          <span className="friend-category-name">{cat.categoria}</span>
                          <span className="friend-category-count">{cat.texto}</span>
                          <span className="friend-stat-badge" style={{ color, background: bg }}>{cat.porcentaje}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {!loadingProfile && (!friendStats || Object.keys(friendStats).length === 0) && (
              <p className="loading-text">Este usuario aún no tiene estadísticas.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-modal">
      <div className="friends-card">
        {/* Header */}
        <div className="friends-hero">
          <button className="profile-close-btn" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="profile-avatar">👥</div>
          <p className="profile-name">Amigos</p>

          <div className="friends-tabs">
            {[
              { key: 'buscar', label: 'Buscar' },
              { key: 'amigos', label: `Amigos (${friends.length})` },
              { key: 'solicitudes', label: pendingReceived.length > 0 ? `Solicitudes (${pendingReceived.length})` : 'Solicitudes' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="friends-body">
          {/* Search tab */}
          {activeTab === 'buscar' && (
            <div style={{ padding: '20px 24px' }}>
              <div className="friends-search-wrap">
                <span className="friends-search-icon">🔍</span>
                <input
                  className="friends-search-input"
                  type="text"
                  placeholder="Buscar por nombre o username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searching && <p className="loading-text">Buscando...</p>}

              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <p className="loading-text">No se encontraron usuarios.</p>
              )}

              <div className="friends-list">
                {searchResults.map(user => {
                  const relation = getRelation(user.id);
                  return (
                    <div key={user.id} className="friend-item">
                      <div className="friend-item-avatar">👤</div>
                      <div className="friend-item-info">
                        <span className="friend-item-name">{user.nombre}</span>
                        <span className="friend-item-username">@{user.username}</span>
                      </div>
                      {relation === 'amigo' ? (
                        <span className="friend-relation-badge" style={{ background: '#D1FAE5', color: '#059669' }}>Amigos</span>
                      ) : relation === 'enviada' ? (
                        <span className="friend-relation-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Enviada</span>
                      ) : relation === 'recibida' ? (
                        <span className="friend-relation-badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>Pendiente</span>
                      ) : (
                        <button className="friend-add-btn" onClick={() => sendRequest(user.id)}>
                          Agregar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Friends tab */}
          {activeTab === 'amigos' && (
            <div style={{ padding: '20px 24px' }}>
              {loading && <p className="loading-text">Cargando...</p>}
              {!loading && friends.length === 0 && (
                <p className="loading-text">Aún no tienes amigos. Busca usuarios para agregar.</p>
              )}
              <div className="friends-list">
                {friends.map(friend => (
                  <div key={friend.id} className="friend-item" onClick={() => viewFriendProfile(friend)} style={{ cursor: 'pointer' }}>
                    <div className="friend-item-avatar">👤</div>
                    <div className="friend-item-info">
                      <span className="friend-item-name">{friend.nombre}</span>
                      <span className="friend-item-username">@{friend.username}</span>
                    </div>
                    <span className="friend-view-btn">Ver perfil ›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests tab */}
          {activeTab === 'solicitudes' && (
            <div style={{ padding: '20px 24px' }}>
              {loading && <p className="loading-text">Cargando...</p>}

              {pendingReceived.length > 0 && (
                <>
                  <p className="friends-section-title">Solicitudes Recibidas</p>
                  <div className="friends-list">
                    {pendingReceived.map(user => (
                      <div key={user.id} className="friend-item">
                        <div className="friend-item-avatar">👤</div>
                        <div className="friend-item-info">
                          <span className="friend-item-name">{user.nombre}</span>
                          <span className="friend-item-username">@{user.username}</span>
                        </div>
                        <div className="friend-request-actions">
                          <button className="friend-accept-btn" onClick={() => respondRequest(user.id, 'aceptada')}>✓</button>
                          <button className="friend-reject-btn" onClick={() => respondRequest(user.id, 'rechazada')}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {pendingSent.length > 0 && (
                <>
                  <p className="friends-section-title" style={{ marginTop: pendingReceived.length > 0 ? 20 : 0 }}>Solicitudes Enviadas</p>
                  <div className="friends-list">
                    {pendingSent.map(user => (
                      <div key={user.id} className="friend-item">
                        <div className="friend-item-avatar">👤</div>
                        <div className="friend-item-info">
                          <span className="friend-item-name">{user.nombre}</span>
                          <span className="friend-item-username">@{user.username}</span>
                        </div>
                        <span className="friend-relation-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Pendiente</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!loading && pendingReceived.length === 0 && pendingSent.length === 0 && (
                <p className="loading-text">No tienes solicitudes pendientes.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
