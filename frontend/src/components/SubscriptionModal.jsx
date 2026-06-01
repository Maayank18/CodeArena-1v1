import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import paymentQr from '../assets/payment-QR.png';
import { useAuthSession } from '../context/AuthSessionContext.jsx';

const SubscriptionModal = ({ isOpen, onClose, plan }) => {
  const { user, updateSession } = useAuthSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submittedTransaction, setSubmittedTransaction] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [hasPending, setHasPending] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [orderData, setOrderData] = useState({
    fullName: '',
    college: '',
    phone: '',
    passoutYear: '2026',
    agreedToTC: false,
  });

  const email = user?.email || 'user@example.com';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setIsSubmitting(false);
    setSubmissionComplete(false);
    setSubmittedTransaction(null);
    setUtrNumber('');
    setOrderData({
      fullName: user.fullName || '',
      college: '',
      phone: user.phone || '',
      passoutYear: '2026',
      agreedToTC: false,
    });
    setHasPending(false);

    const checkPendingRequests = async () => {
      try {
        setIsLoadingPending(true);
        const res = await api.get('/payments/mine');
        const txs = res.data.transactions || [];
        setAllTransactions(txs);
        const pending = txs.find((t) => t.status === 'pending');
        if (pending) {
          setSubmittedTransaction(pending);
          setSubmissionComplete(true);
          setStep(3);
          setHasPending(true);
        }
      } catch (error) {
        console.error('Failed to check pending transactions:', error);
      } finally {
        setIsLoadingPending(false);
      }
    };

    checkPendingRequests();
  }, [isOpen, user?.fullName, user?.phone]);

  const pricing = useMemo(() => {
    const basePrice = Number(plan?.basePrice || 0);
    const gst = 0;

    return {
      basePrice,
      gst,
      totalPrice: basePrice,
    };
  }, [plan?.basePrice]);

  if (!plan) {
    return null;
  }

  const { name, planId, features, color, icon: Icon } = plan;
  const { basePrice, gst, totalPrice } = pricing;

  const isFormValid = (
    orderData.fullName.trim() !== ''
    && orderData.college.trim() !== ''
    && orderData.agreedToTC
  );

  const steps = [
    { id: 1, name: 'Plan' },
    { id: 2, name: 'Details' },
    { id: 3, name: 'Pay' },
  ];

  const closeModal = async () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const handleInputChange = (event) => {
    const { name: fieldName, value, type, checked } = event.target;

    setOrderData((current) => ({
      ...current,
      [fieldName]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUtrChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 12);
    setUtrNumber(digitsOnly);
  };

  const handleSubmitUtr = async () => {
    if (!/^\d{12}$/.test(utrNumber)) {
      toast.error('Enter a valid 12-digit UTR number');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.post('/payments/submit-utr', {
        planId,
        utrNumber,
      });

      setSubmittedTransaction(response.data.transaction);
      setSubmissionComplete(true);
      toast.success(response.data.message || 'Payment request submitted');
      
      // Update allTransactions with newly submitted one
      setAllTransactions(prev => [response.data.transaction, ...prev.filter(t => t.status !== 'pending')]);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!submittedTransaction?._id) return;
    
    try {
      toast.loading('Generating invoice...', { id: 'invoice-toast' });
      const response = await api.get(`/payments/${submittedTransaction._id}/invoice`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CodeArena_Invoice_${submittedTransaction.planName || name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Invoice downloaded successfully', { id: 'invoice-toast' });
    } catch (error) {
      toast.error('Failed to download invoice. Please try again.', { id: 'invoice-toast' });
      console.error('[INVOICE ERROR]', error);
    }
  };

  const handleDownloadPastInvoice = async (txId, planName) => {
    try {
      toast.loading('Generating invoice...', { id: 'invoice-toast' });
      const response = await api.get(`/payments/${txId}/invoice`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CodeArena_Invoice_${planName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Invoice downloaded successfully', { id: 'invoice-toast' });
    } catch (error) {
      toast.error('Failed to download invoice. Please try again.', { id: 'invoice-toast' });
      console.error('[INVOICE ERROR]', error);
    }
  };

  const slideVariants = {
    enter: {
      x: 40,
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: -40,
      opacity: 0,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4 sm:p-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 backdrop-blur-md bg-black/60"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 flex w-full max-w-lg max-h-[92vh] flex-col overflow-hidden rounded-[2.5rem] border border-gray-800 bg-[#121212] shadow-2xl"
            style={{ boxShadow: `0 0 50px -10px ${color}30` }}
          >
            <button
              onClick={closeModal}
              className="absolute right-6 top-6 z-30 rounded-full border border-gray-800 bg-gray-900/50 p-2 text-gray-400 transition-colors hover:text-white disabled:opacity-40"
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>

            <div className="relative p-8 pb-0 flex-shrink-0">
              <div className="flex items-center justify-center gap-4 mb-4">
                {steps.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                          step >= item.id ? 'text-black' : 'bg-gray-900 text-gray-600 border border-gray-800'
                        }`}
                        style={step >= item.id ? { backgroundColor: color } : undefined}
                      >
                        {step > item.id ? <CheckCircle2 size={14} /> : item.id}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${step >= item.id ? 'text-white' : 'text-gray-600'}`}>
                        {item.name}
                      </span>
                    </div>

                    {idx < steps.length - 1 && (
                      <div className="h-[1px] w-10 rounded-full bg-gray-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: step > item.id ? '100%' : '0%' }}
                          className="h-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingPending ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Loader2 size={32} className="animate-spin text-accent mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Checking Verification Status...</p>
                  </div>
              ) : (
                <AnimatePresence mode="wait">
                  {step === 1 && (
                  <motion.div
                    key="step-1"
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
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter whitespace-nowrap">Rs. {basePrice}</span>
                        <span className="font-bold text-gray-500">/mo</span>
                      </div>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                        Secure manual UPI verification
                      </p>
                    </div>

                    <div className="w-full mb-8 rounded-3xl border border-gray-800 bg-[#1a1a1a]/50 p-6">
                      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        What&apos;s included
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

                    {allTransactions.length > 0 && (
                      <div className="w-full mb-8 rounded-3xl border border-gray-800 bg-[#161616]/40 p-6 text-left">
                        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center justify-between">
                          <span>Billing & Invoice History</span>
                          <span className="text-[9px] text-gray-600 font-bold">Secure Manual Payments</span>
                        </h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                          {allTransactions.map((tx) => (
                            <div key={tx._id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-white tracking-widest">{tx.planName}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    tx.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium tracking-wider">
                                  {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • UTR: {tx.utrNumber.slice(0, 4)}...{tx.utrNumber.slice(-4)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-white whitespace-nowrap">Rs. {tx.amount}</span>
                                {tx.status === 'approved' && (
                                  <button
                                    onClick={() => handleDownloadPastInvoice(tx._id, tx.planName)}
                                    className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black transition-all"
                                    title="Download PDF Invoice"
                                  >
                                    <Download size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setStep(2)}
                      className="w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 15px 35px -10px ${color}60`,
                      }}
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="p-8 pt-4"
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-black text-white tracking-tight">Personal Details</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Fill in your information to proceed
                      </p>
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
                          className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all placeholder:text-gray-700 font-semibold"
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
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${orderData.agreedToTC ? 'border-transparent' : 'border-gray-800 bg-[#1a1a1a]'}`}
                          style={orderData.agreedToTC ? { backgroundColor: color } : undefined}
                        >
                          {orderData.agreedToTC && <CheckCircle2 size={14} className="text-black" />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                          I agree to the Terms and Conditions
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-4">
                      {!user?.emailVerified ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-2">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <div>
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Verification Required</p>
                              <p className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                                Please verify your email in settings before purchasing a plan.
                              </p>
                              <button
                                onClick={() => {
                                  onClose();
                                  window.dispatchEvent(new CustomEvent('codearena:open-settings', { detail: { tab: 'security' } }));
                                }}
                                className="mt-2 text-[10px] font-bold text-accent hover:underline"
                              >
                                Go to Security Settings
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setStep(3)}
                          disabled={!isFormValid}
                          className={`w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-black transition-all ${!isFormValid ? 'opacity-30 cursor-not-allowed bg-gray-600' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                          style={isFormValid ? { backgroundColor: color, boxShadow: `0 10px 30px -10px ${color}60` } : undefined}
                        >
                          Continue to Payment
                        </button>
                      )}

                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                      >
                        <ArrowLeft size={12} /> Back to Plan
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="p-8 pt-4"
                  >
                    {!submissionComplete ? (
                      <>
                        <div className="mb-6">
                          <h2 className="text-2xl font-black text-white tracking-tight">Scan, Pay, Submit UTR</h2>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Pay the exact amount and enter your 12-digit UTR
                          </p>
                        </div>

                        <div className="rounded-[2rem] border border-gray-800 bg-[#1a1a1a]/50 overflow-hidden mb-6">
                          <div className="p-6 border-b border-gray-800 flex items-center gap-4 bg-white/5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                              <Icon size={28} style={{ color }} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase tracking-widest">{name} MEMBERSHIP</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Manual UPI verification</p>
                            </div>
                          </div>

                          <div className="p-6 space-y-4">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500 font-bold uppercase tracking-widest">Base Subscription</span>
                              <span className="text-white font-black whitespace-nowrap">Rs. {basePrice}.00</span>
                            </div>

                            <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payable Amount</p>
                                <p className="text-3xl font-black text-white tracking-tighter whitespace-nowrap">Rs. {totalPrice}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">UTR required</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">Exactly 12 digits</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-[1.1fr,0.9fr] mb-6">
                          <div className="rounded-[2rem] border border-gray-800 bg-[#171717] p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <QrCode size={16} className="text-gray-400" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Payment QR</p>
                            </div>
                            <div className="rounded-[1.5rem] bg-white p-4">
                              <img
                                src={paymentQr}
                                alt="CodeArena UPI payment QR"
                                className="w-full rounded-2xl object-contain"
                              />
                            </div>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">
                              <AlertCircle size={14} />
                              <span>Tip: Make payment through Paytm for a faster verification response.</span>
                            </div>
                          </div>

                          <div className="rounded-[2rem] border border-gray-800 bg-[#171717] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Instructions</p>
                            <div className="space-y-3 text-xs text-gray-300">
                              <p>1. Scan the QR using any UPI app.</p>
                              <p>2. Pay the exact amount shown above.</p>
                              <p>3. Copy the 12-digit UTR from the successful payment screen.</p>
                              <p>4. Submit the UTR below for admin verification.</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-gray-800 bg-[#171717] p-5 mb-6">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block">
                            Enter 12-digit UTR
                          </label>
                          <input
                            type="text"
                            value={utrNumber}
                            onChange={handleUtrChange}
                            placeholder="000000000000"
                            inputMode="numeric"
                            maxLength={12}
                            className="w-full rounded-2xl border border-gray-800 bg-[#101010] px-4 py-4 text-lg tracking-[0.25em] text-white placeholder:text-gray-700 focus:outline-none"
                            style={{ borderColor: utrNumber.length === 12 ? color : undefined }}
                          />
                          <p className="mt-3 text-[11px] text-gray-500">
                            Your request is email-confirmed after successful submission and then reviewed by admin.
                          </p>
                        </div>

                        <div className="flex flex-col gap-4">
                          <button
                            onClick={handleSubmitUtr}
                            disabled={isSubmitting || utrNumber.length !== 12}
                            className="w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 15px 35px -10px ${color}60`,
                            }}
                          >
                            {isSubmitting ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Submitting
                              </span>
                            ) : (
                              'Submit UTR for Verification'
                            )}
                          </button>

                          <button
                            onClick={() => setStep(2)}
                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                            disabled={isSubmitting}
                          >
                            <ArrowLeft size={12} /> Edit Details
                          </button>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-2 opacity-70">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-gray-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Merchant Security Verified</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                          <CheckCircle2 size={34} className="text-emerald-400" />
                        </div>

                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-black text-white tracking-tight">Request Received</h2>
                          <p className="mt-2 text-sm text-gray-400">
                            Your payment request is now in the verification queue.
                          </p>
                        </div>

                        <div className="rounded-[2rem] border border-gray-800 bg-[#171717] p-5 mb-6 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-widest">Plan</span>
                            <span className="text-white font-black">{submittedTransaction?.planName || name}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-widest">Amount</span>
                            <span className="text-white font-black whitespace-nowrap">Rs. {submittedTransaction?.amount || totalPrice}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-widest">UTR</span>
                            <span className="text-white font-black tracking-[0.2em]">{submittedTransaction?.utrNumber || utrNumber}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-widest">Status</span>
                            <span className="text-amber-300 font-black uppercase">{submittedTransaction?.status || 'pending'}</span>
                          </div>
                        </div>

                        {submittedTransaction?.status === 'approved' ? (
                          <div className="flex flex-col gap-3 mb-6">
                            <button
                              onClick={handleDownloadInvoice}
                              className="w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                            >
                              <Download size={18} /> Download Invoice
                            </button>
                            <p className="text-center text-[10px] text-gray-400">
                              Your payment is verified. You can now download your invoice.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-6 mb-6 rounded-xl border border-white/10 bg-[#1e1e1e] p-4 text-center">
                            <h3 className="mb-2 font-bold text-emerald-400">Verification in Progress</h3>
                            <p className="text-sm text-gray-300">
                              Your payment details have been sent to our team. You will get access to your upgraded features within <strong>1 hour</strong> from when the payment was made.
                            </p>
                            <p className="mt-3 text-xs text-gray-500">
                              Please try refreshing this page after an hour to access your new features.
                            </p>
                          </div>
                        )}

                        <button
                          onClick={closeModal}
                          className="w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-black"
                          style={{ backgroundColor: color }}
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;

// Version-2.0