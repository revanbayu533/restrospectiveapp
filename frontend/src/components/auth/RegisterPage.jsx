import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import AuthHero from './AuthHero';
import { api } from '../../services/api';

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password validation criteria
  const isMinLength = password.length >= 8;
  const hasLetterAndNumber = /(?=.*[A-Za-z])(?=.*\d)/.test(password);
  const isPasswordValid = isMinLength && hasLetterAndNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    if (!isPasswordValid) {
      setErrorMessage('Password harus minimal 8 karakter dan memuat kombinasi huruf & angka.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password dan konfirmasi password tidak cocok!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.register(email.trim(), password.trim(), fullName.trim());
      onRegisterSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Registrasi gagal. Silakan coba lagi.');
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
      onRegisterSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Daftar dengan Google gagal. Silakan coba lagi.');
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

        {/* Sisi Kanan: Formulir Register */}
        <div className="auth-form-panel">
          <div className="auth-form-badge">Workspace</div>
          <h1 className="auth-form-title">Buat akun baru</h1>
          {errorMessage && (
            <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Field: Nama Lengkap */}
            <div className="auth-input-group">
              <label className="auth-input-label">Nama Lengkap</label>
              <div className="auth-input-container">
                <User size={18} className="auth-input-icon" />
                <input 
                  type="text" 
                  className="auth-input-field" 
                  placeholder="Nama Lengkap Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

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
                  placeholder="Minimal 8 karakter (huruf & angka)"
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

              {/* Password Requirement Checklist */}
              {password.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isMinLength ? '#10b981' : '#64748b' }}>
                    {isMinLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: hasLetterAndNumber ? '#10b981' : '#64748b' }}>
                    {hasLetterAndNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Kombinasi huruf dan angka</span>
                  </div>
                </div>
              )}
            </div>

            {/* Field: Konfirmasi Password */}
            <div className="auth-input-group">
              <label className="auth-input-label">Konfirmasi Password</label>
              <div className="auth-input-container">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="auth-input-field" 
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="auth-toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Tombol Daftar Sekarang */}
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              <span>Daftar Sekarang</span>
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
              <span>atau daftar dengan</span>
            </div>

            {/* Tombol Daftar Resmi Google OAuth */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '12px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
                text="signup_with"
                width="100%"
              />
            </div>
          </form>

          {/* Footer Tautan Masuk */}
          <div className="auth-switch-footer" style={{ marginTop: '4px' }}>
            <span>Sudah punya akun?</span>
            <button 
              type="button" 
              className="auth-switch-link"
              onClick={onNavigateLogin}
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
