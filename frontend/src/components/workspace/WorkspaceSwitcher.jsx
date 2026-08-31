import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  Plus 
} from 'lucide-react';
import Avatar from '../common/Avatar';

export default function WorkspaceSwitcher({ 
  workspaces, 
  activeWorkspace, 
  onSelectWorkspace, 
  searchQuery, 
  onSearchChange,
  onCreateWorkspace 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="switcher-panel">
      <div className="switcher-section-title">
        Berpindah Workspace
      </div>

      <div className="switcher-controls-row">
        {/* Workspace Dropdown Selector */}
        <div className="switcher-dropdown-container" ref={dropdownRef}>
          <button 
            type="button"
            className="switcher-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="dropdown-current-item">
              <Avatar 
                initial={activeWorkspace.initial} 
                color={activeWorkspace.color} 
                size="sm" 
              />
              <span>{activeWorkspace.name}</span>
            </div>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isOpen && (
            <div className="switcher-dropdown-menu">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={`dropdown-item ${ws.id === activeWorkspace.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                >
                  <Avatar 
                    initial={ws.initial} 
                    color={ws.color} 
                    size="sm" 
                  />
                  <span>{ws.name}</span>
                </button>
              ))}

              <button
                className="dropdown-create-btn"
                onClick={() => {
                  setIsOpen(false);
                  onCreateWorkspace();
                }}
              >
                <Plus size={16} />
                <span>Buat Workspace Baru</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="switcher-search-container">
          <Search size={17} className="switcher-search-icon" />
          <input 
            type="text"
            className="switcher-search-input"
            placeholder="Cari workspace..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button 
            className="switcher-filter-btn" 
            title="Filter opsi"
            onClick={() => alert("Filter kriteria workspace")}
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Tips Banner */}
      {showTips && (
        <div className="tips-banner">
          <div className="tips-content">
            <div className="tips-icon-wrapper">
              <Sparkles size={18} />
            </div>
            <p className="tips-text">
              <strong>Tips</strong>
              Gunakan switcher di sebelah kiri untuk berpindah workspace dengan mudah.
            </p>
          </div>
          <button 
            className="tips-close-btn"
            onClick={() => setShowTips(false)}
            title="Tutup tips"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
