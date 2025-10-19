import React, { useState, useEffect, useMemo } from 'react';
import type { VehicleRecommendation, UserInput, SavedAlignment, VehiclePlan } from '../types';
import { getFinancingAdvice, GeminiFinanceCoachResponse } from '../services/geminiService';

interface FinancingPageProps {
  vehicle: VehicleRecommendation;
  userInput: UserInput;
  interestRate: number;
  onBack: () => void;
  onSaveAlignment: (alignment: SavedAlignment) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const FinancingPage: React.FC<FinancingPageProps> = ({ vehicle, userInput, interestRate, onBack, onSaveAlignment }) => {
    const { model, price, image } = vehicle;
    const [planType, setPlanType] = useState<'Financing' | 'Leasing'>('Financing');
    const [advice, setAdvice] = useState<GeminiFinanceCoachResponse | null>(null);
    const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

    // --- Plan Calculations ---
    const financingPlan = useMemo(() => {
        const { downPayment, loanTerm } = userInput;
        const loanAmount = price - downPayment;
        const monthlyRate = interestRate / 12;
        const numberOfPayments = loanTerm * 12;
        const monthlyPayment = loanAmount > 0 
            ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
            : 0;
        const totalCost = (monthlyPayment * numberOfPayments) + downPayment;
        return { planType: 'Financing' as const, monthlyPayment, totalCost, interestRate, loanAmount, loanTerm };
    }, [price, userInput.downPayment, userInput.loanTerm, interestRate]);

    const leasingPlan = useMemo(() => {
        const leaseTermMonths = 36; // Common lease term
        const moneyFactor = interestRate / 2400; // Standard approximation
        const residualValueRate = 0.55; // Typical residual value for a 3-year lease
        
        const residualValue = price * residualValueRate;
        const capitalizedCost = price - userInput.downPayment;
        
        const depreciationFee = (capitalizedCost - residualValue) / leaseTermMonths;
        const financeFee = (capitalizedCost + residualValue) * moneyFactor;
        const monthlyPayment = depreciationFee + financeFee;

        return { 
            planType: 'Leasing' as const, 
            monthlyPayment, 
            dueAtSigning: userInput.downPayment + monthlyPayment, // First month's payment + down payment
            term: leaseTermMonths, 
            moneyFactor, 
            residualValue 
        };
    }, [price, userInput.downPayment, interestRate]);

    useEffect(() => {
        const fetchAdvice = async () => {
            if (!financingPlan) return;
            setIsLoadingAdvice(true);
            const geminiAdvice = await getFinancingAdvice(userInput, vehicle.price, {
                interestRate: financingPlan.interestRate,
                monthlyPayment: financingPlan.monthlyPayment
            });
            setAdvice(geminiAdvice);
            setIsLoadingAdvice(false);
        };
        fetchAdvice();
    }, [userInput, vehicle.price, financingPlan]);

    const handleSave = () => {
        const currentPlan = planType === 'Financing' ? financingPlan : leasingPlan;
        
        const newAlignment: SavedAlignment = {
            id: `${Date.now()}-${vehicle.model}`,
            vehicle: { ...vehicle },
            userInput: { ...userInput },
            plan: currentPlan,
            savedAt: new Date().toISOString()
        };

        onSaveAlignment(newAlignment);

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const brandUrl = `#`; // Placeholder link for the rebranded site


    return (
        <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-4 sm:p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Left Side: Vehicle Info */}
                <div className="text-center">
                    <button onClick={onBack} className="mb-4 text-purple-300 hover:text-white transition-colors">
                        &larr; Back to All Vehicles
                    </button>
                    <img 
                        src={`${image}`} 
                        alt={model}
                        className="w-full rounded-lg shadow-lg shadow-purple-900/20"
                    />
                    <h3 className="text-3xl lg:text-4xl font-cinzel text-white mt-4">{model}</h3>
                    <p className="text-2xl font-bold text-gray-300">{formatCurrency(price)}</p>
                </div>

                {/* Right Side: Calculator & Advice */}
                <div className="space-y-6">
                    {/* Plan Type Toggle */}
                    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-purple-500/30">
                        <button onClick={() => setPlanType('Financing')} className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold ${planType === 'Financing' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Financing</button>
                        <button onClick={() => setPlanType('Leasing')} className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold ${planType === 'Leasing' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Leasing</button>
                    </div>
                    
                    {/* Dynamic Plan Display */}
                    {planType === 'Financing' ? (
                         <FinanceDisplay plan={financingPlan} carPrice={price} />
                    ) : (
                         <LeaseDisplay plan={leasingPlan} />
                    )}
                    
                    {/* AI Finance Coach */}
                    <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4">
                        <h4 className="text-lg font-cinzel text-purple-300 mb-2 tracking-wider">Your AI Finance Coach</h4>
                        <div className="relative min-h-[100px]">
                            {isLoadingAdvice && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}
                            {advice && (
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-300 italic">"{advice.affordabilityAssessment}"</p>
                                    <p className="text-purple-300 font-semibold">
                                        <span className="font-bold">Actionable Tip:</span> {advice.actionableTip}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <button 
                            onClick={handleSave} 
                            disabled={saveStatus === 'saved'}
                            className="w-full text-center bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-base tracking-wider uppercase shadow-[0_0_15px_rgba(20,184,166,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] transform hover:scale-105 transition-all duration-300 disabled:bg-teal-800 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {saveStatus === 'saved' ? '✓ Alignment Saved!' : 'Save Alignment'}
                        </button>
                        <a 
                            href={brandUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center mt-3 bg-gray-700/60 border border-gray-600 text-gray-300 font-bold py-3 px-6 rounded-lg text-sm tracking-wider uppercase hover:bg-gray-700 hover:text-white transform hover:scale-105 transition-all duration-300"
                        >
                            View on AstralMotors.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Displaying Plans ---

const FinanceDisplay: React.FC<{plan: NonNullable<ReturnType<typeof useMemo<any>>['value']>, carPrice: number}> = ({ plan, carPrice }) => {
    const totalInterest = plan.totalCost - carPrice;
    return (
        <div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <FinanceMetric label="Monthly Payment" value={formatCurrency(plan.monthlyPayment)} large />
                <FinanceMetric label="Total Interest" value={formatCurrency(totalInterest)} />
                <FinanceMetric label="Total Cost" value={formatCurrency(plan.totalCost)} />
            </div>
            <CostBreakdownChart carPrice={carPrice} interestPaid={totalInterest} />
        </div>
    );
};

const LeaseDisplay: React.FC<{plan: NonNullable<ReturnType<typeof useMemo<any>>['value']>> = ({ plan }) => (
    <div>
        <div className="grid grid-cols-2 gap-4 text-center">
            <FinanceMetric label="Est. Monthly Payment" value={formatCurrency(plan.monthlyPayment)} large />
            <FinanceMetric label="Due at Signing" value={formatCurrency(plan.dueAtSigning)} large />
        </div>
        <div className='text-xs text-center text-gray-400 mt-4 px-2'>
            Lease estimates are for a {plan.term}-month term. Due at signing includes down payment and first month's payment. Does not include taxes and fees.
        </div>
    </div>
);


const FinanceMetric: React.FC<{ label: string; value: string; large?: boolean }> = ({ label, value, large = false }) => (
  <div className={`bg-white/5 p-3 rounded-lg ${large ? 'col-span-2' : ''}`}>
    <p className={`text-xs uppercase tracking-wider ${large ? 'text-purple-300' : 'text-gray-400'}`}>{label}</p>
    <p className={`font-bold text-white ${large ? 'text-4xl' : 'text-xl'}`}>{value}</p>
  </div>
);

const CostBreakdownChart: React.FC<{ carPrice: number; interestPaid: number }> = ({ carPrice, interestPaid }) => {
    const total = carPrice + interestPaid;
    const carPricePercent = total > 0 ? (carPrice / total) * 100 : 100;
    const interestPercent = total > 0 ? (interestPaid / total) * 100 : 0;

    return (
        <div className='mt-4'>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Total Cost Breakdown</h4>
            <div className="flex w-full h-6 bg-gray-700 rounded-full overflow-hidden" title={`Car Price: ${formatCurrency(carPrice)}, Interest: ${formatCurrency(interestPaid)}`}>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${carPricePercent}%` }}>
                    {carPricePercent > 15 && 'Car'}
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${interestPercent}%` }}>
                     {interestPercent > 15 && 'Interest'}
                </div>
            </div>
             <div className="flex justify-between text-xs mt-1 px-1">
                <span className="text-cyan-300">Car Price: {formatCurrency(carPrice)}</span>
                <span className="text-purple-300">Interest: {formatCurrency(interestPaid)}</span>
            </div>
        </div>
    );
};

export default FinancingPage;