import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="logo_grad_main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id="logo_grad_accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#0f172a" />
        <rect x="2" y="2" width="96" height="96" rx="22" stroke="url(#logo_grad_main)" strokeWidth="3" strokeOpacity="0.8" />
        <path
          d="M28 72L50 26L72 72M35 58H65"
          stroke="url(#logo_grad_accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="24" r="5" fill="#38bdf8" />
        <circle cx="28" cy="72" r="4" fill="#6366f1" />
        <circle cx="72" cy="72" r="4" fill="#6366f1" />
      </svg>
    </div>
  );
};
