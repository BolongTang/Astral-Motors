import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { ActiveLoan } from '../types';
import { getTimelineSummary } from '../services/geminiService';
import PaymentModal from './PaymentModal';

// --- TYPE DEFINITIONS ---
interface Payment {
    date: Date;
    vehicle: ActiveLoan;
    remaining: number;
}

interface TimelineSettings {
    [vehicleId: string]: {
        visible: boolean;
        color: string;
    }
}

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const GALAXY_COLORS = ['#9b59b6', '#3498db', '#1abc9c', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22'];

// --- ICON COMPONENTS ---
const CheckmarkIcon: React.FC = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="On Track">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Payment Due">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);


// --- SUB-COMPONENT: PAYMENTS TABLE ---
const PaymentsTable: React.FC<{ payments: Payment[] }> = ({ payments }) => {
    return (
        <div className="mt-12">
            <h3 className="text-3xl font-bold font-cinzel text-white mb-8">
                Complete Payment Schedule
            </h3>
            <div className="bg-black/20 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto border border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-black/30 text-xs text-purple-300 uppercase tracking-wider sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Payment Date</th>
                            <th scope="col" className="px-6 py-3">Vehicle</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            <th scope="col" className="px-6 py-3 text-right">Payments Remaining</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {payments.map(({ date, vehicle, remaining }, index) => (
                            <tr key={`${vehicle.id}-${index}`} className="hover:bg-black/30">
                                <td className="px-6 py-4 font-semibold text-white">{formatDate(date)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={`${vehicle.imageUrl}`} alt={vehicle.vehicleModel} className="w-16 h-10 object-cover rounded" />
                                        <span className="font-medium text-gray-300">{vehicle.vehicleModel}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-white">{formatCurrency(vehicle.monthlyPayment)}</td>
                                <td className="px-6 py-4 text-right text-gray-400">{remaining}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: DETAILED TIMELINE ---
const DetailedTimeline: React.FC<{ vehicles: ActiveLoan[], settings: TimelineSettings }> = ({ vehicles, settings }) => {
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (timelineRef.current) {
                e.preventDefault();
                timelineRef.current.scrollLeft += e.deltaY;
            }
        };
        const element = timelineRef.current;
        if (element) {
            element.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => { element?.removeEventListener('wheel', handleWheel); };
    }, []);

    const { startDate, endDate, totalDays, allPayments } = useMemo(() => {
        const visibleVehicles = vehicles.filter(v => settings[v.id]?.visible);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let latestEndDate = today;
        const payments: Payment[] = [];

        visibleVehicles.forEach(vehicle => {
            const loanStartDate = new Date(vehicle.loanStartDate);
            const loanEndDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + vehicle.loanTermInMonths, vehicle.paymentDayOfMonth);
            if (loanEndDate > latestEndDate) {
                latestEndDate = loanEndDate;
            }

            for (let i = 0; i < vehicle.loanTermInMonths; i++) {
                const paymentDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + i, vehicle.paymentDayOfMonth);
                if (paymentDate >= today) {
                    payments.push({
                        date: paymentDate,
                        vehicle,
                        remaining: vehicle.loanTermInMonths - i,
                    });
                }
            }
        });

        const startDate = today;
        const endDate = new Date(latestEndDate.getFullYear(), latestEndDate.getMonth() + 3, 1); // Add 3 month buffer
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return { startDate, endDate, totalDays, allPayments: payments.sort((a,b) => a.date.getTime() - b.date.getTime()) };
    }, [vehicles, settings]);
    
    const DAY_WIDTH = 4; // pixels per day
    const totalWidth = totalDays * DAY_WIDTH;

    const axisMarkers = useMemo(() => {
        const markers = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const isFirstDayOfMonth = currentDate.getDate() === 1;
            if (isFirstDayOfMonth) {
                const daysFromStart = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const month = currentDate.toLocaleString('default', { month: 'short' });
                const year = currentDate.getFullYear();
                const isFirstMonthOfYear = currentDate.getMonth() === 0;

                markers.push(
                    <div key={`marker-${currentDate.toISOString()}`} style={{ left: `${daysFromStart * DAY_WIDTH}px` }} className="absolute top-0 h-full border-l border-gray-700/50">
                        <span className={`absolute -top-5 text-xs ${isFirstMonthOfYear ? 'text-white font-bold' : 'text-gray-500'}`}>
                            {month}
                        </span>
                        {isFirstMonthOfYear && (
                            <span className="absolute -top-10 text-lg font-cinzel text-purple-300">{year}</span>
                        )}
                    </div>
                );
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return markers;
    }, [startDate, endDate]);

    const paymentItems = allPayments.map((payment, index) => {
        const daysFromStart = Math.ceil((payment.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const vehicleIndex = vehicles.findIndex(v => v.id === payment.vehicle.id);
        
        return (
            <div
                key={`${payment.vehicle.id}-${index}`}
                className="absolute flex flex-col items-center"
                style={{
                    left: `${daysFromStart * DAY_WIDTH}px`,
                    top: `${(vehicleIndex * 2.75) + 3}rem`,
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                }}
            >
                <span
                    className="text-sm font-semibold underline cursor-pointer whitespace-nowrap"
                    style={{ color: payment.vehicle.color, textUnderlineOffset: '2px' }}
                    title={`${payment.vehicle.vehicleModel} - ${formatDate(payment.date)}: ${formatCurrency(payment.vehicle.monthlyPayment)}`}
                >
                    {formatCurrency(payment.vehicle.monthlyPayment)}
                </span>
                <div
                    className="w-0 h-12 mt-1 border-l border-dashed"
                    style={{ borderColor: payment.vehicle.color }}
                ></div>
            </div>
        );
    });

    return (
        <div className="mt-12">
            <h3 className="text-3xl font-bold font-cinzel text-white mb-8">
                Future Payment Timeline
            </h3>
            <div ref={timelineRef} className="relative h-96 w-full overflow-x-scroll overflow-y-hidden bg-black/30 rounded-lg p-4 pt-12 border border-purple-500/30 cursor-grab active:cursor-grabbing">
                <div className="relative" style={{ width: `${totalWidth}px`, height: '100%' }}>
                    {axisMarkers}
                    {paymentItems}
                </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
                Hover over the timeline and scroll up/down to navigate through time.
            </p>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
interface MyTimelinePageProps {
    onBack: () => void;
    userVehicles: ActiveLoan[];
    onMakePayment: (loanId: string, amount: number) => void;
}

const MyTimelinePage: React.FC<MyTimelinePageProps> = ({ onBack, userVehicles, onMakePayment }) => {
    const [summary, setSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({});
    const [paymentModalState, setPaymentModalState] = useState<{ isOpen: boolean; loan: ActiveLoan | null }>({ isOpen: false, loan: null });

    useEffect(() => {
        setTimelineSettings(prevSettings => {
            const newSettings: TimelineSettings = {};
            userVehicles.forEach((vehicle, index) => {
                newSettings[vehicle.id] = {
                    visible: prevSettings[vehicle.id]?.visible ?? true,
                    color: prevSettings[vehicle.id]?.color || GALAXY_COLORS[index % GALAXY_COLORS.length]
                };
            });
            return newSettings;
        });
    }, [userVehicles]);
    
    const handleGenerateSummary = async () => {
        setIsLoadingSummary(true);
        setError(null);
        setSummary('');
        try {
            const result = await getTimelineSummary(userVehicles);
            setSummary(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const handleToggleVisibility = (id: string) => {
        setTimelineSettings(prev => ({
            ...prev,
            [id]: { ...prev[id], visible: !prev[id].visible }
        }));
    };

    const handleColorChange = (id: string, color: string) => {
        setTimelineSettings(prev => ({
            ...prev,
            [id]: { ...prev[id], color }
        }));
    };
    
    const allFuturePayments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const payments: Payment[] = [];

        userVehicles.forEach(vehicle => {
            const loanStartDate = new Date(vehicle.loanStartDate);
            for (let i = 0; i < vehicle.loanTermInMonths; i++) {
                const paymentDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + i, vehicle.paymentDayOfMonth);
                if (paymentDate >= today) {
                    payments.push({
                        date: paymentDate,
                        vehicle,
                        remaining: vehicle.loanTermInMonths - i,
                    });
                }
            }
        });
        return payments.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [userVehicles]);

    const getOnTrackStatus = (vehicle: ActiveLoan): boolean => {
        const today = new Date();
        const startDate = new Date(vehicle.loanStartDate);

        if (vehicle.planType === 'Leasing') {
            const currentMonthIdentifier = today.getFullYear() * 100 + today.getMonth();
            const startMonthIdentifier = startDate.getFullYear() * 100 + startDate.getMonth();

            if (vehicle.lastPaymentMonth === currentMonthIdentifier) return true;
            if (startMonthIdentifier === currentMonthIdentifier && today.getDate() < vehicle.paymentDayOfMonth) return true;
            
            return false;
        } else { // Financing
            if (vehicle.amountLeft <= 0) return true; // Paid off
            if (!vehicle.initialLoanAmount) return true; // Cannot determine without initial amount

            const monthsPassed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
            let paymentsDue = monthsPassed;
            if (today.getDate() >= vehicle.paymentDayOfMonth) {
                paymentsDue += 1;
            }

            if (paymentsDue <= 0) return true;

            const estimatedPaymentsMade = (vehicle.initialLoanAmount - vehicle.amountLeft) / vehicle.monthlyPayment;
            
            return estimatedPaymentsMade >= (paymentsDue - 1);
        }
    };

    return (
        <>
            <PaymentModal
                isOpen={paymentModalState.isOpen}
                onClose={() => setPaymentModalState({ isOpen: false, loan: null })}
                loan={paymentModalState.loan}
                onPaymentSubmit={onMakePayment}
            />
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white">
                            My Payment Timeline
                        </h3>
                        <p className="text-lg text-gray-400 mt-2">
                            An overview of your current vehicle payment obligations.
                        </p>
                    </div>
                    <button onClick={onBack} className="text-purple-300 hover:text-white transition-colors self-start whitespace-nowrap">
                        &larr; Back to Navigator
                    </button>
                </div>
                
                {userVehicles.length > 0 ? (
                    <>
                        <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 mb-8">
                            <h4 className="text-lg font-cinzel text-purple-300 mb-3 tracking-wider">AI Timeline Summary</h4>
                            {summary && !isLoadingSummary && <p className="text-gray-300 italic">"{summary}"</p>}
                            {isLoadingSummary && <div className="flex items-center justify-center h-20"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}
                            {!summary && !isLoadingSummary && <p className="text-gray-500 text-sm">Generate a summary to get AI-powered insights on your payment schedule.</p>}
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="mt-4 bg-purple-600 text-white font-bold py-2 px-5 rounded-full text-sm tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoadingSummary ? 'Consulting Advisor...' : 'Generate AI Summary'}
                            </button>
                        </div>

                        <div className="bg-black/20 rounded-lg overflow-x-auto mb-8">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-black/30 text-xs text-purple-300 uppercase tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Vehicle</th>
                                        <th scope="col" className="px-6 py-3">Plan Details</th>
                                        <th scope="col" className="px-6 py-3">Monthly Payment</th>
                                        <th scope="col" className="px-6 py-3">Amount Left</th>
                                        <th scope="col" className="px-6 py-3">Plan End Date</th>
                                        <th scope="col" className="px-6 py-3 text-center">On Track</th>
                                        <th scope="col" className="px-6 py-3 text-center">Timeline Controls</th>
                                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userVehicles.map(vehicle => {
                                        const setting = timelineSettings[vehicle.id];
                                        const loanStartDate = new Date(vehicle.loanStartDate);
                                        const loanEndDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + vehicle.loanTermInMonths, vehicle.paymentDayOfMonth);

                                        const isLease = vehicle.planType === 'Leasing';
                                        const currentMonthIdentifier = new Date().getFullYear() * 100 + new Date().getMonth();
                                        const paymentMadeThisMonth = isLease && vehicle.lastPaymentMonth === currentMonthIdentifier;
                                        const amountLeftDisplay = isLease 
                                            ? (paymentMadeThisMonth ? 0 : vehicle.monthlyPayment)
                                            : vehicle.amountLeft;

                                        const isOnTrack = getOnTrackStatus(vehicle);

                                        return (
                                            <tr key={vehicle.id} className="border-b border-gray-800 hover:bg-black/30">
                                                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <img src={`${vehicle.imageUrl}`} alt={vehicle.vehicleModel} className="w-16 h-10 object-cover rounded" />
                                                        {vehicle.vehicleModel}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className='flex flex-col'>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${isLease ? 'bg-fuchsia-900 text-fuchsia-300' : 'bg-cyan-900 text-cyan-300'}`}>
                                                            {vehicle.planType}
                                                        </span>
                                                        <span className='text-gray-300 text-xs mt-1'>
                                                            {isLease ? `Total Payments: ${formatCurrency(vehicle.totalCost)}` : `Total Loan: ${formatCurrency(vehicle.totalCost)}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-xl text-white">{formatCurrency(vehicle.monthlyPayment)}<span className='text-gray-400 text-xs'>/mo</span></td>
                                                <td className="px-6 py-4 font-semibold text-lg text-green-300">{formatCurrency(amountLeftDisplay)}</td>
                                                <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatDate(loanEndDate)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center" title={isOnTrack ? 'On Track' : 'Payment Due'}>
                                                        {isOnTrack ? <CheckmarkIcon /> : <WarningIcon />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {setting && (
                                                        <div className="flex items-center justify-center gap-4">
                                                            <label title="Toggle visibility on timeline" className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={setting.visible} onChange={() => handleToggleVisibility(vehicle.id)} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                            </label>
                                                            <input 
                                                                type="color"
                                                                title="Customize timeline color"
                                                                value={setting.color} 
                                                                onChange={(e) => handleColorChange(vehicle.id, e.target.value)}
                                                                className="w-8 h-8 p-0 bg-transparent border-none rounded-full cursor-pointer"
                                                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => setPaymentModalState({ isOpen: true, loan: vehicle })}
                                                        disabled={isLease ? paymentMadeThisMonth : vehicle.amountLeft <= 0}
                                                        className="bg-green-600 text-white font-bold py-2 px-5 rounded-full text-sm tracking-wider shadow-[0_0_15px_rgba(22,163,74,0.4)] hover:shadow-[0_0_25px_rgba(22,163,74,0.6)] transform hover:scale-105 transition-all duration-300 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                                                    >
                                                        {isLease ? (paymentMadeThisMonth ? 'Paid this month' : 'Pay') : (vehicle.amountLeft <= 0 ? 'Paid Off' : 'Pay')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <DetailedTimeline vehicles={userVehicles} settings={timelineSettings} />
                        <PaymentsTable payments={allFuturePayments} />
                    </>
                ) : (
                    <div className="text-center py-24 bg-black/20 rounded-lg">
                        <h4 className="text-2xl font-cinzel text-white">No Active Loans</h4>
                        <p className="text-gray-400 mt-2">Your active financing plans will appear here once they are added.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default MyTimelinePage;