import React from "react";

export const Logo: React.FC<{ size?: number; animate?: boolean }> = ({
  size = 140,
  animate = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? "animate-float" : ""} filter drop-shadow-[0_0_20px_rgba(233,69,96,0.6)]`}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0f172a", stopOpacity: 1 }} />
          <stop
            offset="30%"
            style={{ stopColor: "#e94560", stopOpacity: 0.9 }}
          />
          <stop
            offset="70%"
            style={{ stopColor: "#f472b6", stopOpacity: 0.9 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "#fbbf24", stopOpacity: 1 }}
          />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#fbbf24", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#fcd34d", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#fbbf24", stopOpacity: 1 }}
          />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="glassGradient">
          <stop
            offset="0%"
            style={{ stopColor: "#ffffff", stopOpacity: 0.3 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "#ffffff", stopOpacity: 0.05 }}
          />
        </radialGradient>
      </defs>
      <circle
        cx="70"
        cy="70"
        r="65"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="1.5"
        opacity="0.4"
        className={animate ? "animate-rotate-slow" : ""}
      />
      <circle
        cx="70"
        cy="70"
        r="58"
        fill="url(#glassGradient)"
        filter="url(#glow)"
      />
      <circle
        cx="70"
        cy="70"
        r="58"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="3"
      />
      <g transform="translate(35, 80)">
        {[5, 17, 29, 41, 53, 65].map((x) => (
          <rect
            key={x}
            x={x}
            y="5"
            width="6"
            height="30"
            fill="#e94560"
            opacity="0.9"
          />
        ))}
        <polygon
          points="37.5,-8 -2,5 77,5"
          fill="url(#goldGradient)"
          filter="url(#glow)"
        />
        <line x1="-2" y1="5" x2="77" y2="5" stroke="#fbbf24" strokeWidth="2" />
        <rect
          x="0"
          y="35"
          width="75"
          height="6"
          fill="url(#goldGradient)"
          opacity="0.9"
        />
      </g>
      <g transform="translate(70, 42)">
        <ellipse
          cx="0"
          cy="0"
          rx="22"
          ry="18"
          fill="#f472b6"
          opacity="0.95"
          filter="url(#glow)"
        />
        <path
          d="M-10,-8 Q-15,-11 -13,-16 Q-10,-18 -5,-16 Q0,-20 5,-16 Q10,-18 13,-16 Q15,-11 10,-8"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          opacity="0.9"
          filter="url(#glow)"
        />
      </g>
    </svg>
  );
};
