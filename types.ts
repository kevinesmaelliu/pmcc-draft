
export interface PMCCStrategy {
  id: string;
  ticker: string;
  currentStockPrice: number;
  
  // Long Leg (LEAP)
  longStrike: number;
  longExpirationDate: string; // YYYY-MM-DD
  longCostBasis: number; // Total Debit Paid per contract (e.g., 5.00 * 100 = 500, usually entered as 5.00)
  
  // Short Leg Assumptions (The "Covered" Call)
  shortStrike: number; // Target strike for short calls
  averagePremium: number; // Estimated premium received per sell
  frequencyDays: number; // e.g., 7 for weekly, 30 for monthly
  
  // Analysis
  notes?: string;
}

export interface SimulationPoint {
  week: number;
  date: string;
  daysDTE: number;
  simulatedStockPrice: number;
  periodPremium: number; // Premium collected specifically in this period
  totalPremiumCollected: number;
  netCostBasis: number; // Initial Cost - Collected
  estimatedLeapValue: number; // Simplified intrinsic value projection
  shortCallLiability: number; // How much we lose if short leg is ITM
  netProfitLoss: number;
}

// New Heatmap Types
export interface HeatmapCell {
  price: number;
  percentageChange: number;
  date: string;
  week: number;
  profit: number;
  periodPremium: number; // Premium collected in this specific block
  totalPremiums: number; // Cumulative
  roi: number; // percentage return
  isMaxProfit: boolean;
}

export interface HeatmapRow {
  pricePoint: number;
  percentageChange: number;
  cells: HeatmapCell[];
}

export interface AnalysisResult {
  verdict: 'Safe' | 'Caution' | 'Risky' | 'Unknown';
  score: number;
  summary: string;
  details: string[];
  management?: {
    rollingLogic: string;
    exitStrategy: string;
    profitTaking: string;
  };
}
