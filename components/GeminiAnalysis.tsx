
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Bot, ShieldCheck, AlertTriangle, ShieldAlert, BookOpen, ArrowRight } from 'lucide-react';

interface Props {
  analysis: AnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

const GeminiAnalysis: React.FC<Props> = ({ analysis, loading, onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'playbook'>('analysis');

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col h-full">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Bot className="text-purple-400" />
          AI Strategy Advisor
        </h3>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            loading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
          }`}
        >
          {loading ? 'Analyzing...' : 'Generate Plan'}
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {!analysis ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 min-h-[200px]">
            <Bot size={48} className="opacity-20" />
            <p className="text-sm text-center max-w-[200px]">
              Generate a risk assessment and management playbook for this trade.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-700">
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`pb-2 text-sm font-medium px-2 ${activeTab === 'analysis' ? 'text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Risk Analysis
              </button>
              <button 
                onClick={() => setActiveTab('playbook')}
                className={`pb-2 text-sm font-medium px-2 ${activeTab === 'playbook' ? 'text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Management Playbook
              </button>
            </div>

            {activeTab === 'analysis' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    analysis.verdict === 'Safe' ? 'bg-emerald-900/50 text-emerald-400' :
                    analysis.verdict === 'Caution' ? 'bg-amber-900/50 text-amber-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {analysis.verdict === 'Safe' && <ShieldCheck size={32} />}
                    {analysis.verdict === 'Caution' && <AlertTriangle size={32} />}
                    {analysis.verdict === 'Risky' && <ShieldAlert size={32} />}
                    {analysis.verdict === 'Unknown' && <Bot size={32} />}
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Verdict</h4>
                    <p className={`text-2xl font-bold ${
                      analysis.verdict === 'Safe' ? 'text-emerald-400' :
                      analysis.verdict === 'Caution' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>{analysis.verdict}</p>
                  </div>
                  <div className="ml-auto text-right">
                     <h4 className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Score</h4>
                     <span className="text-2xl font-bold text-white">{analysis.score}/100</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-200 italic">"{analysis.summary}"</p>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-slate-300 mb-3">Key Insights</h5>
                  <ul className="space-y-2">
                    {analysis.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {analysis.management ? (
                    <>
                        <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                            <h5 className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                                <ArrowRight size={14} /> Rolling Strategy
                            </h5>
                            <p className="text-slate-300 text-xs leading-relaxed">{analysis.management.rollingLogic}</p>
                        </div>
                        <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                            <h5 className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
                                <ArrowRight size={14} /> Exit Strategy (Stop Loss)
                            </h5>
                            <p className="text-slate-300 text-xs leading-relaxed">{analysis.management.exitStrategy}</p>
                        </div>
                         <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                            <h5 className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
                                <ArrowRight size={14} /> Profit Taking
                            </h5>
                            <p className="text-slate-300 text-xs leading-relaxed">{analysis.management.profitTaking}</p>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-500 py-8">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
                        <p>No playbook available. Try analyzing again.</p>
                    </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAnalysis;
