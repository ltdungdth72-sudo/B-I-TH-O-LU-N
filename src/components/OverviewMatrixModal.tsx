import React from 'react';
import { X, Award, CheckCircle2, Clock, Eye, AlertCircle, Laptop } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface OverviewMatrixModalProps {
  onClose: () => void;
  onSelectGroup: (groupId: number) => void;
  onOpenPresentation: (groupId: number) => void;
}

export const OverviewMatrixModal: React.FC<OverviewMatrixModalProps> = ({
  onClose,
  onSelectGroup,
  onOpenPresentation,
}) => {
  const { state } = useClassroom();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              <span>TRÌNH CHIẾU TỔNG HỢP: 12 NHÓM – 4 CHỦ ĐỀ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn cảnh hoạt động thảo luận của lớp 10 · Cô {state?.config?.teacherName || 'Lê Thị Dung'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto flex-1 mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-16 text-center">Nhóm</th>
                <th className="py-3 px-3 w-44">Chủ đề</th>
                <th className="py-3 px-3">Câu 1 (Hành vi)</th>
                <th className="py-3 px-3">Câu 2 (Quyền tác giả)</th>
                <th className="py-3 px-3">Câu 3 (Giải pháp)</th>
                <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                <th className="py-3 px-3 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((groupId) => {
                const sub = state?.submissions[groupId];
                const fb = state?.feedbacks[groupId];
                const topic = state?.topics.find((t) => t.assignedGroups.includes(groupId));

                const isReviewed = fb?.isReviewed;
                const isSubmitted = sub?.status === 'submitted' || isReviewed;
                const isInProgress = sub?.status === 'in_progress';

                return (
                  <tr
                    key={groupId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isReviewed
                        ? 'bg-emerald-50/20'
                        : isSubmitted
                        ? 'bg-blue-50/20'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-extrabold text-slate-900 text-center">
                      <span className="inline-block w-7 h-7 rounded-lg bg-slate-200 text-slate-800 leading-7 font-mono font-bold">
                        {groupId}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block line-clamp-1">
                        CĐ {topic?.id}: {topic?.title.split(':')[1]?.trim() || topic?.title}
                      </span>
                      {sub?.members && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {sub.members}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      {sub?.answers.q1 ? (
                        <span className="text-slate-700 line-clamp-2">{sub.answers.q1}</span>
                      ) : (
                        <span className="text-slate-300 italic">Chưa có</span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      {sub?.answers.q2 ? (
                        <span className="text-slate-700 line-clamp-2">{sub.answers.q2}</span>
                      ) : (
                        <span className="text-slate-300 italic">Chưa có</span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      {sub?.answers.q3 ? (
                        <span className="text-slate-700 line-clamp-2">{sub.answers.q3}</span>
                      ) : (
                        <span className="text-slate-300 italic">Chưa có</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isReviewed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã nhận xét
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3" />
                          Đã nộp bài
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Đang làm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Chưa làm
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPresentation(groupId);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition-colors"
                        >
                          Chiếu
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectGroup(groupId);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                        >
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số 12 nhóm học sinh môn Tin học 10</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900"
          >
            Đóng bảng tổng hợp
          </button>
        </div>
      </div>
    </div>
  );
};
