export interface Topic {
  id: number;
  title: string;
  scenario: string;
  assignedGroups: number[];
  color: string;
  badgeBg: string;
  borderColor: string;
  iconName: 'software' | 'image' | 'music' | 'license';
}

export interface Question {
  id: 'q1' | 'q2' | 'q3';
  title: string;
  description: string;
  placeholder: string;
  guideline: string;
}

export interface GroupSubmission {
  groupId: number;
  groupName: string;
  topicId: number;
  members?: string;
  answers: {
    q1: string;
    q2: string;
    q3: string;
  };
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed';
  submittedAt: string | null;
  updatedAt: string | null;
  lastClientIp?: string;
}

export interface TeacherFeedback {
  groupId: number;
  generalComment: string;
  strengths: string;
  improvements: string;
  suggestions: string;
  isReviewed: boolean;
  reviewedAt: string | null;
  reviewedBy: string;
}

export interface SessionConfig {
  classId: string;
  className: string;
  subject: string;
  schoolName: string;
  teacherName: string;
  topicTitle: string;
  isOpen: boolean;
  allowEditing: boolean;
  teacherPin: string;
  updatedAt: string;
}

export interface ClassroomState {
  config: SessionConfig;
  topics: Topic[];
  questions: Question[];
  submissions: Record<number, GroupSubmission>;
  feedbacks: Record<number, TeacherFeedback>;
}
