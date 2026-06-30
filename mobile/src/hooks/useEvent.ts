import { useEffect, useState } from 'react';
import { eventsApi } from '../api';
import type { Event } from '../api/types';

export function useEvent(slug: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await eventsApi.get(slug);
      setEvent(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [slug]);

  return { event, loading, error, reload };
}
