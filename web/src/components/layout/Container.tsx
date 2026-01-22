import { ReactNode, HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Container({
  children,
  size = 'lg',
  className = '',
  style,
  ...props
}: ContainerProps) {
  const maxWidths = {
    sm: '768px',
    md: '1024px',
    lg: '1440px',
    full: '100%',
  };

  return (
    <div
      className={`container ${className}`}
      style={{
        maxWidth: maxWidths[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
