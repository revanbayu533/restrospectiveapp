import React from 'react';
import { UserPlus, MoreVertical, ArrowRight } from 'lucide-react';
import Avatar from '../common/Avatar';

export default function MembersListCard({ 
  workspace, 
  onInviteClick, 
  onViewAllMembers 
}) {
  const members = workspace.members || [];
  const memberCount = workspace.memberCount || members.length;

  return (
    <div className="right-panel-card">
      <div className="panel-header-title">
        <span>Anggota ({memberCount})</span>
        <button 
          type="button"
          className="panel-action-link"
          onClick={onInviteClick}
        >
          <UserPlus size={15} />
          <span>Undang Anggota</span>
        </button>
      </div>

      <div className="members-list">
        {members.map((member) => (
          <div key={member.id} className="member-item">
            <div className="member-info">
              <Avatar 
                src={member.avatar} 
                alt={member.name} 
                isOnline={member.isOnline} 
              />
              <div>
                <div className="member-name">{member.name}</div>
                <div className="member-role">{member.role}</div>
              </div>
            </div>
            <button 
              className="btn-ghost-icon"
              onClick={() => alert(`Opsi untuk anggota: ${member.name}`)}
              title="Opsi anggota"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        ))}
      </div>

      <button 
        type="button"
        className="panel-footer-link-btn"
        onClick={onViewAllMembers}
      >
        <span>Lihat semua anggota</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
