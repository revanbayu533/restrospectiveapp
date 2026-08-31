import React from 'react';
import { Plus } from 'lucide-react';

export default function CreateWorkspaceCard({ onClick }) {
  return (
    <div className="create-workspace-card" onClick={onClick}>
      <div className="create-icon-box">
        <Plus size={24} />
      </div>
      <h4 className="create-card-title">Buat Workspace Baru</h4>
      <p className="create-card-desc">
        Ajak tim Anda untuk mulai retrospective bersama
      </p>
    </div>
  );
}
