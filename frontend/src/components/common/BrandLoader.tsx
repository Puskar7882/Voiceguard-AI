import React from 'react';
import { Shield } from 'lucide-react';

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  size = 'md',
  label,
  className = ''
}) => {
  const sizeConfig = {
    sm: {
      container: 'w-8 h-8',
      ring: 'border-[2.5px]',
      shield: 'w-3.5 h-3.5',
      text: 'text-[11px]'
    },
    md: {
      container: 'w-12 h-12',
      ring: 'border-3',
      shield: 'w-5 h-5',
      text: 'text-xs'
    },
    lg: {
      container: 'w-16 h-16',
      ring: 'border-4',
      shield: 'w-7 h-7',
      text: 'text-sm'
    }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizeConfig.container} flex items-center justify-center`}>
        {/* Outer glowing rotating gradient ring */}
        <div className={`absolute inset-0 rounded-full ${sizeConfig.ring} border-t-secondary border-r-teal-400/80 border-b-primary/20 border-l-primary animate-brand-spin shadow-[0_0_12px_rgba(13,148,136,0.35)]`} />
        
        {/* Inner subtle glow pulse */}
        <div className="absolute inset-1 rounded-full bg-secondary/10 animate-brand-pulse flex items-center justify-center">
          {/* Shield Icon in center with brand styling */}
          <Shield className={`${sizeConfig.shield} text-secondary drop-shadow-[0_0_4px_rgba(13,148,136,0.5)]`} />
        </div>
      </div>

      {label && (
        <span className={`font-mono font-medium text-on-surface-variant ${sizeConfig.text} tracking-wider uppercase animate-pulse`}>
          {label}
        </span>
      )}
    </div>
  );
};
