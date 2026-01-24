interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'var(--text-lg)' },
    md: { icon: 32, text: 'var(--text-xl)' },
    lg: { icon: 48, text: 'var(--text-3xl)' },
  };

  const { icon, text } = sizes[size];

  return (
    <div
      className={`flex items-center gap-sm ${className}`}
      style={{ cursor: 'pointer' }}
    >
      {/* 8-bit pixel art "A" logo */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 8px var(--neon-cyan))',
          imageRendering: 'pixelated',
        }}
      >
        {/* Top of A */}
        <rect x="6" y="2" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="8" y="2" width="2" height="2" fill="var(--neon-cyan)" />

        {/* Upper sides */}
        <rect x="4" y="4" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="10" y="4" width="2" height="2" fill="var(--neon-cyan)" />

        {/* Middle with horizontal bar */}
        <rect x="4" y="6" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="6" y="6" width="2" height="2" fill="var(--neon-magenta)" />
        <rect x="8" y="6" width="2" height="2" fill="var(--neon-magenta)" />
        <rect x="10" y="6" width="2" height="2" fill="var(--neon-cyan)" />

        {/* Lower sides */}
        <rect x="2" y="8" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="12" y="8" width="2" height="2" fill="var(--neon-cyan)" />

        <rect x="2" y="10" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="12" y="10" width="2" height="2" fill="var(--neon-cyan)" />

        {/* Bottom legs */}
        <rect x="2" y="12" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="12" y="12" width="2" height="2" fill="var(--neon-cyan)" />

        <rect x="2" y="14" width="2" height="2" fill="var(--neon-cyan)" />
        <rect x="12" y="14" width="2" height="2" fill="var(--neon-cyan)" />
      </svg>

      {showText && (
        <span
          className="font-display neon-glow"
          style={{
            fontSize: text,
            fontWeight: 'var(--font-bold)',
            letterSpacing: '2px',
          }}
        >
          ALODUST
        </span>
      )}
    </div>
  );
}
