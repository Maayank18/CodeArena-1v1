import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

const SubscriptionModal = ({ isOpen, onClose, plan }) => {
  if (!plan) return null;

  const { name, price, features, color, icon: Icon } = plan;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop: Dark, blurred overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container: Vertically constrained and professionally styled */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#121212] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] z-10 overflow-hidden"
            style={{ 
              boxShadow: `0 0 40px -10px ${color}40` 
            }}
          >
            {/* Close Button: Clean, circular, integrated */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white rounded-full transition-colors hover:bg-gray-800"
            >
              <X size={18} />
            </button>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              
              {/* Header Icon */}
              <div className="flex justify-center mb-6">
                 <div 
                   className="p-5 rounded-2xl flex items-center justify-center relative group"
                   style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
                 >
                    <Icon className="relative z-10 drop-shadow-lg" size={40} style={{ color }} />
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: color }}></div>
                 </div>
              </div>

              {/* Header Text */}
              <div className="text-center mb-8">
                <h2 className="text-sm font-black tracking-[0.3em] uppercase mb-2" style={{ color }}>
                  {name} PLAN
                </h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-white">{price}</span>
                  <span className="text-gray-400 font-bold">/mo</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-black tracking-widest uppercase">
                  Billed Monthly • Cancel Anytime
                </p>
              </div>

              {/* Inner Features Box (Professional Gray Palette) */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 mb-8">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                  What's included:
                </h3>
                <ul className="space-y-4">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color }} />
                      <span className="text-sm text-gray-300 font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                className="w-full py-4 rounded-xl font-black text-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 10px 30px -10px ${color}60`
                }}
              >
                Proceed to Payment
              </button>
              
              <p className="mt-6 text-[10px] text-gray-500 font-medium text-center">
                By clicking proceed, you agree to our <span className="underline cursor-pointer hover:text-gray-300">Terms of Service</span>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
