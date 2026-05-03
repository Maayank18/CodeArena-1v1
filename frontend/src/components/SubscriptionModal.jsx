import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const SubscriptionModal = ({ isOpen, onClose, plan }) => {
  const { isDark } = useTheme();

  if (!plan) return null;

  const { name, price, features, color, icon: Icon } = plan;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'var(--overlay-scrim)' }}
          />

          {/* Legacy Bright Theme Modal Surface (for quick reversal): bg-[#121212] border-gray-800 */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-2xl"
            style={{ boxShadow: `0 0 40px -10px ${color}40` }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>

            <div className="custom-scrollbar overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 flex justify-center">
                <div
                  className="group relative flex items-center justify-center rounded-2xl p-5"
                  style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
                >
                  <Icon className="relative z-10 drop-shadow-lg" size={40} style={{ color }} />
                  <div className="absolute inset-0 rounded-2xl blur-lg opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: color }} />
                </div>
              </div>

              <div className="mb-8 text-center">
                <h2 className="mb-2 text-sm font-black uppercase tracking-[0.3em]" style={{ color }}>
                  {name} PLAN
                </h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-[var(--text-primary)]">{price}</span>
                  <span className="font-bold text-[var(--text-secondary)]">/mo</span>
                </div>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  Billed Monthly • Cancel Anytime
                </p>
              </div>

              <div className="mb-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-6">
                <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  What's included:
                </h3>
                <ul className="space-y-4">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color }} />
                      <span className="text-sm font-medium leading-tight text-[var(--text-primary)]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 10px 30px -10px ${color}60`,
                }}
              >
                Proceed to Payment
              </button>

              <p className="mt-6 text-center text-[10px] font-medium text-[var(--text-secondary)]">
                By clicking proceed, you agree to our <span className={`underline cursor-pointer ${isDark ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}>Terms of Service</span>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
