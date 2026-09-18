import React from 'react';

interface MountainLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const MountainLogo: React.FC<MountainLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', dot: 'w-1.5 h-1.5' },
    md: { icon: 'w-8 h-8', text: 'text-xl', dot: 'w-2 h-2' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', dot: 'w-2.5 h-2.5' },
    xl: { icon: 'w-12 h-12', text: 'text-3xl', dot: 'w-3 h-3' },
  };

  const { icon, text, dot } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized Modern Geometric Mountain Peak Symbol */}
      <div className={`relative ${icon} flex items-center justify-center`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
          {/* Main Peak polygon */}
          <path 
            d="M8 38L22 10C23 8 25 8 26 10L40 38C41 40 39.5 42 37.5 42H10.5C8.5 42 7 40 8 38Z" 
            fill="url(#peak_grad_1)" 
          />
          {/* Secondary Shaded Facet */}
          <path 
            d="M24 9.5L40 38C41 40 39.5 42 37.5 42H24V9.5Z" 
            fill="url(#peak_grad_2)" 
            opacity="0.9"
          />
          {/* Inner Accent Upward Chevron */}
          <path 
            d="M24 21L33 39H15L24 21Z" 
            fill="#0B0F19" 
            opacity="0.8"
          />
          <path 
            d="M24 24L31 38H24V24Z" 
            fill="url(#peak_grad_3)" 
            opacity="0.6"
          />
          <defs>
            <linearGradient id="peak_grad_1" x1="8" y1="38" x2="30" y2="10" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="peak_grad_2" x1="24" y1="10" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E40AF" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="peak_grad_3" x1="24" y1="24" x2="31" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline">
          <span className={`font-extrabold tracking-tight text-white ${text}`}>
            Peak day
          </span>
          <span className={`rounded-full bg-blue-500 ml-1 ${dot} animate-pulse`} />
        </div>
      )}
    </div>
  );
};
