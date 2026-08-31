import React from 'react';
import { FileText, FileCheck2, ArrowRight } from 'lucide-react';

export default function RecentBoardsCard({ workspace, onViewAllBoards, onOpenBoard }) {
  const boards = workspace.recentBoards || [];

  return (
    <div className="right-panel-card">
      <div className="panel-header-title">
        Board Terbaru
      </div>

      <div className="boards-list">
        {boards.map((board) => (
          <div key={board.id} className="board-item">
            <div className="board-info">
              <div className="board-icon-box">
                {board.iconType === 'check-doc' ? (
                  <FileCheck2 size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
              <div className="board-details">
                <div className="board-title" title={board.title}>
                  {board.title}
                </div>
                <div className="board-updated">{board.updatedAt}</div>
              </div>
            </div>
            <button 
              type="button"
              className="btn-action-small"
              onClick={() => onOpenBoard ? onOpenBoard(board) : alert(`Membuka board: ${board.title}`)}
            >
              Buka
            </button>
          </div>
        ))}
      </div>

      <button 
        type="button"
        className="panel-footer-link-btn"
        onClick={onViewAllBoards}
      >
        <span>Lihat semua board</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
