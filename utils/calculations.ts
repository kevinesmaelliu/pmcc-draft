
import { PMCCStrategy, SimulationPoint, HeatmapRow, HeatmapCell } from "../types";

export const getUpcomingOptionDates = (years: number = 3): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const d = new Date(today);
  d.setDate(d.getDate() + 1); // Start from tomorrow

  const limit = years * 52; 
  let found = 0;

  while (found < limit) {
    if (d.getDay() === 5) { // Friday
      dates.push(d.toISOString().split('T')[0]);
      found++;
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
  }
  return dates;
};

export const calculateBreakEven = (strategy: PMCCStrategy): number => {
  if (strategy.averagePremium <= 0) return Infinity;
  return strategy.longCostBasis / strategy.averagePremium;
};

// Calculate the theoretical value of the LEAP at a specific time and price
const calculateLeapValue = (
  stockPrice: number, 
  strike: number, 
  initialCost: number, 
  startPrice: number, 
  daysRemaining: number, 
  totalDays: number
): number => {
    // Intrinsic
    const intrinsicValue = Math.max(0, stockPrice - strike);
    
    // Extrinsic Model
    const initialIntrinsic = Math.max(0, startPrice - strike);
    const initialExtrinsic = Math.max(0, initialCost - initialIntrinsic);
    
    // Non-linear theta decay approximation
    const timeRatio = Math.max(0, daysRemaining / totalDays);
    const decayFactor = Math.pow(timeRatio, 0.5); 
    
    // Adjust extrinsic based on moneyness 
    const moneyness = stockPrice / strike;
    const moneynessFactor = Math.max(0.1, 1 - Math.max(0, (moneyness - 1) * 2)); 
    
    const estimatedExtrinsic = initialExtrinsic * decayFactor * moneynessFactor;
    
    return intrinsicValue + estimatedExtrinsic;
};

export const generateSimulationData = (strategy: PMCCStrategy, weeksToSimulate: number = 52, driftPercentage: number = 0): SimulationPoint[] => {
  const data: SimulationPoint[] = [];
  const today = new Date();
  const leapExpiry = new Date(strategy.longExpirationDate);
  const startPrice = strategy.currentStockPrice;
  const totalDaysToExpiry = Math.max(1, (leapExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let cumulativePremium = 0;

  for (let i = 0; i <= weeksToSimulate; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + (i * 7));
    
    const diffTime = leapExpiry.getTime() - date.getTime();
    const daysDTE = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysDTE < 0) break; 

    // Calculate Simulated Stock Price based on Drift
    const progress = i / 52; 
    const driftFactor = 1 + (driftPercentage / 100) * progress;
    const simulatedStockPrice = startPrice * driftFactor;

    // Premium Logic:
    const premiumScaling = Math.max(0.2, simulatedStockPrice / startPrice); 
    
    // Calculate sells expected by this date
    const daysPassed = i * 7;
    // Assume first sell happens at day 0
    const totalSellsExpected = Math.floor(daysPassed / strategy.frequencyDays) + 1;
    
    // Sells that happened BEFORE this week
    const prevDays = Math.max(0, (i - 1) * 7);
    const prevSellsExpected = i === 0 ? 0 : Math.floor(prevDays / strategy.frequencyDays) + 1;
    
    const newSells = Math.max(0, totalSellsExpected - prevSellsExpected);
    const periodPremium = (strategy.averagePremium * premiumScaling) * newSells;
    
    cumulativePremium += periodPremium;
    
    const netCostBasis = Math.max(0, strategy.longCostBasis - cumulativePremium);
    
    const estimatedLeapValue = calculateLeapValue(
        simulatedStockPrice, 
        strategy.longStrike, 
        strategy.longCostBasis, 
        startPrice, 
        daysDTE, 
        totalDaysToExpiry
    );

    // Short Call Liability (The "Cap")
    const shortCallLiability = Math.max(0, simulatedStockPrice - strategy.shortStrike);
    
    // Net P/L
    const netProfitLoss = (estimatedLeapValue + cumulativePremium - shortCallLiability) - strategy.longCostBasis;

    data.push({
      week: i,
      date: date.toLocaleDateString(),
      daysDTE: Math.max(0, daysDTE),
      simulatedStockPrice: simulatedStockPrice,
      periodPremium: periodPremium * 100,
      totalPremiumCollected: cumulativePremium * 100,
      netCostBasis: netCostBasis * 100,
      estimatedLeapValue: estimatedLeapValue * 100,
      shortCallLiability: shortCallLiability * 100,
      netProfitLoss: netProfitLoss * 100
    });
  }
  
  return data;
};

export const generateHeatmapData = (strategy: PMCCStrategy, weeks: number = 24): HeatmapRow[] => {
    const rows: HeatmapRow[] = [];
    const priceSteps = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30]; 
    const today = new Date();
    const leapExpiry = new Date(strategy.longExpirationDate);
    const totalDaysToExpiry = Math.max(1, (leapExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const startPrice = strategy.currentStockPrice;

    // Pre-calculate week dates
    const weekDates = [];
    for(let w=0; w<=weeks; w+=2) { 
        const d = new Date(today);
        d.setDate(d.getDate() + (w * 7));
        weekDates.push({ week: w, date: d });
    }

    for (let i = priceSteps.length - 1; i >= 0; i--) {
        const pct = priceSteps[i];
        const targetPrice = startPrice * (1 + pct / 100);
        const cells: HeatmapCell[] = [];

        for (let k = 0; k < weekDates.length; k++) {
            const { week, date } = weekDates[k];
            const daysPassed = week * 7;
            const daysDTE = Math.max(0, totalDaysToExpiry - daysPassed);
            
            // 1. Calculate Total Premiums assuming linear drift
            const avgPricePath = (startPrice + targetPrice) / 2;
            const premiumScale = Math.max(0.2, avgPricePath / startPrice);
            const numSells = Math.floor(daysPassed / strategy.frequencyDays) + 1; // Include T=0
            const totalCollectedPremiums = numSells * strategy.averagePremium * premiumScale;

            // Calculate previous period's cumulative to find the delta for "periodPremium"
            let prevCollected = 0;
            if (k > 0) {
                 const prevWeek = weekDates[k-1].week;
                 const prevDays = prevWeek * 7;
                 const prevSells = Math.floor(prevDays / strategy.frequencyDays) + 1;
                 prevCollected = prevSells * strategy.averagePremium * premiumScale;
            }
            
            // The premium collected specifically in the window between the last column and this one
            const periodPremium = Math.max(0, totalCollectedPremiums - prevCollected);

            // 2. LEAP Value
            const leapVal = calculateLeapValue(
                targetPrice, 
                strategy.longStrike, 
                strategy.longCostBasis, 
                startPrice, 
                daysDTE, 
                totalDaysToExpiry
            );

            // 3. Short Call Liability (Cap)
            const shortLiability = Math.max(0, targetPrice - strategy.shortStrike);

            // 4. Net P/L
            const netPL = (leapVal + totalCollectedPremiums - shortLiability - strategy.longCostBasis) * 100;
            const roi = (netPL / (strategy.longCostBasis * 100)) * 100;

            const isMaxProfit = targetPrice > strategy.shortStrike;

            cells.push({
                price: targetPrice,
                percentageChange: pct,
                date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                week,
                profit: netPL,
                periodPremium: periodPremium * 100,
                totalPremiums: totalCollectedPremiums * 100,
                roi: roi,
                isMaxProfit
            });
        }

        rows.push({
            pricePoint: targetPrice,
            percentageChange: pct,
            cells
        });
    }

    return rows;
};

export const calculateMaxLoss = (strategy: PMCCStrategy): number => {
  return strategy.longCostBasis * 100; 
};

export const calculateStaticReturnIfAssigned = (strategy: PMCCStrategy): number => {
    const width = strategy.shortStrike - strategy.longStrike;
    const profit = width - strategy.longCostBasis;
    return profit * 100;
};
