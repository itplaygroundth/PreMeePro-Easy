import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProductionStep } from '../types';
import { Plus, Edit2, Trash2, GripVertical, Check, X, Settings } from 'lucide-react';
import Swal from 'sweetalert2';

interface StepManagerProps {
  steps: ProductionStep[];
  onAddStep: (name: string) => Promise<void>;
  onUpdateStep: (id: string, name: string) => Promise<void>;
  onDeleteStep: (id: string) => Promise<void>;
}

export function StepManager({ steps, onAddStep, onUpdateStep, onDeleteStep }: StepManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    setLoading(true);
    try {
      await onAddStep(newStepName.trim());
      setNewStepName('');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStep = async (id: string) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      await onUpdateStep(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStep = async (id: string) => {
    const result = await Swal.fire({
      title: 'ลบขั้นตอน?',
      text: 'ต้องการลบขั้นตอนนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      await onDeleteStep(id);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (step: ProductionStep) => {
    setEditingId(step.id);
    setEditingName(step.name);
  };

  const modalContent = isOpen && createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Panel */}
      <div className="relative w-full sm:w-auto sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">จัดการขั้นตอน</h3>
              <p className="text-xs text-blue-100">ขั้นตอนการผลิต {steps.length} รายการ</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มีขั้นตอน</p>
              <p className="text-sm mt-1">เพิ่มขั้นตอนแรกด้านล่าง</p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                >
                  <GripVertical className="w-5 h-5 text-gray-300 shrink-0" />
                  <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shrink-0">
                    {index + 1}
                  </span>

                  {editingId === step.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateStep(step.id)}
                      />
                      <button
                        onClick={() => handleUpdateStep(step.id)}
                        disabled={loading}
                        className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-gray-700">{step.name}</span>
                      <button
                        onClick={() => startEditing(step)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Step */}
        <div className="p-4 border-t bg-gray-50 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              placeholder="ชื่อขั้นตอนใหม่..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
            />
            <button
              onClick={handleAddStep}
              disabled={loading || !newStepName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl disabled:opacity-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">เพิ่ม</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );

  return (
    <>
      {/* Trigger Button - Icon only on mobile, with text on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 sm:px-4 sm:py-2 rounded-xl transition"
        title="จัดการขั้นตอน"
      >
        <Settings className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">จัดการขั้นตอน</span>
      </button>

      {/* Modal via Portal */}
      {modalContent}
    </>
  );
}
