import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

const RETRO_TEMPLATES = [
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    desc: 'Fokus pada tindakan nyata yang perlu dimulai, dihentikan, dan dilanjutkan.',
    emoji: '🔄',
    color: '#6366f1',
    bg: '#eef2ff',
    columns: ['Start', 'Stop', 'Continue'],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    desc: 'Eksplorasi emosi dan dinamika tim melalui tiga sudut pandang perasaan.',
    emoji: '😤',
    color: '#ef4444',
    bg: '#fef2f2',
    columns: ['Mad', 'Sad', 'Glad'],
  },
  {
    id: '4ls',
    name: '4Ls',
    desc: 'Refleksi mendalam: Liked, Learned, Lacked, dan Longed for.',
    emoji: '💎',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed for'],
  },
  {
    id: 'went-well-wrong',
    name: 'Went Well / Went Wrong',
    desc: 'Template klasik untuk evaluasi hal positif dan perlu diperbaiki.',
    emoji: '⚖️',
    color: '#10b981',
    bg: '#ecfdf5',
    columns: ['What Went Well', 'What Went Wrong', 'Action Items'],
  },
];

export default function CreateBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
  workspaceName,
  workspace,
  workspaces = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWs, setSelectedWs] = useState(workspace);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Controls whether template picker panel is visible
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const wsDropdownRef = useRef(null);

  useEffect(() => {
    if (workspace) setSelectedWs(workspace);
  }, [workspace, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSelectedTemplate(null);
      setShowTemplatePicker(false);
      setIsWsDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target)) {
        setIsWsDropdownOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWs = selectedWs || workspace || {
    name: workspaceName || 'Mobile Team',
    color: '#6366f1',
    initial: 'M',
  };
  const wsInitial = currentWs.initial || (currentWs.name ? currentWs.name.charAt(0).toUpperCase() : 'M');
  const wsColor = currentWs.color || '#6366f1';
  const availableWorkspaces = workspaces.length > 0 ? workspaces : [currentWs];

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setShowTemplatePicker(false); // close picker after selection
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!title.trim()) return;

    const tmpl = selectedTemplate || RETRO_TEMPLATES[3];
    onCreateBoard({
      id: `board_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `Evaluasi sprint terbaru tim ${currentWs.name}`,
      workspaceId: currentWs.id,
      membersCount: currentWs.memberCount || 8,
      createdAt: 'Baru saja',
      dateText: `Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      updatedText: 'Baru saja',
      theme: { bg: tmpl.bg, color: tmpl.color },
      color: tmpl.color,
      template: tmpl.name,
      columns: tmpl.columns,
    });
    onClose();
  };

  return (
    <div className="cbm-overlay" onClick={onClose}>
      <div
        className={`cbm-wrapper ${showTemplatePicker ? 'cbm-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ LEFT PANEL — Form ═══ */}
        <div className="cbm-left">
          <div className="cbm-left-header">
            <h3 className="cbm-title">Buat Board Baru</h3>
            <button type="button" className="cbm-close-btn" onClick={onClose} aria-label="Tutup">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="cbm-form">
            {/* Board name */}
            <div className="cbm-field">
              <label className="cbm-label">Nama Board</label>
              <input
                type="text"
                className="cbm-input"
                placeholder="Sprint 16 Retrospective"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
              <p className="cbm-hint">Berikan nama yang mudah dikenali untuk board ini</p>
            </div>

            {/* Description */}
            <div className="cbm-field">
              <label className="cbm-label">
                Deskripsi <span className="cbm-label-optional">(opsional)</span>
              </label>
              <textarea
                className="cbm-textarea"
                rows={3}
                placeholder="Evaluasi sprint terbaru aplikasi mobile"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="cbm-hint">Jelaskan tujuan retrospective ini.</p>
            </div>

            {/* Workspace selector */}
            <div className="cbm-field" ref={wsDropdownRef}>
              <label className="cbm-label">Nama Board</label>
              <div
                className={`cbm-select-box ${isWsDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsWsDropdownOpen((v) => !v)}
              >
                <div className="cbm-select-left">
                  <div className="cbm-ws-dot" style={{ backgroundColor: wsColor }}>{wsInitial}</div>
                  <span className="cbm-ws-name">{currentWs.name}</span>
                </div>
                <ChevronDown size={16} className={`cbm-chevron ${isWsDropdownOpen ? 'rotated' : ''}`} />
              </div>

              {isWsDropdownOpen && (
                <div className="cbm-dropdown">
                  {availableWorkspaces.map((ws) => {
                    const isSel = (ws.id && currentWs.id && ws.id === currentWs.id) || ws.name === currentWs.name;
                    const ini = ws.initial || ws.name?.charAt(0).toUpperCase() || 'W';
                    const col = ws.color || '#6366f1';
                    return (
                      <div
                        key={ws.id || ws.name}
                        className={`cbm-dropdown-item ${isSel ? 'selected' : ''}`}
                        onClick={() => { setSelectedWs(ws); setIsWsDropdownOpen(false); }}
                      >
                        <div className="cbm-select-left">
                          <div className="cbm-ws-dot" style={{ backgroundColor: col }}>{ini}</div>
                          <span>{ws.name}</span>
                        </div>
                        {isSel && <Check size={14} />}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="cbm-hint">Board akan dibuat di workspace ini</p>
            </div>

            {/* Template selector — clicking this opens the right panel */}
            <div className="cbm-field">
              <label className="cbm-label">Nama Retro</label>
              <div
                className={`cbm-select-box ${showTemplatePicker ? 'open' : ''}`}
                onClick={() => setShowTemplatePicker((v) => !v)}
              >
                {selectedTemplate ? (
                  <div className="cbm-select-left">
                    <span className="cbm-template-dot" style={{ backgroundColor: selectedTemplate.bg, color: selectedTemplate.color }}>
                      {selectedTemplate.emoji}
                    </span>
                    <span className="cbm-ws-name">{selectedTemplate.name}</span>
                  </div>
                ) : (
                  <span className="cbm-placeholder">Pilih Template</span>
                )}
                <ChevronDown size={16} className={`cbm-chevron ${showTemplatePicker ? 'rotated' : ''}`} />
              </div>
              <p className="cbm-hint">Template akan menentukan struktur kolom board</p>
            </div>

            {/* Footer Buttons */}
            <div className="cbm-footer">
              <button type="button" className="cbm-btn-cancel" onClick={onClose}>
                BATAL
              </button>
              <button type="submit" className="cbm-btn-submit" disabled={!title.trim()}>
                LANJUTKAN
              </button>
            </div>
          </form>
        </div>

        {/* ═══ RIGHT PANEL — Template Picker (only visible when showTemplatePicker) ═══ */}
        {showTemplatePicker && (
          <div className="cbm-right">
            <div className="cbm-right-header">
              <h4 className="cbm-right-title">Pilih Template Retro</h4>
              <p className="cbm-right-subtitle">Klik salah satu template di bawah untuk memilih struktur board</p>
            </div>

            <div className="cbm-template-list">
              {RETRO_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={`cbm-template-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTemplate(tmpl)}
                  >
                    <div className="cbm-template-card-left">
                      <div
                        className="cbm-template-icon"
                        style={{ backgroundColor: tmpl.bg, color: tmpl.color }}
                      >
                        {tmpl.emoji}
                      </div>
                      <div className="cbm-template-info">
                        <span className="cbm-template-name">{tmpl.name}</span>
                        <span className="cbm-template-desc">{tmpl.desc}</span>
                        <div className="cbm-template-cols">
                          {tmpl.columns.map((c) => (
                            <span
                              key={c}
                              className="cbm-col-pill"
                              style={{ borderColor: tmpl.color, color: tmpl.color }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`cbm-preview-btn ${isSelected ? 'active' : ''}`}
                      style={isSelected ? { backgroundColor: tmpl.color, borderColor: tmpl.color, color: '#fff' } : {}}
                      onClick={(e) => { e.stopPropagation(); handleSelectTemplate(tmpl); }}
                    >
                      {isSelected ? 'Dipilih ✓' : 'Preview'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cbm-right-footer">
              <button type="button" className="cbm-btn-cancel" onClick={() => setShowTemplatePicker(false)}>
                BATAL
              </button>
              <button
                type="button"
                className="cbm-btn-use-template"
                disabled={!selectedTemplate}
                onClick={() => {
                  if (selectedTemplate) setShowTemplatePicker(false);
                }}
              >
                Gunakan Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
