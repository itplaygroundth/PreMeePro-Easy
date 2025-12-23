import { useState } from 'react';
import { ProductionStep } from '../types';
import { Plus, Edit2, Trash2, GripVertical, Check, X, Settings, Cog } from 'lucide-react';
import Swal from 'sweetalert2';

interface StepsViewProps {
  steps: ProductionStep[];
  onAddStep: (name: string) => Promise<void>;
  onUpdateStep: (id: string, name: string) => Promise<void>;
  onDeleteStep: (id: string) => Promise<void>;
}

export function StepsView({ steps, onAddStep, onUpdateStep, onDeleteStep }: StepsViewProps) {
  const [newStepName, setNewStepName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    setLoading(true);
    try {
      await onAddStep(newStepName.trim());
      setNewStepName('');
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มขั้นตอนสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
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
      Swal.fire({
        icon: 'success',
        title: 'แก้ไขสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
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
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (step: ProductionStep) => {
    setEditingId(step.id);
    setEditingName(step.name);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Cog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">จัดการขั้นตอนการผลิต</h2>
            <p className="text-sm text-blue-100">ขั้นตอนทั้งหมด {steps.length} รายการ</p>
          </div>
        </div>
      </div>

      {/* Add New Step */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          เพิ่มขั้นตอนใหม่
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            placeholder="ชื่อขั้นตอน เช่น ตัดผ้า, เย็บ, รีด..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
          />
          <button
            onClick={handleAddStep}
            disabled={loading || !newStepName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl disabled:opacity-50 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            ลำดับขั้นตอนการผลิต
          </h3>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีขั้นตอน</h3>
            <p className="text-gray-400 text-sm">เพิ่มขั้นตอนแรกของคุณด้านบน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition group"
              >
                <GripVertical className="w-5 h-5 text-gray-300 shrink-0" />
                <span className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-sm shrink-0">
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
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

      {/* Info Card */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>หมายเหตุ:</strong> ขั้นตอนเหล่านี้จะถูกใช้เป็น template เมื่อเริ่มงานใหม่
          แต่ละงานสามารถเพิ่ม/ลบ/แก้ไขขั้นตอนเฉพาะของตัวเองได้
        </p>
      </div>
    </div>
  );
}
