import { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: 'cyan' | 'magenta' | 'orange';
  glow?: 'cyan' | 'magenta' | 'orange'; // Alias for glowColor
  clickable?: boolean;
}

export function Card({
  children,
  glowColor,
  glow,
  clickable = false,
  className = '',
  ...props
}: CardProps) {
  const effectiveGlow = glowColor || glow || 'cyan';
  const glowClass = `card-glow-${effectiveGlow}`;
  const clickableClass = clickable ? 'card-clickable' : '';

  return (
    <div
      className={`card ${glowClass} ${clickableClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
