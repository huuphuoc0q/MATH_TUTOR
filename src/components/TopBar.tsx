import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  Database,
  HelpCircle,
  Moon,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  Sun,
  Timer as TimerIcon,
} from 'lucide-react';
import { TabId, ThemeMode, TimerMode, TimerState } from '../types';

interface TopBarProps {
  lessonTitle: string;
  onLessonTitleChange: (title: string) => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  timer: TimerState;
  onTimerToggleRun: () => void;
  onTimerReset: () => void;
  onTimerModeChange: (mode: TimerMode) => void;
  onTimerSetCountdownMinutes: (minutes: number) => void;
  onOpenWorkspaceModal: (initialSection?: 'backup' | 'shortcuts') => void;
}

const NAV_TABS: { id: TabId; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'scratchpad', label: 'Bảng nháp', shortcut: 'Alt+1', icon: <PenTool className="w-4 h-4" /> },
  { id: 'knowledge', label: 'Kiến thức', shortcut: 'Alt+2', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'quiz', label: 'Luyện tập', shortcut: 'Alt+3', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'summary', label: 'Tổng kết', shortcut: 'Alt+4', icon: <ClipboardList className="w-4 h-4" /> },
];

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export const TopBar: React.FC<TopBarProps> = ({
  lessonTitle,
  onLessonTitleChange,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  timer,
  onTimerToggleRun,
  onTimerReset,
  onTimerModeChange,
  onTimerSetCountdownMinutes,
  onOpenWorkspaceModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(lessonTitle);
  const [timerMenuOpen, setTimerMenuOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const timerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftTitle(lessonTitle);
  }, [lessonTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (timerMenuRef.current && !timerMenuRef.current.contains(e.target as Node)) {
        setTimerMenuOpen(false);
      }
    };
    if (timerMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [timerMenuOpen]);

  const commitTitle = () => {
    const trimmed = draftTitle.trim();
    onLessonTitleChange(trimmed || 'Buổi dạy học mới');
    setIsEditingTitle(false);
  };

  const displaySeconds =
    timer.mode === 'stopwatch'
      ? timer.stopwatchSeconds
      : timer.countdownRemainingSeconds;

  const isCountdownWarning =
    timer.mode === 'countdown' &&
    timer.countdownRemainingSeconds > 0 &&
    timer.countdownRemainingSeconds <= 60;

  const isCountdownExpired =
    timer.mode === 'countdown' && timer.countdownRemainingSeconds === 0;

  return (
    <header className="h-[60px] shrink-0 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 lg:px-5 flex items-center justify-between gap-4 z-30">
      {/* Zone 1: Brand & Editable Lesson Title */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          EDU_LEHUUPHUOC
        </span>
        <span className="hidden xl:inline text-slate-300 dark:text-slate-700 select-none">/</span>
        {isEditingTitle ? (
          <div className="hidden md:flex items-center gap-1">
            <input
              ref={titleInputRef}
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setDraftTitle(lessonTitle);
                  setIsEditingTitle(false);
                }
              }}
              aria-label="Tên buổi học"
              className="px-2 py-1 text-sm rounded-md border border-sky-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none w-56 lg:w-64"
            />
            <button
              type="button"
              onClick={commitTitle}
              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Lưu tên buổi học"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            title="Nhấn để sửa tên buổi học"
            className="hidden md:inline-flex items-center text-left text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors max-w-[200px] lg:max-w-[260px] truncate"
          >
            <span className="truncate">{lessonTitle}</span>
          </button>
        )}
      </div>

      {/* Zone 2: Navigation Tabs */}
      <nav
        aria-label="Phân hệ làm việc"
        className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700/60"
      >
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              title={`${tab.label} (${tab.shortcut})`}
              className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Teaching Timer + Theme + Data/Shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Teaching Timer Control */}
        <div className="relative" ref={timerMenuRef}>
          <div
            className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border transition-colors ${
              isCountdownExpired
                ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                : isCountdownWarning
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setTimerMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 focus-visible:outline-none whitespace-nowrap shrink-0"
              title="Cấu hình đồng hồ buổi học"
            >
              <TimerIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-mono tabular-nums text-sm font-semibold tracking-tight">
                {formatClock(displaySeconds)}
              </span>
              {isCountdownWarning && (
                <span className="hidden xl:inline text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Sắp hết
                </span>
              )}
              {isCountdownExpired && (
                <span className="hidden xl:inline text-[11px] font-medium text-red-700 dark:text-red-300">
                  Hết giờ
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={onTimerToggleRun}
              title={timer.isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
              aria-label={timer.isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
              className={`p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                timer.isRunning
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
              }`}
            >
              {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onTimerReset}
              title="Đặt lại đồng hồ"
              aria-label="Đặt lại đồng hồ"
              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {timerMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-3.5 z-50">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Chế độ đồng hồ điều phối
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => onTimerModeChange('stopwatch')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    timer.mode === 'stopwatch'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Đếm tiến (Ca dạy)
                </button>
                <button
                  type="button"
                  onClick={() => onTimerModeChange('countdown')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    timer.mode === 'countdown'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Đếm ngược (Bài tập)
                </button>
              </div>

              {timer.mode === 'countdown' ? (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Đặt nhanh thời gian làm bài:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          onTimerSetCountdownMinutes(mins);
                          setTimerMenuOpen(false);
                        }}
                        className="py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors tabular-nums"
                      >
                        {mins} phút
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = parseInt(customMinutes, 10);
                      if (!Number.isNaN(val) && val > 0 && val <= 180) {
                        onTimerSetCountdownMinutes(val);
                        setTimerMenuOpen(false);
                      }
                    }}
                    className="flex items-center gap-1.5 pt-1"
                  >
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="w-20 px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">phút</span>
                    <button
                      type="submit"
                      className="ml-auto px-3 py-1.5 text-xs font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Đang theo dõi tổng thời gian ca dạy. Tổng thời gian đã dạy trong buổi:{' '}
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatClock(timer.totalSessionSeconds)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Light / Dark Mode Switch */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
          aria-label={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Backup & Shortcuts Modal Trigger */}
        <button
          type="button"
          onClick={() => onOpenWorkspaceModal('backup')}
          title="Sao lưu dữ liệu & Phím tắt"
          aria-label="Sao lưu dữ liệu và phím tắt"
          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="hidden lg:inline">Dữ liệu</span>
        </button>
      </div>
    </header>
  );
};
