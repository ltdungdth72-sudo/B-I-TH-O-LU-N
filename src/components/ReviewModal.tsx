import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, Save, Sparkles, MessageSquare } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface ReviewModalProps {
  groupId: number;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ groupId, onClose }) => {
  const { state, saveFeedback } = useClassroom();
  const currentFeedback = state?.feedbacks[groupId];
  const submission = state?.submissions[groupId];

  const [generalComment, setGeneralComment] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isReviewed, setIsReviewed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentFeedback) {
      setGeneralComment(currentFeedback.generalComment || '');
      setStrengths(currentFeedback.strengths || '');
      setImprovements(currentFeedback.improvements || '');
      setSuggestions(currentFeedback.suggestions || '');
      setIsReviewed(Boolean(currentFeedback.isReviewed));
    }
  }, [currentFeedback]);

  const handleSave = async (markAsReviewed: boolean = false) => {
    setIsSaving(true);
    const targetReviewed = markAsReviewed ? true : isReviewed;
    const success = await saveFeedback(groupId, {
      generalComment,
      strengths,
      improvements,
      suggestions,
      isReviewed: targetReviewed,
    });
    setIsSaving(false);
    if (success) {
      setIsReviewed(targetReviewed);
      setToast(markAsReviewed ? 'Đã lưu và đánh dấu ĐÃ NHẬN XÉT' : 'Đã lưu nhận xét thành công');
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1200);
    } else {
      setToast('Lỗi khi lưu nhận xét, vui lòng kiểm tra lại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Nhận xét & Đánh giá Nhóm {groupId}
            </h2>
            <p className="text-xs text-slate-500">
              Giáo viên: Cô {state?.config?.teacherName || 'Lê Thị Dung'} · {submission?.status === 'submitted' ? 'Đã nộp bài' : 'Chưa nộp bài'}
            </p>
          </div>
        </div>

        {/* Feedback Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              1. Nhận xét chung:
            </label>
            <textarea
              rows={2}
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              placeholder="Đánh giá tổng quát về thái độ làm việc, sự hiểu biết về bản quyền..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-700 block mb-1">
              2. Điểm mạnh của nhóm:
            </label>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Chỉ ra lập luận sắc bén, ví dụ hay, giải pháp thiết thực..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-emerald-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-700 block mb-1">
              3. Nội dung cần bổ sung / điều chỉnh:
            </label>
            <textarea
              rows={2}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Chưa rõ quyền nhân thân, cần phân biệt giữa miễn phí và mã nguồn mở..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-indigo-700 block mb-1">
              4. Đề xuất hướng hoàn thiện:
            </label>
            <textarea
              rows={2}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Hướng dẫn tìm ảnh Creative Commons, trích dẫn chuẩn APA..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isReviewedCheck"
              checked={isReviewed}
              onChange={(e) => setIsReviewed(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isReviewedCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              Đánh dấu đã hoàn thành nhận xét cho Nhóm {groupId}
            </label>
          </div>
        </div>

        {toast && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu nháp nhận xét'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ĐÁNH DẤU ĐÃ NHẬN XÉT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
