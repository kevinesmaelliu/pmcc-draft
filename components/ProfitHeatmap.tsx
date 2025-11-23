
import React, { useMemo, useState } from 'react';
import { PMCCStrategy, HeatmapRow, HeatmapCell } from '../types';
import { generateHeatmapData } from '../utils/calculations';
import { Info } from 'lucide-react';

interface Props {
  strategy: PMCCStrategy;
}

type ViewMode = 'net' | 'premiums';

const ProfitHeatmap: React.FC<Props> = ({ strategy }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('net');
  
  // Generate 26 weeks (6 months) of data for the heatmap
  const data: HeatmapRow[] = useMemo(() => generateHeatmapData(strategy, 26), [strategy]);

  const getCellColor = (cell: HeatmapCell) => {
    if (viewMode === 'net') {
      if (cell.profit > 0) {
        // Green scale for profit
        const intensity = Math.min(1, cell.profit / (strategy.longCostBasis * 100 * 0.5)); 
        return `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`; // emerald
      } else {
        // Red scale for loss
        const intensity = Math.min(1, Math.abs(cell.profit) / (strategy.longCostBasis * 100 * 0.5));
        return `rgba(239, 68, 68, ${0.1 + intensity * 0.6})`; // red
      }
    } else {
      // Premiums Mode - Show Intensity of Period Income
      // Max intensity if income > 2% of cost basis in 2 weeks (approx 50% annual yield pace)
      const benchmark = (strategy.longCostBasis * 100) * 0.02; 
      const intensity = Math.min(1, cell.periodPremium / benchmark);
      
      if (cell.periodPremium === 0) return 'rgba(30, 41, 59, 0.5)'; // Slate-800ish for zero
      return `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`; // Blue scale
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Strategy Heatmap</h3>
          <p className="text-xs text-slate-500">
            {viewMode === 'net' ? 'Estimated Net P/L (Unrealized + Realized)' : 'Premium Income Collected in This Period'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Toggle Switch */}
           <div className="bg-slate-900 p-1 rounded-lg flex border border-slate-700">
              <button
                onClick={() => setViewMode('net')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'net' 
                  ? 'bg-slate-700 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Net P/L
              </button>
              <button
                onClick={() => setViewMode('premiums')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'premiums' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Period Income
              </button>
           </div>

           <div className="hidden md:flex gap-3 text-xs border-l border-slate-700 pl-4">
              {viewMode === 'net' ? (
                <>
                  <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-emerald-500/50 rounded"></div>
                      <span className="text-slate-400">Profit</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500/50 rounded"></div>
                      <span className="text-slate-400">Loss</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500/50 rounded"></div>
                    <span className="text-slate-400">Income</span>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-slate-800 p-2 text-left text-slate-400 font-medium min-w-[80px] border-b border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                Price
              </th>
              {data[0].cells.map((cell) => (
                <th key={cell.week} className="p-2 text-center text-slate-400 font-medium border-b border-slate-700 min-w-[70px]">
                  <div>{cell.date}</div>
                  <div className="text-[10px] opacity-70 font-normal">Wk {cell.week}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-700/30 transition-colors">
                <td className="sticky left-0 z-10 bg-slate-800 p-2 border-r border-slate-700 font-mono text-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  <div className="font-bold">${row.pricePoint.toFixed(2)}</div>
                  <div className={`text-[10px] ${row.percentageChange > 0 ? 'text-emerald-400' : row.percentageChange < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {row.percentageChange > 0 ? '+' : ''}{row.percentageChange}%
                  </div>
                </td>
                {row.cells.map((cell, cellIdx) => {
                  const value = viewMode === 'net' ? cell.profit : cell.periodPremium;
                  return (
                    <td 
                      key={cellIdx} 
                      className="p-1 border border-slate-800/50 relative group cursor-default"
                      style={{ backgroundColor: getCellColor(cell) }}
                    >
                      <div className={`flex flex-col items-center justify-center h-full py-2 rounded ${cell.isMaxProfit && viewMode === 'net' ? 'ring-1 ring-inset ring-amber-500/30' : ''}`}>
                        <span className={`font-bold ${viewMode === 'premiums' ? 'text-blue-50' : (value > 0 ? 'text-emerald-50' : 'text-red-50')}`}>
                          {viewMode === 'net' && value > 0 ? '+' : ''}${Math.round(value)}
                        </span>
                        {viewMode === 'net' && (
                          <span className="text-[9px] text-slate-200/80">
                            {cell.roi.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      
                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-900 border border-slate-600 text-slate-200 p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 flex flex-col gap-1">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-100">
                          ${cell.price.toFixed(2)} on {cell.date}
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-400">Income (This Period):</span>
                          <span className="text-blue-400 font-mono">${cell.periodPremium.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Cumulative Collected:</span>
                          <span className="font-mono">${cell.totalPremiums.toFixed(0)}</span>
                        </div>
                        
                        <div className="flex justify-between border-t border-slate-700 pt-1">
                          <span className="text-slate-400">Net Profit/Loss:</span>
                          <span className={`font-mono ${cell.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                             {cell.profit >= 0 ? '+' : ''}${cell.profit.toFixed(2)}
                          </span>
                        </div>

                        {cell.isMaxProfit && (
                          <div className="mt-1 text-[10px] text-amber-400 flex items-center gap-1 bg-amber-900/20 p-1 rounded">
                            <Info size={10} /> Upside Capped (Short Strike ITM)
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitHeatmap;
