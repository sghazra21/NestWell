import React from 'react';

export type NestWellLogoVariant = 'full' | 'full-on-dark' | 'full-on-white' | 'icon' | 'wordmark';

const SOURCES: Record<NestWellLogoVariant, string> = {
  full: '/branding/logo/NestWell_full_transparent.png',
  'full-on-dark': '/branding/logo/NestWell_full_on_dark.png',
  'full-on-white': '/branding/logo/NestWell_full_on_white.png',
  icon: '/branding/logo/NestWell_icon_transparent.png',
  wordmark: '/branding/logo/NestWell_wordmark_transparent.png',
};

interface NestWellLogoProps {
  variant?: NestWellLogoVariant;
  className?: string;
}

/**
 * Official NestWell brand mark (single source of truth:
 * public/branding, copied from NestWell_Logo_Suite).
 * Aspect ratio is always preserved — never stretched.
 */
export const NestWellLogo: React.FC<NestWellLogoProps> = ({
  variant = 'full',
  className,
}) => (
  <img
    src={SOURCES[variant]}
    alt="NestWell"
    draggable={false}
    className={`object-contain ${className || ''}`}
  />
);
