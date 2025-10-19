import React, { useState, useEffect } from 'react';
import type { ActiveLoan } from '../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loan: ActiveLoan | null;
    onPaymentSubmit: (loanId: string, amount: number) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const floorToCent = (num: number) => Math.floor(num * 100) / 100;

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, loan, onPaymentSubmit }) => {
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'paid'>('idle');
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (loan) {
            if (loan.planType === 'Leasing') {
                setAmount(floorToCent(loan.monthlyPayment));
            } else { // Financing
                setAmount(floorToCent(Math.min(loan.monthlyPayment, loan.amountLeft)));
            }
        }
        setPaymentStatus('idle');
    }, [isOpen, loan]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loan || amount <= 0) return;

        const finalAmount = floorToCent(amount);
        onPaymentSubmit(loan.id, finalAmount);
        setPaymentStatus('paid');

        setTimeout(() => {
            onClose();
        }, 1500); // Close modal after showing success message
    };

    if (!isOpen || !loan) return null;

    const renderContent = () => {
        if (paymentStatus === 'paid') {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <svg className="w-20 h-20 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-2xl font-cinzel text-white">Paid!</h3>
                    <p className="text-gray-300 mt-1">{formatCurrency(amount)} payment recorded.</p>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-400">
                    {loan.planType === 'Leasing'
                        ? `Your monthly lease payment for the ${loan.vehicleModel} is ${formatCurrency(loan.monthlyPayment)}.`
                        : `Enter the amount you wish to pay towards your ${loan.vehicleModel}.`
                    }
                </p>
                <div>
                    <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-300">Payment Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input 
                            id="amount" 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))} 
                            step="0.01" 
                            min="0.01"
                            max={floorToCent(loan.planType === 'Financing' ? loan.amountLeft : loan.monthlyPayment)}
                            className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 pl-7 text-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors disabled:bg-gray-800/50 disabled:cursor-not-allowed" 
                            required 
                        />
                    </div>
                </div>
                <div className="pt-4">
                     <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3 px-8 rounded-full text-lg tracking-wider uppercase shadow-[0_0_20px_rgba(22,163,74,0.6)] hover:shadow-[0_0_30px_rgba(22,163,74,0.8)] transform hover:scale-105 transition-all duration-300">
                        Enter
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="relative bg-black/50 border border-purple-500/50 rounded-xl shadow-2xl shadow-purple-900/60 w-full max-w-md">
                <div className="p-6 border-b border-purple-500/30">
                     <h2 className="text-2xl font-cinzel text-white">Make a Payment</h2>
                     <p className="text-gray-400">For {loan.vehicleModel}</p>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-3xl leading-none">&times;</button>
            </div>
        </div>
    );
};

export default PaymentModal;