import { useState, useEffect } from 'react';
import { ProductionTemplateWithSteps, ProductionStep } from '../types';
import { templateService } from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  Star,
  GripVertical,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface TemplatesViewProps {
  onDataChanged?: () => void;
}

export function TemplatesView({ onDataChanged }: TemplatesViewProps) {
  const [templates, setTemplates] = useState<ProductionTemplateWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState('');
  const [newStepName, setNewStepName] = useState('');
  const [addingStepToTemplateId, setAddingStepToTemplateId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateService.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setActionLoading(true);
    try {
      await templateService.create({ name: newTemplateName.trim() });
      setNewTemplateName('');
      setShowNewTemplate(false);
      await loadTemplates();
      onDataChanged?.();
      Swal.fire({
        icon: 'success',
        title: 'สร้างรูปแบบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTemplate = async (id: string) => {
    if (!editingTemplateName.trim()) return;
    setActionLoading(true);
    try {
      await templateService.update(id, { name: editingTemplateName.trim() });
      setEditingTemplateId(null);
      setEditingTemplateName('');
      await loadTemplates();
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (id === 'default') {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถลบได้',
        text: 'ไม่สามารถลบขั้นตอนมาตรฐานได้',
      });
      return;
    }

    const result = await Swal.fire({
      title: `ลบรูปแบบ "${name}"?`,
      text: 'ขั้นตอนทั้งหมดในรูปแบบนี้จะถูกลบด้วย',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await templateService.delete(id);
      await loadTemplates();
      onDataChanged?.();
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateTemplate = async (id: string, originalName: string) => {
    const { value: newName } = await Swal.fire({
      title: 'คัดลอกรูปแบบ',
      input: 'text',
      inputLabel: 'ชื่อรูปแบบใหม่',
      inputValue: `${originalName} (สำเนา)`,
      showCancelButton: true,
      confirmButtonText: 'คัดลอก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value?.trim()) return 'กรุณาใส่ชื่อรูปแบบ';
        return null;
      },
    });

    if (!newName) return;

    setActionLoading(true);
    try {
      await templateService.duplicate(id, newName.trim());
      await loadTemplates();
      onDataChanged?.();
      Swal.fire({
        icon: 'success',
        title: 'คัดลอกสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (id === 'default') return;
    setActionLoading(true);
    try {
      await templateService.update(id, { is_default: true });
      await loadTemplates();
      onDataChanged?.();
      Swal.fire({
        icon: 'success',
        title: 'ตั้งเป็นค่าเริ่มต้นแล้ว',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDefaultTemplate = async () => {
    setActionLoading(true);
    try {
      await templateService.createDefaultTemplate();
      await loadTemplates();
      onDataChanged?.();
      Swal.fire({
        icon: 'success',
        title: 'สร้างรูปแบบเริ่มต้นสำเร็จ',
        text: 'สร้างรูปแบบพร้อมขั้นตอนตัวอย่างเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Step management
  const handleAddStep = async (templateId: string) => {
    if (!newStepName.trim()) return;
    setActionLoading(true);
    try {
      await templateService.addStep(templateId, newStepName.trim());
      setNewStepName('');
      setAddingStepToTemplateId(null);
      await loadTemplates();
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStep = async (templateId: string, stepId: string) => {
    if (!editingStepName.trim()) return;
    setActionLoading(true);
    try {
      await templateService.updateStep(templateId, stepId, { name: editingStepName.trim() });
      setEditingStepId(null);
      setEditingStepName('');
      await loadTemplates();
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStep = async (templateId: string, stepId: string) => {
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

    setActionLoading(true);
    try {
      await templateService.deleteStep(templateId, stepId);
      await loadTemplates();
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">รูปแบบการผลิต</h2>
            <p className="text-sm text-purple-100">จัดการ template ขั้นตอนการผลิต ({templates.length} รูปแบบ)</p>
          </div>
        </div>
      </div>

      {/* Quick Start - Create Default Template */}
      {templates.length === 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-1">เริ่มต้นใช้งาน</h3>
              <p className="text-sm text-gray-600 mb-3">
                สร้างรูปแบบการผลิตเริ่มต้นพร้อมขั้นตอนตัวอย่าง เช่น รับงาน, ตัดผ้า, เย็บ, QC, แพ็คสินค้า เป็นต้น
              </p>
              <button
                onClick={handleCreateDefaultTemplate}
                disabled={actionLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-lg shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                สร้างรูปแบบเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Template */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {showNewTemplate ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="ชื่อรูปแบบใหม่..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
            />
            <button
              onClick={handleCreateTemplate}
              disabled={actionLoading || !newTemplateName.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 transition"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowNewTemplate(false);
                setNewTemplateName('');
              }}
              className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTemplate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-300 text-purple-600 hover:border-purple-500 hover:bg-purple-50 rounded-xl transition font-medium"
          >
            <Plus className="w-5 h-5" />
            สร้างรูปแบบใหม่
          </button>
        )}
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Template Header */}
            <div
              className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
            >
              {expandedId === template.id ? (
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              )}

              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                <Layers className="w-5 h-5" />
              </div>

              {editingTemplateId === template.id ? (
                <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingTemplateName}
                    onChange={(e) => setEditingTemplateName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTemplate(template.id)}
                  />
                  <button
                    onClick={() => handleUpdateTemplate(template.id)}
                    disabled={actionLoading}
                    className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTemplateId(null)}
                    className="p-2 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{template.name}</span>
                      {template.is_default && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{template.steps.length} ขั้นตอน</p>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {!template.is_default && template.id !== 'default' && (
                      <button
                        onClick={() => handleSetDefault(template.id)}
                        className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                        title="ตั้งเป็นค่าเริ่มต้น"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateTemplate(template.id, template.name)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="คัดลอก"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {template.id !== 'default' && (
                      <>
                        <button
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setEditingTemplateName(template.name);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="แก้ไขชื่อ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Steps List (Expanded) */}
            {expandedId === template.id && (
              <div className="border-t border-gray-100">
                {template.steps.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p>ยังไม่มีขั้นตอน</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {template.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                        <span className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg text-xs font-bold shrink-0">
                          {index + 1}
                        </span>

                        {editingStepId === step.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingStepName}
                              onChange={(e) => setEditingStepName(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateStep(template.id, step.id)}
                            />
                            <button
                              onClick={() => handleUpdateStep(template.id, step.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStepId(null)}
                              className="p-1.5 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-700">{step.name}</span>
                            <button
                              onClick={() => {
                                setEditingStepId(step.id);
                                setEditingStepName(step.name);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStep(template.id, step.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Step Input */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  {addingStepToTemplateId === template.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStepName}
                        onChange={(e) => setNewStepName(e.target.value)}
                        placeholder="ชื่อขั้นตอน..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStep(template.id)}
                      />
                      <button
                        onClick={() => handleAddStep(template.id)}
                        disabled={actionLoading || !newStepName.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-50 transition"
                      >
                        เพิ่ม
                      </button>
                      <button
                        onClick={() => {
                          setAddingStepToTemplateId(null);
                          setNewStepName('');
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg text-sm transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingStepToTemplateId(template.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 hover:bg-purple-100 rounded-lg transition text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มขั้นตอน
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm text-purple-700">
          <strong>หมายเหตุ:</strong> รูปแบบการผลิตเป็น template ของขั้นตอน
          เมื่อสร้างงานใหม่ คุณสามารถเลือกรูปแบบที่ต้องการใช้ได้
        </p>
      </div>
    </div>
  );
}
