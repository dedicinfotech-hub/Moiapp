'use client';

import { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmColors = {
    danger: 'bg-tn-error hover:bg-tn-error/80 text-white',
    warning: 'bg-tn-yellow hover:bg-tn-yellow-2 text-tn-text',
    info: 'bg-tn-purple hover:bg-tn-purple-2 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-bold text-tn-text text-lg mb-2">{title}</h3>
        <p className="text-sm text-tn-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-tn-border text-tn-muted py-2.5 rounded-lg text-sm font-semibold hover:bg-tn-light transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${confirmColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
