import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: 'cyan' | 'magenta' | 'orange';
  clickable?: boolean;
}

export function Card({
  children,
  glowColor = 'cyan',
  clickable = false,
  className = '',
  ...props
}: CardProps) {
  const glowClass = `card-glow-${glowColor}`;
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
