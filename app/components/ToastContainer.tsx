'use client';

import { useToast } from '../hooks/useToast';
import ToastNotification from './ToastNotification';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toasts-container">
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}