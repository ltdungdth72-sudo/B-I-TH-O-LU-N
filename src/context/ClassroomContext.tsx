import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ClassroomState, GroupSubmission, TeacherFeedback } from '../types';
import { createInitialState } from '../defaultData';
import { soundManager } from '../utils/sound';

interface ClassroomContextType {
  state: ClassroomState;
  loading: boolean;
  connected: boolean;
  role: 'welcome' | 'student' | 'teacher';
  selectedGroupId: number | null;
  teacherPin: string | null;
  isTeacherAuthenticated: boolean;
  soundEnabled: boolean;
  newSubmissionAlert: number | null;
  lastSyncedAt: Date | null;
  setRole: (role: 'welcome' | 'student' | 'teacher') => void;
  setSelectedGroupId: (id: number | null) => void;
  toggleSound: () => void;
  loginTeacher: (pin: string) => Promise<boolean>;
  logoutTeacher: () => void;
  submitAnswers: (
    groupId: number,
    answers: { q1: string; q2: string; q3: string },
    members?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  saveDraft: (
    groupId: number,
    answers: { q1: string; q2: string; q3: string },
    members?: string
  ) => Promise<{ success: boolean; submission?: any; error?: string }>;
  saveFeedback: (groupId: number, feedback: Partial<TeacherFeedback>) => Promise<boolean>;
  updateConfig: (config?: any, action?: string) => Promise<boolean>;
  dismissNewAlert: () => void;
  refreshState: () => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClassroomState>(createInitialState);
  const [loading, setLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [role, setRoleState] = useState<'welcome' | 'student' | 'teacher'>('welcome');
  const [selectedGroupId, setSelectedGroupIdState] = useState<number | null>(null);
  const [teacherPin, setTeacherPin] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [newSubmissionAlert, setNewSubmissionAlert] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Restore saved role and group selection from localStorage or URL hash
  useEffect(() => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const urlGroup = searchParams.get('group');
    const urlRole = searchParams.get('role');

    if (urlRole === 'teacher' || hash === '#teacher') {
      setRoleState('teacher');
    } else if (urlRole === 'student' || hash === '#student') {
      setRoleState('student');
    }

    if (urlGroup) {
      const gNum = parseInt(urlGroup, 10);
      if (gNum >= 1 && gNum <= 12) {
        setSelectedGroupIdState(gNum);
        setRoleState('student');
      }
    } else {
      const savedGroup = localStorage.getItem('ptls_selected_group');
      if (savedGroup) {
        const gNum = parseInt(savedGroup, 10);
        if (gNum >= 1 && gNum <= 12) {
          setSelectedGroupIdState(gNum);
        }
      }
    }

    const savedPin = sessionStorage.getItem('ptls_teacher_pin');
    if (savedPin) {
      setTeacherPin(savedPin);
    }
  }, []);

  const setSelectedGroupId = (id: number | null) => {
    setSelectedGroupIdState(id);
    if (id !== null) {
      localStorage.setItem('ptls_selected_group', String(id));
    } else {
      localStorage.removeItem('ptls_selected_group');
    }
  };

  const setRole = (newRole: 'welcome' | 'student' | 'teacher') => {
    setRoleState(newRole);
    if (newRole === 'welcome') {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.history.replaceState(null, '', `?role=${newRole}`);
    }
  };

  const toggleSound = () => {
    const updated = soundManager.toggle();
    setSoundEnabled(updated);
  };

  const fetchSession = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (teacherPin) {
        headers['x-teacher-auth'] = teacherPin;
      }
      const res = await fetch('/api/session', { headers });
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setLastSyncedAt(new Date());
        setConnected(true);
      }
    } catch (err) {
      console.warn('Network sync error:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherPin]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setConnected(true);
      fetchSession();
    };
    const handleOffline = () => {
      setConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchSession]);

  // Server-Sent Events setup with resilient heartbeat
  useEffect(() => {
    let sse: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        sse = new EventSource('/api/events');

        sse.onopen = () => {
          setConnected(true);
        };

        sse.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            setConnected(true);

            if (payload.type === 'submission_received') {
              const { groupId, submission } = payload.payload;
              setState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  submissions: {
                    ...prev.submissions,
                    [groupId]: submission,
                  },
                };
              });
              setNewSubmissionAlert(groupId);
              soundManager.playNewSubmissionPing();
            } else if (payload.type === 'draft_updated') {
              const { groupId, submission } = payload.payload;
              setState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  submissions: {
                    ...prev.submissions,
                    [groupId]: submission,
                  },
                };
              });
            } else if (payload.type === 'feedback_updated') {
              const { groupId, feedback, submission } = payload.payload;
              setState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  feedbacks: {
                    ...prev.feedbacks,
                    [groupId]: feedback,
                  },
                  submissions: {
                    ...prev.submissions,
                    [groupId]: submission,
                  },
                };
              });
              soundManager.playReviewSavedChime();
            } else if (payload.type === 'config_updated' || payload.type === 'session_reset') {
              fetchSession();
            }
          } catch (err) {
            console.error('Error handling SSE message:', err);
          }
        };

        sse.onerror = () => {
          // If SSE drops, fall back to checking HTTP health instead of immediately showing offline
          if (sse) {
            sse.close();
          }
          fetch('/api/health')
            .then((r) => {
              if (r.ok) {
                setConnected(true);
              } else {
                setConnected(false);
              }
            })
            .catch(() => setConnected(false));

          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        setConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    // Fallback polling every 5s
    const pollInterval = setInterval(() => {
      fetchSession();
    }, 5000);

    return () => {
      if (sse) sse.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [fetchSession]);

  const loginTeacher = async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setTeacherPin(pin);
        sessionStorage.setItem('ptls_teacher_pin', pin);
        fetchSession();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logoutTeacher = () => {
    setTeacherPin(null);
    sessionStorage.removeItem('ptls_teacher_pin');
    setRole('welcome');
  };

  const submitAnswers = async (
    groupId: number,
    answers: { q1: string; q2: string; q3: string },
    members?: string
  ) => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, answers, members }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnected(true);
        setLastSyncedAt(new Date());
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            submissions: {
              ...prev.submissions,
              [groupId]: data.submission,
            },
          };
        });
        soundManager.playSuccessChime();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Có lỗi xảy ra khi nộp bài.' };
    } catch (err) {
      return {
        success: false,
        error: 'Mất kết nối với máy chủ. Bản nháp đã được lưu an toàn trên máy bạn.',
      };
    }
  };

  const saveDraft = async (
    groupId: number,
    answers: { q1: string; q2: string; q3: string },
    members?: string
  ): Promise<{ success: boolean; submission?: any; error?: string }> => {
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, answers, members }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.submission) {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              submissions: {
                ...prev.submissions,
                [groupId]: data.submission,
              },
            };
          });
        }
        setConnected(true);
        setLastSyncedAt(new Date());
        return { success: true, submission: data.submission };
      }
      return { success: false, error: data.error || 'Không thể lưu bản nháp lên máy chủ.' };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Không thể kết nối tới máy chủ.',
      };
    }
  };

  const saveFeedback = async (
    groupId: number,
    feedback: Partial<TeacherFeedback>
  ): Promise<boolean> => {
    if (!teacherPin) return false;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-auth': teacherPin,
        },
        body: JSON.stringify({ groupId, ...feedback }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            feedbacks: {
              ...prev.feedbacks,
              [groupId]: data.feedback,
            },
            submissions: {
              ...prev.submissions,
              [groupId]: data.submission,
            },
          };
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateConfig = async (config?: any, action?: string): Promise<boolean> => {
    if (!teacherPin) return false;
    try {
      const res = await fetch('/api/session/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-auth': teacherPin,
        },
        body: JSON.stringify({ config, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) {
          setState(data.state);
        } else {
          fetchSession();
        }
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const dismissNewAlert = () => {
    setNewSubmissionAlert(null);
  };

  return (
    <ClassroomContext.Provider
      value={{
        state,
        loading,
        connected,
        role,
        selectedGroupId,
        teacherPin,
        isTeacherAuthenticated: Boolean(teacherPin),
        soundEnabled,
        newSubmissionAlert,
        lastSyncedAt,
        setRole,
        setSelectedGroupId,
        toggleSound,
        loginTeacher,
        logoutTeacher,
        submitAnswers,
        saveDraft,
        saveFeedback,
        updateConfig,
        dismissNewAlert,
        refreshState: fetchSession,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
