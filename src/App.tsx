import { useCallback, useEffect, useMemo, useState } from 'react';
import { KnowledgeBase } from './components/KnowledgeBase';
import { QuizEngine } from './components/QuizEngine';
import { SessionSummary } from './components/SessionSummary';
import { SmartScratchpad } from './components/SmartScratchpad';
import { SummaryPdfDocument } from './components/SummaryPdfDocument';
import { TopBar } from './components/TopBar';
import { WorkspaceModal } from './components/WorkspaceModal';
import { TabId, TimerMode, WorkspaceState } from './types';
import {
  createDefaultWorkspaceState,
  loadWorkspaceState,
  saveWorkspaceState,
} from './utils/storage';

export default function App() {
  const [state, setState] = useState<WorkspaceState>(() => loadWorkspaceState());
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [includeAllKnowledgeInPdf, setIncludeAllKnowledgeInPdf] = useState(false);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Persist entire workspace state to localStorage
  useEffect(() => {
    saveWorkspaceState(state);
  }, [state]);

  // Teaching Timer 1-second tick loop
  useEffect(() => {
    if (!state.timer.isRunning) return;
    const interval = window.setInterval(() => {
      setState((prev) => {
        if (!prev.timer.isRunning) return prev;
        if (prev.timer.mode === 'stopwatch') {
          return {
            ...prev,
            timer: {
              ...prev.timer,
              stopwatchSeconds: prev.timer.stopwatchSeconds + 1,
              totalSessionSeconds: prev.timer.totalSessionSeconds + 1,
            },
          };
        }

        const nextRemaining = Math.max(0, prev.timer.countdownRemainingSeconds - 1);
        return {
          ...prev,
          timer: {
            ...prev.timer,
            countdownRemainingSeconds: nextRemaining,
            totalSessionSeconds: prev.timer.totalSessionSeconds + 1,
            isRunning: nextRemaining > 0,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.timer.isRunning, state.timer.mode]);

  // Global keyboard shortcuts: Alt + 1 / 2 / 3 / 4 for fast tab switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const tabMap: Record<string, TabId> = {
        '1': 'scratchpad',
        '2': 'knowledge',
        '3': 'quiz',
        '4': 'summary',
      };
      const targetTab = tabMap[e.key];
      if (targetTab) {
        e.preventDefault();
        setState((prev) => ({ ...prev, activeTab: targetTab }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTimerToggleRun = useCallback(() => {
    setState((prev) => {
      if (
        prev.timer.mode === 'countdown' &&
        prev.timer.countdownRemainingSeconds === 0
      ) {
        return {
          ...prev,
          timer: {
            ...prev.timer,
            countdownRemainingSeconds: prev.timer.countdownTotalSeconds,
            isRunning: true,
          },
        };
      }
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: !prev.timer.isRunning,
        },
      };
    });
  }, []);

  const handleTimerReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        stopwatchSeconds:
          prev.timer.mode === 'stopwatch' ? 0 : prev.timer.stopwatchSeconds,
        countdownRemainingSeconds:
          prev.timer.mode === 'countdown'
            ? prev.timer.countdownTotalSeconds
            : prev.timer.countdownRemainingSeconds,
      },
    }));
  }, []);

  const handleTimerModeChange = useCallback((mode: TimerMode) => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode,
        isRunning: false,
      },
    }));
  }, []);

  const handleTimerSetCountdownMinutes = useCallback((minutes: number) => {
    const secs = Math.max(60, Math.round(minutes * 60));
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode: 'countdown',
        isRunning: false,
        countdownTotalSeconds: secs,
        countdownRemainingSeconds: secs,
      },
    }));
  }, []);

  const handleRestoreSampleData = useCallback(() => {
    const fresh = createDefaultWorkspaceState();
    setState((prev) => ({
      ...fresh,
      theme: prev.theme,
      activeTab: prev.activeTab,
    }));
  }, []);

  const handleResetSessionProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        stopwatchSeconds: 0,
        countdownRemainingSeconds: prev.timer.countdownTotalSeconds,
        totalSessionSeconds: 0,
      },
      quizAnswers: {},
      currentQuestionIndex: 0,
      knowledgeBase: prev.knowledgeBase.map((item) => ({
        ...item,
        mastery: 'unseen',
      })),
    }));
  }, []);

  const formattedDurationText = useMemo(() => {
    const effective = Math.max(
      state.timer.totalSessionSeconds,
      state.timer.stopwatchSeconds
    );
    const mins = Math.floor(effective / 60);
    const secs = effective % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs > 0 ? `${secs} giây` : ''}`.trim();
  }, [state.timer.totalSessionSeconds, state.timer.stopwatchSeconds]);

  return (
    <>
      <div className="no-print h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <TopBar
          lessonTitle={state.lessonTitle}
          onLessonTitleChange={(lessonTitle) =>
            setState((prev) => ({ ...prev, lessonTitle }))
          }
          activeTab={state.activeTab}
          onTabChange={(activeTab) => setState((prev) => ({ ...prev, activeTab }))}
          theme={state.theme}
          onToggleTheme={() =>
            setState((prev) => ({
              ...prev,
              theme: prev.theme === 'light' ? 'dark' : 'light',
            }))
          }
          timer={state.timer}
          onTimerToggleRun={handleTimerToggleRun}
          onTimerReset={handleTimerReset}
          onTimerModeChange={handleTimerModeChange}
          onTimerSetCountdownMinutes={handleTimerSetCountdownMinutes}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        />

        {/* Main Viewport occupying 90%+ screen */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <div
            className={
              state.activeTab === 'scratchpad' ? 'h-full w-full' : 'hidden'
            }
          >
            <SmartScratchpad
              strokes={state.mainStrokes}
              onStrokesChange={(mainStrokes) =>
                setState((prev) => ({ ...prev, mainStrokes }))
              }
              background={state.scratchpadBg}
              onBackgroundChange={(scratchpadBg) =>
                setState((prev) => ({ ...prev, scratchpadBg }))
              }
              theme={state.theme}
              isActive={state.activeTab === 'scratchpad'}
            />
          </div>

          {state.activeTab === 'knowledge' && (
            <KnowledgeBase
              items={state.knowledgeBase}
              onItemsChange={(knowledgeBase) =>
                setState((prev) => ({ ...prev, knowledgeBase }))
              }
              isActiveTab={state.activeTab === 'knowledge'}
            />
          )}

          {state.activeTab === 'quiz' && (
            <QuizEngine
              questions={state.quizQuestions}
              onQuestionsChange={(quizQuestions) =>
                setState((prev) => ({ ...prev, quizQuestions }))
              }
              answers={state.quizAnswers}
              onAnswersChange={(quizAnswers) =>
                setState((prev) => ({ ...prev, quizAnswers }))
              }
              currentIndex={state.currentQuestionIndex}
              onCurrentIndexChange={(currentQuestionIndex) =>
                setState((prev) => ({ ...prev, currentQuestionIndex }))
              }
              quickStrokes={state.quickStrokes}
              onQuickStrokesChange={(quickStrokes) =>
                setState((prev) => ({ ...prev, quickStrokes }))
              }
              theme={state.theme}
              isActiveTab={state.activeTab === 'quiz'}
            />
          )}

          {state.activeTab === 'summary' && (
            <SessionSummary
              lessonTitle={state.lessonTitle}
              totalSessionSeconds={state.timer.totalSessionSeconds}
              stopwatchSeconds={state.timer.stopwatchSeconds}
              knowledgeBase={state.knowledgeBase}
              quizQuestions={state.quizQuestions}
              quizAnswers={state.quizAnswers}
              sessionNotes={state.sessionNotes}
              onSessionNotesChange={(sessionNotes) =>
                setState((prev) => ({ ...prev, sessionNotes }))
              }
              onResetSessionProgress={handleResetSessionProgress}
              onNavigateToKnowledge={() =>
                setState((prev) => ({ ...prev, activeTab: 'knowledge' }))
              }
              onNavigateToQuiz={(idx) =>
                setState((prev) => ({
                  ...prev,
                  activeTab: 'quiz',
                  currentQuestionIndex: idx,
                }))
              }
              includeAllKnowledgeInPdf={includeAllKnowledgeInPdf}
              onIncludeAllKnowledgeInPdfChange={setIncludeAllKnowledgeInPdf}
            />
          )}
        </main>

        <WorkspaceModal
          isOpen={isWorkspaceModalOpen}
          onClose={() => setIsWorkspaceModalOpen(false)}
          state={state}
          onImportState={(nextState) => setState(nextState)}
          onRestoreSampleData={handleRestoreSampleData}
        />
      </div>

      {/* Dedicated A4 Print-to-PDF layer (only visible when printing/exporting PDF) */}
      <div className="print-only hidden">
        <SummaryPdfDocument
          lessonTitle={state.lessonTitle}
          durationText={formattedDurationText}
          knowledgeBase={state.knowledgeBase}
          quizQuestions={state.quizQuestions}
          quizAnswers={state.quizAnswers}
          sessionNotes={state.sessionNotes}
          includeAllKnowledge={includeAllKnowledgeInPdf}
        />
      </div>
    </>
  );
}
