import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageSquare, Clock, User, CornerDownRight } from 'lucide-react';
import { api } from '../../services/api';
import Spinner from '../common/Spinner';

export default function CardCommentsModal({
  card,
  boardId,
  currentUser,
  onClose,
  onCommentAdded,
  onCommentDeleted,
  onShowToast,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const commentsEndRef = useRef(null);

  // Load comments for this card
  useEffect(() => {
    if (!card?.id) return;
    let isMounted = true;
    setLoading(true);

    api.getCardComments(card.id)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setComments(data);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat komentar:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [card?.id]);

  // Auto scroll to bottom when new comment arrives
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleSendComment = async (e) => {
    if (e) e.preventDefault();
    const text = inputContent.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.createComment(card.id, text);
      const newComment = res.comment || {
        id: `temp-${Date.now()}`,
        cardId: card.id,
        content: text,
        createdAt: new Date().toISOString(),
        authorId: currentUser?.id,
        author: currentUser,
        authorName: currentUser?.name || 'Anda',
      };

      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      setInputContent('');

      if (onCommentAdded) {
        onCommentAdded(card.id, newComment, res.commentsCount ?? comments.length + 1);
      }
      if (onShowToast) onShowToast('Komentar berhasil dikirim');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mengirim komentar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    setDeletingId(commentId);
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onCommentDeleted) {
        onCommentDeleted(card.id, commentId, Math.max(0, comments.length - 1));
      }
      if (onShowToast) onShowToast('Komentar dihapus');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal menghapus komentar');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Baru saja';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Baru saja';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m lalu`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}j lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Diskusi Catatan
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {comments.length} komentar tim
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Card Highlight Preview */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #5956e9',
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#1e293b',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                fontWeight: 500,
              }}
            >
              {card.content}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author?.email || card.author?.name || 'author'}`}
                alt={card.author?.name || 'Author'}
                style={{ width: '16px', height: '16px', borderRadius: '50%' }}
              />
              <span style={{ fontWeight: 600 }}>{card.author?.name || 'Anggota'}</span>
              <span>·</span>
              <span>Penulis Catatan</span>
            </div>
          </div>
        </div>

        {/* Comments Stream */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            minHeight: '220px',
            backgroundColor: '#ffffff',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: '#94a3b8' }}>
              <Spinner size={24} color="#5956e9" />
              <span style={{ fontSize: '13px' }}>Memuat komentar...</span>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <CornerDownRight size={28} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
                Belum ada komentar untuk catatan ini.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Jadilah yang pertama memulai diskusi!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isMine = comment.authorId === currentUser?.id || comment.author?.id === currentUser?.id;
              const isDeleting = deletingId === comment.id;

              return (
                <div
                  key={comment.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    opacity: isDeleting ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.email || comment.author?.name || comment.authorName || 'user'}`}
                    alt={comment.authorName || 'User'}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginTop: '2px' }}
                  />

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: isMine ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      border: isMine ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isMine ? '#166534' : '#1e293b' }}>
                          {comment.authorName || comment.author?.name || 'Anggota'}
                        </span>
                        {isMine && (
                          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                            Anda
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {formatTimeAgo(comment.createdAt)}
                        </span>

                        {isMine && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Hapus komentar"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input Footer */}
        <form
          onSubmit={handleSendComment}
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Tulis komentar atau tanggapan..."
            autoFocus
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
          />
          <button
            type="submit"
            disabled={!inputContent.trim() || isSubmitting}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#5956e9',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: inputContent.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
              opacity: inputContent.trim() && !isSubmitting ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            {isSubmitting ? <Spinner size={14} color="#ffffff" /> : <Send size={14} />}
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
