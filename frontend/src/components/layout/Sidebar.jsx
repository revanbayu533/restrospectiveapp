import React from 'react';
import { 
  Zap, 
  LayoutGrid, 
  Kanban, 
  Clock, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';

const iconMap = {
  LayoutGrid: LayoutGrid,
  Kanban: Kanban,
  Clock: Clock,
  FileText: FileText,
  Settings: Settings
};

export default function Sidebar({ 
  navItems, 
  activeNav, 
  onSelectNav, 
  recentWorkspaces, 
  activeWorkspaceId, 
  onSelectWorkspace,
  currentUser,
  onLogout 
}) {
  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Zap size={22} fill="#ffffff" />
        </div>
        <span className="brand-title">RetroNerve</span>
      </div>

      {/* Main Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || LayoutGrid;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectNav(item.id)}
            >
              <IconComponent size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Section: Terakhir Dibuka */}
      <div className="sidebar-section-title">
        Terakhir Dibuka
      </div>

      {/* Recent Workspaces List */}
      <div className="sidebar-recent-list">
        {recentWorkspaces.map((ws) => {
          const isLight = !ws.color || ws.color.toLowerCase() === '#ffffff' || ws.color.toLowerCase() === '#fff';
          return (
            <button
              key={ws.id}
              className={`recent-item ${activeWorkspaceId === ws.id ? 'active' : ''}`}
              onClick={() => onSelectWorkspace(ws.id)}
            >
              <div 
                className="recent-badge"
                style={{ 
                  backgroundColor: ws.color || '#5b52f9',
                  color: isLight ? '#0f172a' : '#ffffff' 
                }}
              >
                {ws.initial}
              </div>
              <span className="recent-name">{ws.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom User Profile */}
      <div className="sidebar-footer">
        <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="user-info-wrapper" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-avatar-container">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="user-avatar-img" 
              />
              <span className="user-status-dot" />
            </div>
            <div className="user-details" style={{ minWidth: 0 }}>
              <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</span>
              <span className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</span>
            </div>
          </div>
          {onLogout && (
            <button 
              type="button"
              className="user-logout-btn" 
              onClick={onLogout}
              title="Keluar (Logout)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                marginLeft: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
