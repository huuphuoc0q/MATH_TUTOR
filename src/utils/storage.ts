import {
  SAMPLE_HOMEWORK_ITEMS,
  SAMPLE_KNOWLEDGE_BASE,
  SAMPLE_QUIZ_QUESTIONS,
} from '../data/sampleData';
import { WorkspaceState } from '../types';

const STORAGE_KEY = 'eduworkspace_pro_state_v1';

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    version: 1,
    lessonTitle: 'Ôn tập Toán Tổng hợp · Chuyên đề Trọng tâm',
    theme: 'light',
    activeTab: 'scratchpad',
    timer: {
      mode: 'stopwatch',
      isRunning: false,
      stopwatchSeconds: 0,
      countdownTotalSeconds: 15 * 60,
      countdownRemainingSeconds: 15 * 60,
      totalSessionSeconds: 0,
    },
    knowledgeBase: SAMPLE_KNOWLEDGE_BASE.map((item) => ({ ...item })),
    quizQuestions: SAMPLE_QUIZ_QUESTIONS.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : undefined,
    })),
    quizAnswers: {},
    currentQuestionIndex: 0,
    scratchpadBg: 'oxy',
    mainStrokes: [],
    quickStrokes: [],
    sessionNotes: {
      studentName: 'Minh Anh',
      teacherComment:
        'Em tập trung tốt, nắm chắc các công thức cơ bản và chủ động hỏi lại những bước biến đổi chưa rõ.',
      homework:
        'Ôn lại các công thức được đánh dấu cần ôn và hoàn thành đầy đủ bộ bài tập về nhà bên dưới.',
      homeworkItems: SAMPLE_HOMEWORK_ITEMS.map((item) => ({ ...item })),
    },
  };
}

export function loadWorkspaceState(): WorkspaceState {
  const defaults = createDefaultWorkspaceState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;

    return {
      ...defaults,
      ...parsed,
      timer: {
        ...defaults.timer,
        ...(parsed.timer ?? {}),
        isRunning: false,
      },
      knowledgeBase: Array.isArray(parsed.knowledgeBase)
        ? parsed.knowledgeBase
        : defaults.knowledgeBase,
      quizQuestions: Array.isArray(parsed.quizQuestions)
        ? parsed.quizQuestions
        : defaults.quizQuestions,
      quizAnswers:
        parsed.quizAnswers && typeof parsed.quizAnswers === 'object'
          ? parsed.quizAnswers
          : defaults.quizAnswers,
      mainStrokes: Array.isArray(parsed.mainStrokes) ? parsed.mainStrokes : [],
      quickStrokes: Array.isArray(parsed.quickStrokes) ? parsed.quickStrokes : [],
      sessionNotes: {
        ...defaults.sessionNotes,
        ...(parsed.sessionNotes ?? {}),
        homeworkItems: Array.isArray(parsed.sessionNotes?.homeworkItems)
          ? parsed.sessionNotes.homeworkItems
          : defaults.sessionNotes.homeworkItems,
      },
    };
  } catch {
    return defaults;
  }
}

export function saveWorkspaceState(state: WorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function exportWorkspaceBackup(state: WorkspaceState): void {
  const payload = {
    app: 'EduWorkspace Pro',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `eduworkspace-backup-${dateStamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseWorkspaceBackup(rawJson: string): {
  ok: true;
  state: WorkspaceState;
} | {
  ok: false;
  error: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    const candidate = parsed?.data ? parsed.data : parsed;
    if (!candidate || typeof candidate !== 'object') {
      return { ok: false, error: 'Tệp sao lưu không hợp lệ.' };
    }
    if (
      !Array.isArray(candidate.knowledgeBase) ||
      !Array.isArray(candidate.quizQuestions)
    ) {
      return {
        ok: false,
        error:
          'Thiếu dữ liệu kho kiến thức (knowledgeBase) hoặc ngân hàng câu hỏi (quizQuestions).',
      };
    }

    const defaults = createDefaultWorkspaceState();
    return {
      ok: true,
      state: {
        ...defaults,
        ...candidate,
        timer: {
          ...defaults.timer,
          ...(candidate.timer ?? {}),
          isRunning: false,
        },
        sessionNotes: {
          ...defaults.sessionNotes,
          ...(candidate.sessionNotes ?? {}),
          homeworkItems: Array.isArray(candidate.sessionNotes?.homeworkItems)
            ? candidate.sessionNotes.homeworkItems
            : defaults.sessionNotes.homeworkItems,
        },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `Lỗi cú pháp JSON: ${err instanceof Error ? err.message : 'Không thể phân tích tệp.'}`,
    };
  }
}
