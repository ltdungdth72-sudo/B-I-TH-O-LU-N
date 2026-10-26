import React, { useState } from 'react';
import { X, Settings, Lock, RefreshCw, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface TeacherSettingsModalProps {
  onClose: () => void;
}

export const TeacherSettingsModal: React.FC<TeacherSettingsModalProps> = ({ onClose }) => {
  const { state, updateConfig } = useClassroom();

  const [className, setClassName] = useState<string>(state?.config?.className || 'Lớp 10A1');
  const [teacherName, setTeacherName] = useState<string>(state?.config?.teacherName || 'Lê Thị Dung');
  const [schoolName, setSchoolName] = useState<string>(state?.config?.schoolName || 'THPT Đinh Tiên Hoàng');
  const [subject, setSubject] = useState<string>(state?.config?.subject || 'Tin học 10');
  const [topicTitle, setTopicTitle] = useState<string>(state?.config?.topicTitle || '');
  const [isOpen, setIsOpen] = useState<boolean>(state?.config?.isOpen ?? true);
  const [allowEditing, setAllowEditing] = useState<boolean>(state?.config?.allowEditing ?? true);
  const [teacherPin, setTeacherPin] = useState<string>(state?.config?.teacherPin || 'thpt-dth-2026');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'reset_submissions' | 'reset_all' | null>(null);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    const success = await updateConfig({
      className,
      teacherName,
      schoolName,
      subject,
      topicTitle,
      isOpen,
      allowEditing,
      teacherPin,
    });
    setIsSaving(false);
    if (success) {
      setToast('Đã lưu cấu hình buổi thảo luận thành công');
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast('Lỗi khi lưu cấu hình, vui lòng kiểm tra lại');
    }
  };

  const handleExecuteReset = async () => {
    if (!confirmAction) return;
    setIsSaving(true);
    await updateConfig(undefined, confirmAction);
    setIsSaving(false);
    setConfirmAction(null);
    setToast(confirmAction === 'reset_submissions' ? 'Đã xóa toàn bộ bài nộp' : 'Đã đặt lại toàn bộ buổi học');
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Quản lý Buổi thảo luận
            </h2>
            <p className="text-xs text-slate-500">
              Cài đặt thông tin lớp, đóng/mở nhận bài, mật khẩu quản trị và tái sử dụng cho tiết học khác
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tên lớp học:</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Môn học:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Giáo viên phụ trách:</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trường THPT:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chủ đề bài học:</label>
            <textarea
              rows={2}
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 leading-relaxed"
            />
          </div>

          {/* Toggle controls */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Trạng thái tiếp nhận bài:</span>
                <span className="text-[11px] text-slate-500">
                  {isOpen ? 'Đang mở (Học sinh có thể nộp và chỉnh sửa)' : 'Đã đóng (Khóa tiếp nhận bài mới)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isOpen ? 'Đang mở nhận bài' : 'Đã khóa bài nộp'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Cho phép học sinh chỉnh sửa bài sau khi nộp:</span>
                <span className="text-[11px] text-slate-500">Học sinh có thể cập nhật câu trả lời khi đang mở buổi</span>
              </div>
              <input
                type="checkbox"
                checked={allowEditing}
                onChange={(e) => setAllowEditing(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Teacher PIN */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Mật khẩu quản trị giáo viên (PIN):</label>
            <input
              type="text"
              value={teacherPin}
              onChange={(e) => setTeacherPin(e.target.value)}
              placeholder="thpt-dth-2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-indigo-500"
            />
          </div>

          {/* Danger zone / Reset */}
          <div className="pt-3 border-t border-slate-200">
            <span className="font-bold text-rose-700 block mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Tái sử dụng cho tiết học khác / Đặt lại dữ liệu:
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction('reset_submissions')}
                className="px-3 py-2 border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold transition-colors text-left sm:text-center"
              >
                Xóa bài nộp 12 nhóm (Giữ lại thông tin lớp)
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction('reset_all')}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors text-left sm:text-center"
              >
                Đặt lại hoàn toàn từ đầu
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveConfig}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
              <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                Xác nhận thao tác xóa dữ liệu?
              </h3>
              <p className="text-xs text-slate-600 mt-2 mb-6">
                {confirmAction === 'reset_submissions'
                  ? 'Toàn bộ bài nộp và nhận xét của 12 nhóm sẽ bị xóa sạch để sẵn sàng cho tiết học tiếp theo.'
                  : 'Toàn bộ dữ liệu lớp học, chủ đề, bài nộp sẽ trở về trạng thái ban đầu của hệ thống.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleExecuteReset}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
