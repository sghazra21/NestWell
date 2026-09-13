import React, { useState } from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  className?: string;
}

/**
 * Avatar with graceful fallback: renders the photo when it loads,
 * otherwise initials. Never shows a broken-image icon.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, src, className }) => {
  const [failed, setFailed] = useState(false);
  const initials = (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        onError={() => setFailed(true)}
        className={`object-cover ${className || ''}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      aria-label={name || 'User'}
      className={`flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold select-none ${className || ''}`}
    >
      <span>{initials}</span>
    </div>
  );
};
