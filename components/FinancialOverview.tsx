import React from 'react';
import { TrendingUp, DollarSign, PieChart, ShieldCheck, CheckCircle } from 'lucide-react';
import { FinancialOverview as FinancialType } from '../types.js';

interface FinancialOverviewProps {
  financials: FinancialType;
  monthlyRevenue: number;
  monthlyProfit: number;
  askingPrice: number;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  financials,
  monthlyRevenue = 0,
  monthlyProfit = 0,
  askingPrice = 0
}) => {
  const safeFinancials = financials || {
    ttmRevenue: (monthlyRevenue || 0) * 12,
    ttmProfit: (monthlyProfit || 0) * 12,
    expensesBreakdown: [],
    highlights: []
  };

  const expensesList = safeFinancials.expensesBreakdown || [];
  const highlightsList = safeFinancials.highlights || [];
  const ttmRev = safeFinancials.ttmRevenue ?? ((monthlyRevenue || 0) * 12);
  const ttmProf = safeFinancials.ttmProfit ?? ((monthlyProfit || 0) * 12);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const totalMonthlyExpenses = expensesList.reduce(
    (acc, curr) => acc + (curr?.amount || 0),
    0
  );

  const profitMargin = monthlyRevenue > 0
    ? Math.round((monthlyProfit / monthlyRevenue) * 100)
    : 0;

  const multiple = monthlyProfit > 0
    ? (askingPrice / (monthlyProfit * 12)).toFixed(1)
    : 'N/A';

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-700 text-white rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
              Financial Performance & Multiples
            </h3>
            <p className="text-xs text-[#5D5A53]">
              Verified Revenue, Net Profit, and Operating Expenses
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audited Financials</span>
        </span>
      </div>

      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
            Monthly Revenue
          </span>
          <div className="text-lg font-serif font-bold text-[#2C2A26]">
            {formatCurrency(monthlyRevenue)}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            TTM: {formatCurrency(ttmRev)}
          </span>
        </div>

        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
            Net Monthly Profit
          </span>
          <div className="text-lg font-serif font-bold text-emerald-700">
            {formatCurrency(monthlyProfit)}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            TTM: {formatCurrency(ttmProf)}
          </span>
        </div>

        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
            Net Margin
          </span>
          <div className="text-lg font-serif font-bold text-[#2C2A26]">
            {profitMargin}%
          </div>
          <span className="text-[10px] text-[#5D5A53] block">Gross ROI efficiency</span>
        </div>

        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
            Valuation Multiple
          </span>
          <div className="text-lg font-serif font-bold text-amber-900">
            {multiple}x
          </div>
          <span className="text-[10px] text-[#5D5A53] block">Annual Net Multiple</span>
        </div>
      </div>

      {/* Monthly Expenses Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#2C2A26]" />
            <h4 className="text-sm font-bold text-[#2C2A26] uppercase tracking-wider">
              Monthly Operational Expenses Breakdown
            </h4>
          </div>
          <span className="text-xs font-semibold text-[#8C8275]">
            Total: {formatCurrency(totalMonthlyExpenses)}/mo
          </span>
        </div>

        {expensesList.length > 0 && (
          <div className="border border-[#E2DDD3] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F5F2EB] text-[#2C2A26] font-bold border-b border-[#E2DDD3]">
                <tr>
                  <th className="p-3">Expense Category</th>
                  <th className="p-3 text-right">Cost ($/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3] bg-[#FDFCF9]">
                {expensesList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="p-3 text-[#2C2A26] font-medium">{item.category}</td>
                    <td className="p-3 text-right font-mono font-semibold text-[#2C2A26]">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial Highlights */}
      {highlightsList.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8275]">
            Financial Highlights & Stability Notes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {highlightsList.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs text-[#2C2A26]"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
