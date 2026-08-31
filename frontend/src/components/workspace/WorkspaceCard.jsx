import React, { useState } from 'react';
import { MoreVertical, User, Calendar, Trash2 } from 'lucide-react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

export default function WorkspaceCard({ 
  workspace, 
  isSelected, 
  onSelect, 
  onDeleteWorkspace,
  viewMode = 'grid' 
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isListView = viewMode === 'list';

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (window.confirm(`Apakah Anda yakin ingin menghapus workspace "${workspace.name}"?`)) {
      if (onDeleteWorkspace) {
        onDeleteWorkspace(workspace.id, workspace.name);
      }
    }
  };

  return (
    <div 
      className={`workspace-card ${isSelected ? 'selected' : ''} ${isListView ? 'list-view' : ''}`}
      onClick={() => onSelect(workspace.id)}
      style={{ position: 'relative' }}
    >
      <div className="card-header-top">
        <div className="card-identity">
          <Avatar 
            initial={workspace.initial} 
            color={workspace.color} 
            size={isListView ? 'sm' : 'md'} 
          />
          <div>
            <div className="card-title-group">
              <h3 className="card-title">{workspace.name}</h3>
              <Badge variant={workspace.role}>{workspace.role}</Badge>
            </div>
            {isListView && (
              <p className="card-description" style={{ marginTop: '4px', marginBottom: 0 }}>
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        {workspace.role === 'Owner' && onDeleteWorkspace && (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-ghost-icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              title="Opsi workspace"
            >
              <MoreVertical size={18} />
            </button>

            {showDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '28px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '4px',
                  zIndex: 20,
                  minWidth: '140px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={15} />
                  <span>Hapus Workspace</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isListView && (
        <p className="card-description">
          {workspace.description}
        </p>
      )}

      <div className="card-footer-info">
        <div className="info-item">
          <User size={15} />
          <span>{workspace.memberCount} anggota</span>
        </div>
        <div className="info-item">
          <Calendar size={15} />
          <span>{workspace.dateText}</span>
        </div>
      </div>
    </div>
  );
}
