"use client";

import { useState } from "react";
import { Modal } from "./modal";

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
  required?: boolean;
  isLoading?: boolean;
}

export function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  submitText = "确认",
  cancelText = "取消",
  required = false,
  isLoading = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onSubmit(value.trim());
  };

  const handleClose = () => {
    setValue(defaultValue);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-slate-600">{message}</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={isLoading || (required && !value.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
