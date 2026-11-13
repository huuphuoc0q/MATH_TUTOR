import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileJson,
  Lightbulb,
  PenTool,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { SAMPLE_QUIZ_JSON_TEMPLATE } from '../data/sampleData';
import {
  QuizAnswerRecord,
  QuizQuestion,
  QuizTrueFalseStatement,
  ScratchpadBackground,
  StrokeElement,
  ThemeMode,
} from '../types';
import { MathText } from '../utils/mathRenderer';
import { SmartScratchpad } from './SmartScratchpad';

interface QuizEngineProps {
  questions: QuizQuestion[];
  onQuestionsChange: (questions: QuizQuestion[]) => void;
  answers: Record<string, QuizAnswerRecord>;
  onAnswersChange: (answers: Record<string, QuizAnswerRecord>) => void;
  currentIndex: number;
  onCurrentIndexChange: (index: number) => void;
  quickStrokes: StrokeElement[];
  onQuickStrokesChange: (strokes: StrokeElement[]) => void;
  theme: ThemeMode;
  isActiveTab: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const getTrueFalseStatements = (
  question: QuizQuestion
): QuizTrueFalseStatement[] =>
  question.statements ??
  (typeof question.correctAnswer === 'boolean'
    ? [{ text: question.question, correctAnswer: question.correctAnswer }]
    : []);

export const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  onQuestionsChange,
  answers,
  onAnswersChange,
  currentIndex,
  onCurrentIndexChange,
  quickStrokes,
  onQuickStrokesChange,
  theme,
  isActiveTab,
}) => {
  // Right panel mode: 'solution' (Gợi ý & Lời giải) or 'scratchpad' (Nháp nhanh)
  const [rightPanelMode, setRightPanelMode] = useState<'solution' | 'scratchpad'>('solution');
  const [quickPadBg, setQuickPadBg] = useState<ScratchpadBackground>('grid');
  const [hintRevealedMap, setHintRevealedMap] = useState<Record<string, boolean>>({});
  const [shortAnswerInputs, setShortAnswerInputs] = useState<Record<string, string>>({});

  // JSON Importer Modal states
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, questions.length - 1));
  const currentQuestion = questions[safeIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentAnswerIsSubmitted =
    Boolean(currentAnswer) && currentAnswer?.isSubmitted !== false;
  const currentQuickStrokes = quickStrokes.filter(
    (stroke) => !stroke.questionId || stroke.questionId === currentQuestion?.id
  );
  const handleQuickStrokesChange = (nextStrokes: StrokeElement[]) => {
    if (!currentQuestion) {
      onQuickStrokesChange(nextStrokes);
      return;
    }

    const visibleIds = new Set(currentQuickStrokes.map((stroke) => stroke.id));
    const originalStrokes = new Map(
      quickStrokes.map((stroke) => [stroke.id, stroke])
    );
    const hiddenStrokes = quickStrokes.filter(
      (stroke) => !visibleIds.has(stroke.id)
    );
    const scopedStrokes = nextStrokes.map((stroke) => {
      const original = originalStrokes.get(stroke.id);
      return original
        ? { ...stroke, questionId: original.questionId }
        : { ...stroke, questionId: currentQuestion.id };
    });
    onQuickStrokesChange([...hiddenStrokes, ...scopedStrokes]);
  };
  const currentTrueFalseStatements = currentQuestion
    ? getTrueFalseStatements(currentQuestion)
    : [];

  const stats = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    for (const q of questions) {
      const rec = answers[q.id];
      if (rec && rec.isSubmitted !== false) {
        attempted += 1;
        if (rec.isCorrect) correct += 1;
      }
    }
    return { attempted, correct, total: questions.length };
  }, [questions, answers]);

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQuestion || currentAnswerIsSubmitted) return;

    const correctIndex =
      currentQuestion.type === 'true-false'
        ? currentQuestion.correctAnswer === true
          ? 0
          : 1
        : currentQuestion.correctIndex;
    const isCorrect = optionIdx === correctIndex;
    onAnswersChange({
      ...answers,
      [currentQuestion.id]: {
        selectedIndex: optionIdx,
        isSubmitted: true,
        isCorrect,
        revealedHint: Boolean(hintRevealedMap[currentQuestion.id]),
        answeredAt: Date.now(),
      },
    });
    // Ensure explanation panel is immediately visible horizontally next to the question
    setRightPanelMode('solution');
  };

  const handleSubmitShortAnswer = () => {
    if (!currentQuestion || currentAnswerIsSubmitted) return;
    const response = shortAnswerInputs[currentQuestion.id] ?? '';
    if (!response.trim()) return;

    const acceptedAnswers = [
      currentQuestion.correctAnswer,
      ...(currentQuestion.acceptedAnswers ?? []),
    ].filter((answer): answer is string => typeof answer === 'string');
    const normalizeAnswer = (answer: string) =>
      answer.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
    const normalizedResponse = normalizeAnswer(response);

    onAnswersChange({
      ...answers,
      [currentQuestion.id]: {
        response,
        isSubmitted: true,
        isCorrect: acceptedAnswers.some(
          (answer) => normalizeAnswer(answer) === normalizedResponse
        ),
        revealedHint: Boolean(hintRevealedMap[currentQuestion.id]),
        answeredAt: Date.now(),
      },
    });
    setRightPanelMode('solution');
  };

  const handleSelectTrueFalseStatement = (
    statementIndex: number,
    response: boolean
  ) => {
    if (!currentQuestion || currentAnswerIsSubmitted) return;
    const statementAnswers =
      currentAnswer?.statementAnswers?.length === currentTrueFalseStatements.length
        ? [...currentAnswer.statementAnswers]
        : currentTrueFalseStatements.map(() => null);
    statementAnswers[statementIndex] = response;
    onAnswersChange({
      ...answers,
      [currentQuestion.id]: {
        statementAnswers,
        isSubmitted: false,
        isCorrect: false,
        revealedHint: Boolean(hintRevealedMap[currentQuestion.id]),
        answeredAt: Date.now(),
      },
    });
  };

  const handleSubmitTrueFalse = () => {
    if (!currentQuestion || currentAnswerIsSubmitted) return;
    const statementAnswers = currentAnswer?.statementAnswers;
    if (
      !statementAnswers ||
      statementAnswers.length !== currentTrueFalseStatements.length ||
      statementAnswers.some((answer) => typeof answer !== 'boolean')
    ) {
      return;
    }

    const isCorrect = currentTrueFalseStatements.every(
      (statement, index) =>
        statementAnswers[index] === statement.correctAnswer
    );
    onAnswersChange({
      ...answers,
      [currentQuestion.id]: {
        ...currentAnswer,
        statementAnswers,
        isSubmitted: true,
        isCorrect,
        revealedHint: Boolean(hintRevealedMap[currentQuestion.id]),
        answeredAt: Date.now(),
      },
    });
    setRightPanelMode('solution');
  };

  const handleResetSingleQuestion = () => {
    if (!currentQuestion) return;
    const next = { ...answers };
    delete next[currentQuestion.id];
    onAnswersChange(next);
    setShortAnswerInputs((prev) => {
      const nextInputs = { ...prev };
      delete nextInputs[currentQuestion.id];
      return nextInputs;
    });
  };

  const handleResetAllQuiz = () => {
    onAnswersChange({});
    setHintRevealedMap({});
    setShortAnswerInputs({});
    onCurrentIndexChange(0);
  };

  const toggleHint = () => {
    if (!currentQuestion) return;
    const nextVal = !hintRevealedMap[currentQuestion.id];
    setHintRevealedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: nextVal,
    }));
    if (nextVal) {
      setRightPanelMode('solution');
    }
  };

  const validateQuizJson = (
    raw: string
  ): { ok: true; data: QuizQuestion[] } | { ok: false; error: string } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        ok: false,
        error: `Lỗi cú pháp JSON: ${err instanceof Error ? err.message : 'Kiểm tra dấu ngoặc kép, dấu phẩy hoặc dấu ngoặc vuông.'}`,
      };
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        ok: false,
        error: 'Cấu trúc JSON gốc phải là một mảng [...] gồm ít nhất 1 câu hỏi.',
      };
    }

    const validated: QuizQuestion[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i] as Record<string, unknown>;
      const num = i + 1;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return { ok: false, error: `Câu hỏi #${num}: Không phải là đối tượng JSON hợp lệ.` };
      }
      if (typeof item.question !== 'string' || !item.question.trim()) {
        return { ok: false, error: `Câu hỏi #${num}: Thiếu trường "question" dạng chuỗi.` };
      }

      const type =
        item.type === undefined ? 'multiple-choice' : item.type;
      if (
        type !== 'multiple-choice' &&
        type !== 'true-false' &&
        type !== 'short-answer'
      ) {
        return {
          ok: false,
          error: `Câu hỏi #${num}: "type" phải là "multiple-choice", "true-false" hoặc "short-answer".`,
        };
      }

      if (type === 'multiple-choice') {
        if (!Array.isArray(item.options) || item.options.length < 2) {
          return {
            ok: false,
            error: `Câu hỏi #${num}: Trường "options" phải là mảng có ít nhất 2 đáp án.`,
          };
        }
        if (item.options.some((opt) => typeof opt !== 'string' || !opt.trim())) {
          return {
            ok: false,
            error: `Câu hỏi #${num}: Tất cả đáp án trong "options" phải là chuỗi không rỗng.`,
          };
        }
        if (
          typeof item.correctIndex !== 'number' ||
          !Number.isInteger(item.correctIndex) ||
          item.correctIndex < 0 ||
          item.correctIndex >= item.options.length
        ) {
          return {
            ok: false,
            error: `Câu hỏi #${num}: "correctIndex" phải là số nguyên từ 0 đến ${item.options.length - 1}.`,
          };
        }
      } else if (type === 'true-false') {
        if (!Array.isArray(item.statements) || item.statements.length !== 4) {
          return {
            ok: false,
            error: `Câu hỏi #${num}: Dạng đúng/sai cần đúng 4 mệnh đề trong "statements".`,
          };
        }
        if (
          item.statements.some((statement) => {
            if (!statement || typeof statement !== 'object' || Array.isArray(statement)) {
              return true;
            }
            const row = statement as Record<string, unknown>;
            return (
              typeof row.text !== 'string' ||
              !row.text.trim() ||
              typeof row.correctAnswer !== 'boolean'
            );
          })
        ) {
          return {
            ok: false,
            error: `Câu hỏi #${num}: Mỗi mệnh đề cần có "text" dạng chuỗi và "correctAnswer" là true hoặc false.`,
          };
        }
      } else if (
        type === 'short-answer' &&
        (typeof item.correctAnswer !== 'string' || !item.correctAnswer.trim())
      ) {
        return {
          ok: false,
          error: `Câu hỏi #${num}: Dạng trả lời ngắn cần trường "correctAnswer" là chuỗi không rỗng.`,
        };
      }

      if (
        type === 'short-answer' &&
        item.acceptedAnswers !== undefined &&
        (!Array.isArray(item.acceptedAnswers) ||
          item.acceptedAnswers.some(
            (answer) => typeof answer !== 'string' || !answer.trim()
          ))
      ) {
        return {
          ok: false,
          error: `Câu hỏi #${num}: "acceptedAnswers" phải là mảng các chuỗi không rỗng.`,
        };
      }

      const question: QuizQuestion = {
        id:
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : `q-${Date.now()}-${i}`,
        topic: typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : 'Tổng hợp',
        difficulty:
          typeof item.difficulty === 'string' && item.difficulty.trim()
            ? item.difficulty.trim()
            : 'Thông hiểu',
        type,
        question: item.question.trim(),
        hint: typeof item.hint === 'string' ? item.hint.trim() : '',
        explanation:
          typeof item.explanation === 'string' && item.explanation.trim()
            ? item.explanation.trim()
            : 'Chưa có lời giải chi tiết cho câu hỏi này.',
      };

      if (type === 'multiple-choice') {
        question.options = (item.options as string[]).map((option) => option.trim());
        question.correctIndex = item.correctIndex as number;
      } else if (type === 'true-false') {
        question.statements = (item.statements as Record<string, unknown>[]).map(
          (row) => ({
            text: (row.text as string).trim(),
            correctAnswer: row.correctAnswer as boolean,
          })
        );
      } else {
        question.correctAnswer = (item.correctAnswer as string).trim();
        question.acceptedAnswers = Array.isArray(item.acceptedAnswers)
          ? item.acceptedAnswers.map((answer) => (answer as string).trim())
          : [];
      }
      validated.push(question);
    }

    return { ok: true, data: validated };
  };

  const handleValidateOnly = () => {
    const res = validateQuizJson(jsonText);
    if (res.ok) {
      setValidationError(null);
      setValidationSuccess(`Hợp lệ! Tìm thấy ${res.data.length} câu hỏi đúng chuẩn JSON.`);
    } else {
      setValidationSuccess(null);
      setValidationError(res.error);
    }
  };

  const handleImportQuestions = (mode: 'replace' | 'append') => {
    const res = validateQuizJson(jsonText);
    if (!res.ok) {
      setValidationSuccess(null);
      setValidationError(res.error);
      return;
    }

    if (mode === 'replace') {
      onQuestionsChange(res.data);
      onAnswersChange({});
      setShortAnswerInputs({});
      onCurrentIndexChange(0);
    } else {
      const existingIds = new Set(questions.map((q) => q.id));
      const deduped = res.data.map((q, idx) =>
        existingIds.has(q.id) ? { ...q, id: `${q.id}-${Date.now()}-${idx}` } : q
      );
      onQuestionsChange([...questions, ...deduped]);
    }
    setIsImporterOpen(false);
    setJsonText('');
    setValidationError(null);
    setValidationSuccess(null);
  };

  const handleCopySampleTemplate = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_QUIZ_JSON_TEMPLATE);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2000);
    } catch {
      setJsonText(SAMPLE_QUIZ_JSON_TEMPLATE);
    }
  };

  const isHintVisible = currentQuestion
    ? Boolean(hintRevealedMap[currentQuestion.id])
    : false;
  const currentQuestionType = currentQuestion?.type ?? 'multiple-choice';
  const currentOptions =
    currentQuestionType === 'true-false'
      ? ['Đúng', 'Sai']
      : currentQuestion?.options ?? [];
  const correctOptionIndex =
    currentQuestionType === 'true-false'
      ? currentQuestion?.correctAnswer === true
        ? 0
        : 1
      : currentQuestion?.correctIndex ?? -1;
  const correctAnswerText =
    currentQuestionType === 'short-answer'
      ? String(currentQuestion?.correctAnswer ?? '')
      : currentQuestionType === 'true-false'
        ? 'các mệnh đề được đánh dấu trong bảng'
        : OPTION_LETTERS[correctOptionIndex] ?? String(correctOptionIndex + 1);
  const currentTrueFalseSelections = currentAnswer?.statementAnswers ?? [];
  const canSubmitTrueFalse =
    currentTrueFalseStatements.length > 0 &&
    currentTrueFalseSelections.length === currentTrueFalseStatements.length &&
    currentTrueFalseSelections.every((answer) => typeof answer === 'boolean');

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Question Navigator Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {questions.map((q, idx) => {
            const rec = answers[q.id];
            const isCurrent = idx === safeIndex;
            const isSubmitted = Boolean(rec && rec.isSubmitted !== false);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onCurrentIndexChange(idx)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  isCurrent
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : isSubmitted
                      ? rec.isCorrect
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isSubmitted && rec && !isCurrent && (
                  rec.isCorrect ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )
                )}
                <span>Câu {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 tabular-nums mr-1">
            Đã làm {stats.attempted}/{stats.total} · Đúng {stats.correct}
          </span>

          <button
            type="button"
            onClick={() =>
              setRightPanelMode((prev) =>
                prev === 'scratchpad' ? 'solution' : 'scratchpad'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
              rightPanelMode === 'scratchpad'
                ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>
              {rightPanelMode === 'scratchpad' ? 'Xem lời giải' : 'Mở nháp nhanh'}
            </span>
          </button>

          {stats.attempted > 0 && (
            <button
              type="button"
              onClick={handleResetAllQuiz}
              title="Làm lại toàn bộ bài tập"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              setValidationSuccess(null);
              setIsImporterOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Nhập câu hỏi (JSON)</span>
          </button>
        </div>
      </div>

      {/* Main Horizontal Side-by-Side Stage: Question (Left) | Explanation or Scratchpad (Right) */}
      {!currentQuestion ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <FileJson className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-1">
              Chưa có câu hỏi luyện tập
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Hãy nhấn "Nhập câu hỏi (JSON)" để tải lên bộ đề luyện tập mới.
            </p>
            <button
              type="button"
              onClick={() => setIsImporterOpen(true)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium"
            >
              Nhập câu hỏi (JSON)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT PANE: Question & Options (Independent scroll, never pushed away) */}
          <div className="w-full md:w-[54%] h-1/2 md:h-full overflow-y-auto p-4 lg:p-6 flex flex-col justify-between gap-5 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 lg:p-7">
              {/* Unboxed Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                    Câu {safeIndex + 1} / {questions.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{currentQuestion.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span>Mức độ: {currentQuestion.difficulty}</span>
                </div>

                {currentQuestion.hint && (
                  <button
                    type="button"
                    onClick={toggleHint}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      isHintVisible
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{isHintVisible ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>
                  </button>
                )}
              </div>

              {/* Large Screen-Share Question Text */}
              <div className="text-lg lg:text-xl font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
                <MathText text={currentQuestion.question} />
              </div>

              {/* Answer Options */}
              {currentQuestionType === 'true-false' ? (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th className="border-b border-r border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-semibold">
                            Mệnh đề
                          </th>
                          <th className="w-24 border-b border-r border-slate-300 dark:border-slate-700 px-2 py-2 text-center font-semibold">
                            Đúng
                          </th>
                          <th className="w-24 border-b border-slate-300 dark:border-slate-700 px-2 py-2 text-center font-semibold">
                            Sai
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTrueFalseStatements.map((statement, idx) => (
                          <tr
                            key={idx}
                            className="border-b last:border-b-0 border-slate-200 dark:border-slate-700"
                          >
                            <td className="border-r border-slate-200 dark:border-slate-700 px-3 py-3 leading-relaxed">
                              <span className="mr-2 font-semibold">
                                {String.fromCharCode(97 + idx)})
                              </span>
                              <MathText text={statement.text} />
                            </td>
                            {[true, false].map((choice) => {
                              const selected =
                                currentTrueFalseSelections[idx] === choice;
                              const isCorrectChoice =
                                statement.correctAnswer === choice;
                              const choiceStyle = currentAnswerIsSubmitted
                                ? isCorrectChoice
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                                  : selected
                                    ? 'border-red-500 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200'
                                    : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                                : selected
                                  ? 'border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-200'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-sky-950/30';
                              return (
                                <td
                                  key={String(choice)}
                                  className="border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-2 py-2 text-center"
                                >
                                  <button
                                    type="button"
                                    aria-label={`Mệnh đề ${String.fromCharCode(97 + idx)}: ${choice ? 'Đúng' : 'Sai'}`}
                                    aria-pressed={selected}
                                    disabled={currentAnswerIsSubmitted}
                                    onClick={() =>
                                      handleSelectTrueFalseStatement(idx, choice)
                                    }
                                    className={`w-full rounded-md border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-default ${choiceStyle}`}
                                  >
                                    {choice ? 'Đúng' : 'Sai'}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Đã chọn {currentTrueFalseSelections.filter((answer) => typeof answer === 'boolean').length}/{currentTrueFalseStatements.length} mệnh đề
                    </span>
                    <button
                      type="button"
                      disabled={!canSubmitTrueFalse || currentAnswerIsSubmitted}
                      onClick={handleSubmitTrueFalse}
                      className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium"
                    >
                      {currentAnswerIsSubmitted ? 'Đã chấm' : 'Chấm câu'}
                    </button>
                  </div>
                </div>
              ) : currentQuestionType === 'short-answer' ? (
                <form
                  className="flex flex-col sm:flex-row gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmitShortAnswer();
                  }}
                >
                  <input
                    type="text"
                    value={
                      currentAnswer?.response ??
                      shortAnswerInputs[currentQuestion.id] ??
                      ''
                    }
                    onChange={(event) =>
                      setShortAnswerInputs((prev) => ({
                        ...prev,
                        [currentQuestion.id]: event.target.value,
                      }))
                    }
                    disabled={currentAnswerIsSubmitted}
                    aria-label="Câu trả lời ngắn"
                    placeholder="Nhập câu trả lời..."
                    className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-70"
                  />
                  <button
                    type="submit"
                    disabled={currentAnswerIsSubmitted || !(shortAnswerInputs[currentQuestion.id] ?? '').trim()}
                    className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium"
                  >
                    Trả lời
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentOptions.map((optText, idx) => {
                    const isAnswered = currentAnswerIsSubmitted;
                    const isSelected = currentAnswer?.selectedIndex === idx;
                    const isTrueOption = idx === correctOptionIndex;

                    let cardStyle =
                      'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 text-slate-800 dark:text-slate-100';
                    let stateTag: React.ReactNode = null;

                    if (isAnswered) {
                      if (isTrueOption) {
                        cardStyle =
                          'border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
                        stateTag = (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đúng</span>
                          </span>
                        );
                      } else if (isSelected && !isTrueOption) {
                        cardStyle =
                          'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100';
                        stateTag = (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">
                            <XCircle className="w-4 h-4" />
                            <span>Sai</span>
                          </span>
                        );
                      } else {
                        cardStyle =
                          'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 opacity-75';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(idx)}
                        className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${cardStyle} ${
                          isAnswered ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isAnswered && isTrueOption
                                ? 'bg-emerald-600 text-white'
                                : isAnswered && isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {OPTION_LETTERS[idx] ?? idx + 1}
                          </span>
                          <span className="text-base leading-relaxed break-words">
                            <MathText text={optText} />
                          </span>
                        </div>
                        {stateTag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prev / Next Footer */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => onCurrentIndexChange(safeIndex - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-sm font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                type="button"
                disabled={safeIndex >= questions.length - 1}
                onClick={() => onCurrentIndexChange(safeIndex + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-medium transition-colors"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Horizontal Companion Panel (Hint & Step-by-step Explanation | Quick Scratchpad) */}
          <div className="w-full md:w-[46%] h-1/2 md:h-full flex flex-col bg-white dark:bg-slate-900/70 overflow-hidden">
            {/* Horizontal Pane Switcher Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setRightPanelMode('solution')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    rightPanelMode === 'solution'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  <span>Gợi ý & Lời giải</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelMode('scratchpad')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    rightPanelMode === 'scratchpad'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Bảng nháp nhanh</span>
                </button>
              </div>

              {currentAnswer && rightPanelMode === 'solution' && (
                <button
                  type="button"
                  onClick={handleResetSingleQuestion}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại câu này</span>
                </button>
              )}
            </div>

            {rightPanelMode === 'scratchpad' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <SmartScratchpad
                  key={currentQuestion?.id ?? 'no-question'}
                  strokes={currentQuickStrokes}
                  onStrokesChange={handleQuickStrokesChange}
                  background={quickPadBg}
                  onBackgroundChange={setQuickPadBg}
                  theme={theme}
                  compact={true}
                  isActive={isActiveTab && rightPanelMode === 'scratchpad'}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">
                {/* Hint Block */}
                {isHintVisible && currentQuestion.hint && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
                    <div className="font-semibold mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Gợi ý phương pháp giải</span>
                    </div>
                    <div className="leading-relaxed">
                      <MathText text={currentQuestion.hint} />
                    </div>
                  </div>
                )}

                {/* Solution Block when answered */}
                {currentAnswerIsSubmitted && currentAnswer ? (
                  <div className="space-y-4">
                    <div
                      className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
                        currentAnswer.isCorrect
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                          : 'border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {currentAnswer.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-display font-semibold text-sm">
                            {currentAnswer.isCorrect
                              ? 'Chính xác! Học sinh đã chọn đúng đáp án.'
                              : `Chưa chính xác · Đáp án đúng là ${correctAnswerText}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-2.5">
                        Lời giải chi tiết từng bước
                      </h4>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5 text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed">
                        <MathText text={currentQuestion.explanation} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center space-y-3 my-auto">
                    <BookOpenCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
                        Khung lời giải chi tiết song song
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Chọn đáp án ở khung bên trái để hệ thống chấm điểm và hiển thị lời giải từng bước ngay tại đây mà không che khuất đề bài.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {currentQuestion.hint && !isHintVisible && (
                        <button
                          type="button"
                          onClick={toggleHint}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Xem gợi ý</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRightPanelMode('scratchpad')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <PenTool className="w-3.5 h-3.5 text-sky-500" />
                        <span>Mở bảng nháp nhanh</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JSON Quiz Importer Modal */}
      {isImporterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                  Trình nhập câu hỏi luyện tập (JSON)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hỗ trợ trắc nghiệm, câu đúng/sai gồm 4 mệnh đề và trả lời ngắn. Dán mảng JSON có thể chứa LaTeX ($...$, $$...$$); hệ thống sẽ kiểm tra cú pháp trước khi nhập.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImporterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Trình soạn thảo JSON
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySampleTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-sky-700 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedSample ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedSample ? 'Đã sao chép mẫu' : 'Sao chép cấu trúc JSON mẫu'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(SAMPLE_QUIZ_JSON_TEMPLATE);
                    setValidationError(null);
                    setValidationSuccess(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Chèn mẫu vào khung
                </button>
              </div>
            </div>

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setValidationError(null);
                setValidationSuccess(null);
              }}
              placeholder={SAMPLE_QUIZ_JSON_TEMPLATE}
              spellCheck={false}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 mb-3 leading-relaxed"
            />

            {validationError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {validationSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationSuccess}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleValidateOnly}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Kiểm tra cú pháp
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImporterOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleImportQuestions('append')}
                  className="px-3.5 py-2 rounded-lg border border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-medium"
                >
                  Thêm vào bộ hiện tại
                </button>
                <button
                  type="button"
                  onClick={() => handleImportQuestions('replace')}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
                >
                  Thay thế bộ câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
