import React, { useState, useEffect } from 'react';
import type { SavedAlignment, FinancingPlan, LeasingPlan } from '../types';
import { getSummaryForSavedAlignments } from '../services/geminiService';
import Timeline from './Timeline';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface TimelineSettings {
    [alignmentId: string]: {
        visible: boolean;
        color: string;
    }
}

interface SavedAlignmentsPageProps {
    alignments: SavedAlignment[];
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onBack: () => void;
    onCommit: (id: string) => void;
}

const GALAXY_COLORS = ['#9b59b6', '#3498db', '#1abc9c', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22'];

const SavedAlignmentsPage: React.FC<SavedAlignmentsPageProps> = ({ alignments, onDelete, onClearAll, onBack, onCommit }) => {
    const [summary, setSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({});

    useEffect(() => {
        // Initialize timeline settings for any new alignments
        setTimelineSettings(prevSettings => {
            const newSettings = {...prevSettings};
            alignments.forEach((alignment, index) => {
                if (!newSettings[alignment.id]) {
                    newSettings[alignment.id] = {
                        visible: true,
                        color: GALAXY_COLORS[index % GALAXY_COLORS.length]
                    };
                }
            });
            return newSettings;
        });
    }, [alignments]);

    const handleGenerateSummary = async () => {
        setIsLoadingSummary(true);
        setError(null);
        setSummary('');
        try {
            const result = await getSummaryForSavedAlignments(alignments);
            setSummary(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingSummary(false);
        }
    };
    
    const handleDelete = (id: string) => {
        onDelete(id);
        // Clean up settings state
        setTimelineSettings(prev => {
            const newSettings = {...prev};
            delete newSettings[id];
            return newSettings;
        });
    }
    
    const handleClearAll = () => {
        onClearAll();
        setTimelineSettings({});
    }

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

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white">
                        My Plans
                    </h3>
                    <p className="text-lg text-gray-400 mt-2">
                        Compare your saved financing and leasing constellations.
                    </p>
                </div>
                 <button onClick={onBack} className="text-purple-300 hover:text-white transition-colors self-start whitespace-nowrap">
                    &larr; Back to Navigator
                </button>
            </div>

            {alignments.length > 0 && (
                <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 mb-8">
                    <h4 className="text-lg font-cinzel text-purple-300 mb-3 tracking-wider">AI Comparison Summary</h4>
                    {summary && !isLoadingSummary && <p className="text-gray-300 italic">"{summary}"</p>}
                    {isLoadingSummary && <div className="flex items-center justify-center h-20"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}
                    {!summary && !isLoadingSummary && <p className="text-gray-500 text-sm">Generate a summary to get AI-powered insights on your saved options.</p>}
                     {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="mt-4 bg-purple-600 text-white font-bold py-2 px-5 rounded-full text-sm tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoadingSummary ? 'Consulting Advisor...' : 'Generate AI Summary'}
                    </button>
                </div>
            )}
            
            <div className="bg-black/20 rounded-lg overflow-x-auto">
                 {alignments.length === 0 ? (
                     <div className="text-center py-24">
                        <h4 className="text-2xl font-cinzel text-white">Your Universe is Empty</h4>
                        <p className="text-gray-400 mt-2">Go to the navigator to find and save your perfect plan.</p>
                     </div>
                 ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black/30 text-xs text-purple-300 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-3">Vehicle</th>
                                <th scope="col" className="px-6 py-3">Plan Details</th>
                                <th scope="col" className="px-6 py-3">Length</th>
                                <th scope="col" className="px-6 py-3">Payment</th>
                                <th scope="col" className="px-6 py-3">Timeline</th>
                                <th scope="col" className="px-6 py-3 text-center">Commit</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alignments.map(item => {
                                const setting = timelineSettings[item.id];
                                // FIX: Use discriminated union 'planType' directly for type narrowing, resolving property access errors.
                                return (
                                    <tr key={item.id} className="border-b border-gray-800 hover:bg-black/30">
                                        <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                            {item.vehicle.model}
                                            <div className="font-normal text-xs text-gray-400">
                                                Income: {formatCurrency(item.userInput.income)} | Down: {formatCurrency(item.userInput.downPayment)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className='flex flex-col'>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${item.plan.planType === 'Financing' ? 'bg-cyan-900 text-cyan-300' : 'bg-fuchsia-900 text-fuchsia-300'}`}>
                                                    {item.plan.planType}
                                                </span>
                                                <span className='text-gray-300 text-xs mt-1'>
                                                    {item.plan.planType === 'Financing' ? `Total: ${formatCurrency(item.plan.totalCost)}` : `Due: ${formatCurrency(item.plan.dueAtSigning)}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                                            {item.plan.planType === 'Financing'
                                                ? `${item.plan.loanTerm} years`
                                                : `Ends ${new Date(new Date(item.savedAt).setMonth(new Date(item.savedAt).getMonth() + item.plan.term)).toLocaleString('default', { month: 'short', year: 'numeric' })}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-xl text-white">{formatCurrency(item.plan.monthlyPayment)}<span className='text-gray-400 text-xs'>/mo</span></td>
                                        <td className="px-6 py-4">
                                            {setting && (
                                                <div className="flex items-center gap-3">
                                                    <label title="Toggle visibility on timeline" className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={setting.visible} onChange={() => handleToggleVisibility(item.id)} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                    </label>
                                                    <input 
                                                        type="color"
                                                        title="Customize timeline color"
                                                        value={setting.color} 
                                                        onChange={(e) => handleColorChange(item.id, e.target.value)}
                                                        className="w-8 h-8 p-0 bg-transparent border-none rounded-full cursor-pointer"
                                                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => onCommit(item.id)}
                                                className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full text-xs tracking-wider shadow-[0_0_10px_rgba(20,184,166,0.4)] hover:shadow-[0_0_15px_rgba(20,184,166,0.6)] transform hover:scale-105 transition-all duration-300 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                                                title={"Commit to this plan"}
                                            >
                                                Commit
                                            </button>
                                        </td>
                                        <td className='px-6 py-4 text-right'>
                                            <button onClick={() => handleDelete(item.id)} className="font-medium text-red-500 hover:text-red-400">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 )}
            </div>
             {alignments.length > 0 && (
                <>
                    <div className="text-right mt-4">
                        <button onClick={handleClearAll} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Clear All Plans</button>
                    </div>
                    <Timeline alignments={alignments} settings={timelineSettings} />
                </>
            )}
        </div>
    );
};

export default SavedAlignmentsPage;