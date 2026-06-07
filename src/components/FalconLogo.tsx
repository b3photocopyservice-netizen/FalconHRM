import React from "react";

interface FalconLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "stacked";
  textColor?: "light" | "dark" | "auto";
}

export default function FalconLogo({
  className = "",
  size = "md",
  variant = "full",
  textColor = "auto",
}: FalconLogoProps) {
  // Dimension definitions based on size
  const containerClasses = {
    sm: "gap-2.5",
    md: "gap-3.5",
    lg: "gap-5",
    xl: "gap-7",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-20 h-20",
    xl: "w-36 h-36",
  };

  // Text color detection
  const isDarkBg = textColor === "light" || (textColor === "auto" && variant === "full");
  const textClass = isDarkBg ? "text-white" : "text-slate-900";

  // Premium, High-Fidelity SVG Icon matching user's original logo exactly
  const FalconIcon = () => (
    <svg
      viewBox="0 0 200 200"
      className={`${iconSizes[size]} shrink-0 select-none overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Shimmering Chrome / Metallic Silver Gradient */}
        <linearGradient id="chromeGradient" x1="50" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="20%" stopColor="#CBD5E1" />
          <stop offset="40%" stopColor="#94A3B8" />
          <stop offset="60%" stopColor="#E2E8F0" />
          <stop offset="80%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        {/* Deep Imperial Navy Blue Gradient for the Falcon Head */}
        <linearGradient id="navyFalconGradient" x1="60" y1="50" x2="160" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="30%" stopColor="#1E3A8A" />
          <stop offset="70%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Glow / Gold Orange Gradient for circuit traces and highlights */}
        <linearGradient id="goldGradient" x1="20" y1="40" x2="180" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB01F" />
          <stop offset="50%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Metallic Beak Gradient */}
        <linearGradient id="beakGradient" x1="130" y1="80" x2="170" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. LEFT CYBER-CIRCUIT BOARD TRACES & NODES */}
      <g opacity="0.95">
        {/* Bottom/all traces modeled precisely like PCB pathways */}
        {/* Trace 1: Blue-Violet High-Tech (Top) */}
        <path d="M 5 60 L 50 60 L 65 75 L 80 75" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="60" r="4" fill="#3B82F6" />

        {/* Trace 2: Orange High-Tech */}
        <path d="M 12 75 L 35 75 L 48 88 L 65 88" stroke="#FF9100" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="75" r="4" fill="#FFA726" />

        {/* Trace 3: Blue-Violet Mid */}
        <path d="M 8 92 L 40 92 L 52 104 L 60 104" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="8" cy="92" r="3" fill="#60A5FA" />

        {/* Trace 4: Orange-Gold Low-Mid */}
        <path d="M 15 110 L 45 110" stroke="#FF9100" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="45" y1="110" x2="52" y2="117" stroke="#FF9100" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="52" y1="117" x2="68" y2="117" stroke="#FF9100" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="15" cy="110" r="4.5" fill="#FF8000" />

        {/* Trace 5: Bottom Blue Path */}
        <path d="M 10 130 L 42 130 L 58 114 L 72 114" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="130" r="4" fill="#3B82F6" />
      </g>

      {/* 2. THREE-DIMENSIONAL CHROMED SHIELD RING (Bevel contour wrapping the head, broken on the left) */}
      {/* Underlying shadow ring for depth */}
      <path
        d="M 68 145 C 120 185, 175 140, 175 100 C 175 55, 120 15, 68 55"
        stroke="#020617"
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Outer Main Metallic Curved Shield */}
      <path
        d="M 68 145 C 120 185, 175 140, 175 100 C 175 55, 120 15, 68 55"
        stroke="url(#chromeGradient)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Inner Highlight line for shiny 3D bevel reflection */}
      <path
        d="M 72 142 C 118 178, 169 136, 169 100 C 169 64, 118 22, 72 58"
        stroke="#FFFFFFA0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 3. DYNAMIC GLOWING ORANGE/GOLD SWOOSH ARCH AT BOTTOM LEFT */}
      <path
        d="M 52 146 C 68 152, 78 142, 85 133 C 74 136, 60 142, 52 146 Z"
        fill="url(#goldGradient)"
      />

      {/* 4. HIGH-FIDELITY CYBER FALCON HEAD VECTOR */}
      <g>
        {/* Layer 1: White/Grey neck base feathers representing pure light elements */}
        <path
          d="M 74 138 C 76 130, 80 115, 74 105 C 70 98, 62 90, 68 82 C 74 74, 90 68, 102 62 C 90 68, 80 82, 84 94 C 88 106, 92 118, 84 136 Z"
          fill="#E2E8F0"
        />

        {/* Layer 2: Main Dark Blue Cybernetic Skull Structure */}
        <path
          d="M 152 92 C 146 82, 134 72, 124 67 C 110 61, 92 63, 80 72 C 68 82, 60 102, 73 124 C 78 132, 84 136, 92 139 C 108 141, 124 132, 138 120 C 146 112, 152 102, 152 92 Z"
          fill="url(#navyFalconGradient)"
        />

        {/* Sleek Feather Highlights (Reflecting Blue Metal) */}
        <path
          d="M 124 67 C 115 62, 100 64, 90 70 C 95 68, 108 66, 118 70"
          stroke="#60A5FA"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 78 98 C 76 88, 82 78, 90 73 C 84 78, 82 86, 84 94"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Sleek 3D Beak Shape (Metallic & Curved) */}
        <path
          d="M 148 91 C 150 94, 154 100, 154 104 C 154 112, 142 122, 132 125 C 128 127, 125 128, 122 128 C 128 126, 138 120, 144 112 C 148 107, 149 100, 148 91 Z"
          fill="url(#beakGradient)"
          stroke="#0F172A"
          strokeWidth="1.5"
        />

        {/* Sharp Oro Beak Base Flare */}
        <path
          d="M 120 128 C 126 126, 130 118, 133 112 C 129 115, 123 120, 120 128 Z"
          fill="url(#goldGradient)"
        />

        {/* Aggressive Glowing Orange/Gold Eye */}
        <circle cx="123" cy="88" r="6" fill="url(#goldGradient)" />
        <circle cx="123" cy="88" r="2.5" fill="#020617" />
        <circle cx="124.5" cy="86.5" r="1.2" fill="#FFFFFF" />

        {/* Sharp Eyebrow Crest Contour (Fierce & Smart) */}
        <path
          d="M 112 80 C 118 76, 128 78, 138 86"
          stroke="#E2E8F0"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );

  if (variant === "icon") {
    return <FalconIcon />;
  }

  // Width classes for the text area
  const textSizes = {
    sm: {
      falcon: "text-[19px] tracking-[0.18em]",
      hrm: "text-[9px] tracking-[0.4em] font-black",
      gap: "space-y-0.5",
      logoW: "h-4 w-10",
    },
    md: {
      falcon: "text-[27px] tracking-[0.2em]",
      hrm: "text-[11px] tracking-[0.45em] font-black",
      gap: "space-y-0.7",
      logoW: "h-5 w-14",
    },
    lg: {
      falcon: "text-[42px] tracking-[0.22em]",
      hrm: "text-[14px] tracking-[0.5em] font-black",
      gap: "space-y-1.5",
      logoW: "h-7 w-20",
    },
    xl: {
      falcon: "text-[58px] tracking-[0.25em]",
      hrm: "text-[18px] tracking-[0.55em] font-black",
      gap: "space-y-2",
      logoW: "h-10 w-28",
    },
  };

  const currentSize = textSizes[size];

  // Stylized Horizon Text matching original branding
  const BrandText = () => (
    <div className={`${currentSize.gap} flex flex-col justify-center select-none`}>
      {/* FALCON Word */}
      <div className={`font-sans font-black flex items-center leading-none ${textClass} ${currentSize.falcon}`}>
        FALC
        {/* Custom stylized geometric 'A' */}
        <span className="relative inline-flex items-center justify-center mx-[0.027em] w-[0.72em] h-[1em]">
          {/* Left leg */}
          <span
            className="absolute left-[13%] top-[10%] w-[18%] h-[85%] origin-top-left rounded-sm"
            style={{
              backgroundColor: "currentColor",
              transform: "skewX(-26deg)",
            }}
          />
          {/* Right leg */}
          <span
            className="absolute right-[13%] top-[10%] w-[18%] h-[85%] origin-top-right rounded-sm"
            style={{
              backgroundColor: "currentColor",
              transform: "skewX(26deg)",
            }}
          />
          {/* Golden floating triangle nested inside 'A' as crossbar */}
          <span
            className="absolute bottom-[23%] w-[38%] h-[32%]"
            style={{
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              background: "linear-gradient(135deg, #FFB01F 0%, #FF7A00 100%)",
            }}
          />
        </span>
        ON
      </div>

      {/* HRM and sliding golden gradient side bars */}
      <div className="flex items-center gap-2.5">
        {/* Left tapering line */}
        <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-amber-500/95 rounded-full" />
        {/* HRM font */}
        <span className={`font-mono text-amber-500 tracking-[0.45em] leading-none uppercase ${currentSize.hrm}`}>
          HRM
        </span>
        {/* Right tapering line */}
        <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-amber-500/95 rounded-full" />
      </div>
    </div>
  );

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center text-center ${className} ${containerClasses[size]}`}>
        <FalconIcon />
        <BrandText />
      </div>
    );
  }

  // default variant = "full" (Horizontal side-by-side logo & name)
  return (
    <div className={`flex items-center ${className} ${containerClasses[size]}`}>
      <FalconIcon />
      <BrandText />
    </div>
  );
}
