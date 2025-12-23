import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { MobileDatePicker } from './ui/MobileDatePicker';
import { ProductionTemplateWithSteps } from '../types';
import { templateService } from '../services/api';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    order_number?: string;
    customer_name: string;
    product_name: string;
    quantity: number;
    notes?: string;
    due_date?: string;
    template_id?: string;
  }) => Promise<void>;
}

export function NewJobModal({ isOpen, onClose, onSubmit }: NewJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ProductionTemplateWithSteps[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    product_name: '',
    quantity: 1,
    notes: '',
    due_date: '',
    template_id: '',
  });

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await templateService.getAll();
      const templatesData = response.data || [];
      setTemplates(templatesData);

      // Auto-select default template
      const defaultTemplate = templatesData.find((t: ProductionTemplateWithSteps) => t.is_default);
      if (defaultTemplate) {
        setFormData((prev) => ({ ...prev, template_id: defaultTemplate.id }));
      } else if (templatesData.length > 0) {
        setFormData((prev) => ({ ...prev, template_id: templatesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        notes: formData.notes || undefined,
        due_date: formData.due_date || undefined,
        template_id: formData.template_id || undefined,
      });
      setFormData({
        customer_name: '',
        product_name: '',
        quantity: 1,
        notes: '',
        due_date: '',
        template_id: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold text-gray-800">สร้างงานใหม่</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* เลขใบสั่งจะสร้างอัตโนมัติ: JOB-YYMMDD-XXX */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <span className="font-medium">เลขที่ใบสั่ง:</span> สร้างอัตโนมัติ (เช่น JOB-241222-001)
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปแบบการผลิต
              </label>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        formData.template_id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template_id"
                        value={template.id}
                        checked={formData.template_id === template.id}
                        onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                        className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{template.name}</span>
                          {template.is_default && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {template.steps.length} ขั้นตอน
                          {template.steps.length > 0 && (
                            <span className="text-gray-400">
                              : {template.steps.slice(0, 3).map((s) => s.name).join(' → ')}
                              {template.steps.length > 3 && '...'}
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อลูกค้า *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="กรอกชื่อลูกค้า"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="กรอกชื่อสินค้า"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวน *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันกำหนดส่ง
            </label>
            <MobileDatePicker
              value={formData.due_date}
              onChange={(date) => setFormData({ ...formData, due_date: date })}
              placeholder="เลือกวันกำหนดส่ง"
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {loading ? 'กำลังสร้าง...' : 'สร้างงาน'}
          </button>
        </form>
      </div>
    </div>
  );
}
