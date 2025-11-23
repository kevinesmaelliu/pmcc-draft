import React, { useState, useEffect, useMemo } from 'react';
import { PMCCStrategy } from '../types';
import { fetchStockPrice } from '../services/geminiService';
import { getUpcomingOptionDates } from '../utils/calculations';
import { PlusCircle, Save, Trash2, Activity, Search, Loader2, ExternalLink } from 'lucide-react';

interface Props {
  activeStrategy: PMCCStrategy | null;
  onSave: (strategy: PMCCStrategy) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const StrategyInput: React.FC<Props> = ({ activeStrategy, onSave, onDelete, onNew }) => {
  const [formState, setFormState] = useState<PMCCStrategy>({
    id: '',
    ticker: '',
    currentStockPrice: 0,
    longStrike: 0,
    longExpirationDate: '',
    longCostBasis: 0,
    shortStrike: 0,
    averagePremium: 0,
    frequencyDays: 7,
  });
  
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceSource, setPriceSource] = useState<string | undefined>(undefined);

  // Generate expiration dates (Fridays for next 3 years)
  const expirationDates = useMemo(() => getUpcomingOptionDates(3), []);

  useEffect(() => {
    if (activeStrategy) {
      setFormState(activeStrategy);
      setPriceSource(undefined); // Reset source when switching strategies
    } else {
      // Reset form for new strategy
      const defaultDate = expirationDates.find(d => {
         // Try to set default to approx 1 year out
         const date = new Date(d);
         const today = new Date();
         return date.getFullYear() === today.getFullYear() + 1;
      }) || expirationDates[expirationDates.length - 1];

      setFormState({
        id: crypto.randomUUID(),
        ticker: '',
        currentStockPrice: 0,
        longStrike: 0,
        longExpirationDate: defaultDate,
        longCostBasis: 0,
        shortStrike: 0,
        averagePremium: 0,
        frequencyDays: 7,
      });
      setPriceSource(undefined);
    }
  }, [activeStrategy, expirationDates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'ticker' || name === 'longExpirationDate' ? value : parseFloat(value) || 0
    }));
  };

  const handleTickerBlur = async () => {
    if (!formState.ticker) return;
    setPriceLoading(true);
    const { price, source } = await fetchStockPrice(formState.ticker);
    if (price > 0) {
      setFormState(prev => ({ ...prev, currentStockPrice: price }));
      setPriceSource(source);
    }
    setPriceLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-emerald-400" />
          Strategy Details
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={onNew}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            title="New Strategy"
          >
            <PlusCircle size={20} />
          </button>
          {activeStrategy && (
            <button 
              onClick={() => onDelete(activeStrategy.id)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
              title="Delete Strategy"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Ticker Symbol</label>
            <div className="relative">
              <input
                type="text"
                name="ticker"
                value={formState.ticker}
                onChange={handleChange}
                onBlur={handleTickerBlur}
                placeholder="e.g. AAPL"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                required
              />
              <div className="absolute right-3 top-2.5 text-slate-500">
                {priceLoading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <Search size={16} />}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Current Price ($)</label>
            <input
              type="number"
              name="currentStockPrice"
              step="0.01"
              value={formState.currentStockPrice || ''}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            {priceSource && (
              <a href={priceSource} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-emerald-400/80 mt-1 hover:text-emerald-400 truncate">
                <ExternalLink size={10} />
                Source: {new URL(priceSource).hostname}
              </a>
            )}
          </div>
        </div>

        {/* Long Leg (LEAP) */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">Long Leg (LEAP)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Strike Price ($)</label>
              <input
                type="number"
                name="longStrike"
                step="0.5"
                value={formState.longStrike || ''}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expiration</label>
              <select
                name="longExpirationDate"
                value={formState.longExpirationDate}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
              >
                {expirationDates.map(date => (
                  <option key={date} value={date}>
                    {formatDateLabel(date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Debit Paid (Cost Basis)</label>
              <input
                type="number"
                name="longCostBasis"
                step="0.01"
                value={formState.longCostBasis || ''}
                onChange={handleChange}
                placeholder="e.g. 15.50"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Enter the price per share (e.g., 5.00 for $500 total)</p>
            </div>
          </div>
        </div>

        {/* Short Leg */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3">Short Leg Strategy (The "Covered" Call)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Plan to Sell Strike ($)</label>
              <input
                type="number"
                name="shortStrike"
                step="0.5"
                value={formState.shortStrike || ''}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Est. Premium ($)</label>
              <input
                type="number"
                name="averagePremium"
                step="0.01"
                value={formState.averagePremium || ''}
                onChange={handleChange}
                placeholder="e.g. 0.50"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
               <label className="block text-xs font-medium text-slate-400 mb-1">Frequency (Days)</label>
               <select 
                 name="frequencyDays" 
                 value={formState.frequencyDays}
                 onChange={handleChange}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
               >
                 <option value={7}>Weekly (7 Days)</option>
                 <option value={14}>Bi-Weekly (14 Days)</option>
                 <option value={30}>Monthly (30 Days)</option>
                 <option value={45}>45 Days</option>
               </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Save size={18} />
          {activeStrategy ? 'Update Strategy' : 'Create Strategy'}
        </button>
      </form>
    </div>
  );
};

export default StrategyInput;