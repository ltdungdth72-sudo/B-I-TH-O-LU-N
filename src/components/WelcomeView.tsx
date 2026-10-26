import React, { useState } from 'react';
import { Shield, Users, ArrowRight, Laptop, Sparkles, BookOpen, Music, Image, FileText, CheckCircle2 } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { QRCodeDisplay } from './QRCodeDisplay';

export const WelcomeView: React.FC = () => {
  const { setRole, setSelectedGroupId, state } = useClassroom();
  const [quickGroup, setQuickGroup] = useState<number | ''>('');
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?role=student` : '';

  const handleStudentJoin = (groupNum?: number) => {
    if (groupNum && groupNum >= 1 && groupNum <= 12) {
      setSelectedGroupId(groupNum);
    }
    setRole('student');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm relative overflow-hidden text-center sm:text-left mb-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiết học Tương tác Thời gian thực</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              PHÒNG THẢO LUẬN SỐ
            </h1>
            <p className="mt-2 text-lg font-bold text-indigo-600">
              12 NHÓM – 4 CHỦ ĐỀ – CÙNG HỌC VỀ BẢN QUYỀN
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-semibold text-slate-800">Môn học:</span>
                <span>{state?.config?.subject || 'Tin học 10'} — {state?.config?.schoolName || 'Trường THPT Đinh Tiên Hoàng'}</span>
              </p>
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-semibold text-slate-800">Giáo viên phụ trách:</span>
                <span>Cô {state?.config?.teacherName || 'Lê Thị Dung'}</span>
              </p>
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-semibold text-slate-800">Chủ đề bài học:</span>
                <span className="italic">{state?.config?.topicTitle || 'Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp'}</span>
              </p>
            </div>

            {/* Two Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => handleStudentJoin()}
                className="px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>1. VÀO KHÔNG GIAN HỌC SINH</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setRole('teacher')}
                className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Laptop className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>2. MÀN HÌNH GIÁO VIÊN</span>
                <Shield className="w-4 h-4 text-indigo-300" />
              </button>
            </div>
          </div>

          {/* Quick QR Code card for direct phone scan */}
          <div className="lg:w-72 bg-slate-50 border border-slate-200 rounded-xl p-5 text-center flex flex-col items-center shrink-0">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quét mã QR bằng điện thoại
            </span>
            <QRCodeDisplay url={currentUrl || window.location.href} size={150} />
            <p className="text-[11px] text-slate-500 mt-2">
              Dùng camera điện thoại hoặc Zalo để vào thảo luận nhóm tức thì
            </p>

            <div className="mt-3 w-full pt-3 border-t border-slate-200">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Vào nhanh theo số nhóm:
              </label>
              <div className="flex gap-1.5">
                <select
                  value={quickGroup}
                  onChange={(e) => setQuickGroup(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-medium text-slate-800"
                >
                  <option value="">Chọn nhóm...</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Nhóm {n}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!quickGroup}
                  onClick={() => quickGroup && handleStudentJoin(Number(quickGroup))}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Vào
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Topics Overview Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              4 Chủ đề Thảo luận cho 12 Nhóm
            </h2>
            <p className="text-xs text-slate-500">
              Mỗi chủ đề gồm 3 nhóm học sinh phân tích tình huống thực tế và trả lời 3 câu hỏi bắt buộc
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Topic 1 */}
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-blue-900 text-sm">
                    CHỦ ĐỀ 1: PHẦN MỀM TRẢ PHÍ VÀ BẢN QUYỀN
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                    Nhóm 1, 2, 3
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Tình huống:</span> Một học sinh tải phần mềm trả phí từ nguồn không chính thức và dùng bản đã bẻ khóa.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleStudentJoin(g)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Nhóm {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Topic 2 */}
          <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-xs hover:border-purple-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Image className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-purple-900 text-sm">
                    CHỦ ĐỀ 2: SỬ DỤNG HÌNH ẢNH TRÊN INTERNET
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                    Nhóm 4, 5, 6
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Tình huống:</span> Lấy ảnh trên Internet đưa vào bài trình chiếu, không ghi nguồn và không kiểm tra điều kiện sử dụng.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {[4, 5, 6].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleStudentJoin(g)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      Nhóm {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Topic 3 */}
          <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-rose-900 text-sm">
                    CHỦ ĐỀ 3: SỬ DỤNG BÀI HÁT LÀM NHẠC NỀN
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
                    Nhóm 7, 8, 9
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Tình huống:</span> Dùng một bài hát nổi tiếng làm nhạc nền cho video của lớp rồi đăng công khai lên mạng xã hội.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {[7, 8, 9].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleStudentJoin(g)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      Nhóm {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Topic 4 */}
          <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-900 text-sm">
                    CHỦ ĐỀ 4: SỬ DỤNG HÌNH ẢNH CÓ GIẤY PHÉP
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                    Nhóm 10, 11, 12
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Tình huống:</span> Tải một hình ảnh có giấy phép sử dụng, nhưng chưa đọc điều kiện giấy phép trước khi chỉnh sửa và đăng lại.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {[10, 11, 12].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleStudentJoin(g)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      Nhóm {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Questions Guide */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-300" />
          <span>3 Câu hỏi cốt lõi mỗi nhóm cần giải quyết:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-indigo-800/60 p-4 rounded-xl border border-indigo-700">
            <div className="font-bold text-indigo-200 mb-1">CÂU HỎI 1</div>
            <p className="font-semibold text-white">Hành vi nào có vấn đề?</p>
            <p className="text-xs text-indigo-200 mt-1">Xác định các điểm chưa đúng hoặc vi phạm trong tình huống.</p>
          </div>
          <div className="bg-indigo-800/60 p-4 rounded-xl border border-indigo-700">
            <div className="font-bold text-indigo-200 mb-1">CÂU HỎI 2</div>
            <p className="font-semibold text-white">Quyền lợi của tác giả có thể bị ảnh hưởng như thế nào?</p>
            <p className="text-xs text-indigo-200 mt-1">Đánh giá tác động đến quyền nhân thân, quyền tài sản và uy tín.</p>
          </div>
          <div className="bg-indigo-800/60 p-4 rounded-xl border border-indigo-700">
            <div className="font-bold text-indigo-200 mb-1">CÂU HỎI 3</div>
            <p className="font-semibold text-white">Cần làm gì để sử dụng nội dung phù hợp?</p>
            <p className="text-xs text-indigo-200 mt-1">Đưa ra giải pháp hợp pháp: mua bản quyền, xin phép, trích nguồn.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
