import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MoreHorizontal,
  Share2,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  Send,
  User,
  Clock,
  ThumbsUp,
  Layers,
  FolderPlus,
  Unlink,
  GripVertical,
  Sparkles,
  Copy,
  Flame,
  ArrowRight,
  Wifi,
  WifiOff,
  MoveRight,
} from 'lucide-react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { api } from '../../services/api';
import { useBoardPusher } from '../../hooks/useBoardPusher';
import Spinner from '../common/Spinner';
import CardCommentsModal from './CardCommentsModal';
import RetroTimerWidget from './RetroTimerWidget';

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

const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

/**
 * Draggable & Droppable Retro Sticky Card Item Component
 */
function RetroCardItem({
  card,
  columns = [],
  currentUser,
  isTopPriority = false,
  isEditing,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditContentChange,
  onDeleteCard,
  onToggleVote,
  onUngroupCard,
  onOpenComments,
  onMoveCard,
  onCopyText,
  isInsideGroup = false,
  isDragOverlay = false,
}) {
  const isOwner = card.authorId === currentUser?.id || card.author?.id === currentUser?.id;
  const isVoted = Array.isArray(card.votes) && card.votes.some((v) => v.userId === currentUser?.id);
  const voteCount = card.voteCount ?? (Array.isArray(card.votes) ? card.votes.length : (card._count?.votes || 0));
  const commentsCount = card.commentsCount ?? (Array.isArray(card.comments) ? card.comments.length : (card._count?.comments || 0));

  const [menuOpen, setMenuOpen] = useState(false);
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setMoveSubmenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // DnD Draggable & Droppable Hooks
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
    transform,
  } = useDraggable({
    id: card.id,
    data: { type: 'card', card, cardId: card.id, columnId: card.columnId },
    disabled: isEditing || isDragOverlay,
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${card.id}`,
    data: { type: 'card', card, cardId: card.id, columnId: card.columnId },
    disabled: isEditing || isDragOverlay,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    boxShadow: isOver
      ? '0 0 0 2px #5956e9, 0 8px 20px rgba(89, 86, 233, 0.15)'
      : (isTopPriority ? '0 4px 12px rgba(239, 68, 68, 0.12)' : '0 2px 4px rgba(0, 0, 0, 0.03)'),
    borderColor: isOver ? '#5956e9' : (isTopPriority ? '#fca5a5' : (isVoted ? '#c7d2fe' : '#e2e8f0')),
    backgroundColor: isOver ? '#f5f3ff' : (isTopPriority ? '#fff5f5' : '#ffffff'),
  };

  const setCombinedRef = (el) => {
    setDragRef(el);
    setDropRef(el);
  };

  const otherColumns = columns.filter((col) => col.id !== card.columnId);

  return (
    <div
      ref={setCombinedRef}
      className={`retro-sticky-card ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-target-active' : ''}`}
      style={{
        borderRadius: '8px',
        padding: '12px 14px',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
        position: 'relative',
        ...style,
      }}
    >
      {/* Top Priority Badge (Fitur 6) */}
      {isTopPriority && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '-9px',
            left: '12px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '1px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
            zIndex: 5,
          }}
        >
          <Flame size={11} fill="#ffffff" />
          <span>PRIORITAS TIM</span>
        </div>
      )}

      {/* Drop Indicator Prompt */}
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '12px',
            background: '#5956e9',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(89,86,233,0.3)',
          }}
        >
          <Sparkles size={10} />
          <span>Lepaskan untuk Mengelompokkan</span>
        </div>
      )}

      {isEditing ? (
        /* Inline Edit Card Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
            placeholder="Edit isi catatan..."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(card.id)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Simpan
            </button>
          </div>
        </div>
      ) : (
        /* Display Sticky Card Content */
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#334155',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1,
              }}
            >
              {card.content}
            </p>

            {/* Right Header: 3-Dot Options Menu & Drag Handle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              {!isDragOverlay && (
                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    title="Opsi catatan"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {menuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        padding: '4px',
                        minWidth: '170px',
                        zIndex: 40,
                      }}
                    >
                      {/* Salin Teks Cepat (Fitur 4) */}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (onCopyText) onCopyText(card.content);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '12px',
                          color: '#334155',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          textAlign: 'left',
                        }}
                      >
                        <Copy size={13} color="#64748b" />
                        <span>Salin Teks</span>
                      </button>

                      {/* Submenu Pindahkan ke Kolom... (Fitur 8) */}
                      {otherColumns.length > 0 && (
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setMoveSubmenuOpen(!moveSubmenuOpen)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '7px 10px',
                              fontSize: '12px',
                              color: '#334155',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MoveRight size={13} color="#64748b" />
                              <span>Pindahkan Kolom</span>
                            </div>
                            <ChevronRight size={12} color="#94a3b8" />
                          </button>

                          {moveSubmenuOpen && (
                            <div
                              style={{
                                padding: '4px 6px',
                                borderTop: '1px solid #f1f5f9',
                                backgroundColor: '#f8fafc',
                                borderRadius: '4px',
                                marginTop: '2px',
                              }}
                            >
                              {otherColumns.map((col) => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => {
                                    setMenuOpen(false);
                                    setMoveSubmenuOpen(false);
                                    if (onMoveCard) onMoveCard(card.id, col.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    width: '100%',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    color: '#334155',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    textAlign: 'left',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      backgroundColor: col.color || '#5956e9',
                                    }}
                                  />
                                  <span>{col.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Edit (Ownership only) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onStartEdit(card);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            color: '#334155',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            textAlign: 'left',
                          }}
                        >
                          <Edit2 size={13} color="#64748b" />
                          <span>Edit Catatan</span>
                        </button>
                      )}

                      {/* Delete (Ownership only) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onDeleteCard(card);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            color: '#ef4444',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            textAlign: 'left',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <Trash2 size={13} color="#ef4444" />
                          <span>Hapus Catatan</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Drag Grip Handle */}
              {!isDragOverlay && (
                <div
                  {...attributes}
                  {...listeners}
                  title="Tahan & geser untuk mengelompokkan atau memindahkan kolom"
                  style={{
                    cursor: 'grab',
                    color: '#94a3b8',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GripVertical size={16} />
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            {/* Author Avatar & Name (dengan penanda (Anda) jika milik sendiri) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author?.email || card.author?.name || 'user'}`}
                alt={card.author?.name || 'Author'}
                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                {card.author?.name || 'Anggota'}
                {isOwner && (
                  <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginLeft: '3px' }}>
                    (Anda)
                  </span>
                )}
              </span>
            </div>

            {/* Action Buttons: Vote, Comments, Ungroup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Vote Button (Fitur 6) */}
              <button
                type="button"
                onClick={() => onToggleVote(card)}
                title={isVoted ? 'Batal Vote' : 'Beri Vote'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: isVoted ? '1px solid #818cf8' : '1px solid #e2e8f0',
                  backgroundColor: isVoted ? '#eef2ff' : '#f8fafc',
                  color: isVoted ? '#4f46e5' : '#64748b',
                  fontSize: '12px',
                  fontWeight: isVoted ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ThumbsUp size={13} fill={isVoted ? '#4f46e5' : 'none'} color={isVoted ? '#4f46e5' : '#64748b'} />
                <span>{voteCount}</span>
              </button>

              {/* Comment Button (Fitur 9) */}
              {onOpenComments && (
                <button
                  type="button"
                  onClick={() => onOpenComments(card)}
                  title={`Diskusi komentar (${commentsCount})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 7px',
                    borderRadius: '6px',
                    border: commentsCount > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    backgroundColor: commentsCount > 0 ? '#eff6ff' : '#f8fafc',
                    color: commentsCount > 0 ? '#2563eb' : '#64748b',
                    fontSize: '12px',
                    fontWeight: commentsCount > 0 ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <MessageSquare size={13} fill={commentsCount > 0 ? '#3b82f6' : 'none'} color={commentsCount > 0 ? '#2563eb' : '#64748b'} />
                  <span>{commentsCount}</span>
                </button>
              )}

              {/* Ungroup Button if card is inside a cluster (Fitur 7) */}
              {isInsideGroup && onUngroupCard && (
                <button
                  type="button"
                  onClick={() => onUngroupCard(card)}
                  title="Keluarkan catatan dari grup ini"
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px 5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11px',
                  }}
                >
                  <Unlink size={11} />
                  <span>Pisah</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Visual Cluster / Group Container Component (Fitur 7: Collapse/Expand, Rename Title, Ungroup All)
 */
function RetroCardCluster({
  groupId,
  cards,
  columns = [],
  currentUser,
  topPriorityCardId,
  editingCardId,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditContentChange,
  onDeleteCard,
  onToggleVote,
  onUngroupCard,
  onUngroupAll,
  onOpenComments,
  onMoveCard,
  onMoveGroup,
  onUpdateGroupTitle,
  onCopyText,
  columnColor,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(cards[0]?.groupTitle || '');
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const groupMenuRef = useRef(null);

  const groupTitle = cards[0]?.groupTitle || null;

  useEffect(() => {
    setTitleInput(cards[0]?.groupTitle || '');
  }, [cards]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setGroupMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { setNodeRef: setClusterDropRef, isOver } = useDroppable({
    id: `cluster-${groupId}`,
    data: { type: 'cluster', groupId, columnId: cards[0]?.columnId },
  });

  const totalVotes = cards.reduce(
    (acc, c) => acc + (c.voteCount ?? (Array.isArray(c.votes) ? c.votes.length : (c._count?.votes || 0))),
    0
  );

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (onUpdateGroupTitle) {
      onUpdateGroupTitle(groupId, titleInput.trim());
    }
  };

  const currentColumnId = cards[0]?.columnId;
  const otherColumns = columns.filter((col) => col.id !== currentColumnId);

  return (
    <div
      ref={setClusterDropRef}
      className={`retro-card-cluster ${isOver ? 'cluster-hover' : ''}`}
      style={{
        backgroundColor: isOver ? '#f5f3ff' : '#f8fafc',
        borderRadius: '10px',
        border: isOver ? '2px dashed #5956e9' : '1px solid #cbd5e1',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: isOver ? '0 4px 16px rgba(89, 86, 233, 0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Cluster Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '6px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Buka grup' : 'Tutup grup'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              flexShrink: 0,
            }}
          >
            <Layers size={12} />
          </div>

          {/* Editable Group Title (Fitur 7) */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              placeholder="Nama topik grup..."
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#1e293b',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #5956e9',
                outline: 'none',
                maxWidth: '180px',
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              title="Klik untuk mengubah nama topik grup"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{groupTitle || `Cluster (${cards.length})`}</span>
              <Edit2 size={10} color="#94a3b8" />
            </div>
          )}

          {/* Total Group Votes Badge */}
          {totalVotes > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#4f46e5',
                backgroundColor: '#e0e7ff',
                padding: '1px 6px',
                borderRadius: '10px',
                flexShrink: 0,
              }}
            >
              {totalVotes} vote
            </span>
          )}
        </div>

        {/* Group Header Actions: Menu 3-Titik & Pisahkan Semua */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div ref={groupMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setGroupMenuOpen(!groupMenuOpen)}
              title="Opsi grup"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <MoreHorizontal size={14} />
            </button>

            {groupMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '4px',
                  minWidth: '180px',
                  zIndex: 40,
                }}
              >
                <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Pindah Grup ke Kolom
                </div>
                {otherColumns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      setGroupMenuOpen(false);
                      if (onMoveGroup) onMoveGroup(groupId, col.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '11px',
                      color: '#334155',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: col.color || '#5956e9',
                      }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setGroupMenuOpen(false);
                    onUngroupAll(groupId);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: '#ef4444',
                    border: 'none',
                    borderTop: '1px solid #f1f5f9',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textAlign: 'left',
                    marginTop: '2px',
                  }}
                >
                  <Unlink size={11} color="#ef4444" />
                  <span>Pisahkan Semua</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onUngroupAll(groupId)}
            title="Pisahkan semua catatan dalam grup ini"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              color: '#64748b',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '2px 5px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Unlink size={10} />
            <span>Pisah</span>
          </button>
        </div>
      </div>

      {/* Cards inside Cluster (Collapsible) */}
      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cards.map((card) => (
            <RetroCardItem
              key={card.id}
              card={card}
              columns={columns}
              currentUser={currentUser}
              isTopPriority={card.id === topPriorityCardId}
              isEditing={editingCardId === card.id}
              editContent={editContent}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onEditContentChange={onEditContentChange}
              onDeleteCard={onDeleteCard}
              onToggleVote={onToggleVote}
              onUngroupCard={onUngroupCard}
              onOpenComments={onOpenComments}
              onMoveCard={onMoveCard}
              onCopyText={onCopyText}
              isInsideGroup={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Column Droppable Container (with Cross-Column Drop Support)
 */
function RetroColumnDroppable({
  column,
  columns = [],
  cards,
  currentUser,
  topPriorityCardId,
  editingCardId,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditContentChange,
  onDeleteCard,
  onToggleVote,
  onUngroupCard,
  onUngroupAll,
  onOpenComments,
  onMoveCard,
  onMoveGroup,
  onUpdateGroupTitle,
  onCopyText,
  addingColId,
  cardInputs,
  setCardInputs,
  setAddingColId,
  handleCreateCard,
}) {
  const { setNodeRef: setColumnDropRef, isOver } = useDroppable({
    id: `col-drop-${column.id}`,
    data: { type: 'column-target', columnId: column.id },
  });

  const clustersMap = {};
  const standaloneCards = [];

  cards.forEach((card) => {
    if (card.groupId) {
      if (!clustersMap[card.groupId]) {
        clustersMap[card.groupId] = [];
      }
      clustersMap[card.groupId].push(card);
    } else {
      standaloneCards.push(card);
    }
  });

  const clusterIds = Object.keys(clustersMap);

  return (
    <div
      className="retro-column-card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: `1px solid ${column.border || '#e2e8f0'}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 280px)',
        minHeight: '350px',
      }}
    >
      {/* Column Header */}
      <div
        className="retro-column-header"
        style={{
          padding: '14px 16px',
          backgroundColor: column.bg || '#f8fafc',
          borderBottom: `2px solid ${column.color || '#5956e9'}`,
          borderTopLeftRadius: '11px',
          borderTopRightRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: column.color || '#5956e9',
            }}
          />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            {column.name}
          </h3>
        </div>

        <span
          style={{
            backgroundColor: '#ffffff',
            color: column.color || '#5956e9',
            fontWeight: 700,
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '12px',
            border: `1px solid ${column.border || '#e2e8f0'}`,
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards & Clusters List Container */}
      <div
        ref={setColumnDropRef}
        className="retro-cards-list"
        style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          flex: 1,
          backgroundColor: isOver ? '#faf5ff' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        {cards.length === 0 && addingColId !== column.id && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
            Belum ada catatan. Klik tombol + di bawah untuk menambah feedback.
          </div>
        )}

        {/* Render Grouped Clusters */}
        {clusterIds.map((groupId) => (
          <RetroCardCluster
            key={groupId}
            groupId={groupId}
            cards={clustersMap[groupId]}
            columns={columns}
            currentUser={currentUser}
            topPriorityCardId={topPriorityCardId}
            editingCardId={editingCardId}
            editContent={editContent}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onEditContentChange={onEditContentChange}
            onDeleteCard={onDeleteCard}
            onToggleVote={onToggleVote}
            onUngroupCard={onUngroupCard}
            onUngroupAll={onUngroupAll}
            onOpenComments={onOpenComments}
            onMoveCard={onMoveCard}
            onMoveGroup={onMoveGroup}
            onUpdateGroupTitle={onUpdateGroupTitle}
            onCopyText={onCopyText}
            columnColor={column.color}
          />
        ))}

        {/* Render Standalone Cards */}
        {standaloneCards.map((card) => (
          <RetroCardItem
            key={card.id}
            card={card}
            columns={columns}
            currentUser={currentUser}
            isTopPriority={card.id === topPriorityCardId}
            isEditing={editingCardId === card.id}
            editContent={editContent}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onEditContentChange={onEditContentChange}
            onDeleteCard={onDeleteCard}
            onToggleVote={onToggleVote}
            onUngroupCard={onUngroupCard}
            onOpenComments={onOpenComments}
            onMoveCard={onMoveCard}
            onCopyText={onCopyText}
            isInsideGroup={false}
          />
        ))}

        {/* Inline New Card Input Box */}
        {addingColId === column.id && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              border: `2px solid ${column.color || '#5956e9'}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <textarea
              value={cardInputs[column.id] || ''}
              onChange={(e) => setCardInputs({ ...cardInputs, [column.id]: e.target.value })}
              placeholder={`Tulis masukan untuk ${column.name}...`}
              rows={3}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '8px',
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
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleCreateCard(column.id)}
                disabled={!cardInputs[column.id]?.trim()}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  background: column.color || '#5956e9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: cardInputs[column.id]?.trim() ? 'pointer' : 'not-allowed',
                  opacity: cardInputs[column.id]?.trim() ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
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
      {addingColId !== column.id && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={() => setAddingColId(column.id)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: column.bg || '#f8fafc',
              color: column.color || '#5956e9',
              border: `1px dashed ${column.border || '#cbd5e1'}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
            <span>Tambah Catatan</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Main RetroBoardDetail Component
 */
export default function RetroBoardDetail({
  workspace,
  board,
  onBack,
  onSwitchBoard,
  currentUser,
  onShowToast,
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

  // Comment Modal State (Fitur 9)
  const [activeCommentCard, setActiveCommentCard] = useState(null);

  // Timer Realtime State (Fitur 10)
  const [externalTimerState, setExternalTimerState] = useState(null);

  // DnD Active Card State for DragOverlay
  const [activeDragCard, setActiveDragCard] = useState(null);

  const boardId = board?.id;
  const templateKey = board?.template || 'start-stop-continue';

  // Sensor configuration for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Load Board detail & cards from backend API
  const loadBoardContent = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      let backendColumns = [];
      try {
        const boardData = await api.getBoardById(boardId);
        if (boardData?.columns && Array.isArray(boardData.columns) && boardData.columns.length > 0) {
          backendColumns = boardData.columns;
        }
        if (boardData?.timer) {
          setExternalTimerState(boardData.timer);
        }
      } catch {}

      if (backendColumns.length === 0) {
        backendColumns = DEFAULT_TEMPLATE_COLUMNS[templateKey] || DEFAULT_TEMPLATE_COLUMNS.default;
      }

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

      try {
        const cardsData = await api.getCards(boardId);
        if (Array.isArray(cardsData)) {
          setCards(cardsData);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [boardId, templateKey]);

  useEffect(() => {
    loadBoardContent();
  }, [loadBoardContent]);

  // Realtime Pusher Subscription
  const { connectionStatus } = useBoardPusher(boardId, {
    onCardCreated: (newCard) => {
      if (!newCard || !newCard.id) return;
      setCards((prev) => {
        if (prev.some((c) => c.id === newCard.id)) return prev;
        return [...prev, newCard];
      });
      if (newCard.authorId !== currentUser?.id && newCard.author?.id !== currentUser?.id) {
        if (onShowToast) onShowToast(`${newCard.author?.name || 'Anggota'} menambahkan catatan baru`);
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
    onCardMoved: (moveData) => {
      if (!moveData || !moveData.cardId) return;
      setCards((prev) =>
        prev.map((c) => (c.id === moveData.cardId ? { ...c, columnId: moveData.columnId } : c))
      );
    },
    onGroupMoved: (groupMoveData) => {
      if (!groupMoveData || !groupMoveData.groupId) return;
      setCards((prev) =>
        prev.map((c) => (c.groupId === groupMoveData.groupId ? { ...c, columnId: groupMoveData.columnId } : c))
      );
      if (onShowToast) onShowToast('Grup catatan dipindahkan ke kolom baru');
    },
    onGroupTitleUpdated: (groupTitleData) => {
      if (!groupTitleData || !groupTitleData.groupId) return;
      setCards((prev) =>
        prev.map((c) =>
          c.groupId === groupTitleData.groupId
            ? { ...c, groupTitle: groupTitleData.groupTitle }
            : c
        )
      );
    },
    onVoteUpdated: (voteData) => {
      if (!voteData || !voteData.cardId) return;
      setCards((prev) =>
        prev.map((c) =>
          c.id === voteData.cardId
            ? {
                ...c,
                votes: voteData.votes || [],
                voteCount: voteData.voteCount ?? (voteData.votes ? voteData.votes.length : (c._count?.votes || 0)),
                _count: {
                  ...c._count,
                  votes: voteData.voteCount ?? (voteData.votes ? voteData.votes.length : (c._count?.votes || 0)),
                },
              }
            : c
        )
      );
    },
    onCardGrouped: (groupData) => {
      if (!groupData) return;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === groupData.cardId) {
            return { ...c, groupId: groupData.groupId, groupTitle: groupData.groupTitle };
          }
          if (groupData.targetCard && c.id === groupData.targetCard.id) {
            return { ...c, groupId: groupData.targetCard.groupId, groupTitle: groupData.targetCard.groupTitle };
          }
          return c;
        })
      );
      if (onShowToast && groupData.card) {
        onShowToast('Susunan grup catatan diperbarui realtime');
      }
    },
    onCommentCreated: (commentData) => {
      if (!commentData || !commentData.cardId) return;
      setCards((prev) =>
        prev.map((c) =>
          c.id === commentData.cardId
            ? {
                ...c,
                commentsCount: commentData.commentsCount ?? ((c.commentsCount || c._count?.comments || 0) + 1),
                _count: {
                  ...c._count,
                  comments: commentData.commentsCount ?? ((c._count?.comments || 0) + 1),
                },
              }
            : c
        )
      );
      if (onShowToast && commentData.authorName && commentData.comment?.authorId !== currentUser?.id) {
        onShowToast(`💬 Komentar baru dari ${commentData.authorName}`);
      }
    },
    onCommentDeleted: (deleteData) => {
      if (!deleteData || !deleteData.cardId) return;
      setCards((prev) =>
        prev.map((c) =>
          c.id === deleteData.cardId
            ? {
                ...c,
                commentsCount: deleteData.commentsCount ?? Math.max(0, (c.commentsCount || c._count?.comments || 1) - 1),
                _count: {
                  ...c._count,
                  comments: deleteData.commentsCount ?? Math.max(0, (c._count?.comments || 1) - 1),
                },
              }
            : c
        )
      );
    },
    onTimerUpdated: (timerData) => {
      if (timerData) {
        setExternalTimerState(timerData);
      }
    },
  });

  // Calculate Top Priority Card (Fitur 6)
  const topPriorityCard = cards.reduce((best, c) => {
    const vCount = c.voteCount ?? (Array.isArray(c.votes) ? c.votes.length : (c._count?.votes || 0));
    if (vCount > 0 && (!best || vCount > (best.voteCount ?? (Array.isArray(best.votes) ? best.votes.length : 0)))) {
      return { ...c, voteCount: vCount };
    }
    return best;
  }, null);

  const topPriorityCardId = topPriorityCard ? topPriorityCard.id : null;

  // Handler: Copy Card Text to Clipboard (Fitur 4)
  const handleCopyText = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      if (onShowToast) onShowToast('📋 Teks catatan berhasil disalin!');
    }
  };

  // Handler: Share Board Link
  const handleShare = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
    if (onShowToast) onShowToast('Link board berhasil disalin!');
  };

  // Handler: Create Card
  const handleCreateCard = async (columnId) => {
    const text = cardInputs[columnId]?.trim();
    if (!text) return;

    setIsSaving(true);
    try {
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
        votes: [],
        _count: { votes: 0, comments: 0 },
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      setCards((prev) => {
        if (prev.some((c) => c.id === newCard.id)) return prev;
        return [...prev, newCard];
      });
      setCardInputs((prev) => ({ ...prev, [columnId]: '' }));
      setAddingColId(null);
      if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal menambahkan catatan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Start Editing Card
  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditContent(card.content);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditContent('');
  };

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

  // Handler: Move Individual Card to Another Column (Fitur 8)
  const handleMoveCard = async (cardId, columnId) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, columnId } : c))
    );

    try {
      await api.moveCard(cardId, columnId);
      if (onShowToast) onShowToast('Catatan dipindahkan ke kolom baru');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal memindahkan catatan');
    }
  };

  // Handler: Move Entire Group to Another Column (Fitur 8)
  const handleMoveGroup = async (groupId, columnId) => {
    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, columnId } : c))
    );

    try {
      await api.moveGroup(groupId, columnId);
      if (onShowToast) onShowToast('Seluruh grup catatan dipindahkan ke kolom baru');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal memindahkan grup');
    }
  };

  // Handler: Update Group Title Topic (Fitur 7)
  const handleUpdateGroupTitle = async (groupId, groupTitle) => {
    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupTitle } : c))
    );

    try {
      await api.updateGroupTitle(groupId, groupTitle);
      if (onShowToast) onShowToast('Nama topik grup diperbarui');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mengubah nama topik grup');
    }
  };

  // Handler: Toggle Vote / Unvote Card (Fitur 6)
  const handleToggleVote = async (card) => {
    const isVoted = Array.isArray(card.votes) && card.votes.some((v) => v.userId === currentUser?.id);

    if (isVoted) {
      const updatedVotes = (card.votes || []).filter((v) => v.userId !== currentUser?.id);
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                votes: updatedVotes,
                voteCount: updatedVotes.length,
                _count: { ...c._count, votes: updatedVotes.length },
              }
            : c
        )
      );

      try {
        await api.unvoteCard(card.id);
        if (onShowToast) onShowToast('Vote berhasil dibatalkan');
      } catch (err) {
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, votes: card.votes } : c))
        );
        if (onShowToast) onShowToast(err.message || 'Gagal membatalkan vote');
      }
    } else {
      if (board?.voteLimit && board.voteLimit > 0) {
        const userTotalVotes = cards.reduce(
          (acc, c) => acc + (Array.isArray(c.votes) && c.votes.some((v) => v.userId === currentUser?.id) ? 1 : 0),
          0
        );
        if (userTotalVotes >= board.voteLimit) {
          if (onShowToast) onShowToast(`Batas maksimal vote (${board.voteLimit}) pada board ini telah tercapai!`);
          return;
        }
      }

      const tempVote = { id: `temp-${Date.now()}`, userId: currentUser?.id, createdAt: new Date().toISOString() };
      const updatedVotes = [...(card.votes || []), tempVote];
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                votes: updatedVotes,
                voteCount: updatedVotes.length,
                _count: { ...c._count, votes: updatedVotes.length },
              }
            : c
        )
      );

      try {
        await api.voteCard(card.id);
        if (onShowToast) onShowToast('Vote berhasil ditambahkan!');
      } catch (err) {
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, votes: card.votes } : c))
        );
        if (onShowToast) onShowToast(err.message || 'Gagal memberikan vote');
      }
    }
  };

  // Handler: Ungroup Individual Card (Fitur 7)
  const handleUngroupCard = async (card) => {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, groupId: null } : c))
    );

    try {
      await api.groupCard(card.id, { groupId: null });
      if (onShowToast) onShowToast('Catatan dikeluarkan dari grup');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal memisahkan catatan dari grup');
    }
  };

  // Handler: Ungroup All Cards in Cluster (Fitur 7)
  const handleUngroupAll = async (groupId) => {
    const clusterCards = cards.filter((c) => c.groupId === groupId);
    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupId: null } : c))
    );

    try {
      await Promise.all(clusterCards.map((c) => api.groupCard(c.id, { groupId: null })));
      if (onShowToast) onShowToast('Semua catatan dalam grup telah dipisahkan');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal memisahkan semua catatan');
    }
  };

  // Handlers for comments updates from modal (Fitur 9)
  const handleCommentAdded = (cardId, newComment, count) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              commentsCount: count,
              _count: { ...c._count, comments: count },
            }
          : c
      )
    );
  };

  const handleCommentDeleted = (cardId, commentId, count) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              commentsCount: count,
              _count: { ...c._count, comments: count },
            }
          : c
      )
    );
  };

  // DnD Handlers (Fitur 7 & Fitur 8: Grouping + Cross-Column Drag & Drop)
  const handleDragStart = (event) => {
    const { active } = event;
    const draggedCard = cards.find((c) => c.id === active.id);
    if (draggedCard) {
      setActiveDragCard(draggedCard);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragCard(null);

    if (!over || active.id === over.id) return;

    const sourceCardId = active.id;
    const sourceCard = cards.find((c) => c.id === sourceCardId);
    if (!sourceCard) return;

    // Case 1: Dropped onto another Card (Group them)
    if (over.data?.current?.type === 'card') {
      const targetCardId = over.data.current.cardId;
      if (targetCardId === sourceCardId) return;

      const targetCard = cards.find((c) => c.id === targetCardId);
      if (!targetCard) return;

      const assignedGroupId = targetCard.groupId || `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === sourceCardId) return { ...c, groupId: assignedGroupId, columnId: targetCard.columnId };
          if (c.id === targetCardId) return { ...c, groupId: assignedGroupId };
          return c;
        })
      );

      try {
        await api.groupCard(sourceCardId, { targetCardId });
        if (onShowToast) onShowToast('Catatan berhasil dikelompokkan!');
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal mengelompokkan catatan');
      }
    }

    // Case 2: Dropped into a Cluster container
    if (over.data?.current?.type === 'cluster') {
      const clusterGroupId = over.data.current.groupId;
      const targetColId = over.data.current.columnId || sourceCard.columnId;
      if (sourceCard.groupId === clusterGroupId) return;

      setCards((prev) =>
        prev.map((c) => (c.id === sourceCardId ? { ...c, groupId: clusterGroupId, columnId: targetColId } : c))
      );

      try {
        await api.groupCard(sourceCardId, { groupId: clusterGroupId });
        if (onShowToast) onShowToast('Catatan ditambahkan ke dalam grup!');
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal menambahkan ke dalam grup');
      }
    }

    // Case 3: Dropped onto another Column (Cross-Column Move)
    if (over.data?.current?.type === 'column-target') {
      const targetColId = over.data.current.columnId;
      if (sourceCard.columnId === targetColId) return;

      setCards((prev) =>
        prev.map((c) => (c.id === sourceCardId ? { ...c, columnId: targetColId } : c))
      );

      try {
        await api.moveCard(sourceCardId, targetColId);
        if (onShowToast) onShowToast('Catatan dipindahkan ke kolom baru');
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal memindahkan catatan');
      }
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
                  fontSize: '13px',
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
                    border: '1px solid #e2e8f0',
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
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: b.id === board?.id ? '#5956e9' : '#334155',
                        fontWeight: b.id === board?.id ? 600 : 400,
                        backgroundColor: b.id === board?.id ? '#f1f5f9' : 'transparent',
                        borderRadius: '6px',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
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

        {/* Top Right Header: Connection Status, Live Presence Stack, Top Icons */}
        <div className="retro-full-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Realtime Connection Status Indicator (Fitur 5) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: connectionStatus === 'connected' ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${connectionStatus === 'connected' ? '#a7f3d0' : '#fde68a'}`,
              fontSize: '11px',
              fontWeight: 600,
              color: connectionStatus === 'connected' ? '#059669' : '#d97706',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
                boxShadow: connectionStatus === 'connected' ? '0 0 6px #10b981' : 'none',
              }}
            />
            <span>{connectionStatus === 'connected' ? 'Live Terhubung' : 'Menghubungkan...'}</span>
          </div>

          {/* Live Online Presence Stack & Counter (Fitur 5) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              padding: '2px 8px 2px 4px',
              borderRadius: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
              <img
                src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'user'}`}
                alt={currentUser?.name || 'User'}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1.5px solid #ffffff',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              {memberCount} Online
            </span>
          </div>

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
        </div>
      </div>

      {/* ── Board Header Banner ── */}
      <div className="retro-board-header-banner">
        <div className="retro-board-header-left">
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

              {/* Vote limit hint if set */}
              {board?.voteLimit && (
                <>
                  <span className="retro-meta-sep">·</span>
                  <span style={{ color: '#4f46e5', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ThumbsUp size={12} />
                    Batas Vote: {board.voteLimit} per anggota
                  </span>
                </>
              )}

              {/* Saving indicator */}
              {isSaving && (
                <span className="retro-meta-sep" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5956e9', fontSize: '12px', fontWeight: 600 }}>
                  <Spinner size={12} color="#5956e9" strokeWidth={2} />
                  Menyimpan...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="retro-board-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Realtime Retrospective Session Timer Widget (Fitur 10) */}
          <RetroTimerWidget
            boardId={boardId}
            onShowToast={onShowToast}
            externalTimerState={externalTimerState}
          />

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

      {/* ── Tab 1: Interactive Board Canvas (Columns, Grouping & Cross-Column Move) ── */}
      {activeTab === 'board' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="retro-board-canvas-container" style={{ padding: '24px 0', width: '100%', overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', padding: '40px', color: '#64748b', gap: '14px' }}>
                <Spinner size={32} color="#5956e9" strokeWidth={3.5} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Memuat papan retrospective...</span>
              </div>
            ) : (
              <div
                className="retro-columns-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))`,
                  gap: '20px',
                  alignItems: 'start',
                }}
              >
                {columns.map((col) => {
                  const columnCards = cards.filter((c) => c.columnId === col.id);

                  return (
                    <RetroColumnDroppable
                      key={col.id}
                      column={col}
                      columns={columns}
                      cards={columnCards}
                      currentUser={currentUser}
                      topPriorityCardId={topPriorityCardId}
                      editingCardId={editingCardId}
                      editContent={editContent}
                      onStartEdit={handleStartEdit}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onEditContentChange={setEditContent}
                      onDeleteCard={handleDeleteCard}
                      onToggleVote={handleToggleVote}
                      onUngroupCard={handleUngroupCard}
                      onUngroupAll={handleUngroupAll}
                      onOpenComments={(c) => setActiveCommentCard(c)}
                      onMoveCard={handleMoveCard}
                      onMoveGroup={handleMoveGroup}
                      onUpdateGroupTitle={handleUpdateGroupTitle}
                      onCopyText={handleCopyText}
                      addingColId={addingColId}
                      cardInputs={cardInputs}
                      setCardInputs={setCardInputs}
                      setAddingColId={setAddingColId}
                      handleCreateCard={handleCreateCard}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Drag Overlay */}
          <DragOverlay>
            {activeDragCard ? (
              <div style={{ opacity: 0.9, transform: 'scale(1.03)', pointerEvents: 'none' }}>
                <RetroCardItem
                  card={activeDragCard}
                  columns={columns}
                  currentUser={currentUser}
                  isDragOverlay={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Tab 2: Diskusi ── */}
      {activeTab === 'diskusi' && (
        <div className="retro-tab-placeholder" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px 0' }}>
          <MessageSquare size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#1e293b' }}>Diskusi Tim</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Klik ikon komentar pada catatan mana saja untuk membuka thread diskusi langsung.
          </p>
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

      {/* ── Card Comments Modal (Fitur 9) ── */}
      {activeCommentCard && (
        <CardCommentsModal
          card={activeCommentCard}
          boardId={boardId}
          currentUser={currentUser}
          onClose={() => setActiveCommentCard(null)}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
