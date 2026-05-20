import React from 'react';
import { DeliveryNote } from '../../../types';
import { AssignmentCard } from './AssignmentCard';

interface DriverPortalTripListProps {
  dns: DeliveryNote[];
  onSelect: (dn: DeliveryNote) => void;
}

export const DriverPortalTripList: React.FC<DriverPortalTripListProps> = ({ dns, onSelect }) => {
  if (!dns.length) {
    return (
      <div className="py-48 text-center border-t border-slate-100">
        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No active deployments found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dns.map((dn) => (
        <AssignmentCard key={dn.id} dn={dn} onClick={onSelect} />
      ))}
    </div>
  );
};
