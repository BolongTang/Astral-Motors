import React from 'react';
import type { VehicleRecommendation } from '../types';

interface VehicleResultsProps {
  vehicles: VehicleRecommendation[];
  tips: string;
  isLoading: boolean;
  error: string | null;
  affordablePriceRange: { min: number, max: number };
  onSelectVehicle: (vehicle: VehicleRecommendation) => void;
}

const VehicleResults: React.FC<VehicleResultsProps> = ({ vehicles, tips, isLoading, error, affordablePriceRange, onSelectVehicle }) => {

  const topMatches = vehicles.filter(v => v.isTopMatch);
  const otherOptions = vehicles.filter(v => !v.isTopMatch);

  return (
    <div>
        <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 mb-8">
            <InfoBlock title="Affordable Price Range">
                <p className="text-2xl font-bold text-white">
                    {formatCurrency(affordablePriceRange.min)} - {formatCurrency(affordablePriceRange.max)}
                </p>
            </InfoBlock>
            <InfoBlock title="Celestial Advisor Tips">
                <div className='relative'>
                    <p className="text-base leading-relaxed text-gray-300 italic">"{tips}"</p>
                    {isLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
            </InfoBlock>
        </div>

        {error && <ErrorMessage message={error} />}

        {vehicles.length === 0 && !error && !isLoading && (
            <div className="text-center py-16 bg-black/20 rounded-lg">
                <h4 className='text-xl font-cinzel text-white'>No Vehicles Match Your Criteria</h4>
                <p className='text-gray-400 mt-2'>Try adjusting your filters on the left.</p>
            </div>
        )}

        {topMatches.length > 0 && <ResultsSection title="Top Matches for You" vehicles={topMatches} isTopMatch onSelectVehicle={onSelectVehicle} />}
        {otherOptions.length > 0 && <ResultsSection title="Other Options to Consider" vehicles={otherOptions} onSelectVehicle={onSelectVehicle}/>}
    </div>
  );
};

// Sub-components
const ResultsSection: React.FC<{title: string, vehicles: VehicleRecommendation[], isTopMatch?: boolean, onSelectVehicle: (vehicle: VehicleRecommendation) => void}> = ({ title, vehicles, isTopMatch = false, onSelectVehicle }) => (
    <div className="mb-12">
        <h3 className="text-2xl md:text-3xl font-bold font-cinzel text-purple-300 mb-6 border-b border-purple-500/20 pb-3">{title}</h3>
        <div className="space-y-6">
            {vehicles.map(vehicle => (
                <VehicleResultCard key={vehicle.model} vehicle={vehicle} isTopMatch={isTopMatch} onSelectVehicle={onSelectVehicle} />
            ))}
        </div>
    </div>
);


const VehicleResultCard: React.FC<{ vehicle: VehicleRecommendation, isTopMatch: boolean, onSelectVehicle: (vehicle: VehicleRecommendation) => void }> = ({ vehicle, isTopMatch, onSelectVehicle }) => {
  const { model, description, image, financingPlan, tags, seatingCapacity, specialOffer, price } = vehicle;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-purple-500/30 overflow-hidden flex flex-col md:flex-row shadow-lg shadow-purple-900/20 transition-all duration-300 hover:border-purple-400 hover:shadow-purple-700/30">
      <div className={isTopMatch ? "md:w-1/2" : "md:w-1/3"}>
        <img src={`${image}`} alt={model} className="w-full h-full object-cover"/>
      </div>
      <div className={`p-6 flex flex-col ${isTopMatch ? "md:w-1/2" : "md:w-2/3"}`}>
        <div className="flex justify-between items-start">
            <h4 className="text-2xl font-cinzel text-white">{model}</h4>
            <p className="text-xl font-bold text-gray-300">{formatCurrency(price)}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-1 mb-3 text-xs">
            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">{tags.style}</span>
            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">{tags.useCase}</span>
            <span className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">Seats: {seatingCapacity}</span>
        </div>
        <p className="text-gray-400 mb-4 text-sm flex-grow">{description}</p>
        {specialOffer && <p className="text-sm text-yellow-300 bg-yellow-900/30 rounded px-2 py-1 mb-3 self-start animate-pulse">✨ {specialOffer}</p>}
        
        <div className="bg-white/5 p-4 rounded-lg mt-auto text-center">
            <p className="text-xs text-purple-300 uppercase tracking-wider">Est. Monthly Payment</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(financingPlan.monthlyPayment)}</p>
            <p className="text-xs text-gray-400">based on your inputs</p>
        </div>
         <button onClick={() => onSelectVehicle(vehicle)} className="w-full mt-4 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-base tracking-wider uppercase shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transform hover:scale-105 transition-all duration-300">
            Personalize Financing
        </button>
      </div>
    </div>
  );
};

const InfoBlock: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-6 last:mb-0">
        <h4 className="text-lg font-cinzel text-purple-300 border-b border-purple-500/20 pb-2 mb-3 tracking-wider">{title}</h4>
        {children}
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-10 my-6 text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
    <p className="font-bold">A Cosmic Anomaly Occurred</p>
    <p className='text-sm'>{message}</p>
  </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default VehicleResults;