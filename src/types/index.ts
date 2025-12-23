// Production types for easy version (step-based, no tickets)

export interface ProductionStep {
  id: string;
  name: string;
  order: number;
  is_active: boolean;
  template_id?: string; // Reference to template (null = default/legacy template)
}

// Production Template - กลุ่มของขั้นตอนการผลิต
export interface ProductionTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Template with steps for display
export interface ProductionTemplateWithSteps extends ProductionTemplate {
  steps: ProductionStep[];
}

export interface ProductionJob {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  current_step_id: string;
  current_step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  due_date?: string;
  template_id?: string; // Production template used for this job
  template_name?: string;
  created_at: string;
  updated_at: string;
  // Shipping info
  shipping_tracking_number?: string;
  shipping_carrier?: string;
  shipping_barcode_image?: string;
  shipping_pack_image?: string;
  shipping_notes?: string;
}

export interface StepHistory {
  id: string;
  job_id: string;
  step_id: string;
  step_name: string;
  started_at: string;
  completed_at?: string;
  operator_name?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'operator' | 'staff';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Step Details & Attachments
export interface StepDetail {
  id: string;
  job_id: string;
  step_id: string;
  details?: string;
  started_at?: string;
  completed_at?: string;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StepAttachment {
  id: string;
  job_id: string;
  step_id: string;
  attachment_type: 'image' | 'barcode' | 'qrcode' | 'document';
  file_url?: string;
  file_name?: string;
  barcode_value?: string;
  qrcode_value?: string;
  description?: string;
  created_at: string;
}

export interface StepData {
  step_id: string;
  step_name: string;
  details: StepDetail | null;
  attachments: StepAttachment[];
}

// Job-specific steps (copied from template when job starts)
export interface JobStep {
  id: string;
  job_id: string;
  step_template_id: string;
  name: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  operator_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
