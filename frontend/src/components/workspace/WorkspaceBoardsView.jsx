import React, { useState } from 'react';
import { 
  Plus, 
  User, 
  Calendar, 
  MoreVertical, 
  ArrowRight, 
  Settings, 
  LayoutGrid, 
  Bell, 
  Copy, 
  Check, 
  UserPlus, 
  FileText, 
  FileCheck2,
  Trash2,
  Edit2,
  CheckCircle2,
  Users,
  Layers,
  Activity,
  ChevronRight
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function WorkspaceBoardsView({
  workspace,
  workspaces,
  onSelectWorkspace,
  onOpenBoard,
  onCreateBoardModalOpen,
  onCreateWorkspaceModalOpen,
  onInviteModalOpen,
  onDeleteWorkspace,
  onUpdateWorkspace,
  onDeleteBoard,
  onShowToast,
  currentUser,
  onNavigateAllWorkspaces
}) {
  const [activeTab, setActiveTab] = useState('board'); // 'overview' | 'anggota' | 'board' | 'pengaturan'
  const [copied, setCopied] = useState(false);
  const [activeDropdownBoardId, setActiveDropdownBoardId] = useState(null);

  // Settings tab form states
  const [editWsName, setEditWsName] = useState(workspace?.name || '');
  const [editWsDesc, setEditWsDesc] = useState(workspace?.description || workspace?.longDescription || '');
  const [isUpdatingWs, setIsUpdatingWs] = useState(false);

  React.useEffect(() => {
    if (workspace) {
      setEditWsName(workspace.name || '');
      setEditWsDesc(workspace.description || workspace.longDescription || '');
    }
  }, [workspace]);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!editWsName.trim()) {
      if (onShowToast) onShowToast('Nama workspace tidak boleh kosong');
      return;
    }
    setIsUpdatingWs(true);
    try {
      if (onUpdateWorkspace) {
        await onUpdateWorkspace(workspace.id, {
          name: editWsName.trim(),
          description: editWsDesc.trim(),
        });
      }
    } finally {
      setIsUpdatingWs(false);
    }
  };

  // Copy ID Workspace Handler
  const handleCopyId = () => {
    const wsId = workspace?.id || 'ws_01H8J2KX6PYZQ4M5N2R7D3E1F';
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(wsId);
    }
    setCopied(true);
    if (onShowToast) {
      onShowToast(`ID Workspace ${workspace?.name} berhasil disalin!`);
    }
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const boards = workspace?.boards || workspace?.recentBoards || [];
  
  // Real members from workspace data or logged in user (no fake fallback users)
  const realMembers = (workspace?.members && workspace.members.length > 0)
    ? workspace.members
    : (currentUser ? [{
        id: currentUser.id || 'current-user',
        name: currentUser.fullName || currentUser.name || 'User',
        role: workspace?.role || 'Owner',
        avatar: currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`,
        isOnline: true,
      }] : []);

  const memberCount = realMembers.length;
  const totalCardsCount = boards.reduce((sum, b) => sum + (b.cardsCount || (b.cards ? b.cards.length : 0)), 0);

  return (
    <div className="workspace-boards-layout">
      {/* 1. Main Central Board Area */}
      <div className="workspace-boards-main">
        {/* Top Header / Breadcrumbs & Action Icons */}
        <div className="workspace-top-bar">
          <div className="workspace-breadcrumbs">
            <button 
              type="button"
              className="breadcrumb-root-link"
              onClick={onNavigateAllWorkspaces}
              title="Lihat Semua Workspace"
            >
              Workspace Saya
            </button>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <span className="breadcrumb-current">{workspace?.name || 'Mobile Team'}</span>
          </div>

          <div className="workspace-top-actions">
            <button 
              type="button" 
              className="btn-icon-top" 
              title="Semua Aplikasi & Tampilan"
              onClick={onNavigateAllWorkspaces}
            >
              <LayoutGrid size={18} />
            </button>

            <button 
              type="button" 
              className="btn-icon-top notification-btn" 
              title="Notifikasi"
              onClick={() => onShowToast && onShowToast('Tidak ada notifikasi baru')}
            >
              <Bell size={18} />
              <span className="notification-badge-dot"></span>
            </button>

            <div className="top-user-avatar-wrapper" title={currentUser?.name}>
              <img 
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=afrizal@gmail.com'} 
                alt={currentUser?.name || 'User'} 
                className="top-user-avatar"
              />
            </div>
          </div>
        </div>

        {/* Workspace Identity Profile Banner */}
        <div className="workspace-banner-header">
          <div className="ws-banner-profile">
            <div 
              className="ws-large-badge" 
              style={{ backgroundColor: workspace?.color || '#5956e9' }}
            >
              {workspace?.initial || workspace?.name?.substring(0, 1) || 'M'}
            </div>
            <div className="ws-banner-info">
              <div className="ws-title-row">
                <h1 className="ws-banner-title">{workspace?.name || 'Mobile Team'}</h1>
                <span className="ws-badge-owner">{workspace?.role || 'Owner'}</span>
              </div>
              <p className="ws-banner-desc">
                {workspace?.description || 'Tim pengembangan aplikasi mobile'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="ws-navigation-tabs">
            <button 
              type="button" 
              className={`ws-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              type="button" 
              className={`ws-tab-btn ${activeTab === 'anggota' ? 'active' : ''}`}
              onClick={() => setActiveTab('anggota')}
            >
              Anggota
            </button>
            <button 
              type="button" 
              className={`ws-tab-btn ${activeTab === 'board' ? 'active' : ''}`}
              onClick={() => setActiveTab('board')}
            >
              Board
            </button>
            <button 
              type="button" 
              className={`ws-tab-btn ${activeTab === 'pengaturan' ? 'active' : ''}`}
              onClick={() => setActiveTab('pengaturan')}
            >
              Pengaturan
            </button>
          </div>
        </div>

        {/* Tab 1: Board Content (Default / Matching Screenshot) */}
        {activeTab === 'board' && (
          <div className="ws-board-tab-content">
            {/* Section Header */}
            <div className="board-section-header">
              <div>
                <h2 className="board-section-title">Board Retrospective</h2>
                <p className="board-section-subtitle">
                  Kelola semua board retrospective di workspace ini.
                </p>
              </div>

              <button 
                type="button"
                className="btn btn-primary btn-create-ws-top"
                onClick={onCreateBoardModalOpen}
              >
                <Plus size={18} />
                <span>Buat Workspace</span>
              </button>
            </div>

            {/* Board Cards Grid */}
            <div className="ws-board-cards-grid">
              {boards.map((board, idx) => {
                // Determine card icon style & dot color
                const iconColorStyle = board.theme?.color || (
                  idx === 0 ? '#7c3aed' : idx === 1 ? '#2563eb' : '#16a34a'
                );
                const iconBgStyle = board.theme?.bg || (
                  idx === 0 ? '#f3f0ff' : idx === 1 ? '#eff6ff' : '#f0fdf4'
                );

                return (
                  <div 
                    key={board.id || idx} 
                    className="retro-board-card"
                    onClick={() => onOpenBoard(board)}
                  >
                    <div className="retro-card-top">
                      {/* 4-circle Icon Box */}
                      <div 
                        className="retro-icon-box"
                        style={{ backgroundColor: iconBgStyle }}
                      >
                        <div className="four-dots-icon" style={{ '--dot-color': iconColorStyle }}>
                          <span></span><span></span><span></span><span></span>
                        </div>
                      </div>

                      {/* Dropdown 3-dots menu */}
                      <div className="retro-dropdown-container">
                        <button 
                          type="button"
                          className="btn-ghost-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownBoardId(activeDropdownBoardId === board.id ? null : board.id);
                          }}
                          title="Opsi board"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdownBoardId === board.id && (
                          <div 
                            className="retro-dropdown-popup"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              type="button"
                              onClick={() => {
                                setActiveDropdownBoardId(null);
                                onOpenBoard(board);
                              }}
                            >
                              <ArrowRight size={14} />
                              <span>Buka Board</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setActiveDropdownBoardId(null);
                                if (onShowToast) onShowToast(`Duplikasi board "${board.title}"`);
                              }}
                            >
                              <Copy size={14} />
                              <span>Duplikat Board</span>
                            </button>
                            <button 
                              type="button"
                              className="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownBoardId(null);
                                if (window.confirm(`Apakah Anda yakin ingin menghapus board "${board.title || board.name}"?`)) {
                                  if (onDeleteBoard) {
                                    onDeleteBoard(board.id, board.title || board.name);
                                  } else if (onShowToast) {
                                    onShowToast(`Board "${board.title}" dihapus`);
                                  }
                                }
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Hapus Board</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="retro-card-title">{board.title}</h3>
                    <p className="retro-card-desc">
                      {board.description || 'Evaluasi sprint dan refleksi capaian kinerja tim.'}
                    </p>

                    <div className="retro-card-meta">
                      <div className="meta-item">
                        <User size={14} />
                        <span>{memberCount} anggota</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>
                          {board.createdAt 
                            ? `Dibuat ${new Date(board.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                            : 'Baru saja'}
                        </span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="btn-buka-board"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBoard(board);
                      }}
                    >
                      <span>Buka Board</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                );
              })}

              {/* Dashed Create New Board / Workspace Card */}
              <div 
                className="retro-create-card-dashed"
                onClick={onCreateBoardModalOpen}
              >
                <div className="dashed-plus-icon-box">
                  <Plus size={22} />
                </div>
                <h3 className="dashed-card-title">Buat Workspace Baru</h3>
                <p className="dashed-card-desc">
                  Mulai sesi retrospective baru bersama tim Anda
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Overview Content */}
        {activeTab === 'overview' && (
          <div className="ws-overview-tab-content">
            <div className="overview-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div className="stat-value">{boards.length}</div>
                  <div className="stat-label">Total Board Retrospective</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div className="stat-value">{memberCount}</div>
                  <div className="stat-label">Anggota Tim Aktif</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="stat-value">{totalCardsCount}</div>
                  <div className="stat-label">Total Catatan / Cards</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <div className="stat-value">Aktif</div>
                  <div className="stat-label">Status Workspace</div>
                </div>
              </div>
            </div>

            <div className="overview-activity-box">
              <h3 className="overview-subhead">Aktivitas Terakhir di {workspace?.name}</h3>
              <div className="activity-timeline">
                {boards.length > 0 ? (
                  boards.map((b, idx) => (
                    <div key={b.id || idx} className="activity-item">
                      <div className="activity-bullet"></div>
                      <div className="activity-text">
                        <strong>{currentUser?.name || 'Anggota'}</strong> membuat board <em>{b.name || b.title}</em>
                        <span className="activity-time">{b.timeText || b.dateText || 'Baru saja'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Belum ada aktivitas board di workspace ini. Klik 'Buat Workspace' atau 'Buat Board' untuk memulainya.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Anggota Content */}
        {activeTab === 'anggota' && (
          <div className="ws-members-tab-content">
            <div className="members-tab-header">
              <div>
                <h2 className="board-section-title">Daftar Anggota Tim ({memberCount})</h2>
                <p className="board-section-subtitle">Kelola anggota yang memiliki akses ke workspace ini</p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={onInviteModalOpen}
              >
                <UserPlus size={16} />
                <span>Undang Anggota Baru</span>
              </button>
            </div>

            <div className="members-full-table-card">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {realMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="member-table-user">
                          <img src={member.avatar} alt={member.name} className="member-avatar-img" />
                          <div>
                            <div className="member-name">{member.name}</div>
                            <div className="member-email-small">{member.email || `${member.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={member.role}>{member.role}</Badge>
                      </td>
                      <td>
                        <span className="status-badge-online">
                          <span className="online-dot"></span> Aktif
                        </span>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-ghost-icon" 
                          onClick={() => onShowToast && onShowToast(`Pengaturan akses untuk ${member.name}`)}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Pengaturan Content */}
        {activeTab === 'pengaturan' && (
          <div className="ws-settings-tab-content">
            <h2 className="board-section-title">Pengaturan Workspace</h2>
            <p className="board-section-subtitle">Perbarui informasi dan konfigurasi umum workspace</p>

            <form className="settings-form-card" onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Nama Workspace</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  placeholder="Masukkan nama workspace..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Tim</label>
                <textarea 
                  className="form-textarea" 
                  rows={3} 
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  placeholder="Masukkan deskripsi workspace..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdatingWs || !editWsName.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
                >
                  {isUpdatingWs ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>

              <div className="settings-danger-zone">
                <h4 className="danger-zone-title">Zona Berbahaya</h4>
                <p className="danger-zone-desc">
                  Menghapus workspace akan menghapus semua board, catatan retrospective, dan data terkait secara permanen.
                </p>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  style={{ borderColor: '#fca5a5', color: '#ef4444' }}
                  onClick={() => {
                    if (window.confirm(`Hapus workspace "${workspace?.name}"?`)) {
                      onDeleteWorkspace(workspace.id, workspace.name);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  <span>Hapus Workspace Ini</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. Right Sidebar Detail Panels (Pixel-perfect matching screenshot) */}
      <aside className="workspace-boards-right-sidebar">
        {/* Widget 1: WORKSPACE AKTIF */}
        <div className="right-panel-card">
          <div className="panel-header-title">
            WORKSPACE AKTIF
          </div>

          <div className="active-ws-identity">
            <Avatar 
              initial={workspace?.initial || 'M'} 
              color={workspace?.color || '#5956e9'} 
              size="md" 
            />
            <div>
              <div className="card-title-group">
                <h3 className="active-ws-name">{workspace?.name || 'Mobile Team'}</h3>
                <span className="ws-badge-owner-small">{workspace?.role || 'Owner'}</span>
              </div>
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">ID Workspace</div>
            <div className="field-id-box">
              <span className="field-id-text" title={workspace?.id}>
                {workspace?.id?.length > 28 ? `${workspace?.id?.substring(0, 26)}...` : (workspace?.id || 'ws_01H8J2KX6PYZQ4M5N2R7D3E1F')}
              </span>
              <button 
                type="button"
                className="copy-button"
                onClick={handleCopyId}
                title="Salin ID Workspace"
              >
                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">Deskripsi</div>
            <p className="field-description-text">
              {workspace?.longDescription || workspace?.description || 'Workspace untuk tim pengembangan aplikasi mobile. Semua retrospective dan diskusi tim dilakukan di sini'}
            </p>
          </div>

          <button 
            type="button"
            className="btn btn-outline btn-full-width btn-pengaturan-ws"
            onClick={() => setActiveTab('pengaturan')}
          >
            <Settings size={15} />
            <span>Pengaturan Workspace</span>
          </button>
        </div>

        {/* Widget 2: ANGGOTA (8) */}
        <div className="right-panel-card">
          <div className="panel-header-title">
            <span>ANGGOTA ({memberCount})</span>
            <button 
              type="button"
              className="panel-action-link"
              onClick={onInviteModalOpen}
            >
              <UserPlus size={14} />
              <span>Undang Anggota</span>
            </button>
          </div>

          <div className="members-list">
            {realMembers.slice(0, 4).map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <div className="member-avatar-wrapper">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="member-avatar-img"
                    />
                    {member.isOnline && <span className="member-online-dot" />}
                  </div>
                  <div>
                    <div className="member-name">{member.name}</div>
                    <div className="member-role">{member.role}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="btn-ghost-icon"
                  onClick={() => onShowToast && onShowToast(`Opsi untuk ${member.name}`)}
                  title="Opsi anggota"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button"
            className="panel-footer-link-btn"
            onClick={() => setActiveTab('anggota')}
          >
            <span>Lihat semua anggota</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Widget 3: BOARD TERBARU */}
        <div className="right-panel-card">
          <div className="panel-header-title">
            BOARD TERBARU
          </div>

          <div className="boards-list">
            {boards.slice(0, 2).map((board, idx) => (
              <div key={board.id || idx} className="board-item">
                <div className="board-info">
                  <div className="board-icon-box">
                    {idx === 1 ? (
                      <FileCheck2 size={18} color="#64748b" />
                    ) : (
                      <FileText size={18} color="#64748b" />
                    )}
                  </div>
                  <div className="board-details">
                    <div className="board-title" title={board.title}>
                      {board.title}
                    </div>
                    <div className="board-updated">
                      {board.createdAt 
                        ? `Diperbarui ${new Date(board.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                        : 'Baru saja'}
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="btn-action-small"
                  onClick={() => onOpenBoard(board)}
                >
                  Buka
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button"
            className="panel-footer-link-btn"
            onClick={() => setActiveTab('board')}
          >
            <span>Lihat semua board</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </aside>
    </div>
  );
}
