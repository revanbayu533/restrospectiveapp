import React from 'react';

export default function Spinner({ size = 24, color = '#5956e9', strokeWidth = 3, style = {} }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes rnSpinAnim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `${strokeWidth}px solid rgba(226, 232, 240, 0.9)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'rnSpinAnim 0.75s linear infinite',
          WebkitAnimation: 'rnSpinAnim 0.75s linear infinite',
          display: 'inline-block',
          boxSizing: 'border-box',
          flexShrink: 0,
          ...style,
        }}
      />
    </span>
  );
}
