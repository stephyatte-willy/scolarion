// app/components/ToastNotification.tsx
'use client';

import { useEffect } from 'react';

// ✅ Élargir le type pour inclure "info"
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({
  type,
  message,
  onClose,
  duration = 5000
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Définir les styles selon le type
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className={`toast-notification border rounded-lg p-4 shadow-lg mb-2 ${getStyles()}`}>
      <div className="flex items-center">
        <span className="mr-2 font-bold">{getIcon()}</span>
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
