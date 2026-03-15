import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--border)] relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-red-500/10 p-3 rounded-full text-red-500">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <p className="text-[var(--foreground)]/70 mb-8 font-medium">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
