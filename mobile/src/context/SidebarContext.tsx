import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextValue {
  isOpen: boolean;
  activeModule: string | null;
  open: () => void;
  close: () => void;
  setActiveModule: (module: string | null) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>('dashboard');

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, activeModule, open, close, setActiveModule }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
