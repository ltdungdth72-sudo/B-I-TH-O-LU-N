import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createInitialState } from './src/defaultData.js';
import { ClassroomState } from './src/types.js';
import { getSupabase, isSupabaseConnected, testSupabaseConnection } from './src/lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'session.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

// Sync from Supabase on startup if configured
async function syncFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    console.log('[Supabase] Attempting initial data sync from Supabase...');
    const { data: configData } = await supabase.from('classroom_config').select('*').limit(1).single();
    if (configData) {
      classroomState.config = {
        ...classroomState.config,
        className: configData.class_name || classroomState.config.className,
        teacherName: configData.teacher_name || classroomState.config.teacherName,
        schoolName: configData.school_name || classroomState.config.schoolName,
        subject: configData.subject || classroomState.config.subject,
        topicTitle: configData.topic_title || classroomState.config.topicTitle,
        isOpen: configData.is_open ?? classroomState.config.isOpen,
        allowEditing: configData.allow_editing ?? classroomState.config.allowEditing,
        teacherPin: configData.teacher_pin || classroomState.config.teacherPin,
      };
    }

    const { data: subs } = await supabase.from('group_submissions').select('*');
    if (subs && subs.length > 0) {
      subs.forEach((row: any) => {
        const gId = Number(row.group_id);
        if (gId >= 1 && gId <= 12 && classroomState.submissions[gId]) {
          classroomState.submissions[gId] = {
            groupId: gId,
            groupName: row.group_name || `Nhóm ${gId}`,
            topicId: row.topic_id || classroomState.submissions[gId].topicId,
            members: row.members || '',
            answers: {
              q1: row.answer_q1 || '',
              q2: row.answer_q2 || '',
              q3: row.answer_q3 || '',
            },
            status: row.status || 'not_started',
            submittedAt: row.submitted_at || null,
            updatedAt: row.updated_at || null,
          };
        }
      });
    }

    const { data: fbs } = await supabase.from('teacher_feedbacks').select('*');
    if (fbs && fbs.length > 0) {
      fbs.forEach((row: any) => {
        const gId = Number(row.group_id);
        if (gId >= 1 && gId <= 12 && classroomState.feedbacks[gId]) {
          classroomState.feedbacks[gId] = {
            groupId: gId,
            generalComment: row.general_comment || '',
            strengths: row.strengths || '',
            improvements: row.improvements || '',
            suggestions: row.suggestions || '',
            isReviewed: Boolean(row.is_reviewed),
            reviewedAt: row.reviewed_at || null,
            reviewedBy: row.reviewed_by || 'Cô Lê Thị Dung',
          };
        }
      });
    }

    saveState(classroomState);
    console.log('[Supabase] Initial data sync complete!');
  } catch (err) {
    console.warn('[Supabase] Startup sync notice (tables may not exist yet):', err);
  }
}

// Background async writer to Supabase
async function writeSubmissionToSupabase(sub: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('group_submissions').upsert({
      group_id: sub.groupId,
      group_name: sub.groupName,
      topic_id: sub.topicId,
      members: sub.members || '',
      answer_q1: sub.answers?.q1 || '',
      answer_q2: sub.answers?.q2 || '',
      answer_q3: sub.answers?.q3 || '',
      status: sub.status,
      submitted_at: sub.submittedAt,
      updated_at: sub.updatedAt,
    });
    if (error) {
      console.warn('[Supabase] Error writing submission:', error);
    } else {
      console.log(`[Supabase] Synced submission for Group ${sub.groupId} (${sub.status})`);
    }
  } catch (e) {
    console.warn('[Supabase] Failed to write submission:', e);
  }
}

async function writeFeedbackToSupabase(fb: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('teacher_feedbacks').upsert({
      group_id: fb.groupId,
      general_comment: fb.generalComment,
      strengths: fb.strengths,
      improvements: fb.improvements,
      suggestions: fb.suggestions,
      is_reviewed: fb.isReviewed,
      reviewed_at: fb.reviewedAt,
      reviewed_by: fb.reviewedBy,
    });
  } catch (e) {
    console.warn('[Supabase] Failed to write feedback:', e);
  }
}

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
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      // client may be closed
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Run startup sync
  syncFromSupabase().catch(() => {});

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      supabase: isSupabaseConnected() ? 'connected' : 'offline_mode',
      time: new Date().toISOString(),
    });
  });

  // Supabase Connection status & testing
  app.get('/api/supabase/status', async (_req, res) => {
    const hasConfig = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
    let message = 'Chưa cấu hình Supabase URL hoặc API Key.';
    let connected = false;

    if (hasConfig) {
      const test = await testSupabaseConnection();
      connected = test.success;
      message = test.message;
    }

    res.json({
      configured: hasConfig,
      connected,
      url: process.env.SUPABASE_URL || null,
      message,
    });
  });

  // Helper to verify teacher PIN (accepts configured pin, 123456, or fallback)
  const checkTeacherAuth = (pin?: any) => {
    return pin === '123456' || pin === classroomState.config.teacherPin || pin === 'thpt-dth-2026';
  };

  // Supabase Configuration from UI
  app.post('/api/supabase/config', async (req: Request, res: Response) => {
    const authHeader = req.headers['x-teacher-auth'];
    if (!checkTeacherAuth(authHeader)) {
      return res.status(401).json({ error: 'Yêu cầu quyền giáo viên' });
    }

    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'Vui lòng cung cấp cả URL và API Key của Supabase.' });
    }

    const test = await testSupabaseConnection(url.trim(), key.trim());
    if (!test.success) {
      return res.status(400).json({ error: test.message });
    }

    const cleanUrl = test.normalizedUrl || url.trim();
    const cleanKey = key.trim().replace(/^['"]|['"]$/g, '');

    // Update in-memory process.env
    process.env.SUPABASE_URL = cleanUrl;
    process.env.SUPABASE_ANON_KEY = cleanKey;

    // Append / update .env file
    try {
      const envPath = path.join(__dirname, '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
      if (!envContent.includes('SUPABASE_URL=')) {
        envContent += `\nSUPABASE_URL="${cleanUrl}"\nSUPABASE_ANON_KEY="${cleanKey}"\n`;
      } else {
        envContent = envContent.replace(/SUPABASE_URL=.*/, `SUPABASE_URL="${cleanUrl}"`);
        envContent = envContent.replace(/SUPABASE_ANON_KEY=.*/, `SUPABASE_ANON_KEY="${cleanKey}"`);
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    } catch (err) {
      console.warn('Could not write to .env:', err);
    }

    // Trigger sync
    syncFromSupabase();

    return res.json({
      success: true,
      normalizedUrl: cleanUrl,
      message: test.message,
    });
  });

  // Get full classroom state
  app.get('/api/session', (req: Request, res: Response) => {
    const isTeacher = checkTeacherAuth(req.headers['x-teacher-auth']);
    
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
        teacherPin: isTeacher ? classroomState.config.teacherPin : undefined,
      },
      topics: classroomState.topics,
      questions: classroomState.questions,
      submissions: responseSubmissions,
      feedbacks: responseFeedbacks,
      supabaseConnected: isSupabaseConnected(),
      serverTime: new Date().toISOString(),
    });
  });

  // Teacher authentication
  app.post('/api/auth/teacher', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (checkTeacherAuth(pin)) {
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
    writeSubmissionToSupabase(classroomState.submissions[gId]);

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
    writeSubmissionToSupabase(classroomState.submissions[gId]);

    return res.json({
      success: true,
      message: 'Đã gửi câu trả lời thành công!',
      submission: classroomState.submissions[gId],
    });
  });

  // Teacher feedback review
  app.post('/api/feedback', (req: Request, res: Response) => {
    const authHeader = req.headers['x-teacher-auth'];
    if (!checkTeacherAuth(authHeader)) {
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

    writeFeedbackToSupabase(classroomState.feedbacks[gId]);
    writeSubmissionToSupabase(classroomState.submissions[gId]);

    return res.json({
      success: true,
      feedback: classroomState.feedbacks[gId],
      submission: classroomState.submissions[gId],
    });
  });

  // Teacher session config & reset
  app.post('/api/session/config', async (req: Request, res: Response) => {
    const authHeader = req.headers['x-teacher-auth'];
    if (!checkTeacherAuth(authHeader)) {
      return res.status(401).json({ error: 'Yêu cầu quyền giáo viên' });
    }

    const { config, action, topics, questions } = req.body;

    if (action === 'reset_all') {
      classroomState = createInitialState();
      saveState(classroomState);
      broadcast('session_reset', classroomState);

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('group_submissions').update({
            members: '',
            answer_q1: '',
            answer_q2: '',
            answer_q3: '',
            status: 'not_started',
            submitted_at: null,
            updated_at: new Date().toISOString(),
          }).neq('group_id', 0);

          await supabase.from('teacher_feedbacks').update({
            general_comment: '',
            strengths: '',
            improvements: '',
            suggestions: '',
            is_reviewed: false,
            reviewed_at: null,
          }).neq('group_id', 0);
        } catch (e) {}
      }

      return res.json({ success: true, message: 'Đã đặt lại toàn bộ buổi học', state: classroomState });
    }

    if (action === 'reset_submissions') {
      const initial = createInitialState();
      classroomState.submissions = initial.submissions;
      classroomState.feedbacks = initial.feedbacks;
      saveState(classroomState);
      broadcast('session_reset', classroomState);

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('group_submissions').update({
            members: '',
            answer_q1: '',
            answer_q2: '',
            answer_q3: '',
            status: 'not_started',
            submitted_at: null,
            updated_at: new Date().toISOString(),
          }).neq('group_id', 0);

          await supabase.from('teacher_feedbacks').update({
            general_comment: '',
            strengths: '',
            improvements: '',
            suggestions: '',
            is_reviewed: false,
            reviewed_at: null,
          }).neq('group_id', 0);
        } catch (e) {}
      }

      return res.json({ success: true, message: 'Đã xóa toàn bộ bài nộp của các nhóm', state: classroomState });
    }

    if (config) {
      classroomState.config = {
        ...classroomState.config,
        ...config,
        updatedAt: new Date().toISOString(),
      };

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('classroom_config').upsert({
            id: 'current_session',
            class_name: classroomState.config.className,
            teacher_name: classroomState.config.teacherName,
            school_name: classroomState.config.schoolName,
            subject: classroomState.config.subject,
            topic_title: classroomState.config.topicTitle,
            is_open: classroomState.config.isOpen,
            allow_editing: classroomState.config.allowEditing,
            teacher_pin: classroomState.config.teacherPin,
            updated_at: classroomState.config.updatedAt,
          });
        } catch (e) {}
      }
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
    let csv = '\uFEFF';
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
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Content-Encoding', 'none');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const clientId = Math.random().toString(36).substring(2, 9);
    const role = (req.query.role as 'teacher' | 'student') || 'student';
    const newClient: SSEClient = { id: clientId, res, role };
    sseClients.push(newClient);

    // Initial ping and event
    res.write(`: ping\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId, time: Date.now() })}\n\n`);

    // Keep-alive heartbeat every 15s to keep Cloud Run / reverse proxies alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

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
