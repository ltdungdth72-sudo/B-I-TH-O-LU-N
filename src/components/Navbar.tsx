import React from 'react';
import { BookOpen, Volume2, VolumeX, Shield, Wifi, WifiOff } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

export const Navbar: React.FC = () => {
  const { role, setRole, connected, soundEnabled, toggleSound, isTeacherAuthenticated } = useClassroom();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setRole('welcome')}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-slate-900 text-base tracking-tight block">
              PHÒNG THẢO LUẬN SỐ
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Tin học 10 · THPT Đinh Tiên Hoàng
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation & Status */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <button
            onClick={() => setRole('welcome')}
            className={`transition-colors hover:text-slate-900 ${
              role === 'welcome' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => setRole('student')}
            className={`transition-colors hover:text-slate-900 ${
              role === 'student' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Góc học sinh (12 Nhóm)
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`transition-colors hover:text-slate-900 ${
              role === 'teacher' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Màn hình giáo viên
          </button>
        </nav>

        {/* Zone 3: Actions & Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Connection Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
              connected
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
            title={connected ? 'Đang kết nối thời gian thực qua SSE' : 'Đang thử kết nối lại...'}
          >
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trực tuyến</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Chờ kết nối</span>
              </>
            )}
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={soundEnabled ? 'Âm thanh thông báo: Đang BẬT' : 'Âm thanh thông báo: Đang TẮT'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Quick role change button */}
          {role === 'teacher' ? (
            <button
              onClick={() => setRole('student')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Góc học sinh
            </button>
          ) : (
            <button
              onClick={() => setRole('teacher')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Bàn giáo viên</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
