import React from 'react';
import { ClassroomProvider, useClassroom } from './context/ClassroomContext';
import { Navbar } from './components/Navbar';
import { WelcomeView } from './components/WelcomeView';
import { StudentView } from './components/StudentView';
import { TeacherDashboard } from './components/TeacherDashboard';

const MainContent: React.FC = () => {
  const { role, loading } = useClassroom();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">
          Đang khởi tạo Phòng Thảo Luận Số...
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1">
      {role === 'welcome' && <WelcomeView />}
      {role === 'student' && <StudentView />}
      {role === 'teacher' && <TeacherDashboard />}
    </main>
  );
};

export default function App() {
  return (
    <ClassroomProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <MainContent />
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              PHÒNG THẢO LUẬN SỐ — Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng phù hợp
            </span>
            <span className="font-medium text-slate-700">
              Tin học 10 · THPT Đinh Tiên Hoàng · GV: Cô Lê Thị Dung
            </span>
          </div>
        </footer>
      </div>
    </ClassroomProvider>
  );
}
