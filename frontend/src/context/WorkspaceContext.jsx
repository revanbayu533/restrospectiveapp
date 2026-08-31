import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const WorkspaceContext = createContext(null);

const colorPresets = ['#5b52f9', '#2563eb', '#10b981', '#f97316', '#ec4899'];

function formatWorkspace(ws, currentUserId) {
  const userMember = ws.members?.find((m) => m.userId === currentUserId || m.user?.id === currentUserId);
  const role = userMember ? (userMember.role === 'owner' ? 'Owner' : 'Member') : 'Member';
  const name = ws.name || 'Workspace';
  const initial = name.substring(0, 2).toUpperCase();

  const formattedMembers = (ws.members || []).map((m) => ({
    id: m.id || m.userId,
    name: m.user?.name || m.user?.email?.split('@')[0] || 'Member',
    role: m.role === 'owner' ? 'Owner' : 'Member',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.email || m.userId}`,
    isOnline: true,
  }));

  const formattedBoards = (ws.boards || []).map((b, idx) => ({
    id: b.id,
    title: b.name,
    columnsCount: 3,
    cardsCount: 0,
    timeText: b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : 'Baru saja',
    color: colorPresets[idx % colorPresets.length],
  }));

  const colorIndex = Math.abs((ws.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colorPresets.length;

  return {
    id: ws.id,
    name: ws.name,
    initial,
    color: colorPresets[colorIndex],
    role,
    description: `Workspace untuk ${ws.name}`,
    longDescription: `Workspace untuk ${ws.name}. Semua retrospective dan diskusi tim dilakukan di sini`,
    memberCount: formattedMembers.length,
    dateText: ws.joinedAt ? `Bergabung ${new Date(ws.joinedAt).toLocaleDateString('id-ID')}` : 'Active',
    isRecent: true,
    members: formattedMembers,
    recentBoards: formattedBoards,
  };
}

export function WorkspaceProvider({ children, currentUser }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkspaces = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const data = await api.getWorkspaces();
      if (Array.isArray(data)) {
        const formatted = data.map((ws) => formatWorkspace(ws, userId || currentUser?.id));
        setWorkspaces(formatted);
        if (formatted.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(formatted[0].id);
        }
        return formatted;
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, [currentUser, activeWorkspaceId]);

  const createWorkspace = async (name) => {
    const res = await api.createWorkspace(name);
    await fetchWorkspaces(currentUser?.id);
    if (res.workspace?.id) {
      setActiveWorkspaceId(res.workspace.id);
    }
    return res;
  };

  const deleteWorkspace = async (id) => {
    await api.deleteWorkspace(id);
    await fetchWorkspaces(currentUser?.id);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        setActiveWorkspaceId,
        fetchWorkspaces,
        createWorkspace,
        deleteWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
