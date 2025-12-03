"use client";
import { useState, useEffect, createContext, useContext } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 5000) => {
    const id = crypto.randomUUID();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, "success", duration),
    error: (message, duration) => addToast(message, "error", duration),
    warning: (message, duration) => addToast(message, "warning", duration),
    info: (message, duration) => addToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles =
      "flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 transform";
    const visibilityStyles = isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    const typeStyles = {
      success: "bg-green-800 border-green-700 text-green-100",
      error: "bg-red-800 border-red-700 text-red-100",
      warning: "bg-yellow-800 border-yellow-700 text-yellow-100",
      info: "bg-blue-800 border-blue-700 text-blue-100",
    };

    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`;
  };

  const getIcon = () => {
    const iconProps = { className: "h-5 w-5 shrink-0 mt-0.5" };

    switch (toast.type) {
      case "success":
        return (
          <CheckCircleIcon
            {...iconProps}
            className="h-5 w-5 shrink-0 mt-0.5 text-green-400"
          />
        );
      case "error":
        return (
          <XCircleIcon
            {...iconProps}
            className="h-5 w-5 shrink-0 mt-0.5 text-red-400"
          />
        );
      case "warning":
        return (
          <ExclamationTriangleIcon
            {...iconProps}
            className="h-5 w-5 shrink-0 mt-0.5 text-yellow-400"
          />
        );
      case "info":
      default:
        return (
          <InformationCircleIcon
            {...iconProps}
            className="h-5 w-5 shrink-0 mt-0.5 text-blue-400"
          />
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="ml-4 shrink-0 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
