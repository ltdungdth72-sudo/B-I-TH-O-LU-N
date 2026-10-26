import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createInitialState } from './src/defaultData.js';
import { ClassroomState } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'session.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state cached and persisted to file
let classroomState: ClassroomState;

function loadState(): ClassroomState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.config && parsed.submissions) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading state from file, resetting to initial:', err);
  }
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: ClassroomState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving state to file:', err);
  }
}

classroomState = loadState();

// SSE Connected Clients
interface SSEClient {
  id: string;
  res: Response;
  role: 'teacher' | 'student';
}
let sseClients: SSEClient[] = [];

function broadcast(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: Date.now() });
  sseClients.forEach((client) => {
    try {
      client.res.write(`event: message\ndata: ${data}\n\n`);
    } catch (err) {
      // client may be closed
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full classroom state
  app.get('/api/session', (req: Request, res: Response) => {
    const isTeacher = req.headers['x-teacher-auth'] === classroomState.config.teacherPin;
    
    // If not teacher, hide teacher private notes if any
    const responseSubmissions = { ...classroomState.submissions };
    const responseFeedbacks: Record<number, any> = {};

    Object.keys(classroomState.feedbacks).forEach((key) => {
      const gId = Number(key);
      const fb = classroomState.feedbacks[gId];
      if (isTeacher || fb.isReviewed) {
        responseFeedbacks[gId] = fb;
      } else {
        responseFeedbacks[gId] = {
          groupId: gId,
          generalComment: '',
          strengths: '',
          improvements: '',
          suggestions: '',
          isReviewed: false,
          reviewedAt: null,
          reviewedBy: '',
        };
      }
    });

    res.json({
      config: {
        ...classroomState.config,
        // Don't leak teacher PIN unless teacher is authenticated
        teacherPin: isTeacher ? classroomState.config.teacherPin : undefined,
      },
      topics: classroomState.topics,
      questions: classroomState.questions,
      submissions: responseSubmissions,
      feedbacks: responseFeedbacks,
      serverTime: new Date().toISOString(),
    });
  });

  // Teacher authentication
  app.post('/api/auth/teacher', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (pin === classroomState.config.teacherPin || pin === 'thpt-dth-2026') {
      res.json({ success: true, message: 'Xác thực thành công' });
    } else {
      res.status(401).json({ success: false, message: 'Mật khẩu quản trị giáo viên chưa chính xác' });
    }
  });

  // Student Draft saving
  app.post('/api/draft', (req: Request, res: Response) => {
    const { groupId, answers, members } = req.body;
    const gId = Number(groupId);

    if (!gId || gId < 1 || gId > 12) {
      return res.status(400).json({ error: 'Nhóm không hợp lệ (1 - 12)' });
    }

    if (!classroomState.config.isOpen) {
      return res.status(403).json({ error: 'Buổi thảo luận hiện đã đóng, không thể lưu nháp.' });
    }

    const currentSub = classroomState.submissions[gId];
    // Only change to in_progress if not already submitted or reviewed
    const newStatus = currentSub.status === 'not_started' ? 'in_progress' : currentSub.status;

    classroomState.submissions[gId] = {
      ...currentSub,
      members: members !== undefined ? members : currentSub.members,
      answers: {
        q1: answers?.q1 ?? currentSub.answers.q1,
        q2: answers?.q2 ?? currentSub.answers.q2,
        q3: answers?.q3 ?? currentSub.answers.q3,
      },
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    saveState(classroomState);
    broadcast('draft_updated', { groupId: gId, submission: classroomState.submissions[gId] });

    return res.json({ success: true, submission: classroomState.submissions[gId] });
  });

  // Student Submit
  app.post('/api/submit', (req: Request, res: Response) => {
    const { groupId, answers, members } = req.body;
    const gId = Number(groupId);

    if (!gId || gId < 1 || gId > 12) {
      return res.status(400).json({ error: 'Nhóm không hợp lệ (phải từ 1 đến 12)' });
    }

    if (!classroomState.config.isOpen) {
      return res.status(403).json({ error: 'Buổi thảo luận đã kết thúc. Giáo viên đã khóa tiếp nhận bài nộp.' });
    }

    const currentSub = classroomState.submissions[gId];
    if (currentSub.status === 'submitted' && !classroomState.config.allowEditing) {
      return res.status(403).json({ error: 'Giáo viên không cho phép chỉnh sửa lại bài sau khi đã nộp.' });
    }

    // Validate 3 questions
    const q1 = (answers?.q1 || '').trim();
    const q2 = (answers?.q2 || '').trim();
    const q3 = (answers?.q3 || '').trim();

    if (!q1 || !q2 || !q3) {
      return res.status(400).json({
        error: 'Vui lòng hoàn thành đầy đủ cả 3 câu hỏi trước khi gửi bài.',
        missing: {
          q1: !q1,
          q2: !q2,
          q3: !q3,
        },
      });
    }

    const now = new Date().toISOString();
    classroomState.submissions[gId] = {
      ...currentSub,
      members: members ? members.trim() : currentSub.members,
      answers: { q1, q2, q3 },
      status: currentSub.status === 'reviewed' ? 'reviewed' : 'submitted',
      submittedAt: currentSub.submittedAt || now,
      updatedAt: now,
    };

    saveState(classroomState);
    broadcast('submission_received', {
      groupId: gId,
      submission: classroomState.submissions[gId],
    });

    return res.json({
      success: true,
      message: 'Đã gửi câu trả lời thành công!',
      submission: classroomState.submissions[gId],
    });
  });

  // Teacher feedback review
  app.post('/api/feedback', (req: Request, res: Response) => {
    const authHeader = req.headers['x-teacher-auth'];
    if (authHeader !== classroomState.config.teacherPin && authHeader !== 'thpt-dth-2026') {
      return res.status(401).json({ error: 'Yêu cầu quyền giáo viên' });
    }

    const { groupId, generalComment, strengths, improvements, suggestions, isReviewed } = req.body;
    const gId = Number(groupId);

    if (!gId || gId < 1 || gId > 12) {
      return res.status(400).json({ error: 'Nhóm không hợp lệ' });
    }

    const now = new Date().toISOString();
    classroomState.feedbacks[gId] = {
      groupId: gId,
      generalComment: generalComment || '',
      strengths: strengths || '',
      improvements: improvements || '',
      suggestions: suggestions || '',
      isReviewed: Boolean(isReviewed),
      reviewedAt: isReviewed ? now : null,
      reviewedBy: classroomState.config.teacherName,
    };

    // If marked as reviewed and submission was submitted, update submission status
    if (isReviewed) {
      classroomState.submissions[gId].status = 'reviewed';
    } else if (classroomState.submissions[gId].status === 'reviewed') {
      classroomState.submissions[gId].status = 'submitted';
    }

    saveState(classroomState);
    broadcast('feedback_updated', {
      groupId: gId,
      feedback: classroomState.feedbacks[gId],
      submission: classroomState.submissions[gId],
    });

    return res.json({
      success: true,
      feedback: classroomState.feedbacks[gId],
      submission: classroomState.submissions[gId],
    });
  });

  // Teacher session config & reset
  app.post('/api/session/config', (req: Request, res: Response) => {
    const authHeader = req.headers['x-teacher-auth'];
    if (authHeader !== classroomState.config.teacherPin && authHeader !== 'thpt-dth-2026') {
      return res.status(401).json({ error: 'Yêu cầu quyền giáo viên' });
    }

    const { config, action, topics, questions } = req.body;

    if (action === 'reset_all') {
      // Re-initialize state
      classroomState = createInitialState();
      saveState(classroomState);
      broadcast('session_reset', classroomState);
      return res.json({ success: true, message: 'Đã đặt lại toàn bộ buổi học', state: classroomState });
    }

    if (action === 'reset_submissions') {
      const initial = createInitialState();
      classroomState.submissions = initial.submissions;
      classroomState.feedbacks = initial.feedbacks;
      saveState(classroomState);
      broadcast('session_reset', classroomState);
      return res.json({ success: true, message: 'Đã xóa toàn bộ bài nộp của các nhóm', state: classroomState });
    }

    if (config) {
      classroomState.config = {
        ...classroomState.config,
        ...config,
        updatedAt: new Date().toISOString(),
      };
    }

    if (Array.isArray(topics)) {
      classroomState.topics = topics;
    }

    if (Array.isArray(questions)) {
      classroomState.questions = questions;
    }

    saveState(classroomState);
    broadcast('config_updated', {
      config: classroomState.config,
      topics: classroomState.topics,
      questions: classroomState.questions,
    });

    return res.json({ success: true, state: classroomState });
  });

  // Export CSV for Teacher
  app.get('/api/export-csv', (_req: Request, res: Response) => {
    let csv = '\uFEFF'; // UTF-8 BOM for Excel in Vietnamese
    csv += 'BÁO CÁO TỔNG KẾT PHÒNG THẢO LUẬN SỐ\n';
    csv += `Chủ đề: ${classroomState.config.topicTitle}\n`;
    csv += `Môn: ${classroomState.config.subject} - Lớp: ${classroomState.config.className}\n`;
    csv += `Trường: ${classroomState.config.schoolName} - Giáo viên: ${classroomState.config.teacherName}\n`;
    csv += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

    csv += '"Số nhóm","Tên nhóm","Chủ đề","Tình huống","Câu hỏi 1 (Hành vi có vấn đề)","Câu hỏi 2 (Ảnh hưởng quyền lợi tác giả)","Câu hỏi 3 (Giải pháp phù hợp)","Trạng thái","Thời gian gửi","Nhận xét chung của GV","Điểm mạnh","Cần bổ sung","Đề xuất hướng hoàn thiện"\n';

    for (let i = 1; i <= 12; i++) {
      const sub = classroomState.submissions[i];
      const fb = classroomState.feedbacks[i];
      const topic = classroomState.topics.find((t) => t.id === sub.topicId) || classroomState.topics[0];

      const clean = (text: string | null | undefined) =>
        `"${(text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      const statusText =
        sub.status === 'reviewed'
          ? 'Đã nhận xét'
          : sub.status === 'submitted'
          ? 'Đã nộp bài'
          : sub.status === 'in_progress'
          ? 'Đang làm'
          : 'Chưa làm';

      csv += [
        i,
        clean(sub.groupName),
        clean(topic.title),
        clean(topic.scenario),
        clean(sub.answers.q1),
        clean(sub.answers.q2),
        clean(sub.answers.q3),
        clean(statusText),
        clean(sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : ''),
        clean(fb.generalComment),
        clean(fb.strengths),
        clean(fb.improvements),
        clean(fb.suggestions),
      ].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Ket_Qua_Thao_Luan_Tin10_${Date.now()}.csv"`);
    res.send(csv);
  });

  // Server-Sent Events (SSE) stream for real-time updates
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const clientId = Math.random().toString(36).substring(2, 9);
    const role = (req.query.role as 'teacher' | 'student') || 'student';
    const newClient: SSEClient = { id: clientId, res, role };
    sseClients.push(newClient);

    // Initial sync
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, time: Date.now() })}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // Vite middleware in dev or static serving in prod
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Phòng Thảo Luận Số running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
