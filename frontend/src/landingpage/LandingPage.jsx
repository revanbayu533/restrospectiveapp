import React from 'react';
import '../styles/landingpage.css';

export default function LandingPage({ 
  onNavigateLogin, 
  onNavigateRegister, 
  onDirectDashboard 
}) {
  return (
    <div className="landing-page">

      {/* Navbar */}
      <header className="landing-navbar">
        <div className="landing-nav-actions">
          <button type="button" className="btn-nav-login" onClick={onNavigateLogin}>
            Masuk
          </button>
          <button type="button" className="btn-nav-register" onClick={onNavigateRegister}>
            Daftar
          </button>
        </div>
      </header>

      {/* Footer */}
      <footer className="landing-footer">
        <span>&copy; {new Date().getFullYear()} RetroNerve. All rights reserved.</span>
        <div className="landing-footer-links">
          <button type="button" onClick={onNavigateLogin}>Masuk</button>
          <button type="button" onClick={onNavigateRegister}>Daftar</button>
        </div>
      </footer>

    </div>
  );
}
