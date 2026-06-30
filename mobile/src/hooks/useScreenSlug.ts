import { useRoute } from '@react-navigation/native';
import { useEventSlugOptional } from './useEventSlug';

/** Resolve event slug from tab context or stack route params. */
export function useScreenSlug(): string {
  const contextSlug = useEventSlugOptional();
  const route = useRoute();
  const params = (route.params || {}) as { slug?: string };
  const slug = params.slug || contextSlug || '';
  if (!slug) {
    console.warn('[useScreenSlug] No slug found for', route.name);
  }
  return slug;
}
