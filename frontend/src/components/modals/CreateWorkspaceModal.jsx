import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const COLOR_OPTIONS = [
  '#5b52f9',
  '#2563eb',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4'
];

export default function CreateWorkspaceModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim() || 'Tim kolaborasi retrospective',
      color: selectedColor,
      initial: name.trim().charAt(0).toUpperCase()
    });

    setName('');
    setDescription('');
    setSelectedColor(COLOR_OPTIONS[0]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Buat Workspace Baru</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Workspace</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Core Engineering, Growth Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea 
              className="form-textarea" 
              rows={3}
              placeholder="Deskripsi singkat mengenai workspace tim ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Warna Ikon Identitas</label>
            <div className="color-options">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-circle ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!name.trim()}
            >
              <Plus size={16} />
              <span>Buat Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
