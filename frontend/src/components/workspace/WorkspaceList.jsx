import React from 'react';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceCard from './CreateWorkspaceCard';

export default function WorkspaceList({ 
  workspaces = [], 
  activeWorkspaceId, 
  onSelectWorkspace, 
  onDeleteWorkspace, 
  onCreateWorkspace, 
  viewMode = 'grid' 
}) {
  return (
    <div className={viewMode === 'grid' ? 'workspaces-grid' : 'workspace-list-container'}>
      {workspaces.map((workspace) => (
        <WorkspaceCard 
          key={workspace.id}
          workspace={workspace}
          isSelected={workspace.id === activeWorkspaceId}
          onSelect={onSelectWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          viewMode={viewMode}
        />
      ))}

      <CreateWorkspaceCard 
        onClick={onCreateWorkspace} 
      />
    </div>
  );
}
