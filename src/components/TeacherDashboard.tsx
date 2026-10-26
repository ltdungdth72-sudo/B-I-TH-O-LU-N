import React, { useState } from 'react';
import {
  Laptop,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Download,
  Settings,
  QrCode,
  Sparkles,
  Shield,
  Image as ImageIcon,
  Music,
  FileCheck,
  Eye,
  Maximize2,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { PresentationModal } from './PresentationModal';
import { ReviewModal } from './ReviewModal';
import { OverviewMatrixModal } from './OverviewMatrixModal';
import { TeacherSettingsModal } from './TeacherSettingsModal';
import { QRCodeDisplay } from './QRCodeDisplay';

export const TeacherDashboard: React.FC = () => {
  const {
    state,
    isTeacherAuthenticated,
    loginTeacher,
    logoutTeacher,
    newSubmissionAlert,
    dismissNewAlert,
    refreshState,
  } = useClassroom();

  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Modals state
  const [presentationGroupId, setPresentationGroupId] = useState<number | null>(null);
  const [reviewGroupId, setReviewGroupId] = useState<number | null>(null);
  const [showOverviewMatrix, setShowOverviewMatrix] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [viewDetailGroupId, setViewDetailGroupId] = useState<number | null>(null);

  const studentJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?role=student`
    : '';

  // Handle Teacher PIN Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsLoggingIn(true);
    setPinError(null);
    const ok = await loginTeacher(pinInput.trim());
    setIsLoggingIn(false);
    if (!ok) {
      setPinError('Mật khẩu quản trị chưa đúng (Gợi ý mặc định: thpt-dth-2026)');
    }
  };

  // If not authenticated as teacher, show password lock screen
  if (!isTeacherAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Xác thực Màn hình Giáo viên
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Bảo vệ quyền quản trị lớp học của Cô Lê Thị Dung. Vui lòng nhập mật khẩu quản trị để tiếp tục.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Nhập mã PIN quản trị..."
                className="w-full text-center tracking-widest text-base font-mono px-4 py-3 border border-slate-300 rounded-xl focus:outline-indigo-500"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                (Mã PIN mặc định: <span className="font-mono font-bold text-indigo-600">thpt-dth-2026</span>)
              </p>
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoggingIn ? 'Đang kiểm tra...' : 'Vào Bảng điều khiển'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate 4 Key Metrics
  const totalGroups = 12;
  const submissionsArray = Object.values(state?.submissions || {});
  const feedbacksArray = Object.values(state?.feedbacks || {});

  const submittedCount = submissionsArray.filter(
    (s) => s.status === 'submitted' || s.status === 'reviewed'
  ).length;

  const inProgressOrNotStarted = totalGroups - submittedCount;

  const reviewedCount = feedbacksArray.filter((f) => f.isReviewed).length;

  // Helper for topic icons
  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'software':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-600" />;
      case 'music':
        return <Music className="w-4 h-4 text-rose-600" />;
      case 'license':
        return <FileCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Shield className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Laptop className="w-4 h-4" />
              <span>BẢNG ĐIỀU KHIỂN GIÁO VIÊN & TRÌNH CHIẾU LỚP HỌC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              PHÒNG THẢO LUẬN SỐ
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {state?.config?.teacherName || 'Lê Thị Dung'} – {state?.config?.subject || 'Tin học 10'} · {state?.config?.schoolName || 'Trường THPT Đinh Tiên Hoàng'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
              Chủ đề: {state?.config?.topicTitle}
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setShowQRModal(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Mã QR tham gia</span>
            </button>

            <button
              onClick={() => setShowOverviewMatrix(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Maximize2 className="w-4 h-4 text-indigo-300" />
              <span>TRÌNH CHIẾU TỔNG HỢP</span>
            </button>

            <a
              href="/api/export-csv"
              download
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất CSV</span>
            </a>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Quản lý buổi học"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={refreshState}
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4">
            <span className="text-xs font-medium text-slate-500 block">Tổng số nhóm:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {totalGroups}
              </span>
              <span className="text-xs text-slate-500">nhóm</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 sm:p-4">
            <span className="text-xs font-medium text-blue-700 block">Số nhóm đã gửi bài:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono tabular-nums">
                {submittedCount}
              </span>
              <span className="text-xs text-blue-700">/ 12 nhóm</span>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 sm:p-4">
            <span className="text-xs font-medium text-amber-800 block">Đang làm / Chưa gửi:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 font-mono tabular-nums">
                {inProgressOrNotStarted}
              </span>
              <span className="text-xs text-amber-700">nhóm</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 sm:p-4">
            <span className="text-xs font-medium text-emerald-800 block">Đã được giáo viên nhận xét:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono tabular-nums">
                {reviewedCount}
              </span>
              <span className="text-xs text-emerald-700">/ 12 nhóm</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Submission Toast Alert */}
      {newSubmissionAlert && (
        <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-lg mb-6 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-sm font-bold">
              Nhóm {newSubmissionAlert} vừa nộp bài thảo luận mới!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPresentationGroupId(newSubmissionAlert);
                dismissNewAlert();
              }}
              className="px-3 py-1 bg-white text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-50"
            >
              Trình chiếu ngay
            </button>
            <button
              onClick={dismissNewAlert}
              className="text-xs text-indigo-200 hover:text-white px-2 py-1"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 4 Major Subject Areas (Each containing 3 Groups) */}
      <div className="space-y-8">
        {state?.topics.map((topic) => {
          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs"
            >
              {/* Area Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
                    {getTopicIcon(topic.iconName)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      KHU VỰC {topic.id} – {topic.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {topic.scenario}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 self-start sm:self-auto">
                  Nhóm {topic.assignedGroups.join(', ')}
                </span>
              </div>

              {/* 3 Group Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topic.assignedGroups.map((groupId) => {
                  const sub = state.submissions[groupId];
                  const fb = state.feedbacks[groupId];

                  const isReviewed = fb?.isReviewed;
                  const isSubmitted = sub?.status === 'submitted' || isReviewed;
                  const isInProgress = sub?.status === 'in_progress';
                  const isNotStarted = sub?.status === 'not_started';

                  // Card border and background color conventions
                  let statusBadge = (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Chưa bắt đầu
                    </span>
                  );
                  let cardBorder = 'border-slate-200';
                  let cardBg = 'bg-white';

                  if (isReviewed) {
                    statusBadge = (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã nhận xét
                      </span>
                    );
                    cardBorder = 'border-emerald-300';
                    cardBg = 'bg-emerald-50/20';
                  } else if (isSubmitted) {
                    statusBadge = (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Đã gửi bài
                      </span>
                    );
                    cardBorder = 'border-blue-300';
                    cardBg = 'bg-blue-50/20';
                  } else if (isInProgress) {
                    statusBadge = (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Đang làm...
                      </span>
                    );
                    cardBorder = 'border-amber-300';
                    cardBg = 'bg-amber-50/20';
                  }

                  const isJustSubmitted = newSubmissionAlert === groupId;

                  return (
                    <div
                      key={groupId}
                      className={`rounded-xl border p-4 shadow-2xs transition-all relative flex flex-col justify-between ${cardBorder} ${cardBg} ${
                        isJustSubmitted ? 'ring-2 ring-indigo-500 scale-[1.01]' : ''
                      }`}
                    >
                      <div>
                        {/* Group Number & Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                              {groupId}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              Nhóm {groupId}
                            </span>
                          </div>
                          {statusBadge}
                        </div>

                        {/* Members or timestamp */}
                        <div className="text-[11px] text-slate-500 space-y-0.5 my-2">
                          {sub?.members ? (
                            <p className="truncate">
                              <span className="font-medium text-slate-700">TV: </span>
                              {sub.members}
                            </p>
                          ) : (
                            <p className="italic text-slate-400">Chưa nhập tên thành viên</p>
                          )}

                          <p>
                            {sub?.submittedAt ? (
                              <span>Nộp lúc: {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}</span>
                            ) : sub?.updatedAt ? (
                              <span>Cập nhật: {new Date(sub.updatedAt).toLocaleTimeString('vi-VN')}</span>
                            ) : (
                              <span>Chưa có dữ liệu</span>
                            )}
                          </p>
                        </div>

                        {/* Answers snippet preview */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-[11px] text-slate-700 my-3 space-y-1">
                          <p className="line-clamp-1">
                            <span className="font-semibold text-slate-900">C1: </span>
                            {sub?.answers.q1 || <span className="text-slate-400 italic">Chưa nhập</span>}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-slate-900">C2: </span>
                            {sub?.answers.q2 || <span className="text-slate-400 italic">Chưa nhập</span>}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-slate-900">C3: </span>
                            {sub?.answers.q3 || <span className="text-slate-400 italic">Chưa nhập</span>}
                          </p>
                        </div>
                      </div>

                      {/* 3 Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 mt-auto">
                        <button
                          onClick={() => setViewDetailGroupId(groupId)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>XEM BÀI</span>
                        </button>

                        <button
                          onClick={() => setPresentationGroupId(groupId)}
                          className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>TRÌNH CHIẾU</span>
                        </button>

                        <button
                          onClick={() => setReviewGroupId(groupId)}
                          className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                          title="Nhận xét bài của nhóm"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">NHẬN XÉT</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Projector Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center relative">
            <h2 className="text-2xl font-black text-slate-900">
              QUÉT MÃ QR ĐỂ THAM GIA
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Học sinh dùng điện thoại quét mã QR để vào ngay không gian làm bài
            </p>

            <div className="flex justify-center mb-6">
              <QRCodeDisplay url={studentJoinUrl} size={260} />
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 break-all mb-6">
              {studentJoinUrl}
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Đóng màn hình QR
            </button>
          </div>
        </div>
      )}

      {/* Detail View Modal for a Group */}
      {viewDetailGroupId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center">
                  {viewDetailGroupId}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Chi tiết bài làm: Nhóm {viewDetailGroupId}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {state?.topics.find((t) => t.assignedGroups.includes(viewDetailGroupId))?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewDetailGroupId(null)}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-6 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Tình huống thảo luận:</span>
                <p className="text-slate-700">
                  {state?.topics.find((t) => t.assignedGroups.includes(viewDetailGroupId))?.scenario}
                </p>
              </div>

              <div>
                <span className="font-bold text-indigo-700 block mb-1">
                  Câu 1: Hành vi nào có vấn đề?
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed whitespace-pre-wrap text-slate-800">
                  {state?.submissions[viewDetailGroupId]?.answers.q1 || (
                    <span className="text-slate-400 italic">Chưa trả lời</span>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-rose-700 block mb-1">
                  Câu 2: Quyền lợi của tác giả bị ảnh hưởng như thế nào?
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed whitespace-pre-wrap text-slate-800">
                  {state?.submissions[viewDetailGroupId]?.answers.q2 || (
                    <span className="text-slate-400 italic">Chưa trả lời</span>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-emerald-700 block mb-1">
                  Câu 3: Cần làm gì để sử dụng nội dung phù hợp?
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed whitespace-pre-wrap text-slate-800">
                  {state?.submissions[viewDetailGroupId]?.answers.q3 || (
                    <span className="text-slate-400 italic">Chưa trả lời</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setViewDetailGroupId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Đóng
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const g = viewDetailGroupId;
                    setViewDetailGroupId(null);
                    setReviewGroupId(g);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Nhận xét
                </button>
                <button
                  onClick={() => {
                    const g = viewDetailGroupId;
                    setViewDetailGroupId(null);
                    setPresentationGroupId(g);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Trình chiếu 16:9
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Fullscreen Modal */}
      {presentationGroupId !== null && (
        <PresentationModal
          initialGroupId={presentationGroupId}
          onClose={() => setPresentationGroupId(null)}
          onOpenReview={(gId) => setReviewGroupId(gId)}
        />
      )}

      {/* Teacher Review Modal */}
      {reviewGroupId !== null && (
        <ReviewModal
          groupId={reviewGroupId}
          onClose={() => setReviewGroupId(null)}
        />
      )}

      {/* Overview Matrix Modal */}
      {showOverviewMatrix && (
        <OverviewMatrixModal
          onClose={() => setShowOverviewMatrix(false)}
          onSelectGroup={(gId) => setViewDetailGroupId(gId)}
          onOpenPresentation={(gId) => setPresentationGroupId(gId)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <TeacherSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
