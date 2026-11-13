import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  FileJson,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { SAMPLE_KNOWLEDGE_JSON_TEMPLATE } from '../data/sampleData';
import { KnowledgeItem, KnowledgeLevel, MasteryStatus } from '../types';
import { MathText } from '../utils/mathRenderer';

interface KnowledgeBaseProps {
  items: KnowledgeItem[];
  onItemsChange: (items: KnowledgeItem[]) => void;
  isActiveTab: boolean;
}

const LEVEL_OPTIONS: KnowledgeLevel[] = ['Cơ bản', 'Nâng cao', 'Trọng tâm thi'];

function getMasteryLabel(status: MasteryStatus): {
  text: string;
  className: string;
} {
  if (status === 'mastered') {
    return {
      text: 'Đã nắm vững',
      className: 'text-emerald-700 dark:text-emerald-400',
    };
  }
  if (status === 'review') {
    return {
      text: 'Cần ôn lại',
      className: 'text-amber-700 dark:text-amber-400',
    };
  }
  return {
    text: 'Chưa ôn',
    className: 'text-slate-500 dark:text-slate-400',
  };
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  items,
  onItemsChange,
  isActiveTab,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Tất cả');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tất cả');

  // Flashcard states
  const [onlyReviewCards, setOnlyReviewCards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Add / Edit modal
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState('Đại số');
  const [formLevel, setFormLevel] = useState<KnowledgeLevel>('Cơ bản');
  const [formFormula, setFormFormula] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Batch JSON Modal
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

  const topics = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.topic.trim()).filter(Boolean)));
    return ['Tất cả', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedTopic !== 'Tất cả' && item.topic !== selectedTopic) return false;
      if (selectedLevel !== 'Tất cả' && item.level !== selectedLevel) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedTopic, selectedLevel]);

  const flashcardDeck = useMemo(() => {
    return filteredItems.filter((item) => {
      if (onlyReviewCards) {
        return item.mastery !== 'mastered';
      }
      return true;
    });
  }, [filteredItems, onlyReviewCards]);

  useEffect(() => {
    if (cardIndex >= flashcardDeck.length) {
      setCardIndex(0);
    }
    setIsFlipped(false);
  }, [flashcardDeck.length, selectedTopic, onlyReviewCards]);

  // Keyboard shortcuts in Flashcard mode: Space to flip, Arrows to navigate
  useEffect(() => {
    if (!isActiveTab || viewMode !== 'flashcard' || isEditorOpen || isJsonOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (flashcardDeck.length > 0) {
          setIsFlipped((prev) => !prev);
        }
      } else if (e.key === 'ArrowRight') {
        if (flashcardDeck.length > 1) {
          setIsFlipped(false);
          setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
        }
      } else if (e.key === 'ArrowLeft') {
        if (flashcardDeck.length > 1) {
          setIsFlipped(false);
          setCardIndex((prev) => (prev - 1 + flashcardDeck.length) % flashcardDeck.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActiveTab, viewMode, isEditorOpen, isJsonOpen, flashcardDeck.length]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormTopic(selectedTopic !== 'Tất cả' ? selectedTopic : 'Đại số');
    setFormLevel('Cơ bản');
    setFormFormula('');
    setFormExample('');
    setFormNotes('');
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormTopic(item.topic);
    setFormLevel(item.level);
    setFormFormula(item.formula);
    setFormExample(item.example);
    setFormNotes(item.notes);
    setFormError('');
    setIsEditorOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formFormula.trim() || !formTopic.trim()) {
      setFormError('Vui lòng nhập đầy đủ Tên kiến thức, Chuyên đề và Công thức.');
      return;
    }

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: formTitle.trim(),
              topic: formTopic.trim(),
              level: formLevel,
              formula: formFormula.trim(),
              example: formExample.trim(),
              notes: formNotes.trim(),
            }
          : it
      );
      onItemsChange(updated);
    } else {
      const newItem: KnowledgeItem = {
        id: `kb-${Date.now()}`,
        title: formTitle.trim(),
        topic: formTopic.trim(),
        level: formLevel,
        formula: formFormula.trim(),
        example: formExample.trim(),
        notes: formNotes.trim(),
        mastery: 'unseen',
      };
      onItemsChange([newItem, ...items]);
    }
    setIsEditorOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter((it) => it.id !== id));
  };

  const handleSetMastery = (id: string, mastery: MasteryStatus) => {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, mastery } : it)));
  };

  const handleEvaluateFlashcard = (id: string, mastery: MasteryStatus) => {
    handleSetMastery(id, mastery);
    setIsFlipped(false);
    if (flashcardDeck.length > 1) {
      setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
    }
  };

  const handleCopySampleJson = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_KNOWLEDGE_JSON_TEMPLATE);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2000);
    } catch {
      setJsonInput(SAMPLE_KNOWLEDGE_JSON_TEMPLATE);
    }
  };

  const handleImportJson = (mode: 'append' | 'replace') => {
    setJsonError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setJsonError(
        `Lỗi cú pháp JSON: ${err instanceof Error ? err.message : 'Vui lòng kiểm tra dấu ngoặc và dấu phẩy.'}`
      );
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      setJsonError('Dữ liệu JSON phải là một mảng [...] chứa ít nhất 1 thẻ kiến thức.');
      return;
    }

    const validItems: KnowledgeItem[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i] as Record<string, unknown>;
      if (!row || typeof row !== 'object') {
        setJsonError(`Phần tử thứ ${i + 1} không phải là đối tượng JSON hợp lệ.`);
        return;
      }
      if (typeof row.title !== 'string' || !row.title.trim()) {
        setJsonError(`Phần tử thứ ${i + 1} thiếu trường "title" (tiêu đề).`);
        return;
      }
      if (typeof row.formula !== 'string' || !row.formula.trim()) {
        setJsonError(`Phần tử thứ ${i + 1} thiếu trường "formula" (công thức).`);
        return;
      }
      const levelRaw = typeof row.level === 'string' ? row.level : 'Cơ bản';
      const level: KnowledgeLevel =
        levelRaw === 'Nâng cao' || levelRaw === 'Trọng tâm thi' ? levelRaw : 'Cơ bản';

      validItems.push({
        id:
          typeof row.id === 'string' && row.id.trim()
            ? row.id.trim()
            : `kb-imp-${Date.now()}-${i}`,
        topic: typeof row.topic === 'string' && row.topic.trim() ? row.topic.trim() : 'Chung',
        level,
        title: row.title.trim(),
        formula: row.formula.trim(),
        example: typeof row.example === 'string' ? row.example.trim() : '',
        notes: typeof row.notes === 'string' ? row.notes.trim() : '',
        mastery:
          row.mastery === 'mastered' || row.mastery === 'review' ? row.mastery : 'unseen',
      });
    }

    onItemsChange(mode === 'replace' ? validItems : [...validItems, ...items]);
    setIsJsonOpen(false);
    setJsonInput('');
  };

  const masteredCount = items.filter((i) => i.mastery === 'mastered').length;
  const reviewCount = items.filter((i) => i.mastery === 'review').length;
  const currentCard = flashcardDeck[cardIndex];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Control Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kho công thức</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flashcard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'flashcard'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chế độ Flashcard</span>
            </button>
          </div>

          {/* Real-time Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm công thức, định lý, ghi chú..."
              className="pl-9 pr-3 py-1.5 w-60 lg:w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Level Select */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            aria-label="Lọc theo cấp độ"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="Tất cả">Mọi cấp độ</option>
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400 tabular-nums mr-1">
            {items.length} thẻ · {masteredCount} nắm vững · {reviewCount} cần ôn
          </span>
          <button
            type="button"
            onClick={() => {
              setJsonError('');
              setIsJsonOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Nhập JSON</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm kiến thức</span>
          </button>
        </div>
      </div>

      {/* Topic Filter Strip */}
      <div className="shrink-0 px-4 lg:px-6 py-2.5 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-950 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {topics.map((topic) => {
            const active = selectedTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {viewMode === 'flashcard' && (
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={onlyReviewCards}
              onChange={(e) => setOnlyReviewCards(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
            />
            <span>Chỉ hiện thẻ chưa thuộc</span>
          </label>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {viewMode === 'list' ? (
          filteredItems.length === 0 ? (
            <div className="max-w-md mx-auto mt-12 text-center p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-1">
                Không tìm thấy kiến thức phù hợp
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Thử đổi từ khóa tìm kiếm, chọn chuyên đề khác hoặc thêm công thức mới vào kho.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm công thức mới</span>
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const masteryMeta = getMasteryLabel(item.mastery);
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Quiet Unboxed Metadata Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-sky-700 dark:text-sky-400">
                            {item.topic}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.level}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-medium ${masteryMeta.className}`}>
                            {masteryMeta.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Sửa kiến thức"
                            aria-label="Sửa kiến thức"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Xóa kiến thức"
                            aria-label="Xóa kiến thức"
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-display font-semibold text-base lg:text-lg text-slate-900 dark:text-slate-100 mb-3">
                        {item.title}
                      </h3>

                      {/* Formula Box */}
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 text-sm lg:text-[15px] text-slate-800 dark:text-slate-100 mb-3">
                        <MathText text={item.formula} />
                      </div>

                      {item.example && (
                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Ví dụ:{' '}
                          </span>
                          <MathText text={item.example} />
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-sm text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-sky-700 dark:text-sky-400">
                            Mẹo giảng dạy:{' '}
                          </span>
                          <MathText text={item.notes} />
                        </div>
                      )}
                    </div>

                    {/* Quick Mastery Toggle Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Trạng thái ghi nhớ:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetMastery(item.id, 'review')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            item.mastery === 'review'
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Cần ôn lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetMastery(item.id, 'mastered')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            item.mastery === 'mastered'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nắm vững</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          /* Flashcard Active Recall Mode */
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center py-4">
            {flashcardDeck.length === 0 || !currentCard ? (
              <div className="text-center p-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1">
                  {onlyReviewCards
                    ? 'Học sinh đã nắm vững toàn bộ thẻ trong mục này'
                    : 'Không có thẻ kiến thức nào trong bộ lọc hiện tại'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {onlyReviewCards
                    ? 'Tắt bộ lọc "Chỉ hiện thẻ chưa thuộc" để ôn lại toàn bộ thẻ.'
                    : 'Hãy chọn chuyên đề khác hoặc thêm thẻ kiến thức mới.'}
                </p>
                {onlyReviewCards && (
                  <button
                    type="button"
                    onClick={() => setOnlyReviewCards(false)}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
                  >
                    Xem toàn bộ thẻ
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Progress & Navigation Header */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="tabular-nums font-medium">
                    Thẻ {cardIndex + 1} / {flashcardDeck.length} ·{' '}
                    {getMasteryLabel(currentCard.mastery).text}
                  </span>
                  <span>Nhấn Space hoặc chạm vào thẻ để lật</span>
                </div>

                {/* Flip Card */}
                <div className="perspective-1000">
                  <button
                    type="button"
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl"
                  >
                    <div
                      className={`relative w-full min-h-[340px] lg:min-h-[380px] transition-transform duration-300 preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Front Face */}
                      <div className="absolute inset-0 backface-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {currentCard.topic} · {currentCard.level}
                          </span>
                          <span className="font-medium text-sky-600 dark:text-sky-400">
                            Mặt trước · Gợi nhớ
                          </span>
                        </div>

                        <div className="my-auto text-center px-4">
                          <h2 className="font-display font-bold text-2xl lg:text-3xl text-slate-900 dark:text-slate-100 text-balance mb-4">
                            {currentCard.title}
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Hãy phát biểu công thức chính xác, điều kiện áp dụng và ví dụ minh họa.
                          </p>
                        </div>

                        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                          Chạm hoặc nhấn phím Space để xem công thức chi tiết
                        </div>
                      </div>

                      {/* Back Face */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-sky-200 dark:border-sky-800/70 bg-white dark:bg-slate-900 p-7 lg:p-8 flex flex-col justify-between shadow-xs overflow-y-auto">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <span>{currentCard.title}</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            Mặt sau · Đáp án
                          </span>
                        </div>

                        <div className="space-y-4 my-auto">
                          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 text-base text-slate-900 dark:text-slate-100">
                            <MathText text={currentCard.formula} />
                          </div>

                          {currentCard.example && (
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Ví dụ áp dụng:{' '}
                              </span>
                              <MathText text={currentCard.example} />
                            </div>
                          )}

                          {currentCard.notes && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-sky-700 dark:text-sky-400">
                                Lưu ý:{' '}
                              </span>
                              <MathText text={currentCard.notes} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Controls & Active Recall Rating */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIndex(
                          (prev) => (prev - 1 + flashcardDeck.length) % flashcardDeck.length
                        );
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Thẻ trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                      <span>Thẻ sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEvaluateFlashcard(currentCard.id, 'review')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs lg:text-sm font-medium transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Chưa thuộc - Lặp lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEvaluateFlashcard(currentCard.id, 'mastered')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-medium transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã nắm vững</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Knowledge Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                {editingItem ? 'Chỉnh sửa kiến thức' : 'Thêm công thức / định lý mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Tên công thức / Định lý
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: Công thức tính thể tích khối chóp"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Chuyên đề
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Đại số, Hình học..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Cấp độ
                </label>
                <div className="flex items-center gap-2">
                  {LEVEL_OPTIONS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormLevel(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        formLevel === lvl
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Nội dung công thức (Hỗ trợ $...$ và $$...$$)
                  </label>
                  <textarea
                    rows={4}
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value)}
                    placeholder="$$V = \frac{1}{3} B \cdot h$$"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Xem trước KaTeX trực tiếp
                  </label>
                  <div className="h-[106px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-900 dark:text-slate-100">
                    {formFormula.trim() ? (
                      <MathText text={formFormula} />
                    ) : (
                      <span className="text-slate-400 text-xs">
                        Công thức sẽ hiển thị sắc nét tại đây...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Ví dụ áp dụng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  placeholder="VD: Cho đáy diện tích $B = 12$, chiều cao $h = 5 \Rightarrow V = 20$."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Ghi chú / Mẹo giải nhanh của giáo viên
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Những lỗi sai học sinh thường gặp..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
                >
                  {editingItem ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch JSON Knowledge Import Modal */}
      {isJsonOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                  Nhập hàng loạt kiến thức (JSON)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dán mảng JSON chứa danh sách công thức LaTeX để thêm nhanh vào kho.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Mã nguồn JSON
              </span>
              <button
                type="button"
                onClick={handleCopySampleJson}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-sky-700 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {copiedSample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSample ? 'Đã sao chép mẫu' : 'Sao chép JSON mẫu'}</span>
              </button>
            </div>

            <textarea
              rows={10}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={SAMPLE_KNOWLEDGE_JSON_TEMPLATE}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 mb-3"
            />

            {jsonError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsJsonOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleImportJson('append')}
                className="px-3.5 py-2 rounded-lg border border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-medium"
              >
                Thêm vào kho hiện tại
              </button>
              <button
                type="button"
                onClick={() => handleImportJson('replace')}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
              >
                Thay thế toàn bộ kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
