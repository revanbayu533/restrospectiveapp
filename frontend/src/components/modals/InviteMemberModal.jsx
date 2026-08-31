import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Copy, RefreshCw, Power } from 'lucide-react';
import { api } from '../../services/api';

export default function InviteMemberModal({ isOpen, onClose, workspaceId, workspaceName, onShowToast }) {
  const [inviteUrl, setInviteUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadActiveInvite();
    }
  }, [isOpen, workspaceId]);

  const loadActiveInvite = async () => {
    try {
      setIsLoading(true);
      const data = await api.getActiveInvite(workspaceId);
      if (data.inviteToken) {
        const fullUrl = `${window.location.origin}?invite=${data.inviteToken}`;
        setInviteUrl(fullUrl);
        setIsActive(true);
      } else {
        setInviteUrl('');
        setIsActive(false);
      }
    } catch {
      setInviteUrl('');
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrRegenerate = async () => {
    try {
      setIsLoading(true);
      const data = await api.createInvite(workspaceId);
      if (data.inviteToken) {
        const fullUrl = `${window.location.origin}?invite=${data.inviteToken}`;
        setInviteUrl(fullUrl);
        setIsActive(true);
        if (onShowToast) onShowToast('Link invite berhasil diperbarui!');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal membuat link invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setIsLoading(true);
      await api.deactivateInvite(workspaceId);
      setInviteUrl('');
      setIsActive(false);
      if (onShowToast) onShowToast('Link invite berhasil dinonaktifkan');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal menonaktifkan link invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    if (onShowToast) onShowToast('Link invite berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Undang Anggota ke {workspaceName}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Bagikan link invite ini kepada anggota tim Anda. Pengguna dapat bergabung ke workspace ini setelah masuk/mendaftar.
          </p>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LinkIcon size={16} />
              <span>Link Invite Workspace</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                value={inviteUrl || (isLoading ? 'Memuat link invite...' : 'Belum ada link invite aktif')}
                readOnly
                style={{ flex: 1, backgroundColor: '#f8fafc', color: '#334155' }}
              />
              {isActive && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCopyLink}
                  title="Salin Link Invite"
                >
                  <Copy size={16} />
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleCreateOrRegenerate}
              disabled={isLoading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} />
              <span>{isActive ? 'Buat Ulang Link' : 'Buat Link Invite'}</span>
            </button>

            {isActive && (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleDeactivate}
                disabled={isLoading}
                style={{ color: '#ef4444', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Power size={16} />
                <span>Nonaktifkan</span>
              </button>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
