import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LayoutGrid, List, Search, ArrowLeft, Plus } from 'lucide-react';
import { api } from './services/api';

// Sidebar Navigation Items
const sidebarNavItems = [
  { id: "workspace", label: "Workspace", icon: "LayoutGrid", active: true },
  { id: "my-boards", label: "My Boards", icon: "Kanban", active: false },
  { id: "activity", label: "Activity", icon: "Clock", active: false },
  { id: "templates", label: "Templates", icon: "FileText", active: false },
  { id: "settings", label: "Settings", icon: "Settings", active: false }
];

// Auth Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Layout & Workspace Components
import Sidebar from './components/layout/Sidebar';
import WorkspaceHeader from './components/workspace/WorkspaceHeader';
import WorkspaceList from './components/workspace/WorkspaceList';
import WorkspaceCard from './components/workspace/WorkspaceCard';
import CreateWorkspaceCard from './components/workspace/CreateWorkspaceCard';
import WorkspaceSwitcher from './components/workspace/WorkspaceSwitcher';
import ActiveWorkspaceCard from './components/workspace/ActiveWorkspaceCard';
import MembersListCard from './components/workspace/MembersListCard';
import RecentBoardsCard from './components/workspace/RecentBoardsCard';
import WorkspaceBoardsView from './components/workspace/WorkspaceBoardsView';
import WorkspaceEmptyState from './components/workspace/WorkspaceEmptyState';

// Board Detail & Modals
import RetroBoardDetail from './components/board/RetroBoardDetail';
import CreateWorkspaceModal from './components/modals/CreateWorkspaceModal';
import CreateBoardModal from './components/modals/CreateBoardModal';
import InviteMemberModal from './components/modals/InviteMemberModal';
import Toast from './components/common/Toast';

const DEFAULT_MEMBERS = [
  {
    id: 'm1',
    name: 'Afrizal (Anda)',
    role: 'Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=afrizal@gmail.com',
    isOnline: true,
  },
  {
    id: 'm2',
    name: 'Sarah Wijaya',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah@gmail.com',
    isOnline: true,
  },
  {
    id: 'm3',
    name: 'Budi Santoso',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi@gmail.com',
    isOnline: false,
  },
  {
    id: 'm4',
    name: 'Dewi Lestari',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dewi@gmail.com',
    isOnline: false,
  },
  {
    id: 'm5',
    name: 'Andi Pratama',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andi@gmail.com',
    isOnline: true,
  },
  {
    id: 'm6',
    name: 'Rian Kusuma',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rian@gmail.com',
    isOnline: false,
  },
  {
    id: 'm7',
    name: 'Citra Kirana',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=citra@gmail.com',
    isOnline: true,
  },
  {
    id: 'm8',
    name: 'Dimas Anggara',
    role: 'Member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dimas@gmail.com',
    isOnline: false,
  }
];

const INITIAL_WORKSPACES = [
  {
    id: 'ws_01H8J2KX6PYZQ4M5N2R7D3E1F',
    name: 'Mobile Team',
    initial: 'M',
    color: '#5956e9',
    role: 'Owner',
    description: 'Tim pengembangan aplikasi mobile',
    longDescription: 'Workspace untuk tim pengembangan aplikasi mobile. Semua retrospective dan diskusi tim dilakukan di sini',
    memberCount: 8,
    dateText: 'Dibuat 20 Jun 2026',
    isRecent: true,
    members: DEFAULT_MEMBERS,
    boards: [
      {
        id: 'board_sprint15',
        title: 'Sprint 15 Retrospective',
        description: 'Evaluasi sprint aplikasi mobile periode 15.',
        membersCount: 8,
        dateText: 'Dibuat 20 Jun 2026',
        updatedText: 'Diperbarui 20 Jun 2024',
        theme: { bg: '#f3f0ff', color: '#7c3aed' },
        color: '#7c3aed',
      },
      {
        id: 'board_q2_review',
        title: 'Quarter 2 Review',
        description: 'Evaluasi dan refleksi kerja tim pada Q2.',
        membersCount: 12,
        dateText: 'Dibuat 30 Jun 2026',
        updatedText: 'Diperbarui 30 Jun 2024',
        theme: { bg: '#eff6ff', color: '#2563eb' },
        color: '#2563eb',
      },
      {
        id: 'board_sprint14',
        title: 'Sprint 14 Retrospective',
        description: 'Evaluasi sprint sebelumnya untuk perbaikan.',
        membersCount: 7,
        dateText: 'Dibuat 6 Jun 2026',
        updatedText: 'Diperbarui 6 Jun 2024',
        theme: { bg: '#f0fdf4', color: '#16a34a' },
        color: '#16a34a',
      }
    ]
  },
  {
    id: 'ws_02WEBTEAM',
    name: 'Web Team',
    initial: 'W',
    color: '#2563eb',
    role: 'Member',
    description: 'Tim frontend & backend website aplikasi',
    longDescription: 'Workspace untuk tim website dan portal web RetroNerve.',
    memberCount: 6,
    dateText: 'Dibuat 15 Mei 2026',
    isRecent: true,
    members: DEFAULT_MEMBERS.slice(0, 6),
    boards: [
      {
        id: 'board_web_s1',
        title: 'Website Redesign Retro',
        description: 'Refleksi rilis UI homepage dan flow pendaftaran baru.',
        membersCount: 6,
        dateText: 'Dibuat 15 Mei 2026',
        updatedText: 'Diperbarui 15 Mei 2024',
        theme: { bg: '#eff6ff', color: '#2563eb' },
        color: '#2563eb',
      }
    ]
  },
  {
    id: 'ws_03QASQUAD',
    name: 'QA Squad',
    initial: 'Q',
    color: '#10b981',
    role: 'Member',
    description: 'Tim QA & Automated Testing',
    longDescription: 'Workspace evaluasi kualitas dan kestabilan aplikasi.',
    memberCount: 4,
    dateText: 'Dibuat 2 Mei 2026',
    isRecent: true,
    members: DEFAULT_MEMBERS.slice(0, 4),
    boards: [
      {
        id: 'board_qa_s1',
        title: 'Automation Testing Sync',
        description: 'Evaluasi coverage unit test dan integrasi CI/CD pipeline.',
        membersCount: 4,
        dateText: 'Dibuat 2 Mei 2026',
        updatedText: 'Diperbarui 2 Mei 2024',
        theme: { bg: '#f0fdf4', color: '#16a34a' },
        color: '#16a34a',
      }
    ]
  }
];

export default function App() {
  // Page Routing State: 'login' | 'register' | 'dashboard'
  const [currentPage, setCurrentPage] = useState(() => 
    localStorage.getItem('access_token') ? 'dashboard' : 'login'
  );
  const [user, setUser] = useState(null);

  // Main Dashboard View State: 'workspace-detail' | 'all-workspaces' | 'board-detail'
  const [dashboardView, setDashboardView] = useState('workspace-detail');
  const [activeBoard, setActiveBoard] = useState(null);

  // Dashboard States
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');
  const [activeNav, setActiveNav] = useState('workspace');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Trigger Toast Notification
  const showToast = useCallback((message) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  }, []);

  // Fetch Workspaces from Backend API with real members and real boards
  const fetchWorkspaces = useCallback(async (currentUserObj) => {
    try {
      const data = await api.getWorkspaces();
      if (data && Array.isArray(data) && data.length > 0) {
        const fullWorkspaces = await Promise.all(
          data.map(async (ws, idx) => {
            let boards = [];
            try {
              const res = await api.getBoards(ws.id);
              if (Array.isArray(res)) {
                boards = res.map((b) => ({
                  id: b.id,
                  title: b.name || b.title,
                  name: b.name || b.title,
                  template: b.template,
                  isAnonymous: b.isAnonymous,
                  voteLimit: b.voteLimit,
                  cardsCount: b.cardsCount || (b._count ? b._count.cards : 0) || 0,
                  createdAt: b.createdAt,
                  theme: { bg: '#f3f0ff', color: '#7c3aed' },
                }));
              }
            } catch {
              boards = [];
            }

            const initial = (ws.name || 'W').substring(0, 1).toUpperCase();
            
            // Real members formatting from backend
            let members = [];
            if (ws.members && Array.isArray(ws.members) && ws.members.length > 0) {
              members = ws.members.map((m) => {
                const u = m.user || m;
                const uEmail = u.email || '';
                const uName = u.name || (uEmail ? uEmail.split('@')[0] : 'Anggota');
                const isMe = currentUserObj && (u.id === currentUserObj.id || m.userId === currentUserObj.id);
                return {
                  id: m.userId || m.id || u.id,
                  name: isMe ? `${uName} (Anda)` : uName,
                  role: m.role || (m.userId === ws.ownerId || u.id === ws.ownerId ? 'Owner' : 'Member'),
                  email: uEmail,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uEmail || uName}`,
                  isOnline: true,
                };
              });
            }

            // If members array empty from API, default to current user as Owner
            if (members.length === 0 && currentUserObj) {
              members = [{
                id: currentUserObj.id || 'owner',
                name: currentUserObj.fullName || `${currentUserObj.name} (Anda)`,
                role: 'Owner',
                email: currentUserObj.email,
                avatar: currentUserObj.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserObj.email}`,
                isOnline: true,
              }];
            }

            return {
              id: ws.id,
              name: ws.name,
              initial,
              color: idx === 0 ? '#5956e9' : idx === 1 ? '#2563eb' : '#10b981',
              role: ws.ownerId === currentUserObj?.id ? 'Owner' : 'Owner',
              description: `Workspace untuk ${ws.name}`,
              longDescription: `Workspace untuk tim ${ws.name}. Semua retrospective dan diskusi tim dilakukan di sini`,
              memberCount: members.length,
              dateText: 'Dibuat baru saja',
              isRecent: true,
              members,
              boards,
            };
          })
        );
        
        setWorkspaces(fullWorkspaces);
        if (fullWorkspaces.length > 0) {
          setActiveWorkspaceId((prev) => {
            const exists = fullWorkspaces.some((w) => w.id === prev);
            return exists ? prev : fullWorkspaces[0].id;
          });
        }
      }
    } catch (err) {
      console.warn('Gagal fetch workspaces:', err);
    }
  }, []);

  // Initial Auth Check on Mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await api.getMe();
          const formattedUser = {
            id: userData.id,
            name: userData.name || userData.email.split('@')[0],
            fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
            email: userData.email,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
            isOnline: true
          };
          setUser(formattedUser);
          setCurrentPage('dashboard');
          await fetchWorkspaces(formattedUser);
        } catch {
          api.logout();
          setUser(null);
          setCurrentPage('login');
        }
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    }
    checkAuth();
  }, [fetchWorkspaces]);

  // Active Workspace Object
  const activeWorkspace = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    return workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0];
  }, [workspaces, activeWorkspaceId]);

  // Recent Workspaces for Sidebar
  const recentWorkspaces = useMemo(() => {
    return workspaces.filter((ws) => ws.isRecent);
  }, [workspaces]);

  // Filtered Workspaces for Grid
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    return workspaces.filter((ws) => 
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaces, searchQuery]);

  // Auth Handlers
  const handleLoginSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      isOnline: true
    };
    setUser(formattedUser);
    showToast("Berhasil masuk! Mengarahkan ke Dashboard...");
    setCurrentPage('dashboard');
    setDashboardView('workspace-detail');
    await fetchWorkspaces(formattedUser);
  };

  const handleRegisterSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      isOnline: true
    };
    setUser(formattedUser);
    showToast(`Akun "${formattedUser.name}" berhasil dibuat!`);
    setCurrentPage('dashboard');
    setDashboardView('workspace-detail');
    await fetchWorkspaces(formattedUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setWorkspaces([]);
    setCurrentPage('login');
    showToast('Berhasil keluar dari akun');
  };

  // Handler: Create Workspace
  const handleCreateWorkspace = async (newWsData) => {
    const wsName = newWsData.name.trim();
    const initial = wsName.charAt(0).toUpperCase();

    const currentOwner = {
      id: user.id || 'user_owner',
      name: user.fullName || `${user.name} (Anda)`,
      role: 'Owner',
      email: user.email,
      avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
      isOnline: true,
    };

    try {
      const res = await api.createWorkspace(wsName);
      const wsId = res.workspace?.id || res.id || `ws_${Date.now()}`;

      const newWorkspaceObj = {
        id: wsId,
        name: wsName,
        initial,
        color: newWsData.color || '#5956e9',
        role: 'Owner',
        description: newWsData.description || `Workspace untuk tim ${wsName}`,
        longDescription: `Workspace untuk tim ${wsName}. Semua retrospective dan diskusi tim dilakukan di sini`,
        memberCount: 1,
        dateText: `Dibuat baru saja`,
        isRecent: true,
        members: [currentOwner],
        boards: [], // Clean empty boards for newly created workspace
      };

      setWorkspaces((prev) => [newWorkspaceObj, ...prev]);
      setActiveWorkspaceId(wsId);
      setDashboardView('workspace-detail');
      showToast(`Workspace "${wsName}" berhasil dibuat!`);
    } catch (err) {
      showToast(err.message || 'Gagal membuat workspace');
    }
  };

  // Handler: Create Board within Active Workspace
  const handleCreateBoard = async (newBoardData) => {
    if (!activeWorkspace) return;

    setWorkspaces((prev) => {
      return prev.map((ws) => {
        if (ws.id === activeWorkspace.id) {
          const currentBoards = ws.boards || [];
          return {
            ...ws,
            boards: [newBoardData, ...currentBoards]
          };
        }
        return ws;
      });
    });

    showToast(`Board "${newBoardData.title}" berhasil dibuat!`);

    // Sync to backend
    try {
      const saved = await api.createBoard(activeWorkspace.id, {
        name: newBoardData.title,
        template: newBoardData.template || 'went-well-wrong-action',
      });
      // Update the board with the real ID from backend
      if (saved?.id) {
        setWorkspaces((prev) =>
          prev.map((ws) => {
            if (ws.id !== activeWorkspace.id) return ws;
            return {
              ...ws,
              boards: (ws.boards || []).map((b) =>
                b.id === newBoardData.id ? { ...b, id: saved.id, dbId: saved.id } : b
              ),
            };
          })
        );
      }
    } catch {
      // Local state already updated — backend might be offline
    }
  };

  // Handler: Open Retrospective Board
  const handleOpenBoard = (board) => {
    setActiveBoard(board);
    setDashboardView('board-detail');
    setActiveNav('my-boards');
    showToast(`Membuka sesi: ${board.title || board.name}`);
  };

  // Handler: Update Workspace Info
  const handleUpdateWorkspace = async (workspaceId, updateData) => {
    try {
      await api.updateWorkspace(workspaceId, updateData);
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                name: updateData.name || w.name,
                initial: (updateData.name || w.name).substring(0, 1).toUpperCase(),
                description: updateData.description || w.description,
                longDescription: updateData.description || w.longDescription,
              }
            : w
        )
      );
      showToast(`Workspace "${updateData.name}" berhasil diperbarui!`);
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui workspace');
    }
  };

  // Handler: Delete Workspace
  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
    if (activeWorkspaceId === workspaceId) {
      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      if (remaining.length > 0) {
        setActiveWorkspaceId(remaining[0].id);
      }
    }
    showToast(`Workspace "${workspaceName || ''}" berhasil dihapus`);
    try {
      await api.deleteWorkspace(workspaceId);
    } catch {
      // Ignored
    }
  };

  // Handler: Select Workspace from Sidebar or Switcher
  const handleSelectWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId);
    setDashboardView('workspace-detail');
    setActiveNav('workspace');
  };

  return (
    <>
      {/* 1. Auth: Login Page */}
      {currentPage === 'login' && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentPage('register')}
        />
      )}

      {/* 2. Auth: Register Page */}
      {currentPage === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentPage('login')}
        />
      )}

      {/* 3. Dashboard Application */}
      {currentPage === 'dashboard' && (
        <div className="dashboard-layout">
          {/* Left Sidebar */}
          <Sidebar 
            navItems={sidebarNavItems}
            activeNav={activeNav}
            onSelectNav={(navId) => {
              if (navId === 'workspace') {
                setActiveNav('workspace');
                setDashboardView('workspace-detail');
              } else if (navId === 'my-boards') {
                if (activeWorkspace?.boards && activeWorkspace.boards.length > 0) {
                  setActiveNav('my-boards');
                  handleOpenBoard(activeWorkspace.boards[0]);
                } else {
                  showToast('Belum ada board aktif di workspace ini. Silakan buat board terlebih dahulu.');
                  setActiveNav('workspace');
                  setDashboardView('workspace-detail');
                }
              } else {
                showToast(`Menu ${navId} akan hadir pada update berikutnya`);
              }
            }}
            recentWorkspaces={recentWorkspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={handleSelectWorkspace}
            currentUser={user}
            onLogout={handleLogout}
          />

          {/* Main Area: If user has no workspaces, render Onboarding Empty State */}
          {(!workspaces || workspaces.length === 0) && (
            <WorkspaceEmptyState 
              currentUser={user}
              onCreateWorkspace={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* Interactive Retrospective Board View (When a board is opened) */}
          {workspaces.length > 0 && dashboardView === 'board-detail' && activeBoard && (
            <RetroBoardDetail 
              workspace={activeWorkspace}
              board={activeBoard}
              currentUser={user}
              onBack={() => {
                setDashboardView('workspace-detail');
                setActiveNav('workspace');
              }}
              onSwitchBoard={handleOpenBoard}
              onShowToast={showToast}
            />
          )}

          {/* Workspace Boards View */}
          {dashboardView === 'workspace-detail' && activeWorkspace && (
            <WorkspaceBoardsView 
              workspace={activeWorkspace}
              workspaces={workspaces}
              currentUser={user}
              onSelectWorkspace={handleSelectWorkspace}
              onOpenBoard={handleOpenBoard}
              onCreateBoardModalOpen={() => setIsCreateBoardModalOpen(true)}
              onCreateWorkspaceModalOpen={() => setIsCreateModalOpen(true)}
              onInviteModalOpen={() => setIsInviteModalOpen(true)}
              onDeleteWorkspace={handleDeleteWorkspace}
              onUpdateWorkspace={handleUpdateWorkspace}
              onShowToast={showToast}
              onNavigateAllWorkspaces={() => setDashboardView('all-workspaces')}
            />
          )}

          {/* All Workspaces Grid View (If user wants to see all workspaces) */}
          {dashboardView === 'all-workspaces' && (
            <div style={{ display: 'flex', width: '100%' }}>
              <main className="dashboard-main-content">
                <WorkspaceHeader 
                  onCreateWorkspace={() => setIsCreateModalOpen(true)} 
                />

                <section className="workspaces-section">
                  <div className="section-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => setDashboardView('workspace-detail')}
                        style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title={`Kembali ke ${activeWorkspace?.name || 'Workspace'}`}
                      >
                        <ArrowLeft size={16} />
                        <span>Kembali ke {activeWorkspace?.name || 'Workspace'}</span>
                      </button>
                      <h2 className="section-title" style={{ margin: 0 }}>Semua Workspace</h2>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '450px' }}>
                      <div className="switcher-search-container" style={{ flex: 1, margin: 0 }}>
                        <Search size={16} className="switcher-search-icon" />
                        <input 
                          type="text"
                          className="switcher-search-input"
                          placeholder="Cari workspace..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="view-mode-toggle">
                        <button
                          className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setViewMode('grid')}
                          title="Tampilan Grid"
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                          title="Tampilan Daftar"
                        >
                          <List size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={viewMode === 'grid' ? 'workspaces-grid' : 'workspace-list-container'}>
                    {filteredWorkspaces.map((workspace) => (
                      <WorkspaceCard 
                        key={workspace.id}
                        workspace={workspace}
                        isSelected={workspace.id === activeWorkspaceId}
                        onSelect={(id) => {
                          setActiveWorkspaceId(id);
                          setDashboardView('workspace-detail');
                        }}
                        onDeleteWorkspace={handleDeleteWorkspace}
                        viewMode={viewMode}
                      />
                    ))}

                    <CreateWorkspaceCard 
                      onClick={() => setIsCreateModalOpen(true)} 
                    />
                  </div>
                </section>

                {activeWorkspace && (
                  <WorkspaceSwitcher 
                    workspaces={workspaces}
                    activeWorkspace={activeWorkspace}
                    onSelectWorkspace={(id) => {
                      setActiveWorkspaceId(id);
                      setDashboardView('workspace-detail');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onCreateWorkspace={() => setIsCreateModalOpen(true)}
                  />
                )}
              </main>

              {activeWorkspace && (
                <aside className="dashboard-right-sidebar">
                  <ActiveWorkspaceCard 
                    workspace={activeWorkspace} 
                    onShowToast={showToast}
                    onDeleteWorkspace={handleDeleteWorkspace}
                  />

                  <MembersListCard 
                    workspace={activeWorkspace}
                    onInviteClick={() => setIsInviteModalOpen(true)}
                    onViewAllMembers={() => showToast(`Menampilkan anggota ${activeWorkspace.name}`)}
                  />

                  <RecentBoardsCard 
                    workspace={activeWorkspace}
                    onViewAllBoards={() => setDashboardView('workspace-detail')}
                    onOpenBoard={(board) => handleOpenBoard(board)}
                  />
                </aside>
              )}
            </div>
          )}

          {/* Modals */}
          <CreateWorkspaceModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateWorkspace}
          />

          <CreateBoardModal 
            isOpen={isCreateBoardModalOpen}
            onClose={() => setIsCreateBoardModalOpen(false)}
            onCreateBoard={handleCreateBoard}
            workspaceName={activeWorkspace?.name}
            workspace={activeWorkspace}
            workspaces={workspaces}
          />


          {activeWorkspace && (
            <InviteMemberModal 
              isOpen={isInviteModalOpen}
              onClose={() => setIsInviteModalOpen(false)}
              workspaceId={activeWorkspace.id}
              workspaceName={activeWorkspace.name}
              onShowToast={showToast}
            />
          )}
        </div>
      )}

      {/* Global Notification Toast */}
      <Toast 
        message={toastMessage} 
        isVisible={isToastVisible} 
      />
    </>
  );
}
