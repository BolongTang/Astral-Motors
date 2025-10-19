import React, { useState } from 'react';
import type { UserInput } from '../types';
import { VEHICLE_PREFERENCES } from '../constants';

interface FinanceFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const FinanceForm: React.FC<FinanceFormProps> = ({ onSubmit, isLoading }) => {
  const [income, setIncome] = useState(75000);
  const [creditScore, setCreditScore] = useState(720);
  const [downPayment, setDownPayment] = useState(5000);
  const [loanTerm, setLoanTerm] = useState(5);
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);
  const [useCasePrefs, setUseCasePrefs] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  // FIX: Add state for minSeats and include it in the form to satisfy the UserInput type.
  const [minSeats, setMinSeats] = useState(1);

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    currentPrefs: string[]
  ) => {
    const { value, checked } = e.target;
    if (checked) {
      setter([...currentPrefs, value]);
    } else {
      setter(currentPrefs.filter(item => item !== value));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      income,
      creditScore,
      downPayment,
      loanTerm,
      minSeats,
      preferences: {
        categories: {
          style: stylePrefs,
          useCase: useCasePrefs,
        },
        description,
      },
    });
  };

  return (
    <section id="calculator" className="py-20 px-4">
      <div className="container mx-auto text-center">
        <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white mb-4">
          Stellar Finance Navigator
        </h3>
        <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
          Chart your course to a new Toyota. Provide your coordinates, and we'll calculate the perfect alignment of vehicle and financing.
        </p>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto text-left bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 p-8 space-y-8">
          
          {/* Financials */}
          <div className="grid md:grid-cols-2 gap-8">
            <FormGroup label="Annual Income" htmlFor="income">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <InputField id="income" type="number" value={income} onChange={e => setIncome(Number(e.target.value))} min="10000" step="1000" className="pl-7" />
              </div>
            </FormGroup>
            <FormGroup label={`Credit Score: ${creditScore}`} htmlFor="creditScore">
              <input id="creditScore" type="range" value={creditScore} onChange={e => setCreditScore(Number(e.target.value))} min="300" max="850" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </FormGroup>
            <FormGroup label="Down Payment" htmlFor="downPayment">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <InputField id="downPayment" type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} min="0" step="500" className="pl-7"/>
              </div>
            </FormGroup>
            <FormGroup label="Loan Term (Years)" htmlFor="loanTerm">
              <InputField id="loanTerm" type="number" value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} min="1" max="7" />
            </FormGroup>
          </div>
          
          {/* Preferences */}
          <FormGroup label="Minimum Seats" htmlFor="minSeats">
            <InputField id="minSeats" type="number" value={minSeats} onChange={e => setMinSeats(Number(e.target.value))} min="1" max="8" />
          </FormGroup>
          <div className="space-y-6">
            <CheckboxGroup title="Preferred Style" options={VEHICLE_PREFERENCES.style} selected={stylePrefs} onChange={e => handleCheckboxChange(e, setStylePrefs, stylePrefs)} />
            <CheckboxGroup title="Primary Use Case" options={VEHICLE_PREFERENCES.useCase} selected={useCasePrefs} onChange={e => handleCheckboxChange(e, setUseCasePrefs, useCasePrefs)} />
          </div>

          <FormGroup label="Describe your ideal vehicle journey" htmlFor="description">
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="e.g., 'I need a safe and reliable car for my family with good gas mileage for long road trips. Something with a bit of style would be nice too!'" className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"></textarea>
          </FormGroup>

          <div className="text-center pt-4">
            <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-10 rounded-full text-lg tracking-wider uppercase shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Calculating...' : 'Find My Alignment'}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};


const FormGroup: React.FC<{label: string, htmlFor: string, children: React.ReactNode}> = ({ label, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
    {children}
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors ${props.className}`} />
);

const CheckboxGroup: React.FC<{title: string, options: string[], selected: string[], onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ title, options, selected, onChange }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-300 mb-3">{title}</h4>
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {options.map(option => (
        <label key={option} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
          <input type="checkbox" value={option} checked={selected.includes(option)} onChange={onChange} className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
          <span>{option}</span>
        </label>
      ))}
    </div>
  </div>
);

export default FinanceForm;