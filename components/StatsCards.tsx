import React from 'react';
import { PMCCStrategy } from '../types';
import { calculateBreakEven, calculateMaxLoss, calculateStaticReturnIfAssigned } from '../utils/calculations';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

interface Props {
  strategy: PMCCStrategy;
}

const StatsCards: React.FC<Props> = ({ strategy }) => {
  const breakEvenWeeks = calculateBreakEven(strategy);
  const maxLoss = calculateMaxLoss(strategy);
  const assignedProfit = calculateStaticReturnIfAssigned(strategy);
  const width = strategy.shortStrike - strategy.longStrike;
  const debit = strategy.longCostBasis;
  const isWidthHealthy = width > debit;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Break Even Time */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-400 text-xs font-semibold uppercase">Payback Time</span>
          <Clock size={16} className="text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {isFinite(breakEvenWeeks) ? Math.ceil(breakEvenWeeks) : '∞'} <span className="text-sm font-normal text-slate-400">sells</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">To recover initial debit</p>
      </div>

      {/* Max Risk */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-400 text-xs font-semibold uppercase">Max Risk</span>
          <TrendingDown size={16} className="text-red-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          ${maxLoss.toFixed(2)}
        </div>
        <p className="text-xs text-slate-500 mt-1">If stock goes to $0</p>
      </div>

      {/* Assigned Profit */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-400 text-xs font-semibold uppercase">Assigned Net P/L</span>
          <DollarSign size={16} className="text-emerald-400" />
        </div>
        <div className={`text-2xl font-bold ${assignedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {assignedProfit >= 0 ? '+' : ''}${assignedProfit.toFixed(2)}
        </div>
        <p className="text-xs text-slate-500 mt-1">If short called immediately</p>
      </div>

      {/* Health Check */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-400 text-xs font-semibold uppercase">Structure Health</span>
          <TrendingUp size={16} className={isWidthHealthy ? "text-emerald-400" : "text-red-400"} />
        </div>
        <div className={`text-lg font-bold ${isWidthHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWidthHealthy ? 'Healthy Spread' : 'Inverted Risk'}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Width (${width.toFixed(2)}) {isWidthHealthy ? '>' : '<'} Debit (${debit.toFixed(2)})
        </p>
      </div>
    </div>
  );
};

export default StatsCards;
