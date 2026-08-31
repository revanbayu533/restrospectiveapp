import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthHero from './AuthHero';

import { api } from '../../services/api';

export default function LoginPage({ onLoginSuccess, onNavigateRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.login(email.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Sisi Kiri: Hero & Branding */}
        <AuthHero />

        {/* Sisi Kanan: Formulir Login */}
        <div className="auth-form-panel">
          <div className="auth-form-badge">Workspace</div>
          <h1 className="auth-form-title">Masuk ke akun Anda</h1>
          {errorMessage && (
            <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Field: Email */}
            <div className="auth-input-group">
              <label className="auth-input-label">Email</label>
              <div className="auth-input-container">
                <Mail size={18} className="auth-input-icon" />
                <input 
                  type="email" 
                  className="auth-input-field" 
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="auth-input-group">
              <label className="auth-input-label">Password</label>
              <div className="auth-input-container">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="auth-input-field" 
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="auth-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Lupa Password Link */}
            <div className="auth-forgot-password">
              <button 
                type="button" 
                className="auth-forgot-link"
                onClick={() => alert("Fitur reset password: Tautan pemulihan akan dikirimkan ke email Anda.")}
              >
                Lupa password?
              </button>
            </div>

            {/* Tombol Masuk */}
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              <span>Masuk</span>
            </button>

            {/* Status Verifikasi */}
            {isLoading ? (
              <div className="auth-verifying-text">
                <span className="auth-spinner-dot" />
                <span>Sedang memverifikasi...</span>
              </div>
            ) : (
              <div className="auth-verifying-text" style={{ visibility: 'hidden' }}>
                <span>&nbsp;</span>
              </div>
            )}

            {/* Divider 'atau' */}
            <div className="auth-divider">
              <span>atau</span>
            </div>

            {/* Tombol Masuk dengan Google */}
            <button 
              type="button" 
              className="auth-google-btn"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                  onLoginSuccess({ email: 'user.google@gmail.com' });
                }, 600);
              }}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </form>

          {/* Footer Tautan Pendaftaran */}
          <div className="auth-switch-footer">
            <span>Belum punya akun?</span>
            <button 
              type="button" 
              className="auth-switch-link"
              onClick={onNavigateRegister}
            >
              Daftar sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
