import { APP_NAME } from '@/lib/brand';

interface MoiLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Stacked logo for splash / profile screens */
export default function MoiLogo({ variant = 'light', size = 'md', className = '' }: MoiLogoProps) {
  const moiSize = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-4xl' : 'text-2xl';
  const subSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-xs';
  const moiColor = variant === 'light' ? 'text-white' : 'text-tn-purple';
  const subColor = 'text-tn-yellow';

  return (
    <div className={`flex flex-col items-center leading-none ${className}`} aria-label={APP_NAME}>
      <span className={`${moiSize} font-extrabold ${moiColor} tracking-tight`}>
        M<span className="relative inline-block">o
          <svg className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2" viewBox="0 0 10 10" fill="currentColor">
            <path d="M5 8.5C3.5 6.5 1 4.5 1 2.5a4 4 0 0 1 8 0c0 2-2.5 4-4 6z" className={variant === 'light' ? 'text-white' : 'text-tn-purple'} />
          </svg>
        </span>i
      </span>
      <span className={`${subSize} font-semibold italic ${subColor} -mt-0.5 tracking-tight`}>PassBook</span>
    </div>
  );
}
