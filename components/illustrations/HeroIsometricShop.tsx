import React from "react";

export function HeroIsometricShop() {
  return (
    <div className="w-full aspect-[4/3] bg-slate-900 rounded-[2rem] flex items-center justify-center overflow-hidden relative">
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full scale-110 origin-center"
      >
        <defs>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="deskTop" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          
          <linearGradient id="deskFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="laptopScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="glassCard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>

          <filter id="shadowLarge" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="20" stdDeviation="25" floodOpacity="0.6" floodColor="#000000" />
          </filter>
          
          <filter id="shadowSmall" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.4" floodColor="#000000" />
          </filter>

          <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Lights */}
        <circle cx="200" cy="200" r="150" fill="#10b981" opacity="0.15" filter="url(#glowGreen)" />
        <circle cx="600" cy="400" r="200" fill="#6366f1" opacity="0.15" filter="url(#glowGreen)" />

        {/* Isometric Grid Floor */}
        <g stroke="#334155" strokeWidth="1" opacity="0.3">
          {[...Array(20)].map((_, i) => (
            <React.Fragment key={i}>
              <line x1={-200 + i * 60} y1="600" x2={400 + i * 60} y2="200" />
              <line x1={800 - i * 60} y1="600" x2={200 - i * 60} y2="200" />
            </React.Fragment>
          ))}
        </g>
        <rect x="0" y="200" width="800" height="400" fill="url(#floorGrad)" />

        <g transform="translate(400, 350)">
          {/* Isometric Shop Counter */}
          {/* Front Face */}
          <path d="M -200 50 L 0 150 L 200 50 L 0 -50 Z" fill="url(#deskTop)" />
          {/* Left Face */}
          <path d="M -200 50 L 0 150 L 0 250 L -200 150 Z" fill="url(#deskFront)" />
          {/* Right Face */}
          <path d="M 0 150 L 200 50 L 200 150 L 0 250 Z" fill="#0f172a" />
          
          {/* Neon Strip on Desk */}
          <path d="M -200 55 L 0 155 L 200 55" stroke="#10b981" strokeWidth="4" fill="none" filter="url(#glowGreen)" />

          {/* Shop Owner (Abstract 3D Geometric forms) */}
          <g transform="translate(-80, -100)">
            {/* Body */}
            <path d="M 0 -40 L 40 -20 L 40 60 L 0 40 L -40 60 L -40 -20 Z" fill="#475569" filter="url(#shadowSmall)" />
            {/* Head */}
            <path d="M 0 -110 L 25 -95 L 25 -55 L 0 -40 L -25 -55 L -25 -95 Z" fill="#94a3b8" />
            {/* Arms typing */}
            <path d="M -20 0 L -60 40 L -10 60" stroke="#334155" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 20 0 L 50 30 L 20 70" stroke="#334155" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* Isometric Laptop */}
          <g transform="translate(60, -20)">
            {/* Base */}
            <path d="M -50 0 L 10 30 L 70 0 L 10 -30 Z" fill="#94a3b8" filter="url(#shadowSmall)" />
            {/* Screen */}
            <path d="M -50 0 L 10 -30 L 10 -100 L -50 -70 Z" fill="#1e293b" />
            {/* Screen Glow */}
            <path d="M -45 -5 L 5 -30 L 5 -95 L -45 -70 Z" fill="url(#laptopScreen)" filter="url(#glowGreen)" opacity="0.8" />
          </g>

          {/* Floating UI Elements (Glassmorphism Services) */}
          <g transform="translate(0, -150)" className="animate-[bounce_4s_infinite_ease-in-out]">
            {/* Main Center UI */}
            <path d="M -100 -50 L 0 0 L 100 -50 L 0 -100 Z" fill="url(#glassCard)" filter="url(#shadowLarge)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx="0" cy="-50" r="20" fill="#10b981" />
            <path d="M -10 -50 L 0 -40 L 15 -60" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* Service 1 */}
          <g transform="translate(-160, -60)" className="animate-[bounce_5s_infinite_ease-in-out_1s]">
            <path d="M -50 -25 L 0 0 L 50 -25 L 0 -50 Z" fill="url(#glassCard)" filter="url(#shadowSmall)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x="-15" y="-35" width="30" height="20" rx="4" fill="#6366f1" transform="rotate(-26 0 -25) skewX(30)" />
          </g>
          
          {/* Service 2 */}
          <g transform="translate(160, -100)" className="animate-[bounce_6s_infinite_ease-in-out_0.5s]">
            <path d="M -50 -25 L 0 0 L 50 -25 L 0 -50 Z" fill="url(#glassCard)" filter="url(#shadowSmall)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <path d="M -15 -25 L 15 -25 M 0 -40 L 0 -10" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" transform="rotate(26 0 -25) skewX(-30)" />
          </g>

          {/* Payment Success Hologram */}
          <g transform="translate(80, 80)" className="animate-[pulse_3s_infinite]">
            <path d="M 0 0 L 40 20 L 80 0 L 40 -20 Z" fill="rgba(16, 185, 129, 0.2)" />
            <path d="M 0 0 L 40 20 L 40 -80 L 0 -100 Z" fill="rgba(16, 185, 129, 0.1)" />
            <path d="M 80 0 L 40 20 L 40 -80 L 80 -100 Z" fill="rgba(16, 185, 129, 0.3)" />
            <text x="40" y="-40" fill="#10b981" fontSize="16" fontWeight="bold" textAnchor="middle" transform="rotate(-26 40 -40) skewX(30)" filter="url(#glowGreen)">₹2500</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
