import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Toast({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="toast-container">
      <CheckCircle2 size={18} color="#22c55e" />
      <span>{message}</span>
    </div>
  );
}
