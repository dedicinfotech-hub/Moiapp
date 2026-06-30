import React from 'react';
import { AppHeader } from './AppHeader';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHelp?: () => void;
  rightElement?: React.ReactNode;
  /** Hide left slot entirely (no back placeholder). */
  hideLeft?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, onHelp, rightElement, hideLeft }: ScreenHeaderProps) {
  return (
    <AppHeader
      variant="stack"
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onHelp={onHelp}
      rightElement={rightElement}
      hideLeft={hideLeft}
    />
  );
}
