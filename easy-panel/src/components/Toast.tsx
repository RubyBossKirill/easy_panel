import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div
      className={`${getColors()} rounded-lg shadow-lg p-4 mb-3 min-w-[300px] max-w-[400px] flex items-start gap-3 animate-slide-in-right`}
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div className="text-2xl font-bold flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm font-medium break-words">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:opacity-80 transition-opacity flex-shrink-0 text-xl leading-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
