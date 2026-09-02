import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.googleAuth(credentialResponse.credential);
      onLoginSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Autentikasi Google gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Koneksi Google Sign-In dibatalkan atau terjadi kesalahan.');
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
              <span>atau masuk dengan</span>
            </div>

            {/* Tombol Masuk Resmi Google OAuth */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '12px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
                text="signin_with"
                width="100%"
              />
            </div>
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
