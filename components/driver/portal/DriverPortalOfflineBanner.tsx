import React from 'react';

interface DriverPortalOfflineBannerProps {
  isOffline: boolean;
}

export const DriverPortalOfflineBanner: React.FC<DriverPortalOfflineBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="bg-amber-200 border-b border-amber-300 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 py-3">
      Offline mode active — using cached trip data.
    </div>
  );
};
