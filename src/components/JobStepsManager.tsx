import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JobStep, ProductionJob } from '../types';
import { jobService } from '../services/api';
import Swal from 'sweetalert2';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Check,
  X,
  ListOrdered,
  CheckCircle,
  Clock,
  AlertCircle,
  SkipForward,
} from 'lucide-react';

interface JobStepsManagerProps {
  job: ProductionJob;
  isOpen: boolean;
  onClose: () => void;
  onStepsUpdated?: () => void;
}

export function JobStepsManager({ job, isOpen, onClose, onStepsUpdated }: JobStepsManagerProps) {
  const [steps, setSteps] = useState<JobStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStepName, setNewStepName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch job steps
  const fetchSteps = async () => {
    try {
      setLoading(true);
      const result = await jobService.getJobSteps(job.id);
      setSteps(result.data || []);
    } catch (error) {
      console.error('Failed to fetch job steps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSteps();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, job.id]);

  // Add new step
  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    setSaving(true);
    try {
      await jobService.addJobStep(job.id, newStepName.trim());
      setNewStepName('');
      await fetchSteps();
      onStepsUpdated?.();
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มขั้นตอนสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Rename step
  const handleRenameStep = async (stepId: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      await jobService.renameJobStep(job.id, stepId, editingName.trim());
      setEditingId(null);
      setEditingName('');
      await fetchSteps();
      onStepsUpdated?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete step
  const handleDeleteStep = async (stepId: string, stepName: string) => {
    const result = await Swal.fire({
      title: 'ลบขั้นตอน?',
      text: `ต้องการลบ "${stepName}" ออกจากงานนี้?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      await jobService.deleteJobStep(job.id, stepId);
      await fetchSteps();
      onStepsUpdated?.();
      Swal.fire({
        icon: 'success',
        title: 'ลบขั้นตอนสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถลบได้',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const startEditing = (step: JobStep) => {
    setEditingId(step.id);
    setEditingName(step.name);
  };

  // Get status icon and color
  const getStatusInfo = (status: JobStep['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'เสร็จแล้ว' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'กำลังทำ' };
      case 'skipped':
        return { icon: SkipForward, color: 'text-gray-400', bg: 'bg-gray-50', label: 'ข้าม' };
      default:
        return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'รอ' };
    }
  };

  if (!isOpen) return null;

  const modalContent = createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full sm:w-auto sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">จัดการขั้นตอน</h3>
              <p className="text-xs text-purple-100">#{job.order_number} • {steps.length} ขั้นตอน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p>กำลังโหลด...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มีขั้นตอน</p>
              <p className="text-sm mt-1">กดปุ่ม "เริ่มงาน" เพื่อสร้างขั้นตอนจาก Template</p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, index) => {
                const statusInfo = getStatusInfo(step.status);
                const StatusIcon = statusInfo.icon;
                const canDelete = step.status !== 'in_progress' && step.status !== 'completed';
                const canEdit = step.status !== 'completed';

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 ${statusInfo.bg} rounded-xl transition group border border-transparent hover:border-gray-200`}
                  >
                    <GripVertical className="w-5 h-5 text-gray-300 shrink-0 cursor-grab" />

                    {/* Order Number */}
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold shadow-sm shrink-0 ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : step.status === 'in_progress'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                    }`}>
                      {step.status === 'completed' ? <Check className="w-4 h-4" /> : index + 1}
                    </span>

                    {/* Step Name / Edit Input */}
                    {editingId === step.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameStep(step.id)}
                        />
                        <button
                          onClick={() => handleRenameStep(step.id)}
                          disabled={saving}
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 truncate">{step.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                            <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                            {step.operator_name && (
                              <span className="text-xs text-gray-400">• {step.operator_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition">
                          {canEdit && (
                            <button
                              onClick={() => startEditing(step)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="แก้ไขชื่อ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteStep(step.id, step.name)}
                              disabled={saving}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="ลบขั้นตอน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Step */}
        {job.status === 'in_progress' && (
          <div className="p-4 border-t bg-gray-50 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                placeholder="ชื่อขั้นตอนใหม่..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              />
              <button
                onClick={handleAddStep}
                disabled={saving || !newStepName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl disabled:opacity-50 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">เพิ่ม</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              เพิ่มขั้นตอนใหม่ต่อท้าย (สามารถลบได้เฉพาะขั้นตอนที่ยังไม่ได้ทำ)
            </p>
          </div>
        )}
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

  return modalContent;
}
