import { assetUrl } from '@/lib/assetUrl';
import { APP_NAME } from '@/lib/brand';

interface LogoImageProps {
  /** navbar = compact; sidebar = dashboard; auth = login/register */
  variant?: 'navbar' | 'sidebar' | 'auth';
  className?: string;
}

const variantClasses: Record<NonNullable<LogoImageProps['variant']>, string> = {
  navbar: 'h-6 md:h-7 w-auto max-w-full',
  sidebar: 'h-6 w-auto max-w-full',
  auth: 'h-7 sm:h-8 w-auto max-w-full',
};

/** Horizontal wordmark PNG — height fixed, width scales automatically. */
export default function LogoImage({ variant = 'navbar', className = '' }: LogoImageProps) {
  return (
    <img
      src={assetUrl('/logo.png')}
      alt={APP_NAME}
      className={`object-contain object-left ${variantClasses[variant]} ${className}`}
    />
  );
}
