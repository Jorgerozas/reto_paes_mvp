const TABS = [
  { key: 'home',    label: 'Inicio',    icon: '📐' },
  { key: 'summary', label: 'Resumenes', icon: '📚' },
  { key: 'friends', label: 'Amigos',    icon: '👥' },
  { key: 'profile', label: 'Perfil',    icon: '👤' },
];

export default function BottomNav({ activeTab, onChange, hasNotification }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`bottom-nav-item${activeTab === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
          aria-label={tab.label}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
          {tab.key === 'friends' && hasNotification && (
            <span className="bottom-nav-badge" />
          )}
        </button>
      ))}
    </nav>
  );
}
