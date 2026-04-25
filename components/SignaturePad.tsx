
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  label?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onCapture, onClose, label = 'Customer Signature' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Placeholder guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rect.width * 0.1, rect.height * 0.72);
    ctx.lineTo(rect.width * 0.9, rect.height * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasStrokes(true);
  }, [isDrawing]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Redraw guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rect.width * 0.1, rect.height * 0.72);
    ctx.lineTo(rect.width * 0.9, rect.height * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasStrokes(false);
  };

  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCapture(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Proof of Delivery</p>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{label}</h3>
          </div>
          <button onClick={clear} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all">
            <RotateCcw size={13} /> Clear
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            {hasStrokes ? 'Signature captured' : 'Sign in the box below'}
          </p>
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50 touch-none select-none">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: 180, display: 'block', cursor: 'crosshair' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
        </div>

        <div className="px-6 pb-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={capture}
            disabled={!hasStrokes}
            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Check size={16} /> Confirm Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
