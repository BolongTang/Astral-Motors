import React, { useRef, useEffect, useMemo } from 'react';
import type { SavedAlignment } from '../types';

interface TimelineSettings {
    [alignmentId: string]: {
        visible: boolean;
        color: string;
    }
}

interface TimelineProps {
    alignments: SavedAlignment[];
    settings: TimelineSettings;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const Timeline: React.FC<TimelineProps> = ({ alignments, settings }) => {
    const timelineRef = useRef<HTMLDivElement>(null);

    // Custom scroll effect: vertical scroll (mouse wheel) controls horizontal movement
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (timelineRef.current) {
                // Prevent the page from scrolling vertically
                e.preventDefault();
                // Adjust scrollLeft based on deltaY (vertical scroll)
                timelineRef.current.scrollLeft += e.deltaY;
            }
        };

        const element = timelineRef.current;
        if (element) {
            element.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (element) {
                element.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    // Determine the total length of the timeline based on the longest plan
    const maxTermMonths = useMemo(() => {
        if (alignments.length === 0) return 0;
        return Math.max(...alignments.map(a => 
            a.plan.planType === 'Financing' ? a.plan.loanTerm * 12 : a.plan.term
        ));
    }, [alignments]);

    const totalMonths = maxTermMonths > 0 ? maxTermMonths + 12 : 60; // Add a 1-year buffer, or default to 5 years
    const MONTH_WIDTH = 100; // pixels per month
    const totalWidth = totalMonths * MONTH_WIDTH;
    const today = new Date();

    // Generate month and year markers for the timeline axis
    const axisMarkers = Array.from({ length: totalMonths }).map((_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const isFirstMonthOfYear = date.getMonth() === 0;

        return (
            <div key={`marker-${i}`} style={{ left: `${i * MONTH_WIDTH}px` }} className="absolute top-0 h-full border-l border-gray-700/50">
                <span className={`absolute -top-5 text-xs ${isFirstMonthOfYear ? 'text-white font-bold' : 'text-gray-500'}`}>
                    {month}
                </span>
                {isFirstMonthOfYear && (
                    <span className="absolute -top-10 text-lg font-cinzel text-purple-300">{year}</span>
                )}
            </div>
        );
    });

    // Generate the payment items (text + line) for each visible alignment
    const paymentItems = alignments
        .filter(a => settings[a.id]?.visible)
        .map((alignment, alignmentIndex) => {
            const termInMonths = alignment.plan.planType === 'Financing' ? alignment.plan.loanTerm * 12 : alignment.plan.term;
            const setting = settings[alignment.id];
            
            return Array.from({ length: termInMonths }).map((_, monthIndex) => (
                 <div
                    key={`${alignment.id}-${monthIndex}`}
                    className="absolute flex flex-col items-center"
                    style={{
                        left: `${(monthIndex * MONTH_WIDTH) + MONTH_WIDTH / 2}px`,
                        top: `${(alignmentIndex * 2.75) + 3}rem`,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                    }}
                >
                    <span
                        className="text-sm font-semibold underline cursor-pointer whitespace-nowrap"
                        style={{ color: setting.color, textUnderlineOffset: '2px' }}
                        title={`${alignment.vehicle.model}: ${formatCurrency(alignment.plan.monthlyPayment)}`}
                    >
                        {formatCurrency(alignment.plan.monthlyPayment)}
                    </span>
                    <div
                        className="w-0 h-12 mt-1 border-l border-dashed"
                        style={{ borderColor: setting.color }}
                    ></div>
                </div>
            ));
        }).flat();

    return (
        <div className="mt-12">
            <h3 className="text-3xl font-bold font-cinzel text-white mb-8">
                Payment Constellation Timeline
            </h3>
            <div
                ref={timelineRef}
                className="relative h-96 w-full overflow-x-scroll overflow-y-hidden bg-black/30 rounded-lg p-4 pt-12 border border-purple-500/30 cursor-grab active:cursor-grabbing"
            >
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

export default Timeline;