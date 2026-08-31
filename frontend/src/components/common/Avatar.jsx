import React from 'react';

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  initial = 'U', 
  color = '#5956e9', 
  size = 'md', 
  isOnline = false 
}) {
  if (src) {
    return (
      <div className="member-avatar-wrapper">
        <img 
          src={src} 
          alt={alt} 
          className={size === 'sm' ? 'user-avatar-img' : 'member-avatar-img'} 
        />
        {isOnline && <span className="member-online-dot" />}
      </div>
    );
  }

  const avatarSizeClass = size === 'sm' ? 'workspace-avatar-sm' : 'workspace-avatar';
  
  // Deteksi jika warna background terang/putih agar warna teks menjadi hitam/gelap
  const isLightBg = !color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === 'white' || color.includes('gradient');
  const textColor = isLightBg ? '#0f172a' : '#ffffff';

  return (
    <div 
      className={avatarSizeClass} 
      style={{ 
        backgroundColor: color || '#f1f5f9',
        color: textColor 
      }}
    >
      {initial}
    </div>
  );
}
