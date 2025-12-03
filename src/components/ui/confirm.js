"use client";
import { useState, createContext, useContext } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger", // danger, warning, info
    onConfirm: null,
    onCancel: null,
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || "Confirm Action",
        message: options.message || "Are you sure you want to proceed?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        type: options.type || "danger",
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  type,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconColor: "text-red-400",
          confirmBg: "bg-red-600 hover:bg-red-700",
          border: "border-red-800",
        };
      case "warning":
        return {
          iconColor: "text-yellow-400",
          confirmBg: "bg-yellow-600 hover:bg-yellow-700",
          border: "border-yellow-800",
        };
      case "info":
      default:
        return {
          iconColor: "text-blue-400",
          confirmBg: "bg-blue-600 hover:bg-blue-700",
          border: "border-blue-800",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative bg-gray-800 ${styles.border} border rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all`}
      >
        <div className="p-6">
          <div className="flex items-center">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center`}
            >
              <ExclamationTriangleIcon
                className={`h-6 w-6 ${styles.iconColor}`}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-300">{message}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white ${styles.confirmBg} border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
