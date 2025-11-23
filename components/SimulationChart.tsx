
import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { SimulationPoint } from '../types';

interface Props {
  data: SimulationPoint[];
  drift: number;
  setDrift: (val: number) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl z-50 min-w-[200px]">
        <div className="mb-2 border-b border-slate-700 pb-2">
          <p className="text-slate-200 font-semibold text-sm">{label} (Week {d.week})</p>
          <p className="text-slate-400 text-xs">{d.daysDTE} Days to Expiry</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between gap-4 text-xs">
             <span className="text-slate-400">Stock Price:</span>
             <span className="text-white font-mono">${d.simulatedStockPrice.toFixed(2)}</span>
          </div>
          
          {d.periodPremium > 0 && (
            <div className="flex justify-between gap-4 text-xs bg-emerald-900/20 p-1 rounded">
              <span className="text-emerald-400 font-semibold">Income this week:</span>
              <span className="text-emerald-300 font-mono font-bold">+${d.periodPremium.toFixed(2)}</span>
            </div>
          )}

          <div className="h-px bg-slate-700 my-1"></div>
          
          {payload.map((p: any) => {
            // Filter out the bar from tooltip if value is 0 to reduce noise
            if (p.dataKey === 'periodPremium' && Number(p.value) === 0) return null;
            
            return (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-slate-400">{p.name}:</span>
                <span className="font-mono font-medium text-white ml-auto">
                  ${Number(p.value).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const SimulationChart: React.FC<Props> = ({ data, drift, setDrift }) => {
  if (!data || data.length === 0) return <div className="text-center text-slate-500">No data to display</div>;

  return (
    <div className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Projected Performance</h3>
          <p className="text-xs text-slate-500">Cumulative P/L vs Periodic Income</p>
        </div>
        
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 min-w-[200px]">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">Stock Trend (1 Yr)</span>
            <span className={`font-bold ${drift > 0 ? 'text-emerald-400' : drift < 0 ? 'text-red-400' : 'text-slate-200'}`}>
              {drift > 0 ? '+' : ''}{drift}%
            </span>
          </div>
          <input 
            type="range" 
            min="-30" 
            max="30" 
            step="5" 
            value={drift}
            onChange={(e) => setDrift(Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Bearish (-30%)</span>
            <span>Bullish (+30%)</span>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="week" 
              stroke="#94a3b8" 
              tick={{fontSize: 12}}
              label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} 
            />
            <YAxis 
              stroke="#94a3b8" 
              tickFormatter={(value) => `$${value}`}
              tick={{fontSize: 12}}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}/>
            
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            
            <Bar 
                dataKey="periodPremium" 
                name="Weekly Income" 
                barSize={10} 
                fill="#10b981" 
                opacity={0.6}
            />

            <Line
              type="monotone"
              dataKey="estimatedLeapValue"
              name="LEAP Value"
              stroke="#3b82f6" // blue-500
              strokeWidth={2}
              dot={false}
              animationDuration={500}
            />
            
            <Line
              type="monotone"
              dataKey="netProfitLoss"
              name="Net P/L"
              stroke="#f59e0b" // amber-500
              strokeWidth={3}
              dot={false}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimulationChart;
