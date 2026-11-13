import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Circle,
  Compass,
  Download,
  Eraser,
  Grid3X3,
  Hand,
  Highlighter,
  Maximize2,
  Minus,
  Pen,
  Plus,
  Redo2,
  Square,
  SquareDashedMousePointer,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import {
  Point,
  ScratchpadBackground,
  ScratchpadTool,
  StrokeElement,
  ThemeMode,
} from '../types';

interface SmartScratchpadProps {
  strokes: StrokeElement[];
  onStrokesChange: (strokes: StrokeElement[]) => void;
  background: ScratchpadBackground;
  onBackgroundChange: (bg: ScratchpadBackground) => void;
  theme: ThemeMode;
  compact?: boolean;
  isActive?: boolean;
}

interface CameraState {
  panX: number;
  panY: number;
  zoom: number;
}

const MAX_HISTORY = 30;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;

const INK_COLORS = [
  { id: 'ink-auto', label: 'Mực chuẩn (Đen/Trắng)', swatchLight: '#0F172A', swatchDark: '#F8FAFC' },
  { id: '#2563EB', label: 'Xanh dương', swatchLight: '#2563EB', swatchDark: '#38BDF8' },
  { id: '#DC2626', label: 'Đỏ', swatchLight: '#DC2626', swatchDark: '#F87171' },
  { id: '#059669', label: 'Xanh lá', swatchLight: '#059669', swatchDark: '#34D399' },
  { id: '#7C3AED', label: 'Tím', swatchLight: '#7C3AED', swatchDark: '#A78BFA' },
];

const STROKE_WIDTHS = [
  { value: 2, label: 'Mảnh' },
  { value: 4, label: 'Vừa' },
  { value: 7, label: 'Đậm' },
];

const BG_OPTIONS: { id: ScratchpadBackground; label: string }[] = [
  { id: 'plain', label: 'Trơn' },
  { id: 'grid', label: 'Ô vuông' },
  { id: 'dots', label: 'Lưới chấm' },
  { id: 'oxy', label: 'Trục Oxy' },
];

const TOOLS: { id: ScratchpadTool; label: string; icon: React.ReactNode }[] = [
  { id: 'hand', label: 'Di chuyển', icon: <Hand className="w-4 h-4" /> },
  { id: 'pen', label: 'Bút viết', icon: <Pen className="w-4 h-4" /> },
  { id: 'highlighter', label: 'Dạ quang', icon: <Highlighter className="w-4 h-4" /> },
  { id: 'eraser', label: 'Tẩy', icon: <Eraser className="w-4 h-4" /> },
  { id: 'box-erase', label: 'Xóa vùng', icon: <SquareDashedMousePointer className="w-4 h-4" /> },
  { id: 'line', label: 'Đường thẳng', icon: <Minus className="w-4 h-4" /> },
  { id: 'arrow', label: 'Vector', icon: <ArrowUpRight className="w-4 h-4" /> },
  { id: 'circle', label: 'Hình tròn', icon: <Circle className="w-4 h-4" /> },
  { id: 'rect', label: 'Chữ nhật', icon: <Square className="w-4 h-4" /> },
  { id: 'text', label: 'Văn bản', icon: <Type className="w-4 h-4" /> },
];

function resolveStrokeColor(colorToken: string, theme: ThemeMode): string {
  if (colorToken === 'ink-auto') {
    return theme === 'dark' ? '#F8FAFC' : '#0F172A';
  }
  return colorToken;
}

function drawInfiniteBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: ScratchpadBackground,
  theme: ThemeMode,
  camera: CameraState
) {
  const isDark = theme === 'dark';
  ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  if (bg === 'plain') return;

  const { panX, panY, zoom } = camera;

  if (bg === 'grid') {
    const worldStep = 32;
    const step = worldStep * zoom;
    const startX = ((panX % step) + step) % step;
    const startY = ((panY % step) + step) % step;

    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < width; x += step) {
      const px = Math.round(x) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let y = startY; y < height; y += step) {
      const py = Math.round(y) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();
    return;
  }

  if (bg === 'dots') {
    const worldStep = 24;
    const step = worldStep * zoom;
    const startX = ((panX % step) + step) % step;
    const startY = ((panY % step) + step) % step;
    const radius = Math.max(0.8, Math.min(2.2, 1.3 * zoom));

    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
    for (let x = startX; x < width; x += step) {
      for (let y = startY; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  if (bg === 'oxy') {
    const unit = 40;
    const screenStep = unit * zoom;
    const originX = panX;
    const originY = panY;

    // Infinite minor unit grid
    const startX = ((originX % screenStep) + screenStep) % screenStep;
    const startY = ((originY % screenStep) + screenStep) % screenStep;

    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < width; x += screenStep) {
      const px = Math.round(x) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let y = startY; y < height; y += screenStep) {
      const py = Math.round(y) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    const axisColor = isDark ? '#94A3B8' : '#334155';
    ctx.strokeStyle = axisColor;
    ctx.fillStyle = axisColor;
    ctx.lineWidth = 1.6;

    const minUnitX = Math.floor(-originX / screenStep) - 1;
    const maxUnitX = Math.ceil((width - originX) / screenStep) + 1;
    const minUnitY = Math.floor((originY - height) / screenStep) - 1;
    const maxUnitY = Math.ceil(originY / screenStep) + 1;

    // Determine adaptive label step so numbers never overlap when zoomed out
    const labelStride = zoom < 0.4 ? 5 : zoom < 0.7 ? 2 : 1;

    // X Axis (drawn if within or near viewport)
    if (originY >= -24 && originY <= height + 24) {
      const ay = Math.round(originY) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, ay);
      ctx.lineTo(width - 8, ay);
      ctx.stroke();

      // X Arrowhead at right edge
      ctx.beginPath();
      ctx.moveTo(width - 4, ay);
      ctx.lineTo(width - 14, ay - 4.5);
      ctx.lineTo(width - 14, ay + 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let u = minUnitX; u <= maxUnitX; u++) {
        if (u === 0 || u % labelStride !== 0) continue;
        const tx = originX + u * screenStep;
        if (tx < 16 || tx > width - 24) continue;
        ctx.beginPath();
        ctx.moveTo(tx + 0.5, ay - 4);
        ctx.lineTo(tx + 0.5, ay + 4);
        ctx.stroke();
        ctx.fillText(String(u), tx, ay + 7);
      }

      ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('x', width - 10, ay - 8);
    }

    // Y Axis
    if (originX >= -24 && originX <= width + 24) {
      const ax = Math.round(originX) + 0.5;
      ctx.beginPath();
      ctx.moveTo(ax, height);
      ctx.lineTo(ax, 8);
      ctx.stroke();

      // Y Arrowhead at top edge
      ctx.beginPath();
      ctx.moveTo(ax, 4);
      ctx.lineTo(ax - 4.5, 14);
      ctx.lineTo(ax + 4.5, 14);
      ctx.closePath();
      ctx.fill();

      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let u = minUnitY; u <= maxUnitY; u++) {
        if (u === 0 || u % labelStride !== 0) continue;
        const ty = originY - u * screenStep;
        if (ty < 22 || ty > height - 16) continue;
        ctx.beginPath();
        ctx.moveTo(ax - 4, ty + 0.5);
        ctx.lineTo(ax + 4, ty + 0.5);
        ctx.stroke();
        ctx.fillText(String(u), ax - 7, ty);
      }

      ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('y', ax + 10, 10);
    }

    // Origin label O
    if (
      originX >= -20 &&
      originX <= width + 20 &&
      originY >= -20 &&
      originY <= height + 20
    ) {
      ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('O', originX - 7, originY + 6);
    }
  }
}

function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number
) {
  if (points.length === 0) return;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawStrokeElement(
  ctx: CanvasRenderingContext2D,
  el: StrokeElement,
  theme: ThemeMode
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = el.width * 4.5;
    if (el.points) {
      drawSmoothPath(ctx, el.points, ctx.lineWidth);
    }
    ctx.restore();
    return;
  }

  const resolvedColor = resolveStrokeColor(el.color, theme);
  ctx.strokeStyle = resolvedColor;
  ctx.fillStyle = resolvedColor;

  if (el.tool === 'highlighter') {
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = el.width * 3.5;
    if (el.points) {
      drawSmoothPath(ctx, el.points, ctx.lineWidth);
    }
    ctx.restore();
    return;
  }

  ctx.lineWidth = el.width;

  if (el.tool === 'pen' && el.points) {
    drawSmoothPath(ctx, el.points, el.width);
  } else if (el.tool === 'line' && el.start && el.end) {
    ctx.beginPath();
    ctx.moveTo(el.start.x, el.start.y);
    ctx.lineTo(el.end.x, el.end.y);
    ctx.stroke();
  } else if (el.tool === 'arrow' && el.start && el.end) {
    const dx = el.end.x - el.start.x;
    const dy = el.end.y - el.start.y;
    const angle = Math.atan2(dy, dx);
    const headLength = Math.min(18, Math.max(10, Math.hypot(dx, dy) * 0.25)) + el.width;

    ctx.beginPath();
    ctx.moveTo(el.start.x, el.start.y);
    ctx.lineTo(el.end.x, el.end.y);
    ctx.stroke();

    if (Math.hypot(dx, dy) > 4) {
      ctx.beginPath();
      ctx.moveTo(el.end.x, el.end.y);
      ctx.lineTo(
        el.end.x - headLength * Math.cos(angle - Math.PI / 6),
        el.end.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        el.end.x - headLength * Math.cos(angle + Math.PI / 6),
        el.end.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  } else if (el.tool === 'rect' && el.start && el.end) {
    const x = Math.min(el.start.x, el.end.x);
    const y = Math.min(el.start.y, el.end.y);
    const w = Math.abs(el.end.x - el.start.x);
    const h = Math.abs(el.end.y - el.start.y);
    ctx.strokeRect(x, y, w, h);
  } else if (el.tool === 'circle' && el.start && el.end) {
    const cx = (el.start.x + el.end.x) / 2;
    const cy = (el.start.y + el.end.y) / 2;
    const rx = Math.abs(el.end.x - el.start.x) / 2;
    const ry = Math.abs(el.end.y - el.start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (el.tool === 'text' && el.start && el.text) {
    const fontSize = el.width === 2 ? 15 : el.width === 4 ? 19 : 24;
    ctx.font = `500 ${fontSize}px "DM Sans", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    const lines = el.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, el.start!.x, el.start!.y + i * (fontSize * 1.35));
    });
  }

  ctx.restore();
}

function computeStrokesBounds(strokes: StrokeElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasAny = false;

  const includePt = (x: number, y: number, pad = 12) => {
    hasAny = true;
    if (x - pad < minX) minX = x - pad;
    if (y - pad < minY) minY = y - pad;
    if (x + pad > maxX) maxX = x + pad;
    if (y + pad > maxY) maxY = y + pad;
  };

  for (const el of strokes) {
    if (el.tool === 'eraser') continue;
    const pad = el.width * 2 + 12;
    if (el.points) {
      for (const p of el.points) includePt(p.x, p.y, pad);
    }
    if (el.start) includePt(el.start.x, el.start.y, pad);
    if (el.end) includePt(el.end.x, el.end.y, pad);
    if (el.tool === 'text' && el.start && el.text) {
      const lines = el.text.split('\n');
      const maxLen = Math.max(...lines.map((l) => l.length), 4);
      includePt(el.start.x + maxLen * 11, el.start.y + lines.length * 28, 12);
    }
  }

  return hasAny ? { minX, minY, maxX, maxY } : null;
}

interface WorldBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function normalizeBox(a: Point, b: Point): WorldBox {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

function segmentIntersectsBox(
  p1: Point,
  p2: Point,
  box: WorldBox,
  pad: number
): boolean {
  const minX = box.minX - pad;
  const minY = box.minY - pad;
  const maxX = box.maxX + pad;
  const maxY = box.maxY + pad;

  let t0 = 0;
  let t1 = 1;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  return (
    clip(-dx, p1.x - minX) &&
    clip(dx, maxX - p1.x) &&
    clip(-dy, p1.y - minY) &&
    clip(dy, maxY - p1.y) &&
    t0 <= t1
  );
}

function doesStrokeIntersectBox(el: StrokeElement, box: WorldBox): boolean {
  if (el.tool === 'eraser') return false;
  const pad = Math.max(2, el.width * 0.75);

  if ((el.tool === 'pen' || el.tool === 'highlighter') && el.points) {
    if (el.points.length === 0) return false;
    const hitPad = el.tool === 'highlighter' ? el.width * 1.75 : pad;
    if (el.points.length === 1) {
      const p = el.points[0];
      return (
        p.x >= box.minX - hitPad &&
        p.x <= box.maxX + hitPad &&
        p.y >= box.minY - hitPad &&
        p.y <= box.maxY + hitPad
      );
    }
    for (let i = 0; i < el.points.length - 1; i++) {
      if (segmentIntersectsBox(el.points[i], el.points[i + 1], box, hitPad)) {
        return true;
      }
    }
    return false;
  }

  if ((el.tool === 'line' || el.tool === 'arrow') && el.start && el.end) {
    return segmentIntersectsBox(el.start, el.end, box, pad);
  }

  if ((el.tool === 'rect' || el.tool === 'circle') && el.start && el.end) {
    const sMinX = Math.min(el.start.x, el.end.x) - pad;
    const sMaxX = Math.max(el.start.x, el.end.x) + pad;
    const sMinY = Math.min(el.start.y, el.end.y) - pad;
    const sMaxY = Math.max(el.start.y, el.end.y) + pad;
    return (
      sMaxX >= box.minX &&
      sMinX <= box.maxX &&
      sMaxY >= box.minY &&
      sMinY <= box.maxY
    );
  }

  if (el.tool === 'text' && el.start && el.text) {
    const fontSize = el.width === 2 ? 15 : el.width === 4 ? 19 : 24;
    const lines = el.text.split('\n');
    const maxLen = Math.max(...lines.map((l) => l.length), 1);
    const estW = maxLen * fontSize * 0.6;
    const estH = lines.length * fontSize * 1.35;
    return (
      el.start.x + estW >= box.minX &&
      el.start.x <= box.maxX &&
      el.start.y + estH >= box.minY &&
      el.start.y <= box.maxY
    );
  }

  return false;
}

export const SmartScratchpad: React.FC<SmartScratchpadProps> = ({
  strokes,
  onStrokesChange,
  background,
  onBackgroundChange,
  theme,
  compact = false,
  isActive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeStrokeRef = useRef<StrokeElement | null>(null);
  const isDrawingRef = useRef(false);

  // Infinite Canvas camera & panning refs
  const cameraRef = useRef<CameraState>({ panX: 0, panY: 0, zoom: 1 });
  const cameraInitializedRef = useRef(false);
  const isPanningRef = useRef(false);
  const panLastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const pinchStateRef = useRef<{ dist: number; mid: Point } | null>(null);
  const boxEraseRef = useRef<{ startWorld: Point; endWorld: Point } | null>(null);

  const [zoomPercent, setZoomPercent] = useState(100);
  const [spacePanActive, setSpacePanActive] = useState(false);

  const [tool, setTool] = useState<ScratchpadTool>('pen');
  const [color, setColor] = useState<string>('ink-auto');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);

  // Undo / Redo history capped at 30 steps
  const [past, setPast] = useState<StrokeElement[][]>([]);
  const [future, setFuture] = useState<StrokeElement[][]>([]);

  // Floating text input state (stored in world coords)
  const [textDraft, setTextDraft] = useState<{
    id: number;
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    value: string;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const textOpenedAtRef = useRef<number>(0);

  const strokesRef = useRef<StrokeElement[]>(strokes);
  strokesRef.current = strokes;

  const commitNewStrokes = useCallback(
    (nextStrokes: StrokeElement[]) => {
      setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), strokesRef.current]);
      setFuture([]);
      onStrokesChange(nextStrokes);
    },
    [onStrokesChange]
  );

  const handleUndo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setFuture((f) => [strokesRef.current, ...f.slice(0, MAX_HISTORY - 1)]);
      onStrokesChange(previous);
      return prev.slice(0, -1);
    });
  }, [onStrokesChange]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), strokesRef.current]);
      onStrokesChange(next);
      return prev.slice(1);
    });
  }, [onStrokesChange]);

  const handleClear = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    commitNewStrokes([]);
  }, [commitNewStrokes]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (!cameraInitializedRef.current) {
      cameraRef.current = {
        panX: Math.round(rect.width / 2),
        panY: Math.round(rect.height / 2),
        zoom: 1,
      };
      cameraInitializedRef.current = true;
    }

    const dpr = window.devicePixelRatio || 1;
    const pixelW = Math.round(rect.width * dpr);
    const pixelH = Math.round(rect.height * dpr);

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }

    if (!inkCanvasRef.current) {
      inkCanvasRef.current = document.createElement('canvas');
    }
    const inkCanvas = inkCanvasRef.current;
    if (inkCanvas.width !== pixelW || inkCanvas.height !== pixelH) {
      inkCanvas.width = pixelW;
      inkCanvas.height = pixelH;
    }

    const inkCtx = inkCanvas.getContext('2d');
    const displayCtx = canvas.getContext('2d');
    if (!inkCtx || !displayCtx) return;

    const cam = cameraRef.current;

    // 1. Render all ink strokes in World Coordinates onto offscreen ink buffer
    inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    inkCtx.clearRect(0, 0, pixelW, pixelH);
    inkCtx.setTransform(
      dpr * cam.zoom,
      0,
      0,
      dpr * cam.zoom,
      cam.panX * dpr,
      cam.panY * dpr
    );

    const selectionBox = boxEraseRef.current
      ? normalizeBox(boxEraseRef.current.startWorld, boxEraseRef.current.endWorld)
      : null;

    for (const stroke of strokesRef.current) {
      const isMarkedForDelete =
        selectionBox !== null && doesStrokeIntersectBox(stroke, selectionBox);
      if (isMarkedForDelete) {
        inkCtx.save();
        inkCtx.globalAlpha = 0.25;
        drawStrokeElement(inkCtx, stroke, theme);
        inkCtx.restore();
      } else {
        drawStrokeElement(inkCtx, stroke, theme);
      }
    }
    if (activeStrokeRef.current) {
      drawStrokeElement(inkCtx, activeStrokeRef.current, theme);
    }

    // 2. Render infinite background + grid onto display canvas, then composite ink buffer
    displayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawInfiniteBackgroundLayer(displayCtx, rect.width, rect.height, background, theme, cam);

    displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    displayCtx.drawImage(inkCanvas, 0, 0);

    // 3. Render active Box-Erase marquee rectangle in screen coordinates
    if (selectionBox) {
      const sx = selectionBox.minX * cam.zoom + cam.panX;
      const sy = selectionBox.minY * cam.zoom + cam.panY;
      const sw = (selectionBox.maxX - selectionBox.minX) * cam.zoom;
      const sh = (selectionBox.maxY - selectionBox.minY) * cam.zoom;

      displayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      displayCtx.save();
      displayCtx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      displayCtx.strokeStyle = '#EF4444';
      displayCtx.lineWidth = 1.5;
      displayCtx.setLineDash([6, 4]);
      displayCtx.fillRect(sx, sy, sw, sh);
      displayCtx.strokeRect(sx, sy, sw, sh);
      displayCtx.restore();
    }
  }, [background, theme]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      renderCanvas();
    });
  }, [renderCanvas]);

  const zoomAtPoint = useCallback(
    (nextZoomRaw: number, focalScreenX: number, focalScreenY: number) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
      const cam = cameraRef.current;
      const worldX = (focalScreenX - cam.panX) / cam.zoom;
      const worldY = (focalScreenY - cam.panY) / cam.zoom;

      cameraRef.current = {
        zoom: nextZoom,
        panX: focalScreenX - worldX * nextZoom,
        panY: focalScreenY - worldY * nextZoom,
      };
      setZoomPercent(Math.round(nextZoom * 100));
      scheduleRender();
    },
    [scheduleRender]
  );

  const handleZoomButton = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      zoomAtPoint(cameraRef.current.zoom * factor, rect.width / 2, rect.height / 2);
    },
    [zoomAtPoint]
  );

  const handleResetViewToOrigin = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    cameraRef.current = {
      panX: Math.round(rect.width / 2),
      panY: Math.round(rect.height / 2),
      zoom: 1,
    };
    setZoomPercent(100);
    scheduleRender();
  }, [scheduleRender]);

  const handleFitContent = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const bounds = computeStrokesBounds(strokesRef.current);
    if (!bounds) {
      handleResetViewToOrigin();
      return;
    }
    const contentW = Math.max(80, bounds.maxX - bounds.minX);
    const contentH = Math.max(80, bounds.maxY - bounds.minY);
    const pad = 64;
    const nextZoom = Math.min(
      1.6,
      Math.max(
        MIN_ZOOM,
        Math.min((rect.width - pad) / contentW, (rect.height - pad) / contentH)
      )
    );
    const centerWorldX = (bounds.minX + bounds.maxX) / 2;
    const centerWorldY = (bounds.minY + bounds.maxY) / 2;

    cameraRef.current = {
      zoom: nextZoom,
      panX: rect.width / 2 - centerWorldX * nextZoom,
      panY: rect.height / 2 - centerWorldY * nextZoom,
    };
    setZoomPercent(Math.round(nextZoom * 100));
    scheduleRender();
  }, [handleResetViewToOrigin, scheduleRender]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y, Spacebar temporary pan, H for hand tool
  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setSpacePanActive(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setSpacePanActive(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isActive, handleUndo, handleRedo]);

  // Wheel pan & Ctrl/Cmd+Wheel zoom with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = Math.exp(-e.deltaY * 0.004);
        zoomAtPoint(cameraRef.current.zoom * zoomFactor, sx, sy);
      } else {
        cameraRef.current = {
          ...cameraRef.current,
          panX: cameraRef.current.panX - e.deltaX,
          panY: cameraRef.current.panY - e.deltaY,
        };
        scheduleRender();
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoomAtPoint, scheduleRender]);

  // Re-render whenever strokes, background, or theme changes
  useEffect(() => {
    scheduleRender();
  }, [strokes, background, theme, scheduleRender]);

  // Observe container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      scheduleRender();
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scheduleRender]);

  const textDraftId = textDraft?.id ?? null;
  useEffect(() => {
    if (textDraftId === null) return;
    const raf = requestAnimationFrame(() => {
      textInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [textDraftId]);

  const getScreenPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const screenToWorld = (screenPt: Point): Point => {
    const cam = cameraRef.current;
    return {
      x: (screenPt.x - cam.panX) / cam.zoom,
      y: (screenPt.y - cam.panY) / cam.zoom,
    };
  };

  const commitTextDraft = () => {
    if (!textDraft) return;
    const trimmed = textDraft.value.trim();
    if (trimmed) {
      const el: StrokeElement = {
        id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool: 'text',
        color,
        width: strokeWidth,
        start: { x: textDraft.worldX, y: textDraft.worldY },
        text: trimmed,
      };
      commitNewStrokes([...strokesRef.current, el]);
    }
    setTextDraft(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPt = getScreenPoint(e);
    activePointersRef.current.set(e.pointerId, screenPt);

    // 2-finger touch gesture (pinch + pan)
    if (activePointersRef.current.size === 2) {
      isDrawingRef.current = false;
      activeStrokeRef.current = null;
      boxEraseRef.current = null;
      isPanningRef.current = false;
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      pinchStateRef.current = { dist, mid };
      scheduleRender();
      return;
    }

    // Quick Box-Erase: Ctrl/Meta + Right-Click drag OR active 'box-erase' tool
    const isBoxEraseShortcut = (e.ctrlKey || e.metaKey) && e.button === 2;
    const isBoxEraseTool = tool === 'box-erase' && e.button === 0;
    if (isBoxEraseShortcut || isBoxEraseTool) {
      if (textDraft) commitTextDraft();
      e.currentTarget.setPointerCapture(e.pointerId);
      const worldPt = screenToWorld(screenPt);
      boxEraseRef.current = { startWorld: worldPt, endWorld: worldPt };
      scheduleRender();
      return;
    }

    // Middle click, plain Right click, Hand tool, or Spacebar held -> Pan mode
    const shouldPan =
      e.button === 1 ||
      e.button === 2 ||
      tool === 'hand' ||
      isSpacePressedRef.current;

    if (shouldPan) {
      e.currentTarget.setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      panLastScreenRef.current = screenPt;
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (textDraft) {
      commitTextDraft();
      return;
    }

    const worldPt = screenToWorld(screenPt);

    if (tool === 'text') {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      textOpenedAtRef.current = Date.now();
      setTextDraft({
        id: Date.now(),
        worldX: worldPt.x,
        worldY: worldPt.y,
        screenX: Math.min(screenPt.x, Math.max(16, rect.width - 230)),
        screenY: Math.min(screenPt.y, Math.max(16, rect.height - 96)),
        value: '',
      });
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const id = `str-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      activeStrokeRef.current = {
        id,
        tool,
        color,
        width: strokeWidth,
        points: [worldPt],
      };
    } else {
      activeStrokeRef.current = {
        id,
        tool,
        color,
        width: strokeWidth,
        start: worldPt,
        end: worldPt,
      };
    }
    scheduleRender();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPt = getScreenPoint(e);
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, screenPt);
    }

    // Handle 2-finger pinch & pan
    if (activePointersRef.current.size === 2 && pinchStateRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const prev = pinchStateRef.current;

      const dx = mid.x - prev.mid.x;
      const dy = mid.y - prev.mid.y;
      cameraRef.current = {
        ...cameraRef.current,
        panX: cameraRef.current.panX + dx,
        panY: cameraRef.current.panY + dy,
      };
      if (prev.dist > 5) {
        const factor = dist / prev.dist;
        zoomAtPoint(cameraRef.current.zoom * factor, mid.x, mid.y);
      } else {
        scheduleRender();
      }
      pinchStateRef.current = { dist, mid };
      return;
    }

    if (boxEraseRef.current) {
      boxEraseRef.current.endWorld = screenToWorld(screenPt);
      scheduleRender();
      return;
    }

    if (isPanningRef.current) {
      const dx = screenPt.x - panLastScreenRef.current.x;
      const dy = screenPt.y - panLastScreenRef.current.y;
      panLastScreenRef.current = screenPt;
      cameraRef.current = {
        ...cameraRef.current,
        panX: cameraRef.current.panX + dx,
        panY: cameraRef.current.panY + dy,
      };
      scheduleRender();
      return;
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const worldPt = screenToWorld(screenPt);
    const active = activeStrokeRef.current;

    if (active.points) {
      const last = active.points[active.points.length - 1];
      if (Math.hypot(worldPt.x - last.x, worldPt.y - last.y) >= 1.2 / cameraRef.current.zoom) {
        active.points.push(worldPt);
        scheduleRender();
      }
    } else {
      active.end = worldPt;
      scheduleRender();
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (boxEraseRef.current) {
      const box = normalizeBox(
        boxEraseRef.current.startWorld,
        boxEraseRef.current.endWorld
      );
      boxEraseRef.current = null;

      let remaining = strokesRef.current.filter(
        (el) => !doesStrokeIntersectBox(el, box)
      );
      if (remaining.every((el) => el.tool === 'eraser')) {
        remaining = [];
      }

      if (remaining.length !== strokesRef.current.length) {
        commitNewStrokes(remaining);
      } else {
        scheduleRender();
      }
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;

    const completed = activeStrokeRef.current;
    activeStrokeRef.current = null;
    commitNewStrokes([...strokesRef.current, completed]);
  };

  const handleExportPng = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const bounds = computeStrokesBounds(strokesRef.current);

    if (!bounds) {
      renderCanvas();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `bang-nhap-eduworkspace-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Export full bounding box of infinite canvas drawings
    const padding = 60;
    const exportW = Math.min(3200, Math.max(rect.width, Math.ceil(bounds.maxX - bounds.minX + padding * 2)));
    const exportH = Math.min(3200, Math.max(rect.height, Math.ceil(bounds.maxY - bounds.minY + padding * 2)));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = exportW;
    outCanvas.height = exportH;
    const outCtx = outCanvas.getContext('2d');

    const inkOut = document.createElement('canvas');
    inkOut.width = exportW;
    inkOut.height = exportH;
    const inkOutCtx = inkOut.getContext('2d');

    if (!outCtx || !inkOutCtx) return;

    const exportCam: CameraState = {
      panX: -bounds.minX + padding,
      panY: -bounds.minY + padding,
      zoom: 1,
    };

    drawInfiniteBackgroundLayer(outCtx, exportW, exportH, background, theme, exportCam);
    inkOutCtx.setTransform(1, 0, 0, 1, exportCam.panX, exportCam.panY);
    for (const s of strokesRef.current) {
      drawStrokeElement(inkOutCtx, s, theme);
    }
    outCtx.drawImage(inkOut, 0, 0);

    const url = outCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang-nhap-eduworkspace-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cursorClass =
    tool === 'hand' || spacePanActive
      ? 'cursor-grab active:cursor-grabbing'
      : tool === 'text'
        ? 'cursor-text'
        : 'cursor-crosshair';

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-slate-950 select-none">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {TOOLS.map((item) => {
              const active = tool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (textDraft) commitTextDraft();
                    setTool(item.id);
                  }}
                  title={item.label}
                  aria-label={item.label}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  {!compact && <span className="hidden xl:inline">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* 5 High-Contrast Colors */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            {INK_COLORS.map((c) => {
              const swatch = theme === 'dark' ? c.swatchDark : c.swatchLight;
              const isSelected = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  aria-label={c.label}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    isSelected
                      ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              );
            })}
          </div>

          {/* 3 Stroke Widths */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setStrokeWidth(w.value)}
                title={`Nét ${w.label}`}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  strokeWidth === w.value
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background Grid + Pedagogical Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Grid3X3 className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5 hidden sm:block" />
            {BG_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => onBackgroundChange(bg.id)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  background === bg.id
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={past.length === 0}
              title="Hoàn tác (Ctrl+Z)"
              aria-label="Hoàn tác"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0}
              title="Làm lại (Ctrl+Y)"
              aria-label="Làm lại"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              title="Xóa toàn bộ nét vẽ"
              aria-label="Xóa bảng"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {!compact && <span className="hidden sm:inline">Xóa bảng</span>}
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              title="Xuất toàn bộ bảng vẽ vô hạn ra ảnh PNG"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{compact ? 'PNG' : 'Xuất ảnh PNG'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Infinite Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full h-full block touch-none ${cursorClass}`}
        />

        {/* Floating Infinite Canvas Navigation & Zoom HUD */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-xs">
          <button
            type="button"
            onClick={() => handleZoomButton(0.8)}
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetViewToOrigin}
            title="Đặt lại thu phóng 100% và về gốc O"
            className="px-2 py-1 rounded-md font-mono tabular-nums text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() => handleZoomButton(1.25)}
            title="Phóng to"
            aria-label="Phóng to"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={handleResetViewToOrigin}
            title="Về tâm tọa độ O"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            {!compact && <span>Về tâm</span>}
          </button>

          {strokes.length > 0 && (
            <button
              type="button"
              onClick={handleFitContent}
              title="Căn vừa toàn bộ nét vẽ"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              {!compact && <span>Vừa khung</span>}
            </button>
          )}
        </div>

        {/* Subtle pan & quick-erase hint */}
        {!compact && (
          <div className="hidden md:block absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 pointer-events-none">
            Bảng vô hạn: Cuộn / Space + kéo để di chuyển · Ctrl + cuộn thu phóng · Ctrl + Chuột phải khoanh vùng xóa nhanh
          </div>
        )}

        {/* Floating Text Input Overlay */}
        {textDraft && (
          <div
            className="absolute z-30 select-text"
            style={{ left: `${textDraft.screenX}px`, top: `${textDraft.screenY}px` }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl border-2 border-sky-500 bg-white dark:bg-slate-900 shadow-lg p-1.5 flex flex-col gap-1.5">
              <textarea
                ref={textInputRef}
                autoFocus
                rows={2}
                value={textDraft.value}
                onChange={(e) =>
                  setTextDraft((prev) =>
                    prev ? { ...prev, value: e.target.value } : null
                  )
                }
                onBlur={() => {
                  if (Date.now() - textOpenedAtRef.current < 220) {
                    requestAnimationFrame(() => textInputRef.current?.focus());
                    return;
                  }
                  commitTextDraft();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitTextDraft();
                  } else if (e.key === 'Escape') {
                    setTextDraft(null);
                  }
                }}
                placeholder="Nhập văn bản..."
                className="select-text min-w-[200px] px-2 py-1 rounded-md bg-transparent text-slate-900 dark:text-slate-100 text-sm focus:outline-none resize"
              />
              <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
                <span>Enter để lưu · Shift+Enter xuống dòng</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTextDraft(null);
                    }}
                    className="px-2 py-0.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commitTextDraft();
                    }}
                    className="px-2 py-0.5 rounded bg-sky-600 text-white font-medium hover:bg-sky-700"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
