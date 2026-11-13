export type TabId = 'scratchpad' | 'knowledge' | 'quiz' | 'summary';

export type ThemeMode = 'light' | 'dark';

export type TimerMode = 'stopwatch' | 'countdown';

export type MasteryStatus = 'unseen' | 'review' | 'mastered';

export type KnowledgeLevel = 'Cơ bản' | 'Nâng cao' | 'Trọng tâm thi';

export interface KnowledgeItem {
  id: string;
  topic: string;
  level: KnowledgeLevel;
  title: string;
  formula: string;
  example: string;
  notes: string;
  mastery: MasteryStatus;
}

export type QuizDifficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';

export type QuizQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer';

export interface QuizTrueFalseStatement {
  text: string;
  correctAnswer: boolean;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: QuizDifficulty | string;
  type?: QuizQuestionType;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string | boolean;
  acceptedAnswers?: string[];
  statements?: QuizTrueFalseStatement[];
  hint: string;
  explanation: string;
}

export interface QuizAnswerRecord {
  selectedIndex?: number;
  response?: string;
  statementAnswers?: (boolean | null)[];
  isSubmitted?: boolean;
  isCorrect: boolean;
  revealedHint: boolean;
  answeredAt: number;
}

export type ScratchpadBackground = 'plain' | 'grid' | 'dots' | 'oxy';

export type ScratchpadTool =
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'box-erase'
  | 'line'
  | 'dashed-line'
  | 'arrow'
  | 'image'
  | 'circle'
  | 'rect'
  | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeElement {
  id: string;
  tool: ScratchpadTool;
  color: string;
  width: number;
  points?: Point[];
  start?: Point;
  end?: Point;
  text?: string;
  imageData?: string;
  questionId?: string;
}

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  stopwatchSeconds: number;
  countdownTotalSeconds: number;
  countdownRemainingSeconds: number;
  totalSessionSeconds: number;
}

export interface HomeworkItem {
  id: string;
  topic: string;
  title: string;
  problem: string;
  requirement: string;
  difficulty: string;
  dueDate: string;
}

export interface SessionNotesState {
  studentName: string;
  teacherComment: string;
  homework: string;
  homeworkItems: HomeworkItem[];
}

export interface WorkspaceState {
  version: number;
  lessonTitle: string;
  theme: ThemeMode;
  activeTab: TabId;
  timer: TimerState;
  knowledgeBase: KnowledgeItem[];
  quizQuestions: QuizQuestion[];
  quizAnswers: Record<string, QuizAnswerRecord>;
  currentQuestionIndex: number;
  scratchpadBg: ScratchpadBackground;
  mainStrokes: StrokeElement[];
  quickStrokes: StrokeElement[];
  sessionNotes: SessionNotesState;
}
