import React from 'react';

export const PremiumLogo = ({ className = "w-9 h-9", chipColor = "#2C2A26" }: { className?: string, chipColor?: string }) => (
  <svg 
    viewBox="-4 -4 108 108" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} shrink-0`}
    style={{ color: chipColor }}
  >
    {/* AI Text */}
    <text x="50" y="56" fill="currentColor" fontFamily="sans-serif" fontWeight="bold" fontSize="24" textAnchor="middle">AI</text>
    
    {/* Circuit Lines */}
    <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Top Lines */}
      <path d="M 50 28 L 50 14" />
      <circle cx="50" cy="11" r="3.5" fill="currentColor" />
      
      <path d="M 40 28 L 40 20 L 26 6" />
      <circle cx="23.5" cy="3.5" r="3.5" fill="currentColor" />
      
      <path d="M 60 28 L 60 20 L 74 6" />
      <circle cx="76.5" cy="3.5" r="3.5" fill="currentColor" />
      
      {/* Bottom Lines */}
      <path d="M 50 72 L 50 86" />
      <circle cx="50" cy="89" r="3.5" fill="currentColor" />
      
      <path d="M 40 72 L 40 80 L 26 94" />
      <circle cx="23.5" cy="96.5" r="3.5" fill="currentColor" />
      
      <path d="M 60 72 L 60 80 L 74 94" />
      <circle cx="76.5" cy="96.5" r="3.5" fill="currentColor" />
      
      {/* Left Lines */}
      <path d="M 28 50 L 14 50" />
      <circle cx="11" cy="50" r="3.5" fill="currentColor" />
      
      <path d="M 28 40 L 20 40 L 6 26" />
      <circle cx="3.5" cy="23.5" r="3.5" fill="currentColor" />
      
      <path d="M 28 60 L 20 60 L 6 74" />
      <circle cx="3.5" cy="76.5" r="3.5" fill="currentColor" />
      
      {/* Right Lines */}
      <path d="M 72 50 L 86 50" />
      <circle cx="89" cy="50" r="3.5" fill="currentColor" />
      
      <path d="M 72 40 L 80 40 L 94 26" />
      <circle cx="96.5" cy="23.5" r="3.5" fill="currentColor" />
      
      <path d="M 72 60 L 80 60 L 94 74" />
      <circle cx="96.5" cy="76.5" r="3.5" fill="currentColor" />
    </g>
  </svg>
);
