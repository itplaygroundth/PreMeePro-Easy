import { ProductionJob, ProductionStep } from '../types';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  Calendar,
  MoreVertical,
  FileText,
  Image,
  Play,
  ListOrdered,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { StepDetailModal } from './StepDetailModal';
import { JobStepsManager } from './JobStepsManager';
import { jobService } from '../services/api';

interface JobCardProps {
  job: ProductionJob;
  steps: ProductionStep[];
  onMoveToStep: (jobId: string, stepId: string) => void;
  onComplete: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onStartJob?: (jobId: string) => void;
  onStepDataUpdated?: () => void;
  compact?: boolean;
}

export function JobCard({ job, steps, onMoveToStep, onComplete, onCancel, onStartJob, onStepDataUpdated, compact = false }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStepDetail, setShowStepDetail] = useState(false);
  const [showStepsManager, setShowStepsManager] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ProductionStep | null>(null);
  const [jobSteps, setJobSteps] = useState<ProductionStep[]>([]);

  // Load job-specific steps when job is in_progress
  useEffect(() => {
    if (job.status === 'in_progress') {
      loadJobSteps();
    }
  }, [job.id, job.status]);

  const loadJobSteps = async () => {
    try {
      const response = await jobService.getJobSteps(job.id);
      setJobSteps(response.data || []);
    } catch (error) {
      console.error('Error loading job steps:', error);
    }
  };

  // Use job-specific steps when available, otherwise use template steps
  const activeSteps = jobSteps.length > 0 ? jobSteps : steps;
  const currentStepIndex = activeSteps.findIndex(s => s.id === job.current_step_id);
  const currentStep = activeSteps[currentStepIndex];

  const openStepDetail = (step: ProductionStep) => {
    setSelectedStep(step);
    setShowStepDetail(true);
  };
  const nextStep = activeSteps[currentStepIndex + 1];
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  const statusConfig = {
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      label: 'รอดำเนินการ',
    },
    in_progress: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      label: 'กำลังดำเนินการ',
    },
    completed: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'เสร็จสิ้น',
    },
    cancelled: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      label: 'ยกเลิก',
    },
  };

  const status = statusConfig[job.status];

  // Compact version for Kanban view
  if (compact) {
    return (
      <>
        <div className={`bg-white rounded-xl p-4 border ${status.border} shadow-sm hover:shadow-md transition`}>
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold text-gray-800">#{job.order_number}</span>
            <div className="flex items-center gap-1">
              {currentStep && (
                <button
                  onClick={() => openStepDetail(currentStep)}
                  className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-blue-600 font-medium"
                >
                  รายละเอียด
                </button>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.badge}`}>
                {status.label}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-1">{job.customer_name}</p>
          <p className="text-sm font-medium text-gray-800 mb-3">{job.product_name} x{job.quantity}</p>

          {job.status === 'in_progress' && (
            <div className="flex gap-2">
              {isLastStep ? (
                <button
                  onClick={() => onComplete(job.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  เสร็จ
                </button>
              ) : nextStep ? (
                <button
                  onClick={() => onMoveToStep(job.id, nextStep.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  ถัดไป
                </button>
              ) : null}
            </div>
          )}

          {job.status === 'pending' && (
            <button
              onClick={() => onStartJob?.(job.id)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-1.5 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition font-medium"
            >
              <Play className="w-3.5 h-3.5" />
              เริ่มงาน
            </button>
          )}
        </div>

        {/* Step Detail Modal for compact mode */}
        {selectedStep && (
          <StepDetailModal
            isOpen={showStepDetail}
            onClose={() => {
              setShowStepDetail(false);
              setSelectedStep(null);
            }}
            job={job}
            step={selectedStep}
            onSaved={onStepDataUpdated}
          />
        )}
      </>
    );
  }

  // Full version
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${status.border} hover:shadow-lg transition-all overflow-hidden`}>
      {/* Color Strip */}
      <div className={`h-1.5 ${job.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : job.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : job.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-300'}`} />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-800">#{job.order_number}</h3>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <User className="w-4 h-4" />
              <span>{job.customer_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
              {status.label}
            </span>
            {(job.status === 'in_progress' || job.status === 'pending') && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      {job.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            setShowStepsManager(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                        >
                          <ListOrdered className="w-4 h-4" />
                          จัดการขั้นตอน
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onCancel(job.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        ยกเลิกงาน
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex items-center gap-2 text-gray-700 mb-3">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{job.product_name}</span>
          <span className="text-gray-400 text-sm">x{job.quantity}</span>
        </div>

        {/* Current Step */}
        {job.current_step_name && currentStep && (
          <div className={`${status.bg} rounded-xl p-3 mb-3`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-500 mb-1">ขั้นตอนปัจจุบัน</div>
                <div className="font-semibold text-gray-800">{job.current_step_name}</div>
              </div>
              <button
                onClick={() => openStepDetail(currentStep)}
                className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-blue-600 font-medium shadow-sm"
              >
                รายละเอียด
              </button>
            </div>
          </div>
        )}

        {/* Due Date */}
        {job.due_date && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Calendar className="w-4 h-4" />
            <span>กำหนดส่ง: {new Date(job.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100">
            {job.notes}
          </div>
        )}

        {/* Actions */}
        {job.status === 'in_progress' && (
          <div className="flex gap-2 pt-2">
            {isLastStep ? (
              <button
                onClick={() => onComplete(job.id)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" />
                เสร็จสิ้น
              </button>
            ) : nextStep ? (
              <button
                onClick={() => onMoveToStep(job.id, nextStep.id)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowRight className="w-4 h-4" />
                ไป {nextStep.name}
              </button>
            ) : null}
          </div>
        )}

        {job.status === 'pending' && (
          <button
            onClick={() => onStartJob?.(job.id)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
          >
            <Play className="w-4 h-4" />
            เริ่มงาน
          </button>
        )}
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <StepDetailModal
          isOpen={showStepDetail}
          onClose={() => {
            setShowStepDetail(false);
            setSelectedStep(null);
          }}
          job={job}
          step={selectedStep}
          onSaved={onStepDataUpdated}
        />
      )}

      {/* Job Steps Manager Modal */}
      <JobStepsManager
        job={job}
        isOpen={showStepsManager}
        onClose={() => setShowStepsManager(false)}
        onStepsUpdated={onStepDataUpdated}
      />
    </div>
  );
}
