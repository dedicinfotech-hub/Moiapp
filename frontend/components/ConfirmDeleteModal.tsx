'use client';

import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm transition-all duration-300"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 transform transition-all scale-100">
        <div className="p-6 text-center space-y-4">
          {/* Danger Warning Icon */}
          <div className="mx-auto w-12 h-12 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center text-xl">
            ⚠️
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-[#101010] text-base leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-500 leading-normal px-2">
              {message}
            </p>
          </div>
        </div>

        <div className="flex border-t border-[#F0F0F0] bg-gray-50/70">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1 py-3.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-r border-[#F0F0F0] outline-none disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 py-3.5 text-xs font-bold text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors outline-none disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
