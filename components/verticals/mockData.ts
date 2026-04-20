
import { IndustryType } from '../../types';

export const getMockVerticalData = (industry: IndustryType) => {
  switch (industry) {
    case 'FOOD':
    case 'PROCESSING':
      return {
        harvestPlan: [
          { produce: 'Hass Avocado', region: 'Murang\'a', peakDate: 'May 12', volume: 15.2, status: 'Peak' },
          { produce: 'Standard Tea', region: 'Kericho', peakDate: 'Apr 28', volume: 42.0, status: 'Active' },
          { produce: 'Macadamia', region: 'Embu', peakDate: 'Jun 05', volume: 8.4, status: 'Approaching' },
        ],
        sensorAlerts: [
          { tripId: 'AG-782', temp: 3.2, location: 'Salgaa', type: 'OK', status: 'Optimal' },
          { tripId: 'AG-901', temp: 5.4, location: 'Gilgil', type: 'WARNING', status: 'High' },
          { tripId: 'AG-102', temp: 3.9, location: 'Limuru', type: 'OK', status: 'Optimal' },
        ]
      };
    case 'MEDICAL':
    case 'PHARMA':
      return {
        medicalBatches: [
          { id: 'OX-9002', name: 'Oxytocin Bulk', custodian: 'Dr. Jane Mugo', temp: 4.2, nextHandover: 'Kericho District' },
          { id: 'VR-1123', name: 'Viral Load Kits', custodian: 'Samson K.', temp: 2.1, nextHandover: 'Kisumu Hub' },
          { id: 'PS-4402', name: 'Controlled Pain Relief', custodian: 'Alice W.', temp: 9.2, nextHandover: 'Aga Khan Hosp.' },
        ]
      };
    case 'E-COMMERCE':
    case 'RETAIL':
      return {
        returns: [
          { id: 'RET-881', customer: 'Brenda O.', status: 'Processing', reason: 'Sizing Issue' },
          { id: 'RET-902', customer: 'Kevin M.', status: 'Automated', reason: 'Damaged on Arrival' },
          { id: 'RET-104', customer: 'Stacy W.', status: 'Inspection', reason: 'Change of Mind' },
        ],
        marketplaces: [
          { name: 'Jumia', orders: 142, status: 'Synced' },
          { name: 'Kilimall', orders: 84, status: 'Synced' },
          { name: 'Webstore', orders: 16, status: 'Active' },
        ]
      };
    default:
      return {};
  }
};
