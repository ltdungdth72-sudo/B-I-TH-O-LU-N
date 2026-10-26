import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Users,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Wifi,
  WifiOff,
  ChevronRight,
  MessageSquare,
  Award,
  Sparkles,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { Topic, Question } from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_TOPICS } from '../defaultData';

export const StudentView: React.FC = () => {
  const {
    state,
    connected,
    selectedGroupId,
    setSelectedGroupId,
    setRole,
    submitAnswers,
    saveDraft,
  } = useClassroom();

  const [answers, setAnswers] = useState<{ q1: string; q2: string; q3: string }>({
    q1: '',
    q2: '',
    q3: '',
  });
  const [members, setMembers] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasUnsyncedDraft, setHasUnsyncedDraft] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);

  // Current group submission from server
  const currentSubmission = selectedGroupId && state?.submissions ? state.submissions[selectedGroupId] : null;
  const currentFeedback = selectedGroupId && state?.feedbacks ? state.feedbacks[selectedGroupId] : null;

  const allTopics = state?.topics && state.topics.length > 0 ? state.topics : DEFAULT_TOPICS;
  const allQuestions = state?.questions && state.questions.length > 0 ? state.questions : DEFAULT_QUESTIONS;
  const isSessionClosed = state?.config?.isOpen === false;

  // Find topic for current group
  const currentTopic: Topic | undefined = selectedGroupId
    ? allTopics.find((t) => t.assignedGroups.includes(selectedGroupId))
    : undefined;

  // Load initial content from server or localStorage
  useEffect(() => {
    if (!selectedGroupId) return;

    // Check local draft first
    const localDraftKey = `ptls_draft_group_${selectedGroupId}`;
    const localDraft = localStorage.getItem(localDraftKey);

    if (currentSubmission && currentSubmission.status !== 'not_started') {
      // Server has submission or in_progress data
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          // If local draft is newer, restore it
          if (parsed.timestamp && (!currentSubmission.updatedAt || parsed.timestamp > new Date(currentSubmission.updatedAt).getTime())) {
            setAnswers(parsed.answers || { q1: '', q2: '', q3: '' });
            if (parsed.members) setMembers(parsed.members);
            setDraftSavedAt(new Date(parsed.timestamp).toLocaleTimeString('vi-VN'));
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      setAnswers({
        q1: currentSubmission.answers.q1 || '',
        q2: currentSubmission.answers.q2 || '',
        q3: currentSubmission.answers.q3 || '',
      });
      if (currentSubmission.members) {
        setMembers(currentSubmission.members);
      }
      if (currentSubmission.updatedAt) {
        setDraftSavedAt(new Date(currentSubmission.updatedAt).toLocaleTimeString('vi-VN'));
      }
    } else if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        setAnswers(parsed.answers || { q1: '', q2: '', q3: '' });
        if (parsed.members) setMembers(parsed.members);
        setDraftSavedAt(new Date(parsed.timestamp).toLocaleTimeString('vi-VN'));
      } catch (e) {
        // ignore
      }
    } else {
      setAnswers({ q1: '', q2: '', q3: '' });
      setMembers('');
      setDraftSavedAt(null);
    }
  }, [selectedGroupId, currentSubmission?.updatedAt]);

  // Handle Answer Changes with Auto-Draft
  const handleAnswerChange = (key: 'q1' | 'q2' | 'q3', value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    setHasUnsyncedDraft(true);

    if (!selectedGroupId) return;

    // Save to local storage immediately
    const now = Date.now();
    localStorage.setItem(
      `ptls_draft_group_${selectedGroupId}`,
      JSON.stringify({ answers: updated, members, timestamp: now })
    );
    setDraftSavedAt(new Date(now).toLocaleTimeString('vi-VN'));

    // Debounced sync to server if online
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (connected && selectedGroupId) {
        setIsSavingDraft(true);
        await saveDraft(selectedGroupId, updated, members);
        setIsSavingDraft(false);
        setHasUnsyncedDraft(false);
      }
    }, 1500);
  };

  const handleManualSaveDraft = async () => {
    if (!selectedGroupId) return;
    setIsSavingDraft(true);
    const now = Date.now();
    localStorage.setItem(
      `ptls_draft_group_${selectedGroupId}`,
      JSON.stringify({ answers, members, timestamp: now })
    );
    setDraftSavedAt(new Date(now).toLocaleTimeString('vi-VN'));

    if (connected) {
      await saveDraft(selectedGroupId, answers, members);
      setHasUnsyncedDraft(false);
      setSuccessToast('Đã lưu bản nháp lên máy chủ thành công');
    } else {
      setHasUnsyncedDraft(true);
      setSuccessToast('Đã lưu bản nháp an toàn trên máy (đang ngoại tuyến)');
    }
    setIsSavingDraft(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Pre-submit validation
  const handleInitiateSubmit = () => {
    setErrorMessage(null);
    if (!selectedGroupId) {
      setErrorMessage('Vui lòng chọn nhóm của bạn.');
      return;
    }

    if (isSessionClosed) {
      setErrorMessage('Buổi thảo luận hiện đã đóng. Giáo viên không nhận bài nộp mới.');
      return;
    }

    const q1Trim = answers.q1.trim();
    const q2Trim = answers.q2.trim();
    const q3Trim = answers.q3.trim();

    if (!q1Trim || !q2Trim || !q3Trim) {
      const missingList: string[] = [];
      if (!q1Trim) missingList.push('Câu 1');
      if (!q2Trim) missingList.push('Câu 2');
      if (!q3Trim) missingList.push('Câu 3');
      setErrorMessage(`Vui lòng trả lời đầy đủ ${missingList.join(', ')} trước khi gửi bài.`);
      return;
    }

    setShowConfirmModal(true);
  };

  // Final Submit
  const handleConfirmSubmit = async () => {
    if (!selectedGroupId || isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);
    setErrorMessage(null);

    const result = await submitAnswers(selectedGroupId, answers, members);
    setIsSubmitting(false);

    if (result.success) {
      setIsEditing(false);
      setHasUnsyncedDraft(false);
      setSuccessToast(result.message || 'Đã gửi câu trả lời thành công!');
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      setErrorMessage(result.error || 'Có lỗi xảy ra khi gửi bài.');
    }
  };

  // Word count helper
  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  // If no group is chosen yet, show group picker
  if (!selectedGroupId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Chọn nhóm học tập của bạn
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Lớp 10 được chia thành 12 nhóm tương ứng với 4 chủ đề bản quyền. Hãy chọn đúng nhóm do Cô Lê Thị Dung phân công.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
              const topic = state?.topics.find((t) => t.assignedGroups.includes(num));
              const sub = state?.submissions[num];
              const isDone = sub?.status === 'submitted' || sub?.status === 'reviewed';

              return (
                <button
                  key={num}
                  onClick={() => setSelectedGroupId(num)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative hover:scale-105 active:scale-95 ${
                    isDone
                      ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-200 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-base font-extrabold text-slate-800">
                    Nhóm {num}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {topic ? `CĐ ${topic.id}` : ''}
                  </span>
                  {isDone && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => setRole('welcome')}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang chủ</span>
            </button>
            <span>Tin học 10 · THPT Đinh Tiên Hoàng</span>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitted = currentSubmission?.status === 'submitted' || currentSubmission?.status === 'reviewed';
  const canEdit = !isSessionClosed && (isEditing || !isSubmitted);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Mobile Sticky Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {selectedGroupId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base leading-tight">
                  Nhóm {selectedGroupId}
                </h1>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {state?.config?.className || 'Lớp 10A1'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                GV: Cô {state?.config?.teacherName || 'Lê Thị Dung'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedGroupId(null)}
            className="text-xs text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
          >
            Đổi nhóm
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>Trực tuyến</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>Đang ngoại tuyến (Bản nháp lưu trên máy)</span>
              </span>
            )}
            {isSavingDraft && (
              <span className="text-slate-400 italic">· Đang đồng bộ...</span>
            )}
          </div>

          {draftSavedAt && (
            <span className="text-slate-500 text-[11px]">
              Lưu nháp: {draftSavedAt}
            </span>
          )}
        </div>
      </div>

      {/* Session closed warning */}
      {isSessionClosed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Buổi thảo luận đã đóng tiếp nhận bài nộp</p>
            <p className="text-amber-700 mt-0.5">
              Giáo viên đã khóa lượt nộp bài để tiến hành nhận xét và tổng kết. Bạn vẫn có thể xem lại nội dung đã nộp.
            </p>
          </div>
        </div>
      )}

      {/* Group Members field (optional) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Thành viên trong nhóm (tùy chọn):
        </label>
        <input
          type="text"
          disabled={!canEdit}
          value={members}
          onChange={(e) => {
            setMembers(e.target.value);
            setHasUnsyncedDraft(true);
          }}
          placeholder="Nhập tên các thành viên (Ví dụ: Tuấn, Hoa, Nam, Linh...)"
          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 disabled:bg-slate-100 disabled:text-slate-600"
        />
      </div>

      {/* Topic & Scenario Card */}
      {currentTopic && (
        <div
          className="rounded-2xl border p-4 sm:p-5 shadow-sm mb-6 bg-white"
          style={{ borderColor: currentTopic.borderColor || '#cbd5e1' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: `${currentTopic.color}15`, color: currentTopic.color }}
            >
              CHỦ ĐỀ {currentTopic.id}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
              {currentTopic.title}
            </h2>
          </div>

          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              📌 Tình huống thảo luận được giao:
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {currentTopic.scenario}
            </p>
          </div>
        </div>
      )}

      {/* Teacher Feedback Box (If Reviewed) */}
      {currentFeedback?.isReviewed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-3">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Nhận xét từ Giáo viên (Cô Lê Thị Dung)</span>
            <span className="text-[11px] text-emerald-600 font-normal ml-auto">
              {currentFeedback.reviewedAt ? new Date(currentFeedback.reviewedAt).toLocaleTimeString('vi-VN') : ''}
            </span>
          </div>

          {currentFeedback.generalComment && (
            <div className="mb-2 text-xs">
              <span className="font-semibold text-emerald-900">Nhận xét chung: </span>
              <span className="text-emerald-800">{currentFeedback.generalComment}</span>
            </div>
          )}

          {currentFeedback.strengths && (
            <div className="mb-2 text-xs">
              <span className="font-semibold text-emerald-900">Điểm mạnh: </span>
              <span className="text-emerald-800">{currentFeedback.strengths}</span>
            </div>
          )}

          {currentFeedback.improvements && (
            <div className="mb-2 text-xs">
              <span className="font-semibold text-emerald-900">Cần bổ sung: </span>
              <span className="text-emerald-800">{currentFeedback.improvements}</span>
            </div>
          )}

          {currentFeedback.suggestions && (
            <div className="text-xs">
              <span className="font-semibold text-emerald-900">Đề xuất hướng hoàn thiện: </span>
              <span className="text-emerald-800">{currentFeedback.suggestions}</span>
            </div>
          )}
        </div>
      )}

      {/* 3 Mandatory Questions */}
      <div className="space-y-5">
        {allQuestions.map((q, idx) => {
          const val = answers[q.id] || '';
          const wordCount = getWordCount(val);
          const charCount = val.length;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs transition-shadow focus-within:border-indigo-500 focus-within:shadow-sm"
            >
              <div className="mb-2">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Câu hỏi {idx + 1}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {q.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  💡 Gợi ý: {q.guideline}
                </p>
              </div>

              <div className="mt-3">
                <textarea
                  rows={4}
                  disabled={!canEdit}
                  value={val}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-indigo-500 leading-relaxed disabled:bg-slate-100 disabled:text-slate-600 placeholder:text-slate-400"
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {val.trim() === '' ? (
                    <span className="text-rose-500 font-medium">Bắt buộc nhập</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">✓ Đã có nội dung</span>
                  )}
                </span>
                <span className="font-mono">
                  {wordCount} từ · {charCount} ký tự
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successToast && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Submission Status banner if submitted */}
      {isSubmitted && !isEditing && (
        <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Bài thảo luận đã được gửi tới màn hình giáo viên!</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Thời gian gửi: {currentSubmission?.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('vi-VN') : 'Vừa xong'}
          </p>

          {state?.config?.allowEditing && state?.config?.isOpen && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>CHỈNH SỬA BÀI ĐÃ GỬI</span>
            </button>
          )}
        </div>
      )}

      {/* Fixed Bottom Action Bar for Mobile Thumb Ergonomics */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={handleManualSaveDraft}
                disabled={isSavingDraft}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>{isSavingDraft ? 'Đang lưu...' : 'LƯU BẢN NHÁP'}</span>
              </button>

              <button
                type="button"
                onClick={handleInitiateSubmit}
                disabled={isSubmitting || isSessionClosed}
                className="flex-2 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'ĐANG GỬI...' : 'GỬI CÂU TRẢ LỜI'}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between text-xs text-slate-600 px-2">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã hoàn thành lượt nộp</span>
              </span>
              {state?.config?.allowEditing && !isSessionClosed && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Chỉnh sửa câu trả lời
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Xác nhận nộp bài Nhóm {selectedGroupId}?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6">
              Toàn bộ 3 câu trả lời của nhóm sẽ được đồng bộ ngay lập tức tới máy chiếu của Cô Lê Thị Dung để cùng thảo luận.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Xem lại bài
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm"
              >
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
