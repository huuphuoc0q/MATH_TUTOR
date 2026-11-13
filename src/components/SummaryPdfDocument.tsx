import React from 'react';
import {
  HomeworkItem,
  KnowledgeItem,
  QuizAnswerRecord,
  QuizQuestion,
  SessionNotesState,
} from '../types';
import { MathText } from '../utils/mathRenderer';

interface SummaryPdfDocumentProps {
  lessonTitle: string;
  durationText: string;
  knowledgeBase: KnowledgeItem[];
  quizQuestions: QuizQuestion[];
  quizAnswers: Record<string, QuizAnswerRecord>;
  sessionNotes: SessionNotesState;
  includeAllKnowledge?: boolean;
}

export const SummaryPdfDocument: React.FC<SummaryPdfDocumentProps> = ({
  lessonTitle,
  durationText,
  knowledgeBase,
  quizQuestions,
  quizAnswers,
  sessionNotes,
  includeAllKnowledge = false,
}) => {
  const today = new Date();
  const formattedDate = `Ngày ${today.getDate().toString().padStart(2, '0')} tháng ${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')} năm ${today.getFullYear()}`;

  const attemptedList = quizQuestions.filter((q) => Boolean(quizAnswers[q.id]));
  const correctList = attemptedList.filter((q) => quizAnswers[q.id]?.isCorrect);
  const wrongList = attemptedList.filter((q) => !quizAnswers[q.id]?.isCorrect);
  const accuracy =
    attemptedList.length > 0
      ? Math.round((correctList.length / attemptedList.length) * 100)
      : 0;

  const reviewedOrMastered = knowledgeBase.filter(
    (k) => k.mastery === 'mastered' || k.mastery === 'review'
  );
  const displayedKnowledge =
    includeAllKnowledge || reviewedOrMastered.length === 0
      ? knowledgeBase
      : reviewedOrMastered;

  const homeworkItems: HomeworkItem[] = sessionNotes.homeworkItems ?? [];

  return (
    <div className="pdf-paper bg-white text-slate-900 font-sans text-[13.5px] leading-relaxed">
      {/* Editorial Document Masthead */}
      <header className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
          <span className="font-display font-bold tracking-wide text-sky-700">
            GS. LE HUU PHUOC · PHIẾU TỔNG KẾT BUỔI HỌC
          </span>
          <span className="tabular-nums">{formattedDate}</span>
        </div>

        <h1 className="font-display text-xl font-bold text-slate-900 mb-3">
          {lessonTitle}
        </h1>

        <div className="grid grid-cols-4 border border-slate-200 rounded-lg divide-x divide-slate-200 bg-slate-50/70">
          <div className="p-2.5">
            <div className="text-[11px] text-slate-500">Học sinh</div>
            <div className="font-semibold text-slate-900 truncate">
              {sessionNotes.studentName.trim() || 'Học sinh'}
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-[11px] text-slate-500">Thời lượng</div>
            <div className="font-semibold text-slate-900 tabular-nums">
              {durationText}
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-[11px] text-slate-500">Luyện tập</div>
            <div className="font-semibold text-slate-900 tabular-nums">
              {attemptedList.length > 0
                ? `${correctList.length}/${attemptedList.length} đúng (${accuracy}%)`
                : 'Chưa làm bài'}
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-[11px] text-slate-500">Bài tập về nhà</div>
            <div className="font-semibold text-slate-900 tabular-nums">
              {homeworkItems.length} bài tập
            </div>
          </div>
        </div>
      </header>

      {/* Section I: Knowledge Summary */}
      <section className="mb-6">
        <h2 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-3">
          I. Tổng kết kiến thức trọng tâm đã học
        </h2>

        {displayedKnowledge.length === 0 ? (
          <p className="text-slate-500 italic text-xs">
            Chưa có công thức nào được ghi nhận trong kho kiến thức.
          </p>
        ) : (
          <div className="space-y-3">
            {displayedKnowledge.map((item, idx) => (
              <div
                key={item.id}
                className="pdf-break-avoid rounded-lg border border-slate-200 p-3.5 bg-white"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
                  <span>
                    <strong className="text-sky-700">{item.topic}</strong> · {item.level}
                  </span>
                  <span
                    className={`font-semibold ${
                      item.mastery === 'mastered'
                        ? 'text-emerald-700'
                        : item.mastery === 'review'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {item.mastery === 'mastered'
                      ? 'Đã nắm vững'
                      : item.mastery === 'review'
                        ? 'Cần ôn lại'
                        : 'Đã giới thiệu'}
                  </span>
                </div>

                <div className="font-display font-semibold text-slate-900 text-sm mb-1.5">
                  {idx + 1}. {item.title}
                </div>

                <div className="rounded bg-slate-50 border border-slate-100 px-3 py-2 text-[13px] text-slate-900 mb-1.5">
                  <MathText text={item.formula} />
                </div>

                {item.notes && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Lưu ý: </span>
                    <MathText text={item.notes} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section II: Teacher Comment & Practice Review */}
      <section className="mb-6 pdf-break-avoid">
        <h2 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-3">
          II. Nhận xét của giáo viên & Điểm cần lưu ý
        </h2>

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
          <div className="text-slate-800 whitespace-pre-wrap">
            {sessionNotes.teacherComment.trim() ||
              'Em có tinh thần học tập tích cực, tập trung tiếp thu kiến thức trong buổi học.'}
          </div>

          {wrongList.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <div className="text-xs font-semibold text-amber-800 mb-1">
                Các câu luyện tập làm nhầm cần xem lại lời giải:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {wrongList.map((q) => {
                  const qIdx = quizQuestions.findIndex((item) => item.id === q.id);
                  return (
                    <li key={q.id}>
                      <span className="font-medium">
                        Câu {qIdx + 1} ({q.topic} · {q.difficulty}):{' '}
                      </span>
                      <MathText text={q.question} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Section III: Structured Homework from JSON */}
      <section className="mb-6">
        <h2 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-3">
          III. Bài tập về nhà
        </h2>

        {sessionNotes.homework.trim() && (
          <p className="text-xs text-slate-700 mb-3">
            <span className="font-semibold text-slate-900">Dặn dò chung: </span>
            {sessionNotes.homework.trim()}
          </p>
        )}

        {homeworkItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Chưa có danh sách bài tập JSON được giao cho buổi học này.
          </p>
        ) : (
          <div className="space-y-3">
            {homeworkItems.map((hw, idx) => (
              <div
                key={hw.id}
                className="pdf-break-avoid rounded-lg border border-slate-200 p-3.5 bg-white"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
                  <span>
                    <strong className="text-sky-700">Bài {idx + 1}</strong> · {hw.topic} · Mức độ:{' '}
                    {hw.difficulty}
                  </span>
                  {hw.dueDate && <span>Hạn nộp: {hw.dueDate}</span>}
                </div>

                <div className="font-display font-semibold text-sm text-slate-900 mb-1.5">
                  {hw.title}
                </div>

                <div className="text-[13.5px] text-slate-900 mb-2 leading-relaxed">
                  <MathText text={hw.problem} />
                </div>

                {hw.requirement && (
                  <div className="text-xs text-slate-600 pt-1.5 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Yêu cầu: </span>
                    <MathText text={hw.requirement} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editorial Footer */}
      <footer className="pdf-break-avoid pt-4 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
        <div>
          Phiếu tổng kết được xuất tự động từ EduWorkspace Pro.
          <br />
          Phụ huynh vui lòng nhắc em hoàn thành bài tập đúng hạn.
        </div>
        <div className="text-center min-w-[160px]">
          <div className="font-semibold text-slate-800 mb-8">Giáo viên hướng dẫn</div>
          <div className="border-t border-slate-300 pt-1 text-[11px]">
            (Ký và ghi rõ họ tên)
          </div>
        </div>
      </footer>
    </div>
  );
};
