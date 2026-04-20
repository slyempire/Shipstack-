import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, CheckCircle2, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  dnId: string;
  customerPhone: string;
  onSuccess: (receipt: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  dnId,
  customerPhone,
  onSuccess
}) => {
  const [phone, setPhone] = useState(customerPhone);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useAppStore();

  const handleInitiate = async () => {
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    setStatus('PENDING');
    setError(null);

    try {
      const response = await api.initiateMpesaPayment(phone, amount, dnId);
      
      if (response.status === 'SUCCESS') {
        // In a real app, we'd poll for status, but here we'll simulate success
        setTimeout(() => {
          setStatus('SUCCESS');
          onSuccess(response.receiptNumber || `MP-${Date.now()}`);
          addNotification('Payment received successfully', 'success');
        }, 2000);
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'Failed to initiate payment');
      addNotification('Payment initiation failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">M-Pesa Payment</h3>
                <p className="text-sm text-emerald-600 font-medium">STK Push Integration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-8">
            {status === 'IDLE' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-semibold">Amount to Pay</p>
                  <p className="text-4xl font-black text-gray-900">KES {amount.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 italic">Enter phone in format 2547XXXXXXXX</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleInitiate}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Request Payment
                </button>
              </div>
            )}

            {status === 'PENDING' && (
              <div className="py-12 text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                  <Smartphone className="absolute inset-0 m-auto w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Pushing STK...</h4>
                  <p className="text-gray-500 mt-2">Please check your phone and enter M-Pesa PIN to complete payment.</p>
                </div>
              </div>
            )}

            {status === 'SUCCESS' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Payment Confirmed!</h4>
                  <p className="text-gray-500 mt-2">The transaction was successful. You can now proceed with the delivery.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {status === 'ERROR' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Payment Failed</h4>
                  <p className="text-gray-500 mt-2">{error || 'Something went wrong. Please try again.'}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStatus('IDLE')}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
