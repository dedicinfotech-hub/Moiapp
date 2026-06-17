'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NewEventModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const NewEventModalContext = createContext<NewEventModalContextValue | null>(null);

export function NewEventModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <NewEventModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </NewEventModalContext.Provider>
  );
}

export function useNewEventModal() {
  const ctx = useContext(NewEventModalContext);
  if (!ctx) {
    // Fallback for pages not wrapped in provider
    return { isOpen: false, openModal: () => {}, closeModal: () => {} };
  }
  return ctx;
}
