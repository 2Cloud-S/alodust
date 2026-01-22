interface AvatarProps {
  src?: string;
  alt: string;
  status?: 'online' | 'offline' | 'away' | 'streaming';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  alt,
  status,
  size = 'md',
  className = '',
}: AvatarProps) {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`avatar avatar-${size} ${className}`.trim()}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="avatar-placeholder">{getInitial(alt)}</div>
      )}
      {status && <span className={`avatar-status ${status}`} />}
    </div>
  );
}
