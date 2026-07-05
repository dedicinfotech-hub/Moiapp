import { APP_NAME } from '@/lib/brand';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl sm:text-3xl',
};

/** Horizontal logo: Moi PassBook */
export default function BrandWordmark({ size = 'md', className = '' }: BrandWordmarkProps) {
  return (
    <span
      className={`inline-flex items-baseline gap-1 font-extrabold text-tn-text leading-none tracking-tight ${sizeClasses[size]} ${className}`}
      aria-label={APP_NAME}
    >
      <span>Moi</span>
      <span className="text-tn-yellow italic font-semibold">PassBook</span>
    </span>
  );
}
