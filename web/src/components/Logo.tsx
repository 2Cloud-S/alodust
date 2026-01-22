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
      {/* Lightning bolt icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 8px var(--neon-cyan))',
        }}
      >
        <path
          d="M18 2L6 18H15L14 30L26 14H17L18 2Z"
          fill="url(#gradient)"
          stroke="var(--neon-cyan)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="gradient" x1="6" y1="2" x2="26" y2="30">
            <stop stopColor="#00FFFF" />
            <stop offset="1" stopColor="#FF00FF" />
          </linearGradient>
        </defs>
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
