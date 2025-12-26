import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Extract base URL without /api suffix for storage proxy URLs
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', {
      provider: 'username',
      username,
      password,
    });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  // LINE Login
  getLineLoginUrl: async () => {
    const response = await api.get('/auth/line');
    return response.data;
  },
  // Get pending LINE users for approval (admin only)
  getPendingLineUsers: async () => {
    const response = await api.get('/auth/line/pending');
    return response.data;
  },
  // Approve LINE user (admin only)
  approveLineUser: async (data: {
    lineUserId: string;
    role: string;
    username: string;
    name?: string;
    email?: string;
  }) => {
    const response = await api.post('/auth/line/approve', data);
    return response.data;
  },
  // Link existing user with LINE (admin only)
  linkLineUser: async (lineUserId: string, userId: string) => {
    const response = await api.post('/auth/line/link', { lineUserId, userId });
    return response.data;
  },
  // Reject pending LINE user (admin only)
  rejectLineUser: async (lineUserId: string) => {
    const response = await api.delete(`/auth/line/pending/${lineUserId}`);
    return response.data;
  },
};

// Staff Management
export const staffService = {
  getAll: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  create: async (data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    role: 'admin' | 'operator' | 'staff';
  }) => {
    const response = await api.post('/auth/users', data);
    return response.data;
  },
  update: async (id: string, data: {
    name?: string;
    email?: string;
    role?: 'admin' | 'operator' | 'staff';
    password?: string;
  }) => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },
};

// Production Templates
export const templateService = {
  // Get all templates with steps count
  getAll: async () => {
    const response = await api.get('/productions-easy/templates');
    return response.data;
  },
  // Get single template with steps
  getById: async (id: string) => {
    const response = await api.get(`/productions-easy/templates/${id}`);
    return response.data;
  },
  // Create new template
  create: async (data: { name: string; description?: string; is_default?: boolean }) => {
    const response = await api.post('/productions-easy/templates', data);
    return response.data;
  },
  // Update template
  update: async (id: string, data: { name?: string; description?: string; is_default?: boolean; is_active?: boolean }) => {
    const response = await api.put(`/productions-easy/templates/${id}`, data);
    return response.data;
  },
  // Delete template
  delete: async (id: string) => {
    const response = await api.delete(`/productions-easy/templates/${id}`);
    return response.data;
  },
  // Add step to template
  addStep: async (templateId: string, name: string, order?: number) => {
    const response = await api.post(`/productions-easy/templates/${templateId}/steps`, { name, order });
    return response.data;
  },
  // Update step in template
  updateStep: async (templateId: string, stepId: string, data: { name?: string; order?: number }) => {
    const response = await api.put(`/productions-easy/templates/${templateId}/steps/${stepId}`, data);
    return response.data;
  },
  // Delete step from template
  deleteStep: async (templateId: string, stepId: string) => {
    const response = await api.delete(`/productions-easy/templates/${templateId}/steps/${stepId}`);
    return response.data;
  },
  // Duplicate template
  duplicate: async (templateId: string, newName: string) => {
    const response = await api.post(`/productions-easy/templates/${templateId}/duplicate`, { name: newName });
    return response.data;
  },
  // Create default starter template with common steps
  createDefaultTemplate: async () => {
    const response = await api.post('/productions-easy/templates/create-default');
    return response.data;
  },
};

// Production Steps (legacy - for backward compatibility)
export const stepService = {
  getAll: async (templateId?: string) => {
    const params = templateId ? { template_id: templateId } : {};
    const response = await api.get('/productions-easy/steps', { params });
    return response.data;
  },
  create: async (name: string, order: number, templateId?: string) => {
    const response = await api.post('/productions-easy/steps', { name, order, template_id: templateId });
    return response.data;
  },
  update: async (id: string, data: { name?: string; order?: number; is_active?: boolean }) => {
    const response = await api.put(`/productions-easy/steps/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/productions-easy/steps/${id}`);
    return response.data;
  },
};

// Production Jobs
export const jobService = {
  getAll: async (stepId?: string) => {
    const params = stepId ? { step_id: stepId } : {};
    const response = await api.get('/productions-easy/jobs', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/productions-easy/jobs/${id}`);
    return response.data;
  },
  create: async (data: {
    order_id?: string;
    order_number?: string;
    customer_name: string;
    product_name: string;
    quantity: number;
    notes?: string;
    due_date?: string;
    template_id?: string; // Production template to use
  }) => {
    const response = await api.post('/productions-easy/jobs', data);
    return response.data;
  },
  // Start job - creates steps from template
  start: async (jobId: string) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/start`);
    return response.data;
  },
  moveToStep: async (jobId: string, stepId: string, notes?: string) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/move`, {
      step_id: stepId,
      notes,
    });
    return response.data;
  },
  complete: async (jobId: string) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/complete`);
    return response.data;
  },
  cancel: async (jobId: string, reason?: string) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/cancel`, { reason });
    return response.data;
  },
  // Delete job permanently (admin only, completed/cancelled jobs only)
  delete: async (jobId: string) => {
    const response = await api.delete(`/productions-easy/jobs/${jobId}`);
    return response.data;
  },
  getHistory: async (jobId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/history`);
    return response.data;
  },
  // Job Steps (per job)
  getJobSteps: async (jobId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/job-steps`);
    return response.data;
  },
  updateJobStep: async (
    jobId: string,
    stepId: string,
    data: { status?: string; operator_name?: string; notes?: string }
  ) => {
    const response = await api.put(`/productions-easy/jobs/${jobId}/job-steps/${stepId}`, data);
    return response.data;
  },
  completeJobStep: async (jobId: string, stepId: string, data?: { operator_name?: string; notes?: string }) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/job-steps/${stepId}/complete`, data || {});
    return response.data;
  },
  // Job Step Management (Add/Delete/Rename for specific job)
  addJobStep: async (jobId: string, name: string, afterStepId?: string) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/job-steps`, {
      name,
      after_step_id: afterStepId,
    });
    return response.data;
  },
  deleteJobStep: async (jobId: string, stepId: string) => {
    const response = await api.delete(`/productions-easy/jobs/${jobId}/job-steps/${stepId}`);
    return response.data;
  },
  renameJobStep: async (jobId: string, stepId: string, name: string) => {
    const response = await api.patch(`/productions-easy/jobs/${jobId}/job-steps/${stepId}/rename`, { name });
    return response.data;
  },
  reorderJobSteps: async (jobId: string, stepIds: string[]) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/job-steps/reorder`, { step_ids: stepIds });
    return response.data;
  },
};

// Orders (for linking)
export const orderService = {
  getPending: async () => {
    const response = await api.get('/orders', { params: { status: 'pending' } });
    return response.data;
  },
};

// Push Tokens
export const notificationService = {
  savePushToken: async (token: string) => {
    const response = await api.post('/push-token', { token, platform: 'web' });
    return response.data;
  },
  removePushToken: async (token: string) => {
    const response = await api.delete('/push-token', { data: { token } });
    return response.data;
  },
  testPushNotification: async () => {
    const response = await api.post('/push-token/test');
    return response.data;
  },
  getPushTokensInfo: async () => {
    const response = await api.get('/push-token/info');
    return response.data;
  },
};

// LINE Official Account
export const lineOAService = {
  getStatus: async () => {
    const response = await api.get('/line/status');
    return response.data;
  },
  testNotification: async () => {
    const response = await api.post('/line/test');
    return response.data;
  },
};

// Notification Settings (Web Push & LINE toggles)
export const notificationSettingsService = {
  // Get notification settings for current user
  getSettings: async (): Promise<{
    line: { enabled: boolean; connected: boolean };
    webPush: { enabled: boolean; hasTokens: boolean };
  }> => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },
  // Update notification setting
  updateSetting: async (type: 'line' | 'webPush', enabled: boolean) => {
    const response = await api.put('/notifications/settings', { type, enabled });
    return response.data;
  },
};

// In-App Notifications (notification bell)
export const inAppNotificationService = {
  getAll: async (limit = 50, unreadOnly = false) => {
    const params: Record<string, any> = { limit };
    if (unreadOnly) params.unread_only = 'true';
    const response = await api.get('/notifications/in-app', { params });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/in-app/count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/in-app/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/in-app/read-all');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/in-app/${id}`);
    return response.data;
  },
  deleteAll: async () => {
    const response = await api.delete('/notifications/in-app');
    return response.data;
  },
};

// Step Details & Attachments
export const stepDataService = {
  // Get all step data for a job
  getAllStepData: async (jobId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/steps-data`);
    return response.data;
  },

  // Get step details
  getDetails: async (jobId: string, stepId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/steps/${stepId}/details`);
    return response.data;
  },

  // Save step details (including shipping info per step)
  saveDetails: async (
    jobId: string,
    stepId: string,
    data: {
      details?: string;
      operator_name?: string;
      // Shipping info (per step)
      shipping_tracking_number?: string;
      shipping_carrier?: string;
      shipping_barcode_image?: string;
      shipping_pack_image?: string;
      shipping_notes?: string;
    }
  ) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/steps/${stepId}/details`, data);
    return response.data;
  },

  // Get attachments
  getAttachments: async (jobId: string, stepId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/steps/${stepId}/attachments`);
    return response.data;
  },

  // Add attachment
  addAttachment: async (
    jobId: string,
    stepId: string,
    data: {
      attachment_type: 'image' | 'barcode' | 'qrcode' | 'document';
      file_url?: string;
      file_name?: string;
      barcode_value?: string;
      qrcode_value?: string;
      description?: string;
    }
  ) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/steps/${stepId}/attachments`, data);
    return response.data;
  },

  // Delete attachment
  deleteAttachment: async (attachmentId: string) => {
    const response = await api.delete(`/productions-easy/attachments/${attachmentId}`);
    return response.data;
  },
};

// Shipping Info
export const shippingService = {
  // Get shipping info for a job
  getShippingInfo: async (jobId: string) => {
    const response = await api.get(`/productions-easy/jobs/${jobId}/shipping`);
    return response.data;
  },

  // Save shipping info
  saveShippingInfo: async (
    jobId: string,
    data: {
      shipping_tracking_number?: string;
      shipping_carrier?: string;
      shipping_barcode_image?: string;
      shipping_pack_image?: string;
      shipping_notes?: string;
    }
  ) => {
    const response = await api.post(`/productions-easy/jobs/${jobId}/shipping`, data);
    return response.data;
  },
};

// Upload Service - upload images to storage (same as BrideParish)
export const uploadService = {
  /**
   * Convert base64 data URL to File object
   */
  base64ToFile: (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  },

  /**
   * Upload a file to Supabase Storage via the backend API
   */
  uploadFile: async (file: File, bucketName = 'production-images'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucketName', bucketName);

    const response = await api.post('/buckets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convert relative proxy URL to full URL
    const proxyUrl = response.data.file.publicUrl;
    return uploadService.getFullImageUrl(proxyUrl);
  },

  /**
   * Upload a base64 image to Supabase Storage
   */
  uploadBase64Image: async (
    base64: string,
    filename: string,
    bucketName = 'production-images'
  ): Promise<string> => {
    const file = uploadService.base64ToFile(base64, filename);
    return uploadService.uploadFile(file, bucketName);
  },

  /**
   * Convert a storage URL to full URL accessible by frontend
   * Handles both:
   * - New proxy URLs: /api/buckets/proxy/... → full URL
   * - Old direct Supabase URLs: http://localhost:8000/... → proxy URL
   * - Already full URLs: https://... → unchanged
   */
  getFullImageUrl: (url: string | null | undefined): string => {
    if (!url) return '';

    // Already a data URL (base64)
    if (url.startsWith('data:')) {
      return url;
    }

    // New format: relative proxy URL
    if (url.startsWith('/api/')) {
      return `${API_BASE_URL}${url}`;
    }

    // Old format: direct Supabase localhost URL - convert to proxy
    if (url.includes('localhost:8000/storage/')) {
      // Extract bucket and path from: http://localhost:8000/storage/v1/object/public/bucket/path
      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (match) {
        const [, bucket, path] = match;
        return `${API_BASE_URL}/api/buckets/proxy/${bucket}/${path}`;
      }
    }

    // Already a full URL (https or other), return as-is
    return url;
  },
};

export default api;
