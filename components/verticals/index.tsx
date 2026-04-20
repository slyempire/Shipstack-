
import React, { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IndustryType } from '../../types';
import { getMockVerticalData } from './mockData';
import { EcommerceIntelligence } from './EcommerceIntelligence';
import { AgricultureIntelligence } from './AgricultureIntelligence';
import { HealthcareIntelligence } from './HealthcareIntelligence';
import { RetailIntelligence } from './RetailIntelligence';

interface VerticalIntelligenceProps {
  industry: IndustryType;
}

export const VerticalIntelligence: React.FC<VerticalIntelligenceProps> = ({ industry }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (industry === 'GENERAL') {
       setLoading(false);
       return;
    }
    setLoading(true);
    // Simulate vertical data fetch
    const timer = setTimeout(() => {
      setData(getMockVerticalData(industry));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [industry]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-slate-200 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading {industry} intelligence...</p>
      </div>
    );
  }

  if (industry === 'GENERAL') {
    return (
      <div className="bg-white rounded-[2rem] p-16 border-2 border-dashed border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
         <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6">
            <ShoppingBag size={32} />
         </div>
         <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-3">Industry Hub Inactive</h3>
         <p className="text-sm text-slate-500 font-medium max-w-sm mb-8">
            Tailor your ecosystem for specialized medical, retail, or agricultural operations via the solution marketplace.
         </p>
         <button 
           onClick={() => navigate('/admin/marketplace')}
           className="px-10 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
         >
            Explore Marketplace
         </button>
      </div>
    );
  }

  switch (industry) {
    case 'FOOD':
    case 'PROCESSING':
      return <AgricultureIntelligence data={data} />;
    case 'MEDICAL':
    case 'PHARMA':
      return <HealthcareIntelligence data={data} />;
    case 'E-COMMERCE':
      return <EcommerceIntelligence data={data} />;
    case 'RETAIL':
      return <RetailIntelligence data={data} />;
    default:
      return (
        <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm flex items-center justify-center min-h-[400px]">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select an industry vertical to view insights</p>
        </div>
      );
  }
};
