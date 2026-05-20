import React from 'react';

interface DriverPortalSignaturePadProps {
  open: boolean;
  onClose: () => void;
  onSign: () => void;
}

export const DriverPortalSignaturePad: React.FC<DriverPortalSignaturePadProps> = ({
  open,
  onClose,
  onSign
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9000] bg-black text-white flex flex-col items-center justify-center p-12 transition-all">
      <h3 className="text-4xl font-black uppercase tracking-tighter mb-20">Customer Signing</h3>
      <div className="w-full max-w-lg aspect-video bg-white border-8 border-slate-500/20 relative flex items-center justify-center overflow-hidden">
        <p className="text-black/5 text-8xl font-black uppercase tracking-[0.5em] rotate-[-20deg]">Sign Here</p>
        <div
          className="absolute inset-0 cursor-crosshair"
          onClick={onSign}
          role="button"
          aria-label="Capture signature"
        />
      </div>
      <button onClick={onClose} className="mt-20 text-xs font-black uppercase tracking-[1em] opacity-40">
        Abort
      </button>
    </div>
  );
};
