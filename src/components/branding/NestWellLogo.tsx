import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

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
  alt?: string;
}

/**
 * Official NestWell brand mark (single source of truth:
 * public/branding, copied from NestWell_Logo_Suite).
 * Aspect ratio is always preserved — never stretched.
 */
export const NestWellLogo: React.FC<NestWellLogoProps> = ({
  variant = 'full',
  className,
  alt = 'NestWell',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className || ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
          <Building2 className="w-4 h-4" />
        </div>
        {variant !== 'icon' && (
          <span className={`font-black tracking-tight text-base ${variant === 'full-on-dark' ? 'text-white' : 'text-slate-900'}`}>
            Nest<span className="text-indigo-600">Well</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={SOURCES[variant]}
      alt={alt}
      onError={() => setHasError(true)}
      draggable={false}
      className={`object-contain select-none ${className || ''}`}
    />
  );
};
