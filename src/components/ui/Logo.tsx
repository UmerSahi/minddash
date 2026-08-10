import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showTagline = false, className = '' }: LogoProps) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  const iconSizes = { sm: 18, md: 22, lg: 36 };
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex items-center justify-center ${size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-9 h-9' : 'w-14 h-14'}`}>
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* M shape */}
          <path d="M4 30 L4 8 L12 16 L18 6 L24 16 L32 8 L32 30 L24 30 L24 18 L18 24 L12 18 L12 30 Z"
            fill="url(#logoGrad)" opacity="0.9" />
          {/* Chart line */}
          <polyline points="4,28 14,22 22,26 32,16" fill="none" stroke="#06b6d4" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <circle cx="32" cy="16" r="1.5" fill="#06b6d4" opacity="0.9" />
        </svg>
        <Sparkles className="absolute -top-0.5 -right-0.5 text-accent" size={iconSizes[size] * 0.35} />
      </div>
      <div>
        <div className={`${sizes[size]} font-bold tracking-tight`}>
          <span className="gradient-text">Mind</span>
          <span className="text-foreground">Dash</span>
        </div>
        {showTagline && <div className="text-xs text-muted-foreground tracking-wider uppercase">Transform Data Into Decisions</div>}
      </div>
    </div>
  );
}