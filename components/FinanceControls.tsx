import React, { useState, useEffect, useMemo } from 'react';
import type { UserInput } from '../types';
import { VEHICLE_PREFERENCES } from '../constants';

interface FinanceControlsProps {
  userInput: UserInput;
  setUserInput: React.Dispatch<React.SetStateAction<UserInput>>;
  isFinancingMode: boolean;
}

// Debounce helper function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced;
};


const FinanceControls: React.FC<FinanceControlsProps> = ({ userInput, setUserInput, isFinancingMode }) => {
  const [localCreditScore, setLocalCreditScore] = useState(userInput.creditScore);

  // Sync local state if parent state changes for any reason
  useEffect(() => {
    setLocalCreditScore(userInput.creditScore);
  }, [userInput.creditScore]);
  
  // Memoized debounced function to update the parent state for the credit score
  const debouncedSetCreditScore = useMemo(
    () => debounce((score: number) => {
        setUserInput(prev => ({ ...prev, creditScore: score }));
    }, 1000), // 1-second debounce for a smoother experience
    [setUserInput]
  );
  
  const handleInputChange = (field: keyof UserInput, value: any) => {
    setUserInput(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePrefChange = (
    category: 'style' | 'useCase',
    value: string,
    checked: boolean
  ) => {
    setUserInput(prev => {
      const currentPrefs = prev.preferences.categories[category];
      const newPrefs = checked
        ? [...currentPrefs, value]
        : currentPrefs.filter(item => item !== value);
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          categories: {
            ...prev.preferences.categories,
            [category]: newPrefs,
          },
        },
      };
    });
  };
  
  const handleDescriptionChange = (value: string) => {
    setUserInput(prev => ({
        ...prev,
        preferences: { ...prev.preferences, description: value }
    }));
  };
  
  const handleCreditScoreChange = (value: number) => {
    const score = Math.max(300, Math.min(850, value));
    setLocalCreditScore(score); // Update local state immediately for UI feedback
    debouncedSetCreditScore(score); // Call debounced function to update parent state
  };

  const disabledClass = isFinancingMode ? 'opacity-40 pointer-events-none' : '';

  return (
    <form className="text-left bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 space-y-6 sticky top-28">
      {/* Financials */}
      <h3 className="text-lg font-cinzel text-purple-300 border-b border-purple-500/20 pb-2 tracking-wider">Your Coordinates</h3>
      <FormGroup label="Annual Income" htmlFor="income">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <InputField id="income" type="number" value={userInput.income} onChange={e => handleInputChange('income', Number(e.target.value))} min="10000" step="1000" className="pl-7" />
        </div>
      </FormGroup>
      
      <FormGroup label="Credit Score" htmlFor="creditScore">
        <div className='flex items-center gap-3'>
          <input id="creditScore" type="range" value={localCreditScore} onChange={e => handleCreditScoreChange(Number(e.target.value))} min="300" max="850" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          <InputField type="number" value={localCreditScore} onChange={e => handleCreditScoreChange(Number(e.target.value))} className="w-24 text-center p-2" min="300" max="850" />
        </div>
      </FormGroup>

      <FormGroup label="Down Payment" htmlFor="downPayment">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <InputField id="downPayment" type="number" value={userInput.downPayment} onChange={e => handleInputChange('downPayment', Number(e.target.value))} min="0" step="500" className="pl-7"/>
        </div>
      </FormGroup>

      <FormGroup label="Loan Term (Years)" htmlFor="loanTerm">
        <InputField id="loanTerm" type="number" value={userInput.loanTerm} onChange={e => handleInputChange('loanTerm', Number(e.target.value))} min="1" max="15" />
      </FormGroup>
      
      {/* Preferences */}
      <div className={`transition-opacity duration-300 ${disabledClass}`}>
        <h3 className="text-lg font-cinzel text-purple-300 border-b border-purple-500/20 pb-2 tracking-wider mt-8">Vehicle Preferences</h3>
        <div className="space-y-6 pt-6">
          <FormGroup label="Minimum Seats" htmlFor="minSeats">
            <InputField id="minSeats" type="number" value={userInput.minSeats} onChange={e => handleInputChange('minSeats', Number(e.target.value))} min="1" max="8" disabled={isFinancingMode}/>
          </FormGroup>

          <div className="space-y-4">
            <CheckboxGroup title="Preferred Style" options={VEHICLE_PREFERENCES.style} selected={userInput.preferences.categories.style} onChange={e => handlePrefChange('style', e.target.value, e.target.checked)} disabled={isFinancingMode}/>
            <CheckboxGroup title="Primary Use Case" options={VEHICLE_PREFERENCES.useCase} selected={userInput.preferences.categories.useCase} onChange={e => handlePrefChange('useCase', e.target.value, e.target.checked)} disabled={isFinancingMode} />
          </div>

          <FormGroup label="Describe your ideal vehicle journey" htmlFor="description">
            <textarea id="description" value={userInput.preferences.description} onChange={e => handleDescriptionChange(e.target.value)} rows={5} placeholder="e.g., 'I want to travel through all 50 states...'" className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors" disabled={isFinancingMode}></textarea>
          </FormGroup>
        </div>
      </div>
    </form>
  );
};


const FormGroup: React.FC<{label: string, htmlFor: string, children: React.ReactNode}> = ({ label, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
    {children}
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors disabled:bg-gray-800/50 ${props.className}`} />
);

const CheckboxGroup: React.FC<{title: string, options: string[], selected: string[], onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean}> = ({ title, options, selected, onChange, disabled }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-300 mb-3">{title}</h4>
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map(option => (
        <label key={option} className={`flex items-center space-x-2 text-gray-300 text-sm ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-white'}`}>
          <input type="checkbox" value={option} checked={selected.includes(option)} onChange={onChange} className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" disabled={disabled}/>
          <span>{option}</span>
        </label>
      ))}
    </div>
  </div>
);

export default FinanceControls;