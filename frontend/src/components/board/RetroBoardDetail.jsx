import React, { useState, useEffect, useCallback } from 'react';
import {
  MoreHorizontal,
  Share2,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  Loader2,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  Send,
  User,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useBoardPusher } from '../../hooks/useBoardPusher';

// Default columns fallback based on retro template
const DEFAULT_TEMPLATE_COLUMNS = {
  'start-stop-continue': [
    { id: 'col_start', name: 'Start (Mulai Lakukan)', order: 1, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { id: 'col_stop', name: 'Stop (Hentikan)', order: 2, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { id: 'col_continue', name: 'Continue (Lanjutkan)', order: 3, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  ],
  'mad-sad-glad': [
    { id: 'col_mad', name: 'Mad (Kecewa/Marah)', order: 1, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { id: 'col_sad', name: 'Sad (Sedih/Cemas)', order: 2, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { id: 'col_glad', name: 'Glad (Senang/Puas)', order: 3, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  ],
  '4ls': [
    { id: 'col_liked', name: 'Liked (Disukai)', order: 1, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { id: 'col_learned', name: 'Learned (Dipelajari)', order: 2, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'col_lacked', name: 'Lacked (Kurang)', order: 3, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { id: 'col_longed', name: 'Longed for (Diharapkan)', order: 4, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  ],
  default: [
    { id: 'col_went_well', name: 'What Went Well', order: 1, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { id: 'col_improved', name: 'What Could Be Improved', order: 2, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { id: 'col_action', name: 'Action Items', order: 3, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  ],
};

// Board navigation tabs
const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

export default function RetroBoardDetail({
  workspace,
  board,
  onBack,
  onSwitchBoard,
  currentUser,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('board');
  const [isSaving, setIsSaving] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);

  // Column & Card States
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Card creation input per column state
  const [addingColId, setAddingColId] = useState(null);
  const [cardInputs, setCardInputs] = useState({});

  // Card editing state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const boardId = board?.id;
  const templateKey = board?.template || 'start-stop-continue';

  // Load Board detail & cards from backend API
  const loadBoardContent = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      // 1. Fetch Board Detail (with Columns)
      let backendColumns = [];
      try {
        const boardData = await api.getBoardById(boardId);
        if (boardData?.columns && Array.isArray(boardData.columns) && boardData.columns.length > 0) {
          backendColumns = boardData.columns;
        }
      } catch {
        // Fallback to template columns if endpoint fails
      }

      // If no columns from backend, use fallback template columns
      if (backendColumns.length === 0) {
        backendColumns = DEFAULT_TEMPLATE_COLUMNS[templateKey] || DEFAULT_TEMPLATE_COLUMNS.default;
      }

      // Assign theme colors if not present
      const formattedColumns = backendColumns.map((col, idx) => {
        const themeList = DEFAULT_TEMPLATE_COLUMNS[templateKey] || DEFAULT_TEMPLATE_COLUMNS.default;
        const fallbackTheme = themeList[idx % themeList.length];
        return {
          id: col.id,
          name: col.name,
          order: col.order || idx + 1,
          color: col.color || fallbackTheme?.color || '#5956e9',
          bg: col.bg || fallbackTheme?.bg || '#f8fafc',
          border: col.border || fallbackTheme?.border || '#cbd5e1',
        };
      });

      setColumns(formattedColumns);

      // 2. Fetch Cards
      try {
        const cardsData = await api.getCards(boardId);
        if (Array.isArray(cardsData)) {
          setCards(cardsData);
        }
      } catch {
        // Keep empty cards array if cards endpoint not returning
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, templateKey]);

  useEffect(() => {
    loadBoardContent();
  }, [loadBoardContent]);

  // Realtime Pusher Subscription untuk Board Aktif
  useBoardPusher(boardId, {
    onCardCreated: (newCard) => {
      if (!newCard || !newCard.id) return;
      setCards((prev) => {
        if (prev.some((c) => c.id === newCard.id)) return prev;
        return [...prev, newCard];
      });
      if (newCard.authorId !== currentUser?.id && newCard.author?.id !== currentUser?.id) {
        if (onShowToast) {
          onShowToast(`${newCard.author?.name || 'Anggota'} menambahkan catatan baru`);
        }
      }
    },
    onCardUpdated: (updatedCard) => {
      if (!updatedCard || !updatedCard.id) return;
      setCards((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c))
      );
    },
    onCardDeleted: (deletedData) => {
      if (!deletedData || !deletedData.id) return;
      setCards((prev) => prev.filter((c) => c.id !== deletedData.id));
    },
    onVoteUpdated: (voteData) => {
      if (!voteData || !voteData.cardId) return;
      setCards((prev) =>
        prev.map((c) => (c.id === voteData.cardId ? { ...c, votes: voteData.votes, voteCount: voteData.voteCount } : c))
      );
    },
    onCommentCreated: (commentData) => {
      if (onShowToast && commentData?.authorName) {
        onShowToast(`Komentar baru dari ${commentData.authorName}`);
      }
    },
    onTimerUpdated: (timerData) => {
      // Reserved for timer updates
    },
  });

  // Handler: Share Board Link
  const handleShare = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
    if (onShowToast) onShowToast('Link board berhasil disalin!');
  };

  // Handler: Create Card (Card 7)
  const handleCreateCard = async (columnId) => {
    const text = cardInputs[columnId]?.trim();
    if (!text) return;

    setIsSaving(true);
    try {
      // Call Backend API
      const res = await api.createCard(boardId, columnId, text);
      const newCard = res.card || {
        id: `card_${Date.now()}`,
        boardId,
        columnId,
        content: text,
        authorId: currentUser?.id || 'current_user',
        author: {
          id: currentUser?.id || 'current_user',
          name: currentUser?.name || 'Anda',
          email: currentUser?.email || '',
        },
        createdAt: new Date().toISOString(),
      };

      setCards((prev) => [...prev, newCard]);
      setCardInputs((prev) => ({ ...prev, [columnId]: '' }));
      setAddingColId(null);
      if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal menambahkan catatan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Start Editing Card (Card 8)
  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditContent(card.content);
  };

  // Handler: Save Edit Card (Card 8)
  const handleSaveEdit = async (cardId) => {
    const text = editContent.trim();
    if (!text) return;

    setIsSaving(true);
    try {
      await api.updateCard(cardId, text);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, content: text } : c))
      );
      setEditingCardId(null);
      setEditContent('');
      if (onShowToast) onShowToast('Catatan berhasil diperbarui!');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal memperbarui catatan (Hanya pembuat yang diizinkan)');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Delete Card (Card 8)
  const handleDeleteCard = async (card) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;

    setIsSaving(true);
    try {
      await api.deleteCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      if (onShowToast) onShowToast('Catatan berhasil dihapus');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal menghapus catatan (Hanya pembuat yang diizinkan)');
    } finally {
      setIsSaving(false);
    }
  };

  const boardTitle = board?.title || board?.name || 'Sprint Retrospective';
  const wsName = workspace?.name || 'Workspace Saya';
  const wsColor = workspace?.color || '#5956e9';
  const memberCount = workspace?.memberCount || board?.membersCount || 1;
  const dateText = board?.dateText || (board?.createdAt ? `Dibuat ${new Date(board.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Dibuat baru saja');

  return (
    <div className="retro-board-full-view">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="retro-full-topbar">
        <div className="retro-full-breadcrumbs">
          <button
            type="button"
            className="retro-crumb-btn"
            onClick={onBack}
          >
            Workspace Saya
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          <button
            type="button"
            className="retro-crumb-btn"
            onClick={onBack}
          >
            {wsName}
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          
          {workspace?.boards && workspace.boards.length > 1 ? (
            <div className="retro-board-switcher-container" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="button"
                className="retro-crumb-active-btn"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '13px'
                }}
              >
                <span>{boardTitle}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isBoardDropdownOpen && (
                <div 
                  className="retro-board-dropdown-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    zIndex: 50,
                    minWidth: '220px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Pindah Board di {wsName}
                  </div>
                  {workspace.boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        if (onSwitchBoard) onSwitchBoard(b);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: b.id === board?.id ? '#5956e9' : '#334155',
                        fontWeight: b.id === board?.id ? 600 : 400,
                        backgroundColor: b.id === board?.id ? '#f1f5f9' : 'transparent',
                        borderRadius: '6px',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{b.title || b.name}</span>
                      {b.id === board?.id && <Check size={14} color="#5956e9" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="retro-crumb-active">{boardTitle}</span>
          )}
        </div>

        {/* Top right icons (grid, bell, avatar) */}
        <div className="retro-full-topbar-right">
          <button type="button" className="btn-icon-top" title="Tampilan">
            <LayoutGrid size={18} />
          </button>
          <button type="button" className="btn-icon-top notification-btn" title="Notifikasi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge-dot"></span>
          </button>
          <div className="top-user-avatar-wrapper">
            <img
              src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
              alt={currentUser?.name || 'User'}
              className="top-user-avatar"
            />
          </div>
        </div>
      </div>

      {/* ── Board Header Banner ── */}
      <div className="retro-board-header-banner">
        <div className="retro-board-header-left">
          {/* 4-dot icon */}
          <div className="retro-board-icon-box" style={{ backgroundColor: board?.theme?.bg || '#f3f0ff' }}>
            <div className="four-dots-icon" style={{ '--dot-color': board?.color || wsColor }}>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div className="retro-board-header-info">
            <h1 className="retro-board-header-title">{boardTitle}</h1>
            <div className="retro-board-header-meta">
              <span className="retro-meta-ws">{wsName}</span>
              <span className="retro-meta-sep">·</span>
              <User size={14} />
              <span className="retro-meta-members">{memberCount} anggota</span>
              <span className="retro-meta-sep">·</span>
              <Clock size={14} />
              <span className="retro-meta-date">{dateText}</span>

              {/* Saving indicator */}
              {isSaving && (
                <span className="retro-meta-sep" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '12px' }}>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Menyimpan...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="retro-board-header-right">
          <button type="button" className="btn-ghost-icon" title="Opsi board">
            <MoreHorizontal size={18} />
          </button>
          <button
            type="button"
            className="btn-share-board"
            onClick={handleShare}
          >
            + Bagikan Board
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="retro-board-tabs">
        {BOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`retro-board-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Interactive Board Canvas (Columns & Cards) ── */}
      {activeTab === 'board' && (
        <div className="retro-board-canvas-container" style={{ padding: '24px 0', width: '100%', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b', gap: '8px' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Memuat papan retrospective...</span>
            </div>
          ) : (
            <div 
              className="retro-columns-grid" 
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))`,
                gap: '20px',
                alignItems: 'start'
              }}
            >
              {columns.map((col) => {
                const columnCards = cards.filter((c) => c.columnId === col.id);

                return (
                  <div
                    key={col.id}
                    className="retro-column-card"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: `1px solid ${col.border || '#e2e8f0'}`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: 'calc(100vh - 280px)',
                      minHeight: '350px'
                    }}
                  >
                    {/* Column Header */}
                    <div
                      className="retro-column-header"
                      style={{
                        padding: '14px 16px',
                        backgroundColor: col.bg || '#f8fafc',
                        borderBottom: `2px solid ${col.color || '#5956e9'}`,
                        borderTopLeftRadius: '11px',
                        borderTopRightRadius: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: col.color || '#5956e9'
                          }}
                        />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                          {col.name}
                        </h3>
                      </div>

                      <span
                        style={{
                          backgroundColor: '#ffffff',
                          color: col.color || '#5956e9',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${col.border || '#e2e8f0'}`
                        }}
                      >
                        {columnCards.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div
                      className="retro-cards-list"
                      style={{
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        overflowY: 'auto',
                        flex: 1
                      }}
                    >
                      {columnCards.length === 0 && addingColId !== col.id && (
                        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
                          Belum ada catatan. Klik tombol + di bawah untuk menambah feedback.
                        </div>
                      )}

                      {columnCards.map((card) => {
                        const isOwner = card.authorId === currentUser?.id || card.author?.id === currentUser?.id;

                        return (
                          <div
                            key={card.id}
                            className="retro-sticky-card"
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              position: 'relative'
                            }}
                          >
                            {editingCardId === card.id ? (
                              /* Inline Edit Card Mode */
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={3}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #3b82f6',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    resize: 'vertical'
                                  }}
                                  placeholder="Edit isi catatan..."
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCardId(null)}
                                    style={{ padding: '4px 8px', fontSize: '12px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(card.id)}
                                    style={{ padding: '4px 10px', fontSize: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display Sticky Card Content */
                              <>
                                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {card.content}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <img
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author?.email || card.author?.name || 'user'}`}
                                      alt={card.author?.name || 'Author'}
                                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                                      {card.author?.name || 'Anggota'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {/* Edit & Delete Action Buttons for Card Owner */}
                                    {isOwner && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(card)}
                                          title="Edit catatan (Hanya milik Anda)"
                                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCard(card)}
                                          title="Hapus catatan (Hanya milik Anda)"
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Inline New Card Input Box */}
                      {addingColId === col.id && (
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: `2px solid ${col.color || '#5956e9'}`,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          <textarea
                            value={cardInputs[col.id] || ''}
                            onChange={(e) => setCardInputs({ ...cardInputs, [col.id]: e.target.value })}
                            placeholder={`Tulis masukan untuk ${col.name}...`}
                            rows={3}
                            autoFocus
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              marginBottom: '8px'
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setAddingColId(null)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateCard(col.id)}
                              disabled={!cardInputs[col.id]?.trim()}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: col.color || '#5956e9',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: cardInputs[col.id]?.trim() ? 'pointer' : 'not-allowed',
                                opacity: cardInputs[col.id]?.trim() ? 1 : 0.6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Send size={12} />
                              <span>Tambah Catatan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column Footer: Add Card Button */}
                    {addingColId !== col.id && (
                      <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => setAddingColId(col.id)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: col.bg || '#f8fafc',
                            color: col.color || '#5956e9',
                            border: `1px dashed ${col.border || '#cbd5e1'}`,
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Plus size={16} />
                          <span>Tambah Catatan</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Diskusi ── */}
      {activeTab === 'diskusi' && (
        <div className="retro-tab-placeholder" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px 0' }}>
          <MessageSquare size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#1e293b' }}>Diskusi Tim</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Fitur diskusi dan komentar sesama anggota workspace akan hadir di sini.</p>
        </div>
      )}

      {/* ── Tab 3: Action Items ── */}
      {activeTab === 'action-items' && (
        <div className="retro-tab-placeholder" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px 0' }}>
          <CheckSquare size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#1e293b' }}>Action Items</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Daftar rencana tindakan perbaikan yang disepakati bersama tim.</p>
        </div>
      )}

      {/* ── Tab 4: Aktivitas ── */}
      {activeTab === 'aktivitas' && (
        <div className="retro-tab-placeholder" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px 0' }}>
          <Activity size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#1e293b' }}>Aktivitas Board</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Log aktivitas semua anggota di board retrospective ini.</p>
        </div>
      )}
    </div>
  );
}
