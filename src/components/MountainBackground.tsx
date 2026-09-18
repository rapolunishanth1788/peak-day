import React from 'react';
import { motion } from 'motion/react';

export const MountainBackground: React.FC<{ showSummitFlag?: boolean; variant?: 'subtle' | 'login' }> = ({ 
  showSummitFlag = false,
  variant = 'subtle' 
}) => {
  // Array of ambient floating stars/particles with varied speeds and delays
  const particles = [
    { left: '12%', top: '22%', size: 2.5, duration: 4.2, delay: 0 },
    { left: '28%', top: '15%', size: 2, duration: 5.5, delay: 1.2 },
    { left: '45%', top: '35%', size: 3, duration: 3.8, delay: 0.5 },
    { left: '68%', top: '18%', size: 2, duration: 4.8, delay: 2 },
    { left: '82%', top: '28%', size: 2.5, duration: 6, delay: 0.8 },
    { left: '91%', top: '42%', size: 1.5, duration: 5.2, delay: 1.5 },
    { left: '20%', top: '48%', size: 2, duration: 4.5, delay: 2.2 },
    { left: '75%', top: '52%', size: 3, duration: 6.2, delay: 0.3 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* Soft continuous moving ambient gradient orbs */}
      <motion.div 
        animate={{ 
          x: [0, 30, -20, 0],
          y: [0, -35, 15, 0],
          scale: [1, 1.15, 0.95, 1]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ 
          x: [0, -25, 35, 0],
          y: [0, 30, -25, 0],
          scale: [1, 0.9, 1.12, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ 
          x: [0, 40, -30, 0],
          y: [0, -20, 25, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-3xl" 
      />

      {/* Very faint starry particle effect grid */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Continuously floating & twinkling cosmic stars */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -24, 0],
            opacity: [0.2, 0.9, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          className="rounded-full bg-blue-300 shadow-[0_0_8px_#60A5FA]"
        />
      ))}

      {variant === 'login' && (
        <div className="absolute bottom-0 left-0 w-full h-[60%] pointer-events-none opacity-45">
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
            {/* Background Mountain Layers */}
            <path 
              d="M0 600L140 450L320 530L560 380L780 490L1020 370L1240 480L1440 390V600H0Z" 
              fill="#060913" 
            />
            <path 
              d="M0 600L180 500L420 360L640 460L860 310L1120 440L1320 350L1440 410V600H0Z" 
              fill="#080D1A" 
            />
            {/* Foreground Main Peak */}
            <path 
              d="M200 600L620 220L900 600H200Z" 
              fill="#0B1124" 
            />
            <path 
              d="M620 220L900 600H620V220Z" 
              fill="#0D152C" 
            />

            {/* Glowing moon/sun behind peak with continuous subtle breathing glow */}
            <circle cx="560" cy="280" r="85" fill="url(#moon_grad)" opacity="0.25" filter="blur(22px)" />
            <defs>
              <radialGradient id="moon_grad" cx="0.5" cy="0.5" r="0.5">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="transparent" />
              </radialGradient>
            </defs>

            {showSummitFlag && (
              <>
                {/* Winding trail with glowing dots leading to peak */}
                <path 
                  d="M320 560 Q 450 490 490 420 T 570 320 T 620 220" 
                  stroke="rgba(96, 165, 250, 0.45)" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />
                <circle cx="490" cy="420" r="3.5" fill="#60A5FA" className="animate-ping" />
                <circle cx="490" cy="420" r="2.5" fill="#93C5FD" />
                <circle cx="570" cy="320" r="3" fill="#60A5FA" />

                {/* Flag at the summit with flagpole */}
                <line x1="620" y1="220" x2="620" y2="182" stroke="#93C5FD" strokeWidth="2.5" />
                {/* Summit Flag with slight waving gradient */}
                <path d="M620 182 L646 193 L620 204 Z" fill="#3B82F6">
                  <animate 
                    attributeName="d" 
                    values="M620 182 L646 193 L620 204 Z; M620 182 L642 195 L620 204 Z; M620 182 L648 191 L620 204 Z; M620 182 L646 193 L620 204 Z" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                </path>
                <circle cx="620" cy="180" r="3.5" fill="#BFDBFE" />
              </>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
