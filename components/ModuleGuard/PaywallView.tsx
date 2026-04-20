
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Rocket, CheckCircle2 } from 'lucide-react';
import { ModuleId } from '../../types';
import { AVAILABLE_MODULES } from '../../constants';
import { Badge } from '../../packages/ui';

interface PaywallViewProps {
  moduleId: ModuleId;
  requiredPlan: string;
}

export const PaywallView: React.FC<PaywallViewProps> = ({ moduleId, requiredPlan }) => {
  const moduleDef = AVAILABLE_MODULES.find(m => m.id === moduleId);
  const navigate = useNavigate();

  const getUpgradePrompt = (id: ModuleId) => {
    switch (id) {
      case 'fleet':
        return "Your fleet's compliance score is at risk. Upgrade to SCALE to unlock AI-driven maintenance scheduling and automated NTSA inspection alerts.";
      case 'finance':
        return "Our AI detected a potential revenue leakage of KES 12,400 this week — upgrade to SCALE to see the full report and automated billing anomaly alerts.";
      case 'analytics':
        return "Prescriptive analysis predicts a 15% increase in demand next week. Upgrade to SCALE to see operational directives and predictive inventory intelligence.";
      case 'integrations':
        return "Manual data entry is costing your team ~12 hours per week. Upgrade to SCALE to unlock real-time ERP connectors for SAP, Oracle, and Odoo.";
      case 'client-portal':
        return "Customers who track their own deliveries reduce support volume by 40%. Upgrade to GROWTH to unlock the branded tracking portal.";
      case 'orders':
        return "Unlock advanced order capture and warehouse sync. Upgrade to GROWTH to manage unlimited shipments and client approvals.";
      case 'facility-portal':
        return "Optimize multi-hub operations. Upgrade to SCALE to unlock facility-specific loading controls and regional intelligence reporting.";
      default:
        return `The ${moduleDef?.name || moduleId} module is part of our ${requiredPlan || 'Premium'} tier. Unlock advanced capabilities to scale your logistics operations.`;
    }
  };

  if (!moduleId) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="max-w-lg w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-brand/10 relative overflow-hidden"
      >
        <motion.div 
          initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
          animate={{ opacity: 0.05, rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="absolute top-0 right-0 p-12 pointer-events-none"
        >
          <Rocket size={200} className="text-brand" />
        </motion.div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="h-16 w-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand"
            >
              <Lock size={32} />
            </motion.div>
            <div>
              <Badge variant="neutral" className="mb-2">Premium Feature</Badge>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                Upgrade to {requiredPlan || 'Premium'}
              </h2>
            </div>
          </div>

          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 font-medium text-lg leading-relaxed"
          >
            {getUpgradePrompt(moduleId)}
          </motion.p>

          {moduleDef && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{moduleDef.description}</span>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/subscription')}
              className="flex-1 py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-accent transition-all"
            >
              View Pricing Plans
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="flex-1 py-5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Go Back
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
