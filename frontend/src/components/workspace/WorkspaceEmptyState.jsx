import React from 'react';
import { Plus, LayoutGrid, Users, Sparkles, MessageSquareQuote } from 'lucide-react';

export default function WorkspaceEmptyState({ currentUser, onCreateWorkspace }) {
  const userName = currentUser?.name || currentUser?.fullName || 'Pengguna';

  return (
    <div className="workspace-empty-container" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '48px 36px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {/* Top Icon Badge */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: '#eff6ff',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
        }}>
          <Sparkles size={32} />
        </div>

        {/* Welcome Greeting */}
        <h2 style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '10px'
        }}>
          Selamat Datang, {userName}! 👋
        </h2>

        <p style={{
          fontSize: '15px',
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '32px',
          maxWidth: '520px',
          marginInline: 'auto'
        }}>
          Anda belum memiliki workspace. Buat workspace pertama Anda untuk mulai mengelola sesi sprint retrospective, kolaborasi ide, dan menyusun action item bersama tim.
        </p>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onCreateWorkspace}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            transition: 'all 0.2s ease',
            marginBottom: '40px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          <Plus size={20} />
          <span>Buat Workspace Pertama</span>
        </button>

        {/* Features Preview Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          textAlign: 'left',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '28px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ color: '#4f46e5', marginBottom: '8px' }}>
              <LayoutGrid size={20} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Retro Board
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
              Format Went Well, To Improve, & Action Items.
            </p>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ color: '#0ea5e9', marginBottom: '8px' }}>
              <MessageSquareQuote size={20} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Realtime Feedback
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
              Kirim catatan dan vote kartu secara langsung.
            </p>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ color: '#10b981', marginBottom: '8px' }}>
              <Users size={20} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Undang Tim
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
              Bagikan link undangan instan ke seluruh rekan tim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
