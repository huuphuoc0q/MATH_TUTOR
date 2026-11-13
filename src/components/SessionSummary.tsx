import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileJson,
  Printer,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { SAMPLE_HOMEWORK_JSON_TEMPLATE } from '../data/sampleData';
import {
  HomeworkItem,
  KnowledgeItem,
  QuizAnswerRecord,
  QuizQuestion,
  SessionNotesState,
} from '../types';
import { MathText } from '../utils/mathRenderer';
import { SummaryPdfDocument } from './SummaryPdfDocument';
import { formatClock } from './TopBar';

interface SessionSummaryProps {
  lessonTitle: string;
  totalSessionSeconds: number;
  stopwatchSeconds: number;
  knowledgeBase: KnowledgeItem[];
  quizQuestions: QuizQuestion[];
  quizAnswers: Record<string, QuizAnswerRecord>;
  sessionNotes: SessionNotesState;
  onSessionNotesChange: (notes: SessionNotesState) => void;
  onResetSessionProgress: () => void;
  onNavigateToKnowledge: () => void;
  onNavigateToQuiz: (index: number) => void;
  includeAllKnowledgeInPdf: boolean;
  onIncludeAllKnowledgeInPdfChange: (val: boolean) => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  lessonTitle,
  totalSessionSeconds,
  stopwatchSeconds,
  knowledgeBase,
  quizQuestions,
  quizAnswers,
  sessionNotes,
  onSessionNotesChange,
  onResetSessionProgress,
  onNavigateToKnowledge,
  onNavigateToQuiz,
  includeAllKnowledgeInPdf,
  onIncludeAllKnowledgeInPdfChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmNewSession, setConfirmNewSession] = useState(false);

  // Homework JSON Modal
  const [isHomeworkJsonOpen, setIsHomeworkJsonOpen] = useState(false);
  const [hwJsonInput, setHwJsonInput] = useState('');
  const [hwJsonError, setHwJsonError] = useState<string | null>(null);
  const [hwJsonSuccess, setHwJsonSuccess] = useState<string | null>(null);
  const [copiedHwSample, setCopiedHwSample] = useState(false);

  // PDF Preview Modal
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  const effectiveSeconds = Math.max(totalSessionSeconds, stopwatchSeconds);
  const homeworkItems = sessionNotes.homeworkItems ?? [];

  const summaryData = useMemo(() => {
    const attemptedList = quizQuestions.filter((q) => {
      const answer = quizAnswers[q.id];
      return Boolean(answer) && answer.isSubmitted !== false;
    });
    const correctList = attemptedList.filter((q) => quizAnswers[q.id]?.isCorrect);
    const wrongList = attemptedList.filter((q) => !quizAnswers[q.id]?.isCorrect);

    const accuracy =
      attemptedList.length > 0
        ? Math.round((correctList.length / attemptedList.length) * 100)
        : 0;

    const reviewKnowledge = knowledgeBase.filter((k) => k.mastery === 'review');
    const masteredKnowledge = knowledgeBase.filter((k) => k.mastery === 'mastered');

    const practicedTopics = Array.from(
      new Set([
        ...attemptedList.map((q) => q.topic),
        ...masteredKnowledge.map((k) => k.topic),
      ])
    );

    return {
      attemptedCount: attemptedList.length,
      correctCount: correctList.length,
      wrongList,
      accuracy,
      reviewKnowledge,
      masteredKnowledge,
      practicedTopics,
    };
  }, [quizQuestions, quizAnswers, knowledgeBase]);

  const formattedDurationText = useMemo(() => {
    const mins = Math.floor(effectiveSeconds / 60);
    const secs = effectiveSeconds % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs > 0 ? `${secs} giây` : ''}`.trim();
  }, [effectiveSeconds]);

  const generatedReport = useMemo(() => {
    const today = new Date().toLocaleDateString('vi-VN');
    const student = sessionNotes.studentName.trim() || 'Học sinh';
    const topicsLine =
      summaryData.practicedTopics.length > 0
        ? summaryData.practicedTopics.join(', ')
        : 'Kiến thức trọng tâm theo giáo án';

    const quizLine =
      summaryData.attemptedCount > 0
        ? `${summaryData.correctCount}/${summaryData.attemptedCount} câu đúng (đạt ${summaryData.accuracy}%)`
        : 'Chưa thực hiện bài trắc nghiệm trên lớp';

    const reviewItems: string[] = [];
    summaryData.reviewKnowledge.forEach((k) => {
      reviewItems.push(`- Công thức: ${k.title} (${k.topic})`);
    });
    summaryData.wrongList.forEach((q) => {
      const idx = quizQuestions.findIndex((item) => item.id === q.id);
      reviewItems.push(`- Dạng bài Câu ${idx + 1} (${q.topic} - ${q.difficulty})`);
    });

    const reviewBlock =
      reviewItems.length > 0
        ? reviewItems.join('\n')
        : '- Không có nội dung tồn đọng; em đã nắm chắc các phần vừa luyện tập.';

    const hwListBlock =
      homeworkItems.length > 0
        ? homeworkItems
            .map(
              (hw, idx) =>
                `  + Bài ${idx + 1} (${hw.topic}): ${hw.title} — Hạn: ${hw.dueDate || 'Buổi tới'}`
            )
            .join('\n')
        : '';

    return [
      `BÁO CÁO TỔNG KẾT BUỔI HỌC (${today})`,
      `Buổi học: ${lessonTitle}`,
      `Học sinh: ${student}`,
      `Thời lượng học: ${formattedDurationText}`,
      ``,
      `1. KẾT QUẢ LUYỆN TẬP TRÊN LỚP`,
      `- Chuyên đề đã ôn: ${topicsLine}`,
      `- Trắc nghiệm tương tác: ${quizLine}`,
      `- Công thức đã nắm vững: ${summaryData.masteredKnowledge.length} thẻ kiến thức`,
      ``,
      `2. NỘI DUNG CẦN ÔN TẬP THÊM`,
      reviewBlock,
      ``,
      `3. NHẬN XÉT CỦA GIÁO VIÊN`,
      sessionNotes.teacherComment.trim() || 'Em có thái độ học tập tích cực trong buổi học.',
      ``,
      `4. BÀI TẬP VỀ NHÀ`,
      sessionNotes.homework.trim() || 'Hoàn thành bộ bài tập về nhà bên dưới.',
      hwListBlock,
    ]
      .filter(Boolean)
      .join('\n');
  }, [
    lessonTitle,
    sessionNotes,
    summaryData,
    formattedDurationText,
    quizQuestions,
    homeworkItems,
  ]);

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const area = document.createElement('textarea');
      area.value = generatedReport;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const validateHomeworkJson = (
    raw: string
  ): { ok: true; data: HomeworkItem[] } | { ok: false; error: string } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        ok: false,
        error: `Lỗi cú pháp JSON: ${err instanceof Error ? err.message : 'Kiểm tra lại dấu ngoặc và dấu phẩy.'}`,
      };
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        ok: false,
        error: 'Dữ liệu JSON phải là một mảng [...] gồm ít nhất 1 bài tập.',
      };
    }

    const valid: HomeworkItem[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i] as Record<string, unknown>;
      const num = i + 1;
      if (!row || typeof row !== 'object') {
        return { ok: false, error: `Bài tập #${num}: Không phải là đối tượng JSON hợp lệ.` };
      }
      if (typeof row.title !== 'string' || !row.title.trim()) {
        return { ok: false, error: `Bài tập #${num}: Thiếu trường "title" (tiêu đề bài).` };
      }
      if (typeof row.problem !== 'string' || !row.problem.trim()) {
        return { ok: false, error: `Bài tập #${num}: Thiếu trường "problem" (đề bài).` };
      }

      valid.push({
        id:
          typeof row.id === 'string' && row.id.trim()
            ? row.id.trim()
            : `hw-${Date.now()}-${i}`,
        topic: typeof row.topic === 'string' && row.topic.trim() ? row.topic.trim() : 'Tổng hợp',
        title: row.title.trim(),
        problem: row.problem.trim(),
        requirement: typeof row.requirement === 'string' ? row.requirement.trim() : '',
        difficulty:
          typeof row.difficulty === 'string' && row.difficulty.trim()
            ? row.difficulty.trim()
            : 'Thông hiểu',
        dueDate:
          typeof row.dueDate === 'string' && row.dueDate.trim()
            ? row.dueDate.trim()
            : 'Buổi học kế tiếp',
      });
    }

    return { ok: true, data: valid };
  };

  const handleImportHomework = (mode: 'replace' | 'append') => {
    const res = validateHomeworkJson(hwJsonInput);
    if (!res.ok) {
      setHwJsonSuccess(null);
      setHwJsonError(res.error);
      return;
    }

    const nextItems =
      mode === 'replace' ? res.data : [...homeworkItems, ...res.data];

    onSessionNotesChange({
      ...sessionNotes,
      homeworkItems: nextItems,
    });
    setIsHomeworkJsonOpen(false);
    setHwJsonInput('');
    setHwJsonError(null);
    setHwJsonSuccess(null);
  };

  const handleRemoveHomeworkItem = (id: string) => {
    onSessionNotesChange({
      ...sessionNotes,
      homeworkItems: homeworkItems.filter((item) => item.id !== id),
    });
  };

  const handleCopyHwSample = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_HOMEWORK_JSON_TEMPLATE);
      setCopiedHwSample(true);
      setTimeout(() => setCopiedHwSample(false), 2000);
    } catch {
      setHwJsonInput(SAMPLE_HOMEWORK_JSON_TEMPLATE);
    }
  };

  const triggerPdfPrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100">
              Tổng kết buổi học
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lessonTitle} · Tổng hợp kiến thức, nhận xét, bài tập về nhà JSON và xuất PDF chuẩn A4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPdfPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Xem trước PDF</span>
            </button>

            <button
              type="button"
              onClick={triggerPdfPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất PDF tổng kết</span>
            </button>

            {confirmNewSession ? (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                  Đặt lại đồng hồ & bài làm?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetSessionProgress();
                    setConfirmNewSession(false);
                  }}
                  className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmNewSession(false)}
                  className="px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmNewSession(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Buổi học mới</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Tổng thời gian học</span>
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatClock(effectiveSeconds)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formattedDurationText}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Số câu đã luyện tập</span>
              <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summaryData.attemptedCount} / {quizQuestions.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Câu hỏi trắc nghiệm tương tác
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Tỷ lệ làm đúng</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {summaryData.attemptedCount > 0 ? `${summaryData.accuracy}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {summaryData.correctCount} câu đúng · {summaryData.wrongList.length} câu sai
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Mục cần ôn tập lại</span>
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400">
              {summaryData.reviewKnowledge.length + summaryData.wrongList.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {summaryData.reviewKnowledge.length} công thức · {summaryData.wrongList.length} bài tập
            </div>
          </div>
        </div>

        {/* Two-Column Main Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Homework JSON + Review Queue */}
          <div className="lg:col-span-5 space-y-4">
            {/* Structured Homework Section */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                    Bài tập về nhà (JSON)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đưa vào dạng JSON để tự động định dạng vào file PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHwJsonError(null);
                    setHwJsonSuccess(null);
                    setIsHomeworkJsonOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Nhập BTVN (JSON)</span>
                </button>
              </div>

              {homeworkItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-3">
                  Chưa có bài tập về nhà dạng JSON. Nhấn "Nhập BTVN (JSON)" để thêm bài tập.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {homeworkItems.map((hw, idx) => (
                    <li key={hw.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                          <span className="font-semibold text-sky-700 dark:text-sky-400">
                            Bài {idx + 1}
                          </span>{' '}
                          · {hw.topic} · {hw.difficulty}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {hw.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          <MathText text={hw.problem} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHomeworkItem(hw.id)}
                        title="Xóa bài tập này"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Formulas to review */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  Công thức cần ôn lại
                </h2>
                <button
                  type="button"
                  onClick={onNavigateToKnowledge}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Mở Flashcard
                </button>
              </div>

              {summaryData.reviewKnowledge.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                  Chưa có công thức nào bị đánh dấu "Chưa thuộc - Lặp lại".
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summaryData.reviewKnowledge.map((item) => (
                    <li key={item.id} className="py-2.5">
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-0.5">
                        {item.topic} · {item.level}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Wrong quiz questions */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-3">
                Câu hỏi làm sai cần chữa kỹ
              </h2>

              {summaryData.wrongList.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                  {summaryData.attemptedCount === 0
                    ? 'Chưa có câu hỏi nào được làm trong buổi học này.'
                    : 'Học sinh đã trả lời đúng toàn bộ các câu đã làm.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summaryData.wrongList.map((q) => {
                    const idx = quizQuestions.findIndex((item) => item.id === q.id);
                    return (
                      <li key={q.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Câu {idx + 1} · {q.topic} · {q.difficulty}
                            </span>
                          </div>
                          <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
                            <MathText text={q.question} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateToQuiz(idx)}
                          className="shrink-0 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Xem lại
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Right Column (7 cols): Teacher Review & Parent Report */}
          <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 lg:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  Báo cáo nhận xét & Định dạng PDF
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chỉnh sửa thông tin để đồng bộ cả văn bản sao chép và file PDF tổng kết.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium transition-colors whitespace-nowrap"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép văn bản' : 'Copy báo cáo chữ'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tên học sinh
                </label>
                <input
                  type="text"
                  value={sessionNotes.studentName}
                  onChange={(e) =>
                    onSessionNotesChange({ ...sessionNotes, studentName: e.target.value })
                  }
                  placeholder="Nhập tên học sinh..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Dặn dò bài tập về nhà (chung)
                </label>
                <input
                  type="text"
                  value={sessionNotes.homework}
                  onChange={(e) =>
                    onSessionNotesChange({ ...sessionNotes, homework: e.target.value })
                  }
                  placeholder="Giao dặn dò chung..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Nhận xét chi tiết của giáo viên
              </label>
              <textarea
                rows={3}
                value={sessionNotes.teacherComment}
                onChange={(e) =>
                  onSessionNotesChange({ ...sessionNotes, teacherComment: e.target.value })
                }
                placeholder="Ghi nhận thái độ học tập, điểm mạnh và điểm cần cải thiện..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAllKnowledgeInPdf}
                  onChange={(e) => onIncludeAllKnowledgeInPdfChange(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                />
                <span>Bao gồm toàn bộ công thức trong kho khi xuất PDF (mặc định chỉ xuất thẻ đã ôn/cần ôn)</span>
              </label>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Bản nháp tin nhắn gửi phụ huynh (Zalo / Messenger)
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-200">
                {generatedReport}
              </pre>
            </div>
          </section>
        </div>
      </div>

      {/* Homework JSON Importer Modal */}
      {isHomeworkJsonOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                  Nhập Bài tập về nhà (JSON) cho PDF Tổng kết
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dán mảng JSON bài tập hỗ trợ công thức LaTeX ($...$, $$...$$). Hệ thống sẽ định dạng chuẩn A4 khi xuất PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHomeworkJsonOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Mã nguồn JSON bài tập về nhà
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHwSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-sky-700 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {copiedHwSample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHwSample ? 'Đã sao chép mẫu' : 'Sao chép JSON mẫu'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHwJsonInput(SAMPLE_HOMEWORK_JSON_TEMPLATE);
                    setHwJsonError(null);
                    setHwJsonSuccess(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Chèn mẫu vào khung
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              value={hwJsonInput}
              onChange={(e) => {
                setHwJsonInput(e.target.value);
                setHwJsonError(null);
                setHwJsonSuccess(null);
              }}
              placeholder={SAMPLE_HOMEWORK_JSON_TEMPLATE}
              spellCheck={false}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 mb-3 leading-relaxed"
            />

            {hwJsonError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{hwJsonError}</span>
              </div>
            )}

            {hwJsonSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{hwJsonSuccess}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const res = validateHomeworkJson(hwJsonInput);
                  if (res.ok) {
                    setHwJsonError(null);
                    setHwJsonSuccess(`Hợp lệ! Tìm thấy ${res.data.length} bài tập về nhà.`);
                  } else {
                    setHwJsonSuccess(null);
                    setHwJsonError(res.error);
                  }
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Kiểm tra cú pháp
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHomeworkJsonOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleImportHomework('append')}
                  className="px-3.5 py-2 rounded-lg border border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-medium"
                >
                  Thêm vào danh sách
                </button>
                <button
                  type="button"
                  onClick={() => handleImportHomework('replace')}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
                >
                  Thay thế BTVN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A4 PDF Live Preview Modal */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex flex-col overflow-hidden">
          <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Xem trước Phiếu Tổng Kết PDF (Chuẩn A4)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhấn "Xuất PDF / In" rồi chọn "Save as PDF" (Lưu dưới dạng PDF) để tải file sắc nét.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerPdfPrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất PDF / In ngay</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPdfPreviewOpen(false)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 dark:bg-slate-950">
            <div className="max-w-[794px] mx-auto bg-white shadow-xl rounded-sm p-8 sm:p-12 border border-slate-300">
              <SummaryPdfDocument
                lessonTitle={lessonTitle}
                durationText={formattedDurationText}
                knowledgeBase={knowledgeBase}
                quizQuestions={quizQuestions}
                quizAnswers={quizAnswers}
                sessionNotes={sessionNotes}
                includeAllKnowledge={includeAllKnowledgeInPdf}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
