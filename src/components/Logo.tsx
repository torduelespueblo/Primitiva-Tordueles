import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'icon-only' | 'light';
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 64,
  variant = 'full',
  theme = 'light',
}) => {
  const effectiveTheme = variant === 'light' ? 'dark' : theme;
  const src = effectiveTheme === 'dark' ? './splash-logo.png' : './logo-navy.png';

  return (
    <img
      src={src}
      alt="Logo Peña La Primitiva Tordueles"
      width={size}
      height={size}
      draggable={false}
      className={`select-none shrink-0 object-contain bg-transparent ${className}`}
    />
  );
};
