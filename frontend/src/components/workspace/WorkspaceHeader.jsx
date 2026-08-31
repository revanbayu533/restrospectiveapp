import React from 'react';
import { Plus } from 'lucide-react';

export default function WorkspaceHeader({ onCreateWorkspace }) {
  return (
    <div className="page-header-row">
      <div>
        <h1 className="page-title">Workspace Saya</h1>
        <p className="page-subtitle">
          Kelola workspace tim Anda dan mulai retrospective bersama
        </p>
      </div>
      <button 
        className="btn btn-primary"
        onClick={onCreateWorkspace}
      >
        <Plus size={18} />
        <span>Buat Workspace</span>
      </button>
    </div>
  );
}
