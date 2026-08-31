import React, { useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function ActiveWorkspaceCard({ workspace, onShowToast, onDeleteWorkspace }) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyId = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(workspace.id);
    }
    setCopied(true);
    if (onShowToast) {
      onShowToast(`ID Workspace ${workspace.name} berhasil disalin!`);
    }
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus workspace "${workspace.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      setIsDeleting(true);
      try {
        await onDeleteWorkspace(workspace.id, workspace.name);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="right-panel-card">
      <div className="panel-header-title">
        Workspace Aktif
      </div>

      <div className="active-ws-identity">
        <Avatar 
          initial={workspace.initial} 
          color={workspace.color} 
          size="md" 
        />
        <div>
          <div className="card-title-group">
            <h3 className="active-ws-name">{workspace.name}</h3>
            <Badge variant={workspace.role}>{workspace.role}</Badge>
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">ID Workspace</div>
        <div className="field-id-box">
          <span className="field-id-text" title={workspace.id}>
            {workspace.id}
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
          {workspace.longDescription || workspace.description}
        </p>
      </div>

      {workspace.role === 'Owner' && onDeleteWorkspace && (
        <button 
          type="button"
          className="btn btn-outline btn-full-width"
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            borderColor: '#fca5a5',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <Trash2 size={16} />
          <span>{isDeleting ? 'Menghapus...' : 'Hapus Workspace'}</span>
        </button>
      )}
    </div>
  );
}
