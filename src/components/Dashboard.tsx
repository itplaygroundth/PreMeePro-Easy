import { useState, useEffect, useCallback } from 'react';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useNotifications } from '../hooks/useNotifications';
import { registerForPushNotifications, savePushToken } from '../services/pushNotifications';
import { ProductionStep, ProductionJob, User } from '../types';
import { stepService, jobService, uploadService } from '../services/api';
import { NewJobModal } from './NewJobModal';
import { JobDetailModal } from './JobDetailModal';
import { BottomNavigation, TabId } from './BottomNavigation';
import { SettingsView } from './SettingsView';
import { ReportsView } from './ReportsView';
import { NotificationBell, Notification } from './NotificationBell';
import Swal from 'sweetalert2';
import {
  Plus,
  RefreshCw,
  Package,
  Filter,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [filterStep, setFilterStep] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Notification system - notifications are created server-side via notification_queue
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      const [stepsData, jobsData] = await Promise.all([
        stepService.getAll(),
        jobService.getAll(),
      ]);
      setSteps(stepsData.data || stepsData || []);
      const newJobs = jobsData.data || jobsData || [];
      setJobs(newJobs);

      // Update selectedJob if it exists with fresh data
      setSelectedJob((prev) => {
        if (prev) {
          const updatedJob = newJobs.find((j: ProductionJob) => j.id === prev.id);
          return updatedJob || prev;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle deep link from URL query parameter ?job=xxx
  useEffect(() => {
    const handleDeepLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('job');

      if (jobId && jobs.length > 0) {
        const targetJob = jobs.find((j) => j.id === jobId);
        if (targetJob) {
          setSelectedJob(targetJob);
          setShowJobDetail(true);
          // Clear the URL parameter after handling
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // Job not found in current list, try to fetch it directly
          try {
            const response = await jobService.getById(jobId);
            const jobData = response.data || response;
            if (jobData) {
              setSelectedJob(jobData);
              setShowJobDetail(true);
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (error) {
            console.error('Failed to fetch job from URL:', error);
          }
        }
      }
    };

    handleDeepLink();
  }, [jobs]);

  // Register for Push Notifications
  useEffect(() => {
    const registerPush = async () => {
      try {
        const subscription = await registerForPushNotifications();
        if (subscription) {
          await savePushToken(subscription);
        }
      } catch (error) {
        console.error('Failed to register for push notifications:', error);
      }
    };
    registerPush();
  }, []);

  // Realtime updates for jobs - just refresh data, notifications are created server-side
  useRealtimeSubscription({
    table: 'pari_production_jobs',
    onInsert: (newJob: any) => {
      console.log('New job received', newJob);
      // Notifications are created server-side via notification_queue table
      fetchData();
    },
    onUpdate: (updatedJobPayload: any) => {
      console.log('Job updated payload:', updatedJobPayload);
      // Notifications are created server-side via notification_queue table
      fetchData();
    },
    onDelete: () => {
      fetchData();
    },
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Step Management
  // const handleAddStep = async (name: string) => {
  //   await stepService.create(name, steps.length + 1);
  //   fetchData();
  // };

  // const handleUpdateStep = async (id: string, name: string) => {
  //   await stepService.update(id, { name });
  //   fetchData();
  // };

  // const handleDeleteStep = async (id: string) => {
  //   await stepService.delete(id);
  //   fetchData();
  // };

  // Job Management
  const handleCreateJob = async (data: {
    order_number?: string;
    customer_name: string;
    product_name: string;
    quantity: number;
    notes?: string;
    due_date?: string;
    template_id?: string;
  }) => {
    await jobService.create(data);
    fetchData();
  };

  const handleMoveToStep = async (jobId: string, stepId: string) => {
    await jobService.moveToStep(jobId, stepId);
    fetchData();
  };

  const handleComplete = async (jobId: string) => {
    await jobService.complete(jobId);
    fetchData();
  };

  const handleCancel = async (jobId: string) => {
    const result = await Swal.fire({
      title: 'ยกเลิกงาน?',
      text: 'ต้องการยกเลิกงานนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยกเลิกงาน',
      cancelButtonText: 'ไม่',
    });

    if (!result.isConfirmed) return;
    await jobService.cancel(jobId);
    fetchData();
  };

  // Delete job permanently (admin only)
  const handleDelete = async (jobId: string) => {
    // Find the job to show its details in the confirmation
    const jobToDelete = jobs.find((j) => j.id === jobId);

    const result = await Swal.fire({
      title: 'ลบงานถาวร?',
      html: `
        <div class="text-left">
          <p class="mb-2">ต้องการลบงานนี้อย่างถาวรหรือไม่?</p>
          <p class="text-sm text-gray-500 mb-2">รหัส: <strong>${jobToDelete?.order_number || jobId}</strong></p>
          <p class="text-sm text-gray-500 mb-2">สินค้า: <strong>${jobToDelete?.product_name || '-'}</strong></p>
          <p class="text-red-600 text-sm font-medium mt-3">⚠️ การลบนี้ไม่สามารถย้อนกลับได้!</p>
          <p class="text-gray-500 text-xs mt-1">ข้อมูลทั้งหมดรวมถึงประวัติ รูปภาพ และไฟล์แนบจะถูกลบ</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบถาวร',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    try {
      await jobService.delete(jobId);
      await Swal.fire({
        icon: 'success',
        title: 'ลบงานสำเร็จ',
        text: `งาน ${jobToDelete?.order_number || ''} ถูกลบแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedJob(null);
      setShowJobDetail(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถลบได้',
        text: error.response?.data?.error || error.message || 'Unknown error',
      });
    }
  };

  // Start job - creates steps from template
  const handleStartJob = async (jobId: string) => {
    try {
      await jobService.start(jobId);
      await Swal.fire({
        icon: 'success',
        title: 'เริ่มงานสำเร็จ',
        text: 'สร้างขั้นตอนการผลิตเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to start job:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเริ่มงานได้',
        text: error.response?.data?.error || error.message || 'Unknown error',
      });
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (filterStep !== 'all' && job.current_step_id !== filterStep) return false;
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    return true;
  });

  // Handle job click to show details
  const handleJobClick = (job: ProductionJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const handleCloseJobDetail = () => {
    setShowJobDetail(false);
    setSelectedJob(null);
  };

  // Handle notification click - open job detail
  const handleNotificationClick = (notification: Notification) => {
    if (notification.data?.jobId) {
      const job = jobs.find((j) => j.id === notification.data?.jobId);
      if (job) {
        setSelectedJob(job);
        setShowJobDetail(true);
        setActiveTab('dashboard');
      }
    }
  };

  // Get page title based on active tab
  const getPageTitle = () => {
    const titles: Record<TabId, string> = {
      dashboard: 'งานทั้งหมด',
      reports: 'รายงาน',
      settings: 'ตั้งค่า',
    };
    return titles[activeTab];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <SettingsView
            user={user}
            onLogout={onLogout}
            onDataChanged={fetchData}
          />
        );
      case 'reports':
        return <ReportsView jobs={jobs} />;
      case 'dashboard':
      default:
        return renderJobsContent();
    }
  };

  // Jobs content (main dashboard)
  const renderJobsContent = () => (
    <>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Add Job Button */}
          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-medium shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>สร้างงานใหม่</span>
          </button>

        </div>

        {/* Filters - Responsive layout */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 flex-1 sm:flex-none min-w-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="bg-transparent outline-none text-sm text-gray-700 w-full sm:w-auto truncate"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
          </div>

          {steps.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 flex-1 sm:flex-none min-w-0">
              <span className="text-xs sm:text-sm text-gray-400 shrink-0">ขั้นตอน:</span>
              <select
                value={filterStep}
                onChange={(e) => setFilterStep(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-700 w-full sm:w-auto truncate"
              >
                <option value="all">ทั้งหมด</option>
                {steps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีงาน</h3>
          <p className="text-gray-400 mb-6">เริ่มต้นสร้างงานแรกของคุณเลย</p>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            <Plus className="w-5 h-5" />
            สร้างงานใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .map((job) => {
              // Use progress from backend (calculated based on job steps)
              const progress = (job as any).progress ?? 0;

              // Card colors based on status
              const cardStyles = job.status === 'completed'
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-l-emerald-500 hover:from-emerald-100 hover:to-green-100 shadow-emerald-100'
                : job.status === 'cancelled'
                  ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500 hover:from-red-100 hover:to-rose-100 shadow-red-100'
                  : job.status === 'pending'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-500 hover:from-amber-100 hover:to-orange-100 shadow-amber-100'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 hover:from-blue-100 hover:to-indigo-100 shadow-blue-100';

              const progressColor = job.status === 'completed'
                ? '#10b981'
                : job.status === 'cancelled'
                  ? '#ef4444'
                  : job.status === 'pending'
                    ? '#f59e0b'
                    : '#3b82f6';

              const stepTextColor = job.status === 'completed'
                ? 'text-emerald-600'
                : job.status === 'cancelled'
                  ? 'text-red-600'
                  : job.status === 'pending'
                    ? 'text-amber-600'
                    : 'text-blue-600';

              // Get current step image URL
              const currentStepImage = (job as any).current_step_image;

              return (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`flex items-center gap-3 p-4 rounded-xl shadow-md transition cursor-pointer active:scale-[0.99] ${cardStyles}`}
                >
                  {/* Progress Circle */}
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke={progressColor}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(progress / 100) * 125.66} 125.66`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                      {progress}%
                    </span>
                  </div>

                  {/* Current Step Image Thumbnail - Show for all started jobs */}
                  {currentStepImage && job.status !== 'pending' && (
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={uploadService.getFullImageUrl(currentStepImage)}
                        alt="Step"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 text-sm">
                        #{job.order_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate font-medium">{job.product_name}</p>
                    <p className="text-xs text-gray-500 truncate">{job.customer_name}</p>
                  </div>

                  {/* Current Step & Status */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-semibold mb-1 ${stepTextColor}`}>
                      {job.status === 'completed'
                        ? 'เสร็จสิ้น'
                        : job.status === 'pending'
                          ? 'รอเริ่มงาน'
                          : job.current_step_name || '-'}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${job.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : job.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {job.status === 'completed' ? 'เสร็จสิ้น' : job.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                    </span>
                  </div>

                  <ChevronRight className={`w-5 h-5 shrink-0 ${job.status === 'completed' ? 'text-emerald-400' : job.status === 'pending' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                </div>
              );
            })}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-sm sticky top-0 z-40 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* Main Header Row */}
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">{getPageTitle()}</h1>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">SmartFab</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Notification Bell */}
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClear={clearNotification}
                onClearAll={clearAll}
                onNotificationClick={handleNotificationClick}
              />

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition active:scale-95"
                title="รีเฟรช"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* User Profile Avatar */}
              <button
                onClick={() => setActiveTab('settings')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-300 transition active:scale-95"
                title={user.name || user.username}
              >
                {user.picture_url ? (
                  <img
                    src={user.picture_url}
                    alt={user.name || user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 pb-24">
        {renderContent()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* New Job Modal */}
      <NewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onSubmit={handleCreateJob}
      />

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          isOpen={showJobDetail}
          onClose={handleCloseJobDetail}
          job={selectedJob}
          steps={steps}
          onMoveToStep={handleMoveToStep}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onStartJob={handleStartJob}
          onDataUpdated={fetchData}
          user={user}
        />
      )}
    </div>
  );
}
