import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FinanceControls from './components/FinanceControls';
import VehicleResults from './components/VehicleResults';
import Footer from './components/Footer';
import FinancingPage from './components/FinancingPage';
import SavedAlignmentsPage from './components/SavedAlignmentsPage';
import MyTimelinePage from './components/MyTimelinePage';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import SampleUsersPage from './components/SampleUsersPage';
import type { UserInput, ToyotaVehicle, VehicleRecommendation, SimpleFinancingPlan, SavedAlignment, AppStateForChatbot, UserData, ActiveLoan, Conversation, FinancingPlan, SampleUser } from './types';
import { getFinancialInsights } from './services/geminiService';
import { TOYOTA_FLEET } from './constants';
import * as db from './services/databaseService';
import * as sampleUserDb from './services/sampleUserService';

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

const GALAXY_COLORS = ['#9b59b6', '#3498db', '#1abc9c', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22'];


// --- HELPER FUNCTIONS ---
const getInterestRate = (score: number): number => {
  if (score >= 760) return 0.05;
  if (score >= 700) return 0.065;
  if (score >= 650) return 0.08;
  if (score >= 600) return 0.12;
  return 0.18;
};

const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const numberOfPayments = years * 12;
  if (monthlyRate === 0) return principal / numberOfPayments;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const [geminiResults, setGeminiResults] = useState<{ topModels: string[], tips: string }>({ topModels: [], tips: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecommendation | null>(null);
  const [view, setView] = useState<'navigator' | 'saved' | 'timeline' | 'samples'>('navigator');
  const [sampleUsers, setSampleUsers] = useState<SampleUser[]>([]);

  // Check for active session on initial load
  useEffect(() => {
    db.initializeDatabase();
    setSampleUsers(sampleUserDb.getSampleUsers());
    const session = db.getCurrentSession();
    if (session.username) {
      handleLoginSuccess(session.username);
    }
  }, []);

  // Persist user data whenever it changes (but not for guests)
  useEffect(() => {
    if (currentUser && currentUser !== 'guest' && userData) {
      db.updateUserData(currentUser, userData);
    }
  }, [userData, currentUser]);
  
  const handleLoginSuccess = (username: string) => {
    const data = db.getUserData(username);
    if (data) {
        setCurrentUser(username);
        setUserData(data);
    }
  };
  
  const handleContinueAsGuest = () => {
    setCurrentUser('guest');
    setUserData(db.getDefaultUserData());
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setUserData(null);
  };


  const setUserInput = (updater: React.SetStateAction<UserInput>) => {
    setUserData(prev => {
        if (!prev) return null;
        const newUserInput = typeof updater === 'function' ? updater(prev.userInput) : updater;
        return { ...prev, userInput: newUserInput };
    });
  };

  const handleSaveAlignment = (alignment: SavedAlignment) => {
      setUserData(prev => {
        if (!prev) return null;
        const newAlignments = [alignment, ...prev.savedAlignments];
        newAlignments.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        return { ...prev, savedAlignments: newAlignments };
      });
  };

  const handleDeleteAlignment = (id: string) => {
       setUserData(prev => {
        if (!prev) return null;
        const updatedAlignments = prev.savedAlignments.filter(a => a.id !== id);
        return { ...prev, savedAlignments: updatedAlignments };
      });
  };

  const handleClearAllAlignments = () => {
       setUserData(prev => prev ? { ...prev, savedAlignments: [] } : null);
  };

    const handleCommitAlignment = (alignmentId: string) => {
        setUserData(prev => {
            if (!prev) return null;

            const alignmentToCommit = prev.savedAlignments.find(a => a.id === alignmentId);
            if (!alignmentToCommit) {
                console.warn("Plan not found.");
                return prev;
            }
            
            const loanExists = prev.activeLoans.some(loan => loan.id === alignmentToCommit.id);
            if (loanExists) {
                console.warn("This plan has already been committed.");
                return prev;
            }

            const plan = alignmentToCommit.plan;
            let newLoan: ActiveLoan;

            if (plan.planType === 'Financing') {
                newLoan = {
                    id: alignmentToCommit.id,
                    vehicleModel: alignmentToCommit.vehicle.model,
                    imageUrl: alignmentToCommit.vehicle.image,
                    monthlyPayment: plan.monthlyPayment,
                    totalCost: plan.totalCost,
                    loanStartDate: new Date().toISOString(),
                    loanTermInMonths: plan.loanTerm * 12,
                    paymentDayOfMonth: new Date().getDate(),
                    color: GALAXY_COLORS[prev.activeLoans.length % GALAXY_COLORS.length],
                    amountLeft: plan.loanAmount,
                    planType: 'Financing',
                    initialLoanAmount: plan.loanAmount,
                };
            } else { // It's a Leasing plan
                newLoan = {
                    id: alignmentToCommit.id,
                    vehicleModel: alignmentToCommit.vehicle.model,
                    imageUrl: alignmentToCommit.vehicle.image,
                    monthlyPayment: plan.monthlyPayment,
                    totalCost: plan.monthlyPayment * plan.term,
                    loanStartDate: new Date().toISOString(),
                    loanTermInMonths: plan.term,
                    paymentDayOfMonth: new Date().getDate(),
                    color: GALAXY_COLORS[prev.activeLoans.length % GALAXY_COLORS.length],
                    amountLeft: 0, // Not used for balance tracking in leases
                    planType: 'Leasing',
                };
            }
            
            return {
                ...prev,
                activeLoans: [...prev.activeLoans, newLoan],
            };
        });
    };

  const handleSaveConversation = (conversation: Conversation) => {
      setUserData(prev => {
          if (!prev) return null;
          const newConversations = [conversation, ...prev.chatbotConversations];
          return { ...prev, chatbotConversations: newConversations };
      });
  };

  const handleMakePayment = (loanId: string, amount: number) => {
    setUserData(prev => {
        if (!prev) return null;
        const updatedLoans = prev.activeLoans.map(loan => {
            if (loan.id === loanId) {
                if (loan.planType === 'Leasing') {
                    const currentMonthIdentifier = new Date().getFullYear() * 100 + new Date().getMonth();
                    return { ...loan, lastPaymentMonth: currentMonthIdentifier };
                } else { // Financing
                    return { ...loan, amountLeft: Math.max(0, loan.amountLeft - amount) };
                }
            }
            return loan;
        });
        return { ...prev, activeLoans: updatedLoans };
    });
  };

  const handleSelectVehicle = (vehicle: VehicleRecommendation) => {
    setSelectedVehicle(vehicle);
    window.scrollTo(0, document.getElementById('calculator')?.offsetTop || 0);
  };

  const handleBackToResults = () => {
    setSelectedVehicle(null);
  };
  
  const handleNavigate = (newView: 'navigator' | 'saved' | 'timeline' | 'samples') => {
      setView(newView);
      setSelectedVehicle(null);
  }

  // --- Sample User Handlers ---
  const handleSaveNewSample = (name: string) => {
    if (!userData) return;
    const newSample = sampleUserDb.addSampleUser(name, userData);
    setSampleUsers(prev => [newSample, ...prev]);
  };

  const handleSaveOverwriteSample = (id: string) => {
    if (!userData) return;
    if (window.confirm("This will overwrite the saved sample with your current data. Are you sure?")) {
      sampleUserDb.overwriteSampleUser(id, userData);
      // We need to re-read to update the date, etc.
      setSampleUsers(sampleUserDb.getSampleUsers());
      alert("Sample user data overwritten.");
    }
  };

  const handleDeleteSample = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sample user?")) {
      sampleUserDb.deleteSampleUser(id);
      setSampleUsers(prev => prev.filter(s => s.id !== id));
    }
  };
  
  const handleTryOutSample = (id: string) => {
    if (currentUser !== 'guest') {
        alert("This feature is for guest mode only.");
        return;
    }
    const sampleToTry = sampleUsers.find(s => s.id === id);
    if (sampleToTry) {
        setUserData(sampleToTry.data);
        alert(`Now trying out "${sampleToTry.name}". Your previous guest session has been replaced.`);
        handleNavigate('navigator');
    }
  };


  // --- CALCULATIONS ---
  const { affordablePriceRange, interestRate } = useMemo(() => {
    if (!userData) return { affordablePriceRange: { min: 0, max: 0}, interestRate: 0.1 };
    const { income, creditScore, downPayment, loanTerm } = userData.userInput;
    const monthlyIncome = income / 12;
    const maxMonthlyPayment = monthlyIncome * 0.15;
    const rate = getInterestRate(creditScore);
    const monthlyInterestRate = rate / 12;
    const numberOfPayments = loanTerm * 12;
    
    const maxLoanAmount = maxMonthlyPayment * ( (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) / (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) );
    const maxCarPrice = maxLoanAmount + downPayment;
    
    return {
      affordablePriceRange: { min: maxCarPrice * 0.7, max: maxCarPrice },
      interestRate: rate,
    };
  }, [userData?.userInput]);

  const locallyFilteredVehicles = useMemo(() => {
    if (!userData) return [];
    return TOYOTA_FLEET.filter(vehicle => {
      const styleMatch = userData.userInput.preferences.categories.style.length === 0 || userData.userInput.preferences.categories.style.includes(vehicle.tags.style);
      const useCaseMatch = userData.userInput.preferences.categories.useCase.length === 0 || userData.userInput.preferences.categories.useCase.includes(vehicle.tags.useCase);
      const seatsMatch = vehicle.seatingCapacity >= userData.userInput.minSeats;
      return styleMatch && useCaseMatch && seatsMatch;
    });
  }, [userData?.userInput.preferences.categories, userData?.userInput.minSeats]);

  const debouncedGetInsights = useCallback(
    debounce(async (description: string, vehicles: ToyotaVehicle[]) => {
      if (!description.trim() || vehicles.length === 0) {
        setGeminiResults({ topModels: [], tips: 'Enter a description of your needs to get personalized tips and top matches!' });
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const geminiResponse = await getFinancialInsights(description, vehicles);
        setGeminiResults({ topModels: geminiResponse.recommendedModels, tips: geminiResponse.financialTips });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'The cosmic signal is weak. Please try again later.';
        setError(message);
        setGeminiResults({ topModels: [], tips: 'Could not retrieve AI insights.' });
      } finally {
        setIsLoading(false);
      }
    }, 750),
    []
  );

  useEffect(() => {
    if (!userData || selectedVehicle || view !== 'navigator') return; 

    let vehiclesForGemini = locallyFilteredVehicles.filter(v => v.price <= affordablePriceRange.max);
    
    if (vehiclesForGemini.length === 0 && locallyFilteredVehicles.length > 0) {
      vehiclesForGemini = [...locallyFilteredVehicles].sort((a, b) => a.price - b.price).slice(0, 3);
    }

    debouncedGetInsights(userData.userInput.preferences.description, vehiclesForGemini);
  }, [userData?.userInput.preferences.description, locallyFilteredVehicles, affordablePriceRange.max, debouncedGetInsights, selectedVehicle, view]);
  
  const finalVehicleRecommendations = useMemo(() => {
    if (!userData) return [];
    const { downPayment, loanTerm } = userData.userInput;

    const allMatchingVehicles = locallyFilteredVehicles.filter(v => v.price <= affordablePriceRange.max * 1.1);

    const recommendations = allMatchingVehicles.map(vehicle => {
      const loanAmount = vehicle.price - downPayment;
      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
      const totalCost = (monthlyPayment * (loanTerm * 12)) + downPayment;

      const financingPlan: SimpleFinancingPlan = { monthlyPayment, totalCost, interestRate, loanAmount };
      
      return {
        ...vehicle,
        financingPlan,
        isTopMatch: geminiResults.topModels.includes(vehicle.model),
      };
    });

    recommendations.sort((a, b) => {
      if (a.isTopMatch && !b.isTopMatch) return -1;
      if (!a.isTopMatch && b.isTopMatch) return 1;
      return a.price - b.price;
    });

    return recommendations;
  }, [locallyFilteredVehicles, affordablePriceRange.max, userData?.userInput, interestRate, geminiResults.topModels]);
  
  // Update selected vehicle's financing plan in real-time
  useEffect(() => {
    if (selectedVehicle && userData) {
      const { downPayment, loanTerm } = userData.userInput;
      const loanAmount = selectedVehicle.price - downPayment;
      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
      const totalCost = (monthlyPayment * (loanTerm * 12)) + downPayment;
      const financingPlan: SimpleFinancingPlan = { monthlyPayment, totalCost, interestRate, loanAmount };
      setSelectedVehicle(prev => prev ? {...prev, financingPlan} : null);
    }
  }, [userData?.userInput.downPayment, userData?.userInput.loanTerm, interestRate, selectedVehicle?.price]);

  if (!currentUser || !userData) {
      return <Login onLoginSuccess={handleLoginSuccess} onContinueAsGuest={handleContinueAsGuest} />;
  }

  const appStateForChatbot: AppStateForChatbot = {
    view,
    userInput: userData.userInput,
    savedAlignments: userData.savedAlignments,
    recommendations: finalVehicleRecommendations,
  };

  const renderView = () => {
      switch (view) {
        case 'samples':
            return <SampleUsersPage
                samples={sampleUsers}
                onSaveNew={handleSaveNewSample}
                onOverwrite={handleSaveOverwriteSample}
                onDelete={handleDeleteSample}
                onTryOut={handleTryOutSample}
                isGuest={currentUser === 'guest'}
            />;
        case 'saved':
            return <SavedAlignmentsPage 
                alignments={userData.savedAlignments}
                onDelete={handleDeleteAlignment}
                onClearAll={handleClearAllAlignments}
                onBack={() => handleNavigate('navigator')} 
                onCommit={handleCommitAlignment}
            />;
        case 'timeline':
             return <MyTimelinePage 
                onBack={() => handleNavigate('navigator')} 
                userVehicles={userData.activeLoans} 
                onMakePayment={handleMakePayment}
            />;
        case 'navigator':
        default:
            return <>
                <div className="text-center">
                    <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white mb-4">
                        Stellar Finance Navigator
                    </h3>
                    <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
                        {selectedVehicle 
                            ? `Personalize your financing for the ${selectedVehicle.model}.`
                            : "Chart your course to a new vehicle. Adjust your coordinates below and watch as the cosmos reveals your perfect vehicle alignment."
                        }
                    </p>
                </div>
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <FinanceControls 
                            userInput={userData.userInput} 
                            setUserInput={setUserInput} 
                            isFinancingMode={!!selectedVehicle}
                        />
                    </div>
                    <div className="lg:col-span-8 xl:col-span-9">
                        {selectedVehicle ? (
                            <FinancingPage 
                                vehicle={selectedVehicle} 
                                userInput={userData.userInput}
                                interestRate={interestRate}
                                onBack={handleBackToResults}
                                onSaveAlignment={handleSaveAlignment}
                            />
                        ) : (
                            <VehicleResults 
                                vehicles={finalVehicleRecommendations}
                                tips={geminiResults.tips}
                                isLoading={isLoading}
                                error={error}
                                affordablePriceRange={affordablePriceRange}
                                onSelectVehicle={handleSelectVehicle}
                            />
                        )}
                    </div>
                </div>
            </>;
      }
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/seed/galaxy/2000/3000')] bg-cover bg-center bg-no-repeat opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black"></div>
      
      <div className="relative z-10">
        <Header onNavigate={handleNavigate} username={currentUser} onLogout={handleLogout}/>
        <main>
          {view === 'navigator' && <Hero />}
          <section id="calculator" className="py-20 px-4">
             <div className="container mx-auto">
                {renderView()}
             </div>
          </section>
        </main>
        <Footer />
      </div>
      <Chatbot 
        appState={appStateForChatbot} 
        savedConversations={userData.chatbotConversations}
        onSaveConversation={handleSaveConversation}
      />
    </div>
  );
};

export default App;