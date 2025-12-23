import { useState, useEffect } from 'react';
import { ProductionJob, ProductionStep, User as UserType } from '../types';
import {
  X,
  ArrowRight,
  CheckCircle,
  XCircle,
  User,
  Package,
  Calendar,
  Play,
  ListOrdered,
  FileText,
  Loader2,
} from 'lucide-react';
import { StepDetailModal } from './StepDetailModal';
import { JobStepsManager } from './JobStepsManager';
import { jobService } from '../services/api';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ProductionJob;
  steps: ProductionStep[];
  onMoveToStep: (jobId: string, stepId: string) => Promise<void>;
  onComplete: (jobId: string) => Promise<void>;
  onCancel: (jobId: string) => void;
  onStartJob?: (jobId: string) => Promise<void>;
  onDataUpdated?: () => void;
  user?: UserType;
}

export function JobDetailModal({
  isOpen,
  onClose,
  job,
  steps,
  onMoveToStep,
  onComplete,
  onCancel,
  onStartJob,
  onDataUpdated,
  user,
}: JobDetailModalProps) {
  // Check if user can cancel (not staff)
  const canCancel = user?.role !== 'staff';
  const [showStepDetail, setShowStepDetail] = useState(false);
  const [showStepsManager, setShowStepsManager] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ProductionStep | null>(null);
  const [isStepReadOnly, setIsStepReadOnly] = useState(false);
  const [jobSteps, setJobSteps] = useState<ProductionStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  // Use job-specific steps when available, otherwise use template steps
  const activeSteps = jobSteps.length > 0 ? jobSteps : steps;

  // Find current step - job.current_step_id is template step ID
  // For job steps, we need to match by step_template_id
  const currentStepIndex = jobSteps.length > 0
    ? activeSteps.findIndex((s: any) => s.step_template_id === job.current_step_id || s.id === job.current_step_id)
    : activeSteps.findIndex((s) => s.id === job.current_step_id);

  const currentStep = activeSteps[currentStepIndex];
  const nextStep = activeSteps[currentStepIndex + 1];
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  // Load job-specific steps when job has started (in_progress, completed, cancelled)
  useEffect(() => {
    if (isOpen && job.status !== 'pending') {
      loadJobSteps();
    }
  }, [isOpen, job.id, job.status]);

  const loadJobSteps = async () => {
    setLoadingSteps(true);
    try {
      const response = await jobService.getJobSteps(job.id);
      setJobSteps(response.data || []);
    } catch (error) {
      console.error('Error loading job steps:', error);
    } finally {
      setLoadingSteps(false);
    }
  };

  const openStepDetail = (step: ProductionStep, readOnly = false) => {
    setSelectedStep(step);
    setIsStepReadOnly(readOnly);
    setShowStepDetail(true);
  };

  const statusConfig = {
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      label: 'รอดำเนินการ',
      gradient: 'from-amber-400 to-orange-500',
    },
    in_progress: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      label: 'กำลังดำเนินการ',
      gradient: 'from-blue-500 to-cyan-500',
    },
    completed: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'เสร็จสิ้น',
      gradient: 'from-emerald-500 to-green-500',
    },
    cancelled: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      label: 'ยกเลิก',
      gradient: 'from-red-400 to-red-500',
    },
  };

  const status = statusConfig[job.status];

  const handleCancel = () => {
    // Close modal first, then let parent (Dashboard.handleCancel) show the confirmation dialog
    onClose();
    onCancel(job.id);
  };

  if (!isOpen) return null;

  // Calculate progress based on active steps (job steps if available, otherwise template steps)
  const totalSteps = activeSteps.length;
  const completedStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progress =
    job.status === 'completed'
      ? 100
      : job.status === 'pending'
        ? 0
        : totalSteps > 0
          ? Math.round(((completedStepIndex + 1) / totalSteps) * 100)
          : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Color Strip */}
          <div className={`h-2 bg-gradient-to-r ${status.gradient}`} />

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">#{job.order_number}</h2>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <User className="w-4 h-4" />
                  <span>{job.customer_name}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={job.status === 'completed' ? '#10b981' : job.status === 'pending' ? '#f59e0b' : '#3b82f6'}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(progress / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                  {progress}%
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">ความคืบหน้า</div>
                <div className="font-semibold text-gray-800">
                  {job.status === 'completed'
                    ? 'งานเสร็จสมบูรณ์'
                    : job.status === 'pending'
                      ? 'รอเริ่มงาน'
                      : `${completedStepIndex + 1}/${totalSteps} ขั้นตอน`}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{job.product_name}</div>
                  <div className="text-sm text-gray-500">จำนวน {job.quantity} ชิ้น</div>
                </div>
              </div>
            </div>

            {/* Current Step */}
            {job.status === 'in_progress' && currentStep && (
              <div className={`${status.bg} rounded-xl p-4 border ${status.border}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ขั้นตอนปัจจุบัน</div>
                    <div className="font-bold text-gray-800 text-lg">{job.current_step_name}</div>
                  </div>
                  <button
                    onClick={() => openStepDetail(currentStep)}
                    className="px-4 py-2 text-sm bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition text-blue-600 font-medium shadow-sm"
                  >
                    <FileText className="w-4 h-4 inline mr-1" />
                    รายละเอียด
                  </button>
                </div>
              </div>
            )}

            {/* Due Date */}
            {job.due_date && (
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">กำหนดส่ง</div>
                  <div className="font-medium">
                    {new Date(job.due_date).toLocaleDateString('th-TH', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {job.notes && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs text-gray-400 mb-1">หมายเหตุ</div>
                <p className="text-gray-700">{job.notes}</p>
              </div>
            )}

            {/* Job Steps List (for all started jobs: in_progress, completed, cancelled) */}
            {job.status !== 'pending' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">ขั้นตอนการผลิต</h3>
                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => setShowStepsManager(true)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      จัดการ
                    </button>
                  )}
                </div>

                {loadingSteps ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSteps.map((step, index) => {
                      // For job steps, compare step_template_id with current_step_id
                      const stepTemplateId = (step as any).step_template_id;
                      const isCurrentStep = stepTemplateId
                        ? stepTemplateId === job.current_step_id
                        : step.id === job.current_step_id;

                      const isCurrent = (job.status === 'in_progress' || job.status === 'cancelled') && isCurrentStep;
                      const stepStatus = (step as any).status;
                      const isCompleted = stepStatus === 'completed';

                      // For completed/cancelled jobs, all steps are read-only
                      // For in_progress jobs, past steps are read-only
                      const isJobFinished = job.status === 'completed' || job.status === 'cancelled';
                      const isClickable = isJobFinished || isCompleted || isCurrent;

                      return (
                        <div
                          key={step.id}
                          onClick={() => isClickable && openStepDetail(step, !isCurrent || isJobFinished)}
                          className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent
                            ? job.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                            : isCompleted ? 'bg-emerald-50' : 'bg-white'
                            } ${isClickable ? 'cursor-pointer hover:opacity-80 active:scale-[0.98] transition' : ''}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent
                              ? job.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                              : isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                              }`}
                          >
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <span
                            className={`flex-1 text-sm ${isCurrent ? 'font-semibold text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-gray-500'
                              }`}
                          >
                            {step.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">
                              กำลังทำ
                            </span>
                          )}
                          {isCompleted && !isCurrent && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              ดูข้อมูล →
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-3">
            {job.status === 'pending' && (
              <button
                onClick={async () => {
                  await onStartJob?.(job.id);
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-green-200"
              >
                <Play className="w-5 h-5" />
                เริ่มงาน
              </button>
            )}

            {job.status === 'in_progress' && (
              <>
                {isLastStep ? (
                  <button
                    onClick={async () => {
                      await onComplete(job.id);
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-green-200"
                  >
                    <CheckCircle className="w-5 h-5" />
                    เสร็จสิ้น
                  </button>
                ) : nextStep ? (
                  <button
                    onClick={async () => {
                      await onMoveToStep(job.id, nextStep.id);
                      loadJobSteps(); // Reload job steps to update UI
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-blue-200"
                  >
                    <ArrowRight className="w-5 h-5" />
                    ส่ง {nextStep.name}
                  </button>
                ) : null}
              </>
            )}

            {(job.status === 'in_progress' || job.status === 'pending') && canCancel && (
              <button
                onClick={handleCancel}
                className="w-full bg-white hover:bg-red-50 text-red-600 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-red-200 font-medium"
              >
                <XCircle className="w-4 h-4" />
                ยกเลิกงาน
              </button>
            )}

            {(job.status === 'completed' || job.status === 'cancelled') && (
              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium transition"
              >
                ปิด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <StepDetailModal
          isOpen={showStepDetail}
          onClose={() => {
            setShowStepDetail(false);
            setSelectedStep(null);
            setIsStepReadOnly(false);
          }}
          job={job}
          step={selectedStep}
          isReadOnly={isStepReadOnly}
          onSaved={() => {
            onDataUpdated?.();
            loadJobSteps();
          }}
        />
      )}

      {/* Job Steps Manager Modal */}
      <JobStepsManager
        job={job}
        isOpen={showStepsManager}
        onClose={() => setShowStepsManager(false)}
        onStepsUpdated={() => {
          onDataUpdated?.();
          loadJobSteps();
        }}
      />
    </>
  );
}
