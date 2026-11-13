import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Keyboard,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { WorkspaceState } from '../types';
import { exportWorkspaceBackup, parseWorkspaceBackup } from '../utils/storage';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: WorkspaceState;
  onImportState: (nextState: WorkspaceState) => void;
  onRestoreSampleData: () => void;
}

const SHORTCUTS = [
  { keys: 'Alt + 1', desc: 'Chuyển sang Bảng nháp thông minh' },
  { keys: 'Alt + 2', desc: 'Chuyển sang Kho kiến thức & Flashcard' },
  { keys: 'Alt + 3', desc: 'Chuyển sang Hệ thống Luyện tập JSON' },
  { keys: 'Alt + 4', desc: 'Chuyển sang Tổng kết buổi học' },
  { keys: 'Ctrl + Z', desc: 'Hoàn tác nét vẽ trên Bảng nháp' },
  { keys: 'Ctrl + Y', desc: 'Làm lại nét vẽ vừa hoàn tác' },
  { keys: 'Ctrl + Chuột phải', desc: 'Kéo chọn vùng để xóa nhanh các nét vẽ & hình học' },
  { keys: 'Space', desc: 'Lật thẻ Flashcard (hoặc giữ + kéo để di chuyển bảng vẽ)' },
];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportState,
  onRestoreSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const result = parseWorkspaceBackup(content);
      if (result.ok) {
        onImportState(result.state);
        setFeedback({
          type: 'success',
          message: 'Đã khôi phục toàn bộ dữ liệu từ tệp sao lưu thành công.',
        });
      } else {
        setFeedback({ type: 'error', message: result.error });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể đọc tệp đã chọn. Vui lòng thử lại.',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
              Quản lý dữ liệu & Phím tắt giảng dạy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dữ liệu được tự động lưu bền vững vào trình duyệt (localStorage).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Backup & Restore Actions */}
        <div className="space-y-3">
          <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
            Sao lưu & Khôi phục dữ liệu
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                exportWorkspaceBackup(state);
                setFeedback({
                  type: 'success',
                  message: 'Đã tải xuống tệp sao lưu toàn bộ không gian làm việc (.json).',
                });
              }}
              className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-sky-500 text-left transition-colors"
            >
              <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Xuất sao lưu (.json)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Lưu kho công thức, bộ đề và bảng nháp ra máy.
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-sky-500 text-left transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Nhập sao lưu (.json)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Khôi phục toàn bộ dữ liệu từ tệp đã lưu.
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {confirmRestore ? (
              <div className="flex flex-col justify-between p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
                <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200 mb-2">
                  Ghi đè bằng dữ liệu mẫu?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreSampleData();
                      setConfirmRestore(false);
                      setFeedback({
                        type: 'success',
                        message: 'Đã khôi phục bộ dữ liệu Toán học mẫu mặc định.',
                      });
                    }}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                  >
                    Đồng ý
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRestore(false)}
                    className="px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRestore(true)}
                className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-500 text-left transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Khôi phục dữ liệu mẫu
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nạp lại 7 công thức & 6 câu hỏi chuẩn ban đầu.
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Phím tắt thao tác nhanh trên lớp</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {SHORTCUTS.map((sc) => (
              <div
                key={sc.keys}
                className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs"
              >
                <span className="text-slate-700 dark:text-slate-300">{sc.desc}</span>
                <kbd className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  {sc.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
