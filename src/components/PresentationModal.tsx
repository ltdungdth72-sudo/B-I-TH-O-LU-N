import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Award,
  Users,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface PresentationModalProps {
  initialGroupId: number;
  onClose: () => void;
  onOpenReview: (groupId: number) => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  initialGroupId,
  onClose,
  onOpenReview,
}) => {
  const { state } = useClassroom();
  const [currentGroupId, setCurrentGroupId] = useState<number>(initialGroupId);
  const [showFeedback, setShowFeedback] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const submission = state?.submissions[currentGroupId];
  const feedback = state?.feedbacks[currentGroupId];
  const topic = state?.topics.find((t) => t.assignedGroups.includes(currentGroupId));

  // Keyboard navigation (Arrow keys + Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGroupId]);

  const goToNext = () => {
    setCurrentGroupId((prev) => (prev < 12 ? prev + 1 : 1));
  };

  const goToPrev = () => {
    setCurrentGroupId((prev) => (prev > 1 ? prev - 1 : 12));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto">
      {/* Top Presentation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
            {currentGroupId}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                NHÓM {currentGroupId}
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                {topic?.title.split(':')[0] || `CHỦ ĐỀ ${topic?.id}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {topic?.title.split(':')[1]?.trim() || topic?.title}
            </p>
          </div>
        </div>

        {/* Center Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            title="Nhóm trước (Phím mũi tên trái)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden md:inline">Nhóm trước</span>
          </button>

          <span className="text-sm font-mono text-slate-400 px-2 font-bold tabular-nums">
            {currentGroupId} / 12
          </span>

          <button
            onClick={goToNext}
            title="Nhóm tiếp theo (Phím mũi tên phải)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <span className="hidden md:inline">Nhóm tiếp theo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReview(currentGroupId)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Viết nhận xét</span>
          </button>

          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Ẩn / Hiện nhận xét của giáo viên"
          >
            {showFeedback ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showFeedback ? 'Ẩn nhận xét' : 'Hiện nhận xét'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            title="Thoát trình chiếu (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Presentation Screen Body (16:9 Optimized) */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col justify-between">
        {/* Scenario Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              TÌNH HUỐNG THẢO LUẬN GIAO CHO NHÓM {currentGroupId}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {submission?.members && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{submission.members}</span>
                </span>
              )}
              {submission?.submittedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(submission.submittedAt).toLocaleTimeString('vi-VN')}</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium text-slate-200 leading-relaxed">
            {topic?.scenario}
          </p>
        </div>

        {/* 3 Questions 3-Column Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-6">
          {/* Question 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                CÂU HỎI 1
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Hành vi nào có vấn đề?
              </h3>
            </div>
            <div className="flex-1 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 overflow-y-auto">
              {submission?.answers.q1 ? (
                <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                  {submission.answers.q1}
                </p>
              ) : (
                <span className="text-slate-500 italic text-sm">
                  Nhóm chưa gửi câu trả lời cho câu hỏi này.
                </span>
              )}
            </div>
          </div>

          {/* Question 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                CÂU HỎI 2
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Quyền lợi tác giả bị ảnh hưởng?
              </h3>
            </div>
            <div className="flex-1 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 overflow-y-auto">
              {submission?.answers.q2 ? (
                <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                  {submission.answers.q2}
                </p>
              ) : (
                <span className="text-slate-500 italic text-sm">
                  Nhóm chưa gửi câu trả lời cho câu hỏi này.
                </span>
              )}
            </div>
          </div>

          {/* Question 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                CÂU HỎI 3
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Cần làm gì để sử dụng phù hợp?
              </h3>
            </div>
            <div className="flex-1 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 overflow-y-auto">
              {submission?.answers.q3 ? (
                <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                  {submission.answers.q3}
                </p>
              ) : (
                <span className="text-slate-500 italic text-sm">
                  Nhóm chưa gửi câu trả lời cho câu hỏi này.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Teacher Feedback Bar if present & toggled */}
        {showFeedback && feedback && (feedback.generalComment || feedback.strengths || feedback.improvements || feedback.suggestions) && (
          <div className="bg-emerald-950/70 border border-emerald-800 rounded-2xl p-5 mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                NHẬN XÉT CỦA GIÁO VIÊN (CÔ LÊ THỊ DUNG)
              </span>
              {feedback.reviewedAt && (
                <span className="text-xs text-emerald-400">
                  Đã đánh giá: {new Date(feedback.reviewedAt).toLocaleTimeString('vi-VN')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs sm:text-sm">
              {feedback.generalComment && (
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">Nhận xét chung:</span>
                  <p className="text-slate-200">{feedback.generalComment}</p>
                </div>
              )}
              {feedback.strengths && (
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">Điểm mạnh:</span>
                  <p className="text-slate-200">{feedback.strengths}</p>
                </div>
              )}
              {feedback.improvements && (
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">Cần bổ sung:</span>
                  <p className="text-slate-200">{feedback.improvements}</p>
                </div>
              )}
              {feedback.suggestions && (
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">Đề xuất hướng hoàn thiện:</span>
                  <p className="text-slate-200">{feedback.suggestions}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
