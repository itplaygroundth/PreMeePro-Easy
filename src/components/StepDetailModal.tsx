import { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Image,
  Trash2,
  Plus,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  Camera,
  ImageIcon,
  FileText,
  Truck,
  Package,
  QrCode,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ProductionStep, ProductionJob, StepAttachment } from '../types';
import { stepDataService, uploadService } from '../services/api';

interface StepDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ProductionJob;
  step: ProductionStep;
  onSaved?: () => void;
  isReadOnly?: boolean; // For viewing past steps
}

export function StepDetailModal({ isOpen, onClose, job, step, onSaved, isReadOnly = false }: StepDetailModalProps) {
  const [details, setDetails] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [attachments, setAttachments] = useState<StepAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [attachmentValue, setAttachmentValue] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    attachments: true,
    shipping: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Shipping info state
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingPackImage, setShippingPackImage] = useState('');
  const [shippingBarcodeImage, setShippingBarcodeImage] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [showAddPackImage, setShowAddPackImage] = useState(false);
  const [showAddBarcodeImage, setShowAddBarcodeImage] = useState(false);
  const [packImagePreview, setPackImagePreview] = useState<string | null>(null);
  const [barcodeImagePreview, setBarcodeImagePreview] = useState<string | null>(null);
  const packCameraRef = useRef<HTMLInputElement>(null);
  const packGalleryRef = useRef<HTMLInputElement>(null);
  const barcodeCameraRef = useRef<HTMLInputElement>(null);
  const barcodeGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset all states when modal opens
      setDetails('');
      setOperatorName('');
      setAttachments([]);
      setShippingTrackingNumber('');
      setShippingCarrier('');
      setShippingPackImage('');
      setShippingBarcodeImage('');
      setShippingNotes('');
      setImagePreview(null);
      setPackImagePreview(null);
      setBarcodeImagePreview(null);
      setShowAddAttachment(false);
      setShowAddPackImage(false);
      setShowAddBarcodeImage(false);
      // Then load data
      loadData();
    }
  }, [isOpen, job.id, step.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [detailsRes, attachmentsRes] = await Promise.all([
        stepDataService.getDetails(job.id, step.id),
        stepDataService.getAttachments(job.id, step.id),
      ]);

      // Load step details including shipping info (now stored per step)
      if (detailsRes?.data) {
        setDetails(detailsRes.data.details || '');
        setOperatorName(detailsRes.data.operator_name || '');
        // Load shipping info from step details
        setShippingTrackingNumber(detailsRes.data.shipping_tracking_number || '');
        setShippingCarrier(detailsRes.data.shipping_carrier || '');
        setShippingPackImage(detailsRes.data.shipping_pack_image || '');
        setShippingBarcodeImage(detailsRes.data.shipping_barcode_image || '');
        setShippingNotes(detailsRes.data.shipping_notes || '');
      }

      // Load attachments
      if (attachmentsRes?.data) {
        setAttachments(attachmentsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading step data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    // Check if there's unsaved attachment image
    if (showAddAttachment && imagePreview) {
      const result = await Swal.fire({
        title: 'มีรูปที่ยังไม่ได้บันทึก',
        text: 'คุณเลือกรูปไฟล์แนบไว้แล้วแต่ยังไม่ได้กดบันทึก ต้องการบันทึกไฟล์รูปก่อนหรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#8b5cf6',
        denyButtonColor: '#6b7280',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'บันทึกรูปก่อน',
        denyButtonText: 'ไม่บันทึกรูป ดำเนินการต่อ',
        cancelButtonText: 'ยกเลิก',
      });

      if (result.isConfirmed) {
        // Save attachment first
        await handleAddAttachment();
        return; // Let user save details after attachment is saved
      } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
        return; // User cancelled, do nothing
      }
      // If denied, continue without saving attachment
      setShowAddAttachment(false);
      setImagePreview(null);
      setAttachmentValue('');
    }

    setIsSaving(true);
    try {
      // Upload images to storage first if they are base64
      let packImageUrl = shippingPackImage;
      let barcodeImageUrl = shippingBarcodeImage;

      // Upload pack image if it's a new base64 image
      if (shippingPackImage && shippingPackImage.startsWith('data:')) {
        try {
          packImageUrl = await uploadService.uploadBase64Image(
            shippingPackImage,
            `pack_${job.id}_${Date.now()}.jpg`
          );
        } catch (uploadErr) {
          console.error('Error uploading pack image:', uploadErr);
        }
      }

      // Upload barcode image if it's a new base64 image
      if (shippingBarcodeImage && shippingBarcodeImage.startsWith('data:')) {
        try {
          barcodeImageUrl = await uploadService.uploadBase64Image(
            shippingBarcodeImage,
            `barcode_${job.id}_${Date.now()}.jpg`
          );
        } catch (uploadErr) {
          console.error('Error uploading barcode image:', uploadErr);
        }
      }

      // Save step details including shipping info (all in one call)
      const stepResponse = await stepDataService.saveDetails(job.id, step.id, {
        details,
        operator_name: operatorName,
        // Include shipping info per step
        shipping_tracking_number: shippingTrackingNumber || undefined,
        shipping_carrier: shippingCarrier || undefined,
        shipping_pack_image: packImageUrl || undefined,
        shipping_barcode_image: barcodeImageUrl || undefined,
        shipping_notes: shippingNotes || undefined,
      });

      if (stepResponse.data) {
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          text: 'บันทึกรายละเอียดเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        onSaved?.();
        onClose();
      } else if (stepResponse.error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: stepResponse.error,
        });
      }
    } catch (error: any) {
      console.error('Error saving details:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถบันทึกได้',
        text: error.response?.data?.error || error.message || 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentValue.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = attachmentValue;

      // Upload to storage if it's a base64 image
      if (attachmentValue.startsWith('data:')) {
        try {
          fileUrl = await uploadService.uploadBase64Image(
            attachmentValue,
            `attachment_${job.id}_${step.id}_${Date.now()}.jpg`
          );
        } catch (uploadErr: any) {
          console.error('Error uploading attachment:', uploadErr);
          Swal.fire({
            icon: 'error',
            title: 'อัพโหลดรูปไม่สำเร็จ',
            text: uploadErr?.response?.data?.error || uploadErr?.message || 'กรุณาลองใหม่อีกครั้ง',
          });
          setIsSaving(false);
          return;
        }
      }

      const data = {
        attachment_type: 'image' as const,
        file_url: fileUrl,
        description: attachmentDescription || undefined,
      };

      const response = await stepDataService.addAttachment(job.id, step.id, data);
      if (response.success || response.data) {
        setAttachments([...attachments, response.data]);
        setAttachmentValue('');
        setAttachmentDescription('');
        setImagePreview(null);
        setShowAddAttachment(false);
        onSaved?.();
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มรูปสำเร็จ',
          timer: 1200,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเพิ่มรูปได้',
        text: error.response?.data?.error || error.message || 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const result = await Swal.fire({
      title: 'ลบไฟล์แนบ?',
      text: 'ต้องการลบไฟล์แนบนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    try {
      await stepDataService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      onSaved?.();
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถลบได้',
        text: error.response?.data?.error || error.message || 'Unknown error',
      });
    }
  };

  const toggleSection = (section: 'details' | 'attachments' | 'shipping') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle pack image selection
  const handlePackImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const compressed = await compressImage(files[0]);
        setPackImagePreview(compressed);
        setShippingPackImage(compressed);
        setShowAddPackImage(false);
      } catch (err) {
        console.error('Error compressing pack image:', err);
      }
      e.target.value = '';
    }
  };

  // Handle barcode image selection
  const handleBarcodeImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const compressed = await compressImage(files[0]);
        setBarcodeImagePreview(compressed);
        setShippingBarcodeImage(compressed);
        setShowAddBarcodeImage(false);
      } catch (err) {
        console.error('Error compressing barcode image:', err);
      }
      e.target.value = '';
    }
  };

  const clearPackImage = () => {
    setPackImagePreview(null);
    setShippingPackImage('');
  };

  const clearBarcodeImage = () => {
    setBarcodeImagePreview(null);
    setShippingBarcodeImage('');
  };

  // Compress image before upload
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          const maxHeight = 800;
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection from camera or gallery
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const compressed = await compressImage(files[0]);
        setImagePreview(compressed);
        setAttachmentValue(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
      e.target.value = '';
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setAttachmentValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 10001 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 ${isReadOnly ? 'bg-gradient-to-r from-gray-50 to-slate-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">
                  รายละเอียดขั้นตอน: {step.name}
                </h2>
                {isReadOnly && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                    ดูอย่างเดียว
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                งาน #{job.order_number} - {job.product_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Details Section */}
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('details')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700">รายละเอียด</span>
                  </div>
                  {expandedSections.details ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.details && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        ผู้ดำเนินการ
                      </label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => !isReadOnly && setOperatorName(e.target.value)}
                        placeholder={isReadOnly ? '-' : 'ชื่อผู้ดำเนินการ'}
                        readOnly={isReadOnly}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl transition ${isReadOnly ? 'bg-gray-50 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        บันทึก/หมายเหตุ
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => !isReadOnly && setDetails(e.target.value)}
                        placeholder={isReadOnly ? '-' : 'รายละเอียดเพิ่มเติม...'}
                        readOnly={isReadOnly}
                        rows={3}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl transition resize-none ${isReadOnly ? 'bg-gray-50 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('attachments')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-gray-700">
                      ไฟล์แนบ ({attachments.length})
                    </span>
                  </div>
                  {expandedSections.attachments ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.attachments && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Existing Attachments */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="bg-white rounded-xl p-3 border border-gray-200 overflow-hidden"
                          >
                            {/* Image preview */}
                            {attachment.file_url && (
                              <div className="mb-2">
                                <img
                                  src={uploadService.getFullImageUrl(attachment.file_url)}
                                  alt="attachment"
                                  className="w-full h-32 object-contain rounded-lg bg-gray-100"
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {attachment.description && (
                                  <div className="text-sm text-gray-600">
                                    {attachment.description}
                                  </div>
                                )}
                                {!attachment.description && (
                                  <div className="text-sm text-gray-400">
                                    ไม่มีคำอธิบาย
                                  </div>
                                )}
                              </div>
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state - only show when no attachments AND not adding */}
                    {attachments.length === 0 && !showAddAttachment && (
                      <div className="text-center py-6 text-gray-400">
                        <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">ยังไม่มีไฟล์แนบ</p>
                      </div>
                    )}

                    {/* Hidden file inputs for camera and gallery */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {/* Image Preview & Save Form - iOS Style Modal */}
                    {imagePreview && (
                      <div
                        className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40 p-4"
                        onClick={() => {
                          setAttachmentValue('');
                          setAttachmentDescription('');
                          clearImagePreview();
                        }}
                      >
                        <div
                          className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Image Preview */}
                          <div className="relative p-4 pb-0">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-52 object-contain rounded-2xl bg-gray-100"
                            />
                            <button
                              onClick={() => {
                                setAttachmentValue('');
                                setAttachmentDescription('');
                                clearImagePreview();
                              }}
                              className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Description Input */}
                          <div className="p-4">
                            <input
                              type="text"
                              value={attachmentDescription}
                              onChange={(e) => setAttachmentDescription(e.target.value)}
                              placeholder="คำอธิบาย (ไม่บังคับ)"
                              className="w-full px-4 py-3 bg-gray-100/80 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition text-gray-800 placeholder-gray-400"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex border-t border-gray-200/50">
                            <button
                              onClick={() => {
                                setAttachmentValue('');
                                setAttachmentDescription('');
                                clearImagePreview();
                              }}
                              className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-100/80 transition active:bg-gray-200/80 border-r border-gray-200/50"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={handleAddAttachment}
                              disabled={!attachmentValue.trim() || isSaving}
                              className="flex-1 py-4 text-purple-600 font-semibold hover:bg-purple-50/80 transition active:bg-purple-100/80 disabled:text-purple-300 flex items-center justify-center gap-2"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              บันทึก
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add attachment button - shows when no preview and not read-only */}
                    {!imagePreview && !isReadOnly && (
                      <button
                        onClick={() => setShowAddAttachment(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        เพิ่มไฟล์แนบ
                      </button>
                    )}

                    {/* Mobile Action Sheet for Camera/Gallery Selection - iOS Style */}
                    {showAddAttachment && !imagePreview && (
                      <div
                        className="fixed inset-0 z-[60] flex items-end justify-center backdrop-blur-sm bg-black/40"
                        onClick={() => setShowAddAttachment(false)}
                      >
                        <div
                          className="w-full max-w-lg px-4 pb-8 animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Action Sheet Card */}
                          <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl mb-3">
                            <div className="px-4 py-3 border-b border-gray-200/50">
                              <p className="text-center text-sm text-gray-500 font-medium">เลือกรูปภาพ</p>
                            </div>
                            <button
                              onClick={() => {
                                cameraInputRef.current?.click();
                                setShowAddAttachment(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80 border-b border-gray-200/50"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">ถ่ายรูป</p>
                                <p className="text-xs text-gray-500">เปิดกล้องถ่ายภาพใหม่</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                galleryInputRef.current?.click();
                                setShowAddAttachment(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">เลือกจากอัลบั้ม</p>
                                <p className="text-xs text-gray-500">เลือกรูปที่มีอยู่แล้ว</p>
                              </div>
                            </button>
                          </div>

                          {/* Cancel Button - Separate Card */}
                          <button
                            onClick={() => setShowAddAttachment(false)}
                            className="w-full py-4 bg-white/95 backdrop-blur-xl rounded-2xl text-blue-600 font-semibold text-lg shadow-2xl hover:bg-gray-100/95 transition active:bg-gray-200/95"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping Info Section - Show for all steps (may need to ship to tailor, laundry, etc.) */}
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('shipping')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-gray-700">ข้อมูลขนส่ง</span>
                  </div>
                  {expandedSections.shipping ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.shipping && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Tracking Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        <QrCode className="w-4 h-4 inline mr-1" />
                        เลขแทร็ค / Tracking Number
                      </label>
                      <input
                        type="text"
                        value={shippingTrackingNumber}
                        onChange={(e) => !isReadOnly && setShippingTrackingNumber(e.target.value)}
                        placeholder={isReadOnly ? '-' : 'เช่น TH123456789'}
                        readOnly={isReadOnly}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl transition ${isReadOnly ? 'bg-gray-50 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                      />
                    </div>

                    {/* Carrier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        ขนส่ง / Carrier
                      </label>
                      <select
                        value={shippingCarrier}
                        onChange={(e) => !isReadOnly && setShippingCarrier(e.target.value)}
                        disabled={isReadOnly}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl transition bg-white ${isReadOnly ? 'bg-gray-50 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                      >
                        <option value="">-- เลือกขนส่ง --</option>
                        <option value="flash">Flash Express</option>
                        <option value="kerry">Kerry Express</option>
                        <option value="jt">J&T Express</option>
                        <option value="thaipost">ไปรษณีย์ไทย</option>
                        <option value="ems">EMS</option>
                        <option value="shopee">Shopee Express</option>
                        <option value="lazada">Lazada Express</option>
                        <option value="ninja">Ninja Van</option>
                        <option value="best">Best Express</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>

                    {/* Pack Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        <Package className="w-4 h-4 inline mr-1" />
                        รูปแพ็คสินค้า
                      </label>

                      {/* Hidden file inputs */}
                      <input
                        ref={packCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePackImageSelect}
                        className="hidden"
                      />
                      <input
                        ref={packGalleryRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePackImageSelect}
                        className="hidden"
                      />

                      {(shippingPackImage || packImagePreview) ? (
                        <div className="relative">
                          <img
                            src={packImagePreview || uploadService.getFullImageUrl(shippingPackImage)}
                            alt="Pack"
                            className="w-full h-40 object-contain rounded-xl bg-gray-100 border border-gray-200"
                          />
                          {!isReadOnly && (
                            <button
                              onClick={clearPackImage}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : !isReadOnly ? (
                        <button
                          onClick={() => setShowAddPackImage(true)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          เพิ่มรูปแพ็คสินค้า
                        </button>
                      ) : (
                        <div className="text-sm text-gray-400 italic">ไม่มีรูปแพ็คสินค้า</div>
                      )}
                    </div>

                    {/* Barcode/QR Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        <QrCode className="w-4 h-4 inline mr-1" />
                        รูป Barcode/QR Code ขนส่ง
                      </label>

                      {/* Hidden file inputs */}
                      <input
                        ref={barcodeCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleBarcodeImageSelect}
                        className="hidden"
                      />
                      <input
                        ref={barcodeGalleryRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBarcodeImageSelect}
                        className="hidden"
                      />

                      {(shippingBarcodeImage || barcodeImagePreview) ? (
                        <div className="relative">
                          <img
                            src={barcodeImagePreview || uploadService.getFullImageUrl(shippingBarcodeImage)}
                            alt="Barcode"
                            className="w-full h-40 object-contain rounded-xl bg-gray-100 border border-gray-200"
                          />
                          {!isReadOnly && (
                            <button
                              onClick={clearBarcodeImage}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : !isReadOnly ? (
                        <button
                          onClick={() => setShowAddBarcodeImage(true)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition flex items-center justify-center gap-2"
                        >
                          <QrCode className="w-5 h-5" />
                          เพิ่มรูป Barcode/QR
                        </button>
                      ) : (
                        <div className="text-sm text-gray-400 italic">ไม่มีรูป Barcode/QR</div>
                      )}
                    </div>

                    {/* Action Sheet for Pack Image - iOS Style */}
                    {showAddPackImage && (
                      <div
                        className="fixed inset-0 z-[60] flex items-end justify-center backdrop-blur-sm bg-black/40"
                        onClick={() => setShowAddPackImage(false)}
                      >
                        <div
                          className="w-full max-w-lg px-4 pb-8 animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl mb-3">
                            <div className="px-4 py-3 border-b border-gray-200/50">
                              <p className="text-center text-sm text-gray-500 font-medium">เลือกรูปแพ็คสินค้า</p>
                            </div>
                            <button
                              onClick={() => {
                                packCameraRef.current?.click();
                                setShowAddPackImage(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80 border-b border-gray-200/50"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">ถ่ายรูป</p>
                                <p className="text-xs text-gray-500">เปิดกล้องถ่ายภาพใหม่</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                packGalleryRef.current?.click();
                                setShowAddPackImage(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">เลือกจากอัลบั้ม</p>
                                <p className="text-xs text-gray-500">เลือกรูปที่มีอยู่แล้ว</p>
                              </div>
                            </button>
                          </div>
                          <button
                            onClick={() => setShowAddPackImage(false)}
                            className="w-full py-4 bg-white/95 backdrop-blur-xl rounded-2xl text-blue-600 font-semibold text-lg shadow-2xl hover:bg-gray-100/95 transition active:bg-gray-200/95"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Sheet for Barcode Image - iOS Style */}
                    {showAddBarcodeImage && (
                      <div
                        className="fixed inset-0 z-[60] flex items-end justify-center backdrop-blur-sm bg-black/40"
                        onClick={() => setShowAddBarcodeImage(false)}
                      >
                        <div
                          className="w-full max-w-lg px-4 pb-8 animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl mb-3">
                            <div className="px-4 py-3 border-b border-gray-200/50">
                              <p className="text-center text-sm text-gray-500 font-medium">เลือกรูป Barcode/QR</p>
                            </div>
                            <button
                              onClick={() => {
                                barcodeCameraRef.current?.click();
                                setShowAddBarcodeImage(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80 border-b border-gray-200/50"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">ถ่ายรูป</p>
                                <p className="text-xs text-gray-500">เปิดกล้องถ่ายภาพใหม่</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                barcodeGalleryRef.current?.click();
                                setShowAddBarcodeImage(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-100/80 transition active:bg-gray-200/80"
                            >
                              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-800">เลือกจากอัลบั้ม</p>
                                <p className="text-xs text-gray-500">เลือกรูปที่มีอยู่แล้ว</p>
                              </div>
                            </button>
                          </div>
                          <button
                            onClick={() => setShowAddBarcodeImage(false)}
                            className="w-full py-4 bg-white/95 backdrop-blur-xl rounded-2xl text-blue-600 font-semibold text-lg shadow-2xl hover:bg-gray-100/95 transition active:bg-gray-200/95"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Shipping Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        หมายเหตุการจัดส่ง
                      </label>
                      <textarea
                        value={shippingNotes}
                        onChange={(e) => !isReadOnly && setShippingNotes(e.target.value)}
                        placeholder={isReadOnly ? '-' : 'หมายเหตุเพิ่มเติม เช่น รายละเอียดที่อยู่จัดส่ง...'}
                        readOnly={isReadOnly}
                        rows={2}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl transition resize-none ${isReadOnly ? 'bg-gray-50 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`${isReadOnly ? 'flex-1' : 'flex-1'} py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition`}
            >
              ปิด
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSaveDetails}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-medium"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                บันทึก
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
