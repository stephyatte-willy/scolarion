// app/components/Toast.tsx
'use client';

import { useState, useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        setTimeout(onClose, 300);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return '';
      case 'error':
        return '';
      case 'warning':
        return '';
      case 'info':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className={`toast-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className={`toast toast-${type}`}>
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-content">
          <div className="toast-title">{getTitle()}</div>
          <div className="toast-message">{message}</div>
        </div>
        <button className="toast-close" onClick={handleClose}>
          ✕
        </button>
        <div 
          className="toast-progress" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}