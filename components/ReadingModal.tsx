import React from 'react';
// Fix: The 'AnalysisResult' type was not exported from '../types'.
// Since this component appears to be unused, the type is defined locally
// to resolve the error without modifying shared type definitions.
import type { VehicleRecommendation } from '../types';

interface AnalysisResult {
  recommendedVehicles: VehicleRecommendation[];
  affordablePriceRange: {
    min: number;
    max: number;
  };
  financialTips: string;
}

interface ResultsDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isLoading, error }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return <ErrorMessage message={error} />;
  }
  if (!result) {
    return null; // Don't render anything if there's no result yet
  }

  return (
    <section id="results" className="py-20 px-4">
      <div className="container mx-auto">
        <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white mb-12 text-center">
          Your Cosmic Alignments
        </h3>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main Results: Recommended Vehicles */}
          <div className="lg:col-span-2 space-y-8">
            {result.recommendedVehicles.map(vehicle => (
              <VehicleResultCard key={vehicle.model} vehicle={vehicle} />
            ))}
          </div>

          {/* Sidebar: Financial Summary & Tips */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 sticky top-28">
            <InfoBlock title="Affordable Price Range">
                <p className="text-2xl font-bold text-white">
                    {formatCurrency(result.affordablePriceRange.min)} - {formatCurrency(result.affordablePriceRange.max)}
                </p>
            </InfoBlock>
            <InfoBlock title="Celestial Advisor Tips">
                <p className="text-base leading-relaxed text-gray-300 italic">"{result.financialTips}"</p>
            </InfoBlock>
          </div>
        </div>
      </div>
    </section>
  );
};

// Sub-components for ResultsDisplay
const VehicleResultCard: React.FC<{ vehicle: AnalysisResult['recommendedVehicles'][0] }> = ({ vehicle }) => {
  const { model, description, image, financingPlan, tags } = vehicle;
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-purple-500/30 overflow-hidden flex flex-col md:flex-row shadow-lg shadow-purple-900/20">
      <div className="md:w-1/3">
        <img src={`${image}`} alt={model} className="w-full h-full object-cover"/>
      </div>
      <div className="p-6 md:w-2/3">
        <h4 className="text-2xl font-cinzel text-white">{model}</h4>
        <div className="flex gap-2 mt-1 mb-3">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">{tags.style}</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">{tags.useCase}</span>
        </div>
        <p className="text-gray-400 mb-4 text-sm">{description}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center bg-white/5 p-4 rounded-lg">
          <FinanceMetric label="Monthly Payment" value={formatCurrency(financingPlan.monthlyPayment)} />
          <FinanceMetric label="Interest Rate" value={`${(financingPlan.interestRate * 100).toFixed(2)}%`} />
          <FinanceMetric label="Loan Amount" value={formatCurrency(financingPlan.loanAmount)} />
          <FinanceMetric label="Total Cost" value={formatCurrency(financingPlan.totalCost)} />
        </div>
      </div>
    </div>
  );
};

const FinanceMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-purple-300 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);

const InfoBlock: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-6 last:mb-0">
        <h4 className="text-lg font-cinzel text-purple-300 border-b border-purple-500/20 pb-2 mb-3 tracking-wider">{title}</h4>
        {children}
    </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20">
    <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-lg font-cinzel text-white">Aligning Financial Constellations...</p>
    <p className="text-sm text-gray-400">Please wait while we consult the cosmic financial advisors.</p>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full text-center py-20 text-red-400 container mx-auto max-w-2xl bg-red-900/20 border border-red-500/50 rounded-lg p-8">
    <p>{message}</p>
  </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default ResultsDisplay;