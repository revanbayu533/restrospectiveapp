import React from 'react';

export default function Badge({ children, variant = 'owner' }) {
  const variantClass = variant.toLowerCase() === 'owner' ? 'badge-owner' : 'badge-member';
  return (
    <span className={`badge ${variantClass}`}>
      {children}
    </span>
  );
}
