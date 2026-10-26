-- ========================================================
-- PHÒNG THẢO LUẬN SỐ: TIN HỌC 10 - THPT ĐINH TIÊN HOÀNG
-- BẢN QUYỀN NỘI DUNG SỐ (12 NHÓM - 4 CHỦ ĐỀ)
-- SQL Script khởi tạo bảng trên Supabase (Copy & Paste vào SQL Editor)
-- ========================================================

-- 1. Bảng cấu hình buổi học (classroom_config)
CREATE TABLE IF NOT EXISTS classroom_config (
  id TEXT PRIMARY KEY DEFAULT 'current_session',
  class_id TEXT NOT NULL DEFAULT '10A1',
  class_name TEXT NOT NULL DEFAULT 'Lớp 10A1',
  teacher_name TEXT NOT NULL DEFAULT 'Lê Thị Dung',
  school_name TEXT NOT NULL DEFAULT 'THPT Đinh Tiên Hoàng',
  subject TEXT NOT NULL DEFAULT 'Tin học 10',
  topic_title TEXT NOT NULL DEFAULT 'Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp',
  is_open BOOLEAN NOT NULL DEFAULT true,
  allow_editing BOOLEAN NOT NULL DEFAULT true,
  teacher_pin TEXT NOT NULL DEFAULT 'thpt-dth-2026',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Khởi tạo bản ghi mặc định nếu chưa có
INSERT INTO classroom_config (id, class_id, class_name, teacher_name, school_name, subject, topic_title, is_open, allow_editing, teacher_pin)
VALUES (
  'current_session',
  '10A1',
  'Lớp 10A1',
  'Lê Thị Dung',
  'THPT Đinh Tiên Hoàng',
  'Tin học 10',
  'Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp',
  true,
  true,
  'thpt-dth-2026'
) ON CONFLICT (id) DO NOTHING;

-- 2. Bảng bài nộp 12 nhóm (group_submissions)
CREATE TABLE IF NOT EXISTS group_submissions (
  group_id INT PRIMARY KEY CHECK (group_id >= 1 AND group_id <= 12),
  group_name TEXT NOT NULL,
  topic_id INT NOT NULL CHECK (topic_id >= 1 AND topic_id <= 4),
  members TEXT DEFAULT '',
  answer_q1 TEXT DEFAULT '',
  answer_q2 TEXT DEFAULT '',
  answer_q3 TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Khởi tạo 12 nhóm
INSERT INTO group_submissions (group_id, group_name, topic_id, status)
VALUES
  (1, 'Nhóm 1', 1, 'not_started'),
  (2, 'Nhóm 2', 1, 'not_started'),
  (3, 'Nhóm 3', 1, 'not_started'),
  (4, 'Nhóm 4', 2, 'not_started'),
  (5, 'Nhóm 5', 2, 'not_started'),
  (6, 'Nhóm 6', 2, 'not_started'),
  (7, 'Nhóm 7', 3, 'not_started'),
  (8, 'Nhóm 8', 3, 'not_started'),
  (9, 'Nhóm 9', 3, 'not_started'),
  (10, 'Nhóm 10', 4, 'not_started'),
  (11, 'Nhóm 11', 4, 'not_started'),
  (12, 'Nhóm 12', 4, 'not_started')
ON CONFLICT (group_id) DO NOTHING;

-- 3. Bảng nhận xét giáo viên (teacher_feedbacks)
CREATE TABLE IF NOT EXISTS teacher_feedbacks (
  group_id INT PRIMARY KEY REFERENCES group_submissions(group_id) ON DELETE CASCADE,
  general_comment TEXT DEFAULT '',
  strengths TEXT DEFAULT '',
  improvements TEXT DEFAULT '',
  suggestions TEXT DEFAULT '',
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT DEFAULT 'Cô Lê Thị Dung'
);

-- Khởi tạo nhận xét rỗng cho 12 nhóm
INSERT INTO teacher_feedbacks (group_id, reviewed_by)
SELECT generate_series(1, 12), 'Cô Lê Thị Dung'
ON CONFLICT (group_id) DO NOTHING;

-- 4. Bật Realtime cho các bảng trong Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE group_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_feedbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_config;

-- 5. Thiết lập phân quyền Row Level Security (RLS)
ALTER TABLE classroom_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_feedbacks ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai để học sinh và giáo viên hiển thị bài
CREATE POLICY "Public Read Configuration" ON classroom_config FOR SELECT USING (true);
CREATE POLICY "Public Read Submissions" ON group_submissions FOR SELECT USING (true);
CREATE POLICY "Public Read Feedbacks" ON teacher_feedbacks FOR SELECT USING (true);

-- Cho phép cập nhật bài nộp từ ứng dụng web
CREATE POLICY "Allow All Update Submissions" ON group_submissions FOR ALL USING (true);
CREATE POLICY "Allow All Update Feedbacks" ON teacher_feedbacks FOR ALL USING (true);
CREATE POLICY "Allow All Update Config" ON classroom_config FOR ALL USING (true);
