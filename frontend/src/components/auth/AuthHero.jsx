import React from 'react';
import { Zap, Check } from 'lucide-react';
import workImg from '../../assets/work.png';

export default function AuthHero() {
  const checkItems = [
    "Pantau progress sprint bersama tim",
    "Kolaborasi realtime dan transparan",
    "Susun rencana aksi dari feedback tim",
    "Refleksikan pencapaian dan kendala kerja"
  ];

  return (
    <div className="auth-hero-panel">
      {/* Brand Logo */}
      <div className="auth-brand">
        <div className="auth-brand-icon">
          <Zap size={22} fill="#ffffff" />
        </div>
        <span className="auth-brand-name">RetroNerve</span>
      </div>

      {/* Illustration Image */}
      <div className="auth-hero-image-wrapper">
        <img 
          src={workImg} 
          alt="Retrospective Team Collaboration" 
          className="auth-hero-img" 
        />
      </div>

      {/* Bottom Content / Quote & Checklist */}
      <div>
        <h2 className="auth-hero-quote">
          "Evaluasi tim lebih terstruktur, action item lebih jelas."
        </h2>

        <div className="auth-checklist">
          {checkItems.map((item, index) => (
            <div key={index} className="auth-checklist-item">
              <Check size={18} strokeWidth={3} className="auth-check-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
