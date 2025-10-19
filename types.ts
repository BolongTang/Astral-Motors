export interface ToyotaVehicle {
  model: string;
  price: number;
  description: string;
  image: string;
  tags: {
    style: 'Sedan' | 'SUV' | 'Truck' | 'Minivan' | 'Sports Car';
    useCase: 'Commuting' | 'Family' | 'Off-road' | 'Hauling' | 'Performance';
  };
  seatingCapacity: number;
  specialOffer?: string;
}

export interface UserInput {
  income: number;
  creditScore: number;
  downPayment: number;
  loanTerm: number; // in years
  minSeats: number;
  preferences: {
    categories: {
      style: string[];
      useCase: string[];
    };
    description: string;
  };
}

// Original simple plan for card display
export interface SimpleFinancingPlan {
  monthlyPayment: number;
  totalCost: number;
  interestRate: number;
  loanAmount: number;
}


// Detailed plans for financing page and saving
export interface FinancingPlan {
  planType: 'Financing';
  monthlyPayment: number;
  totalCost: number;
  interestRate: number;
  loanAmount: number;
  loanTerm: number; // years
}

export interface LeasingPlan {
  planType: 'Leasing';
  monthlyPayment: number;
  dueAtSigning: number;
  term: number; // months
  moneyFactor: number;
  residualValue: number;
}

export type VehiclePlan = FinancingPlan | LeasingPlan;


export interface SavedAlignment {
    id: string;
    vehicle: ToyotaVehicle;
    userInput: UserInput;
    plan: VehiclePlan;
    savedAt: string;
}


export interface VehicleRecommendation extends ToyotaVehicle {
  financingPlan: SimpleFinancingPlan; // Use the simple one for cards
  isTopMatch: boolean;
}

// New type for active loans on My Timeline page
export interface ActiveLoan {
    id: string;
    vehicleModel: string;
    imageUrl: string;
    monthlyPayment: number;
    totalCost: number;
    loanStartDate: string; // ISO string
    loanTermInMonths: number;
    paymentDayOfMonth: number;
    color: string;
    amountLeft: number; // For financing: total remaining. For leasing: not used for balance tracking.
    planType: 'Financing' | 'Leasing';
    lastPaymentMonth?: number; // YYYYMM format, e.g. 202407 for July 2024
    initialLoanAmount?: number; // The starting principal for financing plans
}

// New types for Chatbot
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export type Conversation = ChatMessage[];

export interface AppStateForChatbot {
  view: 'navigator' | 'saved' | 'timeline' | 'samples';
  userInput: UserInput;
  savedAlignments: SavedAlignment[];
  recommendations: VehicleRecommendation[];
}

// --- NEW TYPES FOR USER AUTH & DATA ---

export interface UserData {
    userInput: UserInput;
    savedAlignments: SavedAlignment[];
    chatbotConversations: Conversation[];
    activeLoans: ActiveLoan[];
}

export interface User {
    username: string;
    // In a real application, this would be a securely hashed password.
    // For this simulation, we'll store it as plain text.
    password_plaintext: string; 
    data: UserData;
}

export interface Database {
    users: {
        [username: string]: User;
    };
}

export interface SampleUser {
    id: string;
    name: string;
    createdAt: string;
    data: UserData;
}