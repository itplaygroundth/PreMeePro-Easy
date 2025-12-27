import { useState, useEffect } from 'react';
import { X, MessageCircle, Bell, ExternalLink } from 'lucide-react';
import { lineOAService } from '../services/api';

// LINE Icon component
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

interface AddLineOAPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
}

export function AddLineOAPrompt({ isOpen, onClose, onSkip }: AddLineOAPromptProps) {
  const [loading, setLoading] = useState(true);
  const [friendUrl, setFriendUrl] = useState<string | null>(null);
  const [basicId, setBasicId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLineOAInfo();
    }
  }, [isOpen]);

  const loadLineOAInfo = async () => {
    setLoading(true);
    try {
      const info = await lineOAService.getInfo();
      if (info.configured) {
        setFriendUrl(info.friendUrl);
        setBasicId(info.basicId);
      }
    } catch (error) {
      console.error('Failed to load LINE OA info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = () => {
    if (friendUrl) {
      // Open LINE app or LINE website to add friend
      window.open(friendUrl, '_blank');
      // Mark as dismissed so we don't show again
      localStorage.setItem('lineOAPromptDismissed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    // Mark as dismissed for this session
    localStorage.setItem('lineOAPromptDismissed', 'true');
    onSkip?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with LINE Green */}
        <div className="bg-[#00B900] px-5 py-6 text-center relative">
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <LineIcon className="w-10 h-10 text-[#00B900]" />
          </div>

          <h2 className="text-xl font-bold text-white">เพิ่มเพื่อน LINE OA</h2>
          <p className="text-white/90 text-sm mt-1">รับการแจ้งเตือนงานผลิต</p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#00B900] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friendUrl ? (
            <>
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">รับแจ้งเตือนทันที</p>
                    <p className="text-xs text-gray-500">เมื่อมีงานใหม่หรืองานเปลี่ยนสถานะ</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">ติดตามสถานะง่าย</p>
                    <p className="text-xs text-gray-500">ดูความคืบหน้างานผ่าน LINE</p>
                  </div>
                </div>
              </div>

              {/* LINE OA ID */}
              {basicId && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">LINE OA ID</p>
                  <p className="font-mono font-bold text-[#00B900] text-lg">{basicId}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddFriend}
                  className="w-full bg-[#00B900] hover:bg-[#00a000] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition font-medium shadow-lg shadow-green-200"
                >
                  <LineIcon className="w-5 h-5" />
                  เพิ่มเพื่อน LINE OA
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 px-4 text-sm transition"
                >
                  ข้ามไปก่อน
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">ยังไม่ได้ตั้งค่า LINE OA</p>
              <button
                onClick={onClose}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
