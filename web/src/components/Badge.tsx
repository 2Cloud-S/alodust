import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'live' | 'online' | 'offline' | 'away' | 'new' | 'beta';
  children?: ReactNode;
  className?: string;
}

export function Badge({ variant = 'online', children, className = '' }: BadgeProps) {
  const getDefaultText = () => {
    switch (variant) {
      case 'live':
        return 'LIVE';
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'away':
        return 'Away';
      case 'new':
        return 'NEW';
      case 'beta':
        return 'BETA';
      default:
        return '';
    }
  };

  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children || getDefaultText()}
    </span>
  );
}
