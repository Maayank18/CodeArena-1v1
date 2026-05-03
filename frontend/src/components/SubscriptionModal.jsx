import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionModal = ({ isOpen, onClose, plan }) => {
  const [step, setStep] = useState(1);
  const [orderData, setOrderData] = useState({
    fullName: '',
    college: '',
    phone: '',
    passoutYear: '2026',
    agreedToTC: false,
  });

  // Fetch user from localStorage for pre-filling email
  const user = JSON.parse(localStorage.getItem('codearena_user')) || {};
  const email = user.email || 'user@example.com';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!plan) return null;

  const { name, price, features, color, icon: Icon } = plan;

  // Price calculations
  const basePrice = parseInt(price.replace('₹', '')) || 0;
  const gst = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gst;

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isFormValid = orderData.fullName.trim() !== '' && 
                     orderData.college.trim() !== '' && 
                     orderData.phone.trim().length >= 10 && 
                     orderData.agreedToTC;

  const steps = [
    { id: 1, name: 'Plan' },
    { id: 2, name: 'Details' },
    { id: 3, name: 'Summary' },
  ];

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4 sm:p-8 py-8 sm:py-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-md bg-black/60"
          />

          {/* Modal Surface */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-[2.5rem] border border-gray-800 bg-[#121212] shadow-2xl"
            style={{ boxShadow: `0 0 50px -10px ${color}30` }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-30 rounded-full border border-gray-800 bg-gray-900/50 p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Stepper (Visible on Step 2 and 3) */}
            <div className="relative p-8 pb-0 flex-shrink-0">
              <AnimatePresence mode="wait">
                {step > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-4 mb-4"
                  >
                    {steps.map((s, idx) => (
                      <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-1.5">
                          <div 
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                              step >= s.id ? 'text-black' : 'bg-gray-900 text-gray-600 border border-gray-800'
                            }`}
                            style={step >= s.id ? { backgroundColor: color } : {}}
                          >
                            {step > s.id ? <CheckCircle2 size={14} /> : s.id}
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s.id ? 'text-white' : 'text-gray-600'}`}>
                            {s.name}
                          </span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className="h-[1px] w-10 rounded-full bg-gray-800 overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: step > s.id ? '100%' : '0%' }}
                               className="h-full"
                               style={{ backgroundColor: color }}
                             />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait" custom={step}>
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="p-8 pt-4 flex flex-col items-center"
                  >
                    <div
                      className="mb-6 flex items-center justify-center rounded-[2rem] p-6 relative group"
                      style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
                    >
                      <Icon className="relative z-10 drop-shadow-lg" size={56} style={{ color }} />
                      <div className="absolute inset-0 rounded-[2rem] blur-2xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: color }} />
                    </div>

                    <div className="text-center mb-8">
                      <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-2" style={{ color }}>
                        {name} PLAN
                      </h2>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-6xl font-black text-white tracking-tighter">{price}</span>
                        <span className="font-bold text-gray-500">/mo</span>
                      </div>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                        Billed Monthly • Cancel Anytime
                      </p>
                    </div>

                    <div className="w-full mb-8 rounded-3xl border border-gray-800 bg-[#1a1a1a]/50 p-6">
                      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        What's included:
                      </h3>
                      <ul className="space-y-4">
                        {features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                               <CheckCircle2 size={12} style={{ color }} />
                            </div>
                            <span className="text-xs font-semibold leading-tight text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 15px 35px -10px ${color}60`,
                      }}
                    >
                      Get Started Now
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="p-8 pt-4"
                  >
                    <div className="mb-6">
                       <h2 className="text-2xl font-black text-white tracking-tight">Personal Details</h2>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Fill in your information to proceed</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Email (Registered)</label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-gray-600 cursor-not-allowed font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={orderData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your official name"
                          className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all focus:border-opacity-100 placeholder:text-gray-700 font-semibold"
                          style={{ borderColor: orderData.fullName ? color : undefined }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">College / Institution</label>
                        <input
                          type="text"
                          name="college"
                          value={orderData.college}
                          onChange={handleInputChange}
                          placeholder="University name"
                          className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all placeholder:text-gray-700 font-semibold"
                          style={{ borderColor: orderData.college ? color : undefined }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-black">+91</span>
                            <input
                              type="tel"
                              name="phone"
                              value={orderData.phone}
                              onChange={handleInputChange}
                              placeholder="0000000000"
                              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-xs text-white focus:outline-none transition-all placeholder:text-gray-700 font-semibold"
                              style={{ borderColor: orderData.phone.length >= 10 ? color : undefined }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Passout Year</label>
                          <select
                            name="passoutYear"
                            value={orderData.passoutYear}
                            onChange={handleInputChange}
                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all font-semibold appearance-none cursor-pointer"
                          >
                            <option value="2024">Batch of 2024</option>
                            <option value="2025">Batch of 2025</option>
                            <option value="2026">Batch of 2026</option>
                            <option value="2027">Batch of 2027</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer group mt-2">
                        <input
                          type="checkbox"
                          name="agreedToTC"
                          checked={orderData.agreedToTC}
                          onChange={handleInputChange}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${orderData.agreedToTC ? 'border-transparent' : 'border-gray-800 bg-[#1a1a1a]'}`}
                             style={orderData.agreedToTC ? { backgroundColor: color } : {}}>
                          {orderData.agreedToTC && <CheckCircle2 size={14} className="text-black" />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                          I agree to the <span className="underline decoration-gray-700">Terms and Conditions</span>
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={handleNext}
                        disabled={!isFormValid}
                        className={`w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-black transition-all ${!isFormValid ? 'opacity-30 cursor-not-allowed bg-gray-600' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        style={isFormValid ? { backgroundColor: color, boxShadow: `0 10px 30px -10px ${color}60` } : {}}
                      >
                        Review Order
                      </button>
                      <button 
                        onClick={handleBack} 
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                      >
                        <ArrowLeft size={12} /> Back to Plan
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="p-8 pt-4"
                  >
                    <div className="mb-6">
                       <h2 className="text-2xl font-black text-white tracking-tight">Order Summary</h2>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Final check before payment</p>
                    </div>

                    <div className="rounded-[2rem] border border-gray-800 bg-[#1a1a1a]/50 overflow-hidden mb-8">
                       <div className="p-6 border-b border-gray-800 flex items-center gap-4 bg-white/5">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                             <Icon size={28} style={{ color }} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-white uppercase tracking-widest">{name} MEMBERSHIP</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Priority Access Plan</p>
                          </div>
                       </div>
                       
                       <div className="p-6 space-y-4">
                          <div className="flex justify-between text-xs">
                             <span className="text-gray-500 font-bold uppercase tracking-widest">Base Subscription</span>
                             <span className="text-white font-black">₹{basePrice}.00</span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-gray-500 font-bold uppercase tracking-widest">GST Support (18%)</span>
                             <span className="text-white font-black">₹{gst}.00</span>
                          </div>
                          <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payable Amount</p>
                                <p className="text-3xl font-black text-white tracking-tighter">₹{totalPrice}</p>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Secure Transaction</span>
                                <div className="flex gap-1 mt-1 opacity-40">
                                   <div className="w-6 h-3 bg-gray-700 rounded-sm" />
                                   <div className="w-6 h-3 bg-gray-700 rounded-sm" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <button
                         onClick={() => {
                           toast.success('Redirecting to UPI Payment Gateway...');
                           // Implementation for UPI QR Code Flow
                           if (typeof window !== 'undefined' && window.triggerUPIFlow) {
                              window.triggerUPIFlow({ amount: totalPrice, plan: name });
                           }
                         }}
                         className="w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                         style={{
                           backgroundColor: color,
                           boxShadow: `0 15px 35px -10px ${color}60`,
                         }}
                       >
                         Proceed to Payment
                       </button>
                       <button 
                        onClick={handleBack} 
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                      >
                        <ArrowLeft size={12} /> Edit Details
                      </button>
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-2 opacity-30">
                       <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-gray-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Merchant Security Verified</span>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;

