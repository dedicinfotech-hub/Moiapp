'use client';

import { useNewEventModal } from '@/lib/new-event-modal';
import NewEventModal from '@/app/dashboard/components/NewEventModal';

export default function GlobalNewEventModal() {
  const { isOpen, closeModal } = useNewEventModal();
  if (!isOpen) return null;
  return <NewEventModal onClose={closeModal} onCreated={closeModal} />;
}
