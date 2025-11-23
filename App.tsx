
import React, { useState, useMemo, useEffect } from 'react';
import StrategyInput from './components/StrategyInput';
import SimulationChart from './components/SimulationChart';
import ProfitHeatmap from './components/ProfitHeatmap';
import StatsCards from './components/StatsCards';
import { PMCCStrategy } from './types';
import { generateSimulationData } from './utils/calculations';
import { LineChart as ChartIcon, Info } from 'lucide-react';

const App: React.FC = () => {
  // Initialize state from LocalStorage if available
  const [strategies, setStrategies] = useState<PMCCStrategy[]>(() => {
    try {
      const saved = localStorage.getItem('pmcc_strategies');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse strategies from local storage:", e);
      return [];
    }
  });

  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(() => {
    return localStorage.getItem('pmcc_active_id') || null;
  });
  
  // Simulation Parameters
  const [drift, setDrift] = useState<number>(0); // Percentage drift over simulation

  // Persist strategies to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pmcc_strategies', JSON.stringify(strategies));
  }, [strategies]);

  // Persist active strategy selection
  useEffect(() => {
    if (activeStrategyId) {
      localStorage.setItem('pmcc_active_id', activeStrategyId);
    } else {
      localStorage.removeItem('pmcc_active_id');
    }
  }, [activeStrategyId]);

  const activeStrategy = useMemo(() => 
    strategies.find(s => s.id === activeStrategyId) || null
  , [strategies, activeStrategyId]);

  const simulationData = useMemo(() => 
    activeStrategy ? generateSimulationData(activeStrategy, 52, drift) : []
  , [activeStrategy, drift]);

  const handleSaveStrategy = (strategy: PMCCStrategy) => {
    setStrategies(prev => {
      const existing = prev.findIndex(s => s.id === strategy.id);
      if (existing >= 0) {
        const newStrategies = [...prev];
        newStrategies[existing] = strategy;
        return newStrategies;
      }
      return [...prev, strategy];
    });
    setActiveStrategyId(strategy.id);
    setDrift(0); // Reset drift on save
  };

  const handleDelete = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
    if (activeStrategyId === id) setActiveStrategyId(null);
  };

  const handleNew = () => {
    setActiveStrategyId(null);
    setDrift(0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
            <ChartIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PMCC Simulator</h1>
            <p className="text-sm text-slate-400">Poor Man's Covered Call Strategy Analyzer</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <Info size={14} />
          <span>Simulation assumes linear drift & static IV</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar / Strategy Selector (Mobile adapted) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Your Plays</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {strategies.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4 italic">
                  No plays created yet.
                </div>
              )}
              {strategies.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStrategyId(s.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    activeStrategyId === s.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                      : 'bg-slate-900/50 border-transparent hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{s.ticker}</span>
                    <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      {new Date(s.longExpirationDate).getFullYear()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs opacity-80">
                    <span>Long ${s.longStrike}</span>
                    <span>Short ${s.shortStrike}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <StrategyInput 
            activeStrategy={activeStrategy}
            onSave={handleSaveStrategy}
            onDelete={handleDelete}
            onNew={handleNew}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {activeStrategy ? (
            <>
              <StatsCards strategy={activeStrategy} />
              
              <div className="w-full">
                <SimulationChart 
                  data={simulationData} 
                  drift={drift}
                  setDrift={setDrift}
                />
              </div>

              <ProfitHeatmap strategy={activeStrategy} />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-xl border border-slate-800 border-dashed min-h-[500px] text-slate-500">
              <ChartIcon size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">Start a New Play</h3>
              <p className="max-w-md text-center">
                Select "New Strategy" on the left to input your LEAP details and simulate your returns over time.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
