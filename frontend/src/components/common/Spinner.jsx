import React from 'react';

export default function Spinner({ size = 26, color = '#5956e9', strokeWidth = 3, style = {} }) {
  return (
    <div
      className="rn-spinner"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `${strokeWidth}px solid #e2e8f0`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        display: 'inline-block',
        boxSizing: 'border-box',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
