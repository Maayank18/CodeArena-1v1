import React, { useEffect, useState } from 'react';
import { CreditCard, Download, ShieldCheck, Zap, Sparkles, Loader2, History } from 'lucide-react';
import api from '../../api.js';
import toast from 'react-hot-toast';
import { useAuthSession } from '../../context/AuthSessionContext.jsx';

const BillingTab = () => {
  const { user } = useAuthSession();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const activePlan = (user?.subscriptionPlan || 'free').toLowerCase();

  const planMeta = {
    free: { name: 'Free Tier', price: 'Rs. 0', desc: 'Standard access to 1v1 arenas', color: 'from-gray-600 to-gray-500', badgeColor: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
    plus: { name: 'Plus Tier', price: 'Rs. 49/mo', desc: '3 AI Assists, Custom Rooms access & persistent editor notes', color: 'from-blue-600 to-cyan-500', badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
    pro: { name: 'Pro Tier', price: 'Rs. 99/mo', desc: '6 AI Assists, unlimited matches, priority queues & customization tools', color: 'from-emerald-600 to-teal-500', badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    premium: { name: 'Premium Tier', price: 'Rs. 149/mo', desc: '15 AI Assists/day, unlimited custom matches & all features unlocked', color: 'from-purple-600 to-pink-500', badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  };

  const meta = planMeta[activePlan] || planMeta.free;

  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/payments/mine');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to load billing history:', err);
        toast.error('Failed to load billing history');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, []);

  const handleDownload = async (transactionId) => {
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf-toast' });
      const response = await api.get(`/payments/${transactionId}/invoice`, {
        responseType: 'blob', // CRITICAL for PDFs
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CodeArena_Invoice_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully', { id: 'pdf-toast' });
    } catch (error) {
      toast.error('Failed to download invoice.', { id: 'pdf-toast' });
      console.error('[DOWNLOAD ERROR]', error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Active Plan Card */}
      <div className={`relative rounded-3xl border border-gray-800 bg-gradient-to-br from-[#181818]/60 to-[#101010]/80 p-8 overflow-hidden shadow-2xl`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${meta.badgeColor}`}>
              Active Plan
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 pt-2">
              {meta.name}
              {activePlan !== 'free' && <Zap size={20} className="text-emerald-400 fill-emerald-400/20" />}
            </h3>
            <p className="text-xs text-gray-400 font-medium tracking-wide max-w-md leading-relaxed">
              {meta.desc}
            </p>
          </div>
          <div className="text-left md:text-right space-y-1 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Subscription Cost</p>
            <p className="text-3xl font-black text-white tracking-tighter">{meta.price}</p>
            {activePlan !== 'free' && user?.subscriptionExpiry && (
              <p className="text-[10px] text-gray-500 font-medium tracking-wider pt-1">
                Expires on: {new Date(user.subscriptionExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Billing & Invoice History */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
          <History size={14} className="text-emerald-400" />
          Billing & Payment History
        </h4>

        {loading ? (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-gray-800 bg-[#161616]/40">
            <Loader2 className="animate-spin text-emerald-400" size={24} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-gray-800 bg-[#161616]/40 text-gray-500 text-center">
            <CreditCard size={32} className="text-gray-600 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">No Billing Transactions</p>
            <p className="text-[10px] text-gray-600 mt-1 font-semibold max-w-xs leading-normal">
              Any premium upgrades or verification attempts via manual payment scans will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-800 bg-[#161616]/20 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Plan Requested</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">UTR / Reference</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Date Issued</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#161616]/10">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-900/20 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="text-xs font-black text-white tracking-widest uppercase">{tx.planName}</span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-400 font-mono tracking-wider">
                          {tx.utrNumber ? `${tx.utrNumber.slice(0, 4)}...${tx.utrNumber.slice(-4)}` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-400 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="text-xs font-black text-white">Rs. {tx.amount}</span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          tx.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        {tx.status === 'approved' ? (
                          <button
                            onClick={() => handleDownload(tx._id)}
                            className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black transition-all inline-flex items-center justify-center"
                            title="Download Invoice PDF"
                          >
                            <Download size={13} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingTab;
