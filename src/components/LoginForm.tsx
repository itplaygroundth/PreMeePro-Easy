import { useState, useEffect } from 'react';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import Swal from 'sweetalert2';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

// LINE icon component
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  // Check for LINE login status from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const errorParam = params.get('error');
    const name = params.get('name');

    if (status === 'pending') {
      setPendingMessage(`สวัสดี ${name || 'คุณ'}! บัญชี LINE ของคุณกำลังรอการอนุมัติจาก Admin`);
    } else if (errorParam === 'pending_approval') {
      setPendingMessage(`สวัสดี ${name || 'คุณ'}! บัญชี LINE ของคุณกำลังรอการอนุมัติจาก Admin`);
    } else if (errorParam) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: decodeURIComponent(errorParam),
      });
    }

    // Clean up URL
    if (status || errorParam) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLineLogin = async () => {
    try {
      setLineLoading(true);
      const { loginUrl } = await authService.getLineLoginUrl();
      window.location.href = loginUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถเชื่อมต่อ LINE Login ได้';
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage,
      });
      setLineLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'เข้าสู่ระบบไม่สำเร็จ';
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-6 sm:px-6 md:px-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">SmartFab</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">ระบบจัดการงานผลิตอัจฉริยะ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
          {pendingMessage && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-xs sm:text-sm border border-yellow-200">
              {pendingMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="กรอกชื่อผู้ใช้"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="กรอกรหัสผ่าน"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span className="text-sm sm:text-base">{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือ</span>
            </div>
          </div>

          {/* LINE Login Button */}
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={lineLoading}
            className="w-full bg-[#00B900] hover:bg-[#00a000] active:bg-[#009000] text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {lineLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LineIcon className="w-5 h-5" />
            )}
            <span className="text-sm sm:text-base">{lineLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย LINE'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
