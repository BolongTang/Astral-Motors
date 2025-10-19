import { GoogleGenAI, Type } from "@google/genai";
// Fix: Replaced non-existent type UserVehiclePayment with ActiveLoan.
import type { ToyotaVehicle, UserInput, SimpleFinancingPlan, SavedAlignment, ChatMessage, AppStateForChatbot, ActiveLoan } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    recommendedModels: {
      type: Type.ARRAY,
      description: "An array of the model names of the top 1-3 cars from the provided list that best match the user's description. The array should only contain strings.",
      items: { type: Type.STRING },
    },
    financialTips: {
      type: Type.STRING,
      description: "A short paragraph (2-4 sentences) of personalized financial advice for the user based on their situation and car preference. Be encouraging and helpful.",
    },
  },
  required: ["recommendedModels", "financialTips"],
};

const financeCoachSchema = {
    type: Type.OBJECT,
    properties: {
        affordabilityAssessment: {
            type: Type.STRING,
            description: "A very short (1-2 sentences) assessment of how affordable this car is for the user. Be gentle and encouraging. e.g., 'This looks like a comfortable fit for your budget.' or 'This may be a bit of a stretch, but here's a tip to make it work.'",
        },
        actionableTip: {
            type: Type.STRING,
            description: "A single, actionable financial tip for the user related to this specific car purchase. e.g., 'Increasing your down payment by $1,000 could lower your monthly payment by about $20.' or 'Your credit score is good, but improving it to over 760 could unlock even better interest rates, potentially saving you over $1,000.'",
        }
    },
    required: ["affordabilityAssessment", "actionableTip"],
};

const savedSummarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A 3-5 sentence summary comparing the user's saved options, leading with insight. Highlight key differences in monthly payments and long-term costs. Make a recommendation based on potential user priorities (e.g., lowest payment vs. best long-term value)."
        }
    },
    required: ["summary"],
}

const timelineSummarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A 3-5 sentence summary of the user's upcoming payment schedule, leading with insight. Mention the total monthly commitment for the next month, when the first vehicle will be paid off or the first lease ends, and one piece of advice for managing these payments (e.g., setting up automatic payments, or a 'snowball' strategy if they have multiple loans)."
        }
    },
    required: ["summary"],
}

interface GeminiAnalysisResponse {
    recommendedModels: string[];
    financialTips: string;
}

export interface GeminiFinanceCoachResponse {
    affordabilityAssessment: string;
    actionableTip: string;
}

export const getFinancialInsights = async (
  userDescription: string,
  affordableVehicles: ToyotaVehicle[]
): Promise<GeminiAnalysisResponse> => {
  const model = "gemini-2.5-flash";

  if (affordableVehicles.length === 0) {
      return { recommendedModels: [], financialTips: "No vehicles match your current criteria, but don't worry! Try adjusting your budget or preferences to see more options." };
  }

  const vehicleListForPrompt = affordableVehicles
    .map(v => `- ${v.model}: ${v.description}`)
    .join('\n');

  const prompt = `
    Based on the user's description of what they are looking for in a car, please recommend the best-fitting models from the following list.

    User's description: "${userDescription}"

    List of available and affordable cars:
    ${vehicleListForPrompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly and knowledgeable financial advisor for Astral Motors. Your name is Cosmo. Your goal is to help users find the perfect car that fits their lifestyle and budget. Analyze the user's needs and match them to the best vehicles from the provided list. Also, offer some brief, encouraging financial advice.",
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    return parsedJson as GeminiAnalysisResponse;

  } catch (error) {
    console.error("Error fetching financial insights from Gemini API:", error);
    throw new Error("Failed to consult the celestial financial advisors.");
  }
};


export const getFinancingAdvice = async (
    userInput: UserInput,
    vehiclePrice: number,
    planDetails: { monthlyPayment: number; interestRate: number; }
): Promise<GeminiFinanceCoachResponse> => {
    const model = "gemini-2.5-flash";

    const prompt = `
      A user is considering financing a car. Here is their financial situation and the details of the car and loan. Provide a simple, beginner-friendly affordability assessment and one actionable tip.

      User's Financials:
      - Annual Income: ${userInput.income}
      - Credit Score: ${userInput.creditScore}

      Car & Loan Details:
      - Car Price: ${vehiclePrice}
      - Down Payment: ${userInput.downPayment}
      - Loan Term: ${userInput.loanTerm} years
      - Interest Rate: ${(planDetails.interestRate * 100).toFixed(2)}%
      - Monthly Payment: ${planDetails.monthlyPayment.toFixed(2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a friendly, encouraging financial coach named Cosmo. Your goal is to demystify car financing. Use simple language. Avoid complex jargon. The user is looking for a quick, helpful tip, not a full financial plan.",
                responseMimeType: "application/json",
                responseSchema: financeCoachSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GeminiFinanceCoachResponse;
    } catch (error) {
        console.error("Error fetching financing advice from Gemini API:", error);
        return {
            affordabilityAssessment: "Could not retrieve personalized advice at this time.",
            actionableTip: "A general tip: always aim to pay more than your minimum monthly payment if possible to reduce total interest paid."
        }
    }
};

export const getSummaryForSavedAlignments = async (alignments: SavedAlignment[]): Promise<string> => {
    if (alignments.length === 0) {
        return "You have no saved plans to summarize.";
    }

    const model = "gemini-2.5-flash";

    const alignmentsForPrompt = alignments.map((a, index) => {
        const userInput = `Income: ${a.userInput.income}, Credit: ${a.userInput.creditScore}, Down Payment: ${a.userInput.downPayment}`;
        let planDetails = '';
        if (a.plan.planType === 'Financing') {
            planDetails = `Financing for ${a.plan.loanTerm} years, Monthly: $${a.plan.monthlyPayment.toFixed(0)}, Total Cost: $${a.plan.totalCost.toFixed(0)}`;
        } else {
            planDetails = `Leasing for ${a.plan.term} months, Monthly: $${a.plan.monthlyPayment.toFixed(0)}, Due at Signing: $${a.plan.dueAtSigning.toFixed(0)}`;
        }
        return `Option ${index + 1}: ${a.vehicle.model} (Price: $${a.vehicle.price}) with user inputs (${userInput}). Plan: ${planDetails}.`;
    }).join('\n');

    const prompt = `
        A user has saved several car financing and leasing options. Analyze them and provide a concise summary comparing the choices. 
        
        Consider the user's different financial inputs for each option. Highlight key trade-offs between monthly affordability and long-term cost. 
        
        Give a final recommendation or highlight the best options for different priorities (e.g., 'For the lowest monthly payment...', 'For the best long-term value...').

        Here are the user's saved options:
        ${alignmentsForPrompt}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful and concise financial advisor named Cosmo. Your goal is to help a user understand their saved car financing options at a glance.",
                responseMimeType: "application/json",
                responseSchema: savedSummarySchema,
                temperature: 0.6,
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson.summary || "Could not generate a summary at this time.";

    } catch (error) {
        console.error("Error fetching saved alignments summary:", error);
        return "There was an error consulting the AI advisor for a summary. Please try again.";
    }
};

// Fix: Changed parameter type from non-existent UserVehiclePayment[] to ActiveLoan[].
export const getTimelineSummary = async (vehicles: ActiveLoan[]): Promise<string> => {
    if (vehicles.length === 0) {
        return "You have no financing plans to summarize.";
    }

    const model = "gemini-2.5-flash";

    const vehiclesForPrompt = vehicles.map((v, index) => {
        const endDate = new Date(new Date(v.loanStartDate).setMonth(new Date(v.loanStartDate).getMonth() + v.loanTermInMonths));
        const planType = v.planType === 'Leasing' ? 'Lease' : 'Loan';
        const endVerb = v.planType === 'Leasing' ? 'ends' : 'will be paid off';
        return `Vehicle ${index + 1} (${planType}): ${v.vehicleModel}, Monthly Payment: $${v.monthlyPayment.toFixed(0)}, ${planType} ${endVerb} around ${endDate.toLocaleDateString()}`;
    }).join('\n');
    
    // Calculate total payment for next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthPayments = vehicles.reduce((total, v) => {
        const loanStartDate = new Date(v.loanStartDate);
        const loanEndDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + v.loanTermInMonths, v.paymentDayOfMonth);
        const paymentDateThisMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), v.paymentDayOfMonth);

        if (paymentDateThisMonth >= loanStartDate && paymentDateThisMonth <= loanEndDate) {
            return total + v.monthlyPayment;
        }
        return total;
    }, 0);


    const prompt = `
        A user is viewing their payment timeline for their active vehicle plans. Analyze their commitments and provide a concise summary.
        Differentiate between loans (which get paid off) and leases (which end).

        Here is their list of vehicle loans and leases:
        ${vehiclesForPrompt}
        
        Their total combined payment for the next month will be approximately $${nextMonthPayments.toFixed(0)}.

        Provide a summary that includes their total monthly payment, when their first loan will be paid off or lease will end, and one piece of actionable advice for managing their payments.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful and concise financial advisor named Cosmo. Your goal is to help a user understand their payment timeline at a glance.",
                responseMimeType: "application/json",
                responseSchema: timelineSummarySchema,
                temperature: 0.6,
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson.summary || "Could not generate a summary at this time.";

    } catch (error) {
        console.error("Error fetching timeline summary:", error);
        return "There was an error consulting the AI advisor for a summary. Please try again.";
    }
};


const buildContextPrompt = (appState: AppStateForChatbot): string => {
    let context = "Here is the current context of the user's session on the website:\n";
    context += `- The user is currently on the '${appState.view}' page.\n`;
    context += `- User's financial inputs: Annual Income: $${appState.userInput.income}, Credit Score: ${appState.userInput.creditScore}, Down Payment: $${appState.userInput.downPayment}, Loan Term: ${appState.userInput.loanTerm} years.\n`;
    
    if (appState.savedAlignments.length > 0) {
        context += `- The user has ${appState.savedAlignments.length} saved vehicle plans. The models are: ${appState.savedAlignments.map(a => a.vehicle.model).join(', ')}.\n`;
    } else {
        context += "- The user has no saved vehicle plans yet.\n";
    }

    if (appState.view === 'navigator' && appState.recommendations.length > 0) {
        context += `- The user is currently viewing these recommended vehicles: ${appState.recommendations.map(r => r.model).slice(0, 5).join(', ')}.\n`;
    }

    return context;
};

export const getChatResponse = async (history: ChatMessage[], newMessage: string, appState: AppStateForChatbot): Promise<string> => {
    const model = "gemini-2.5-flash";

    const promptHistory = history.map(msg => `${msg.sender === 'user' ? 'Model' : 'User'}: ${msg.text}`).join('\n');
    const contextPrompt = buildContextPrompt(appState);
    
    const prompt = `
        ${contextPrompt}
        ---
        The following is a conversation between a user and you, a helpful AI assistant. Use the context above to provide accurate and relevant answers.

        ${promptHistory}
        User: ${newMessage}
        Model:
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a friendly and knowledgeable AI assistant for the Astral Motors website. Your name is 'Cosmo'. Help users with questions about vehicles, financing options, and navigating the website. You have access to the user's current actions on the site, such as their financial inputs and saved cars. Use this context to provide personalized and helpful responses. Keep your answers concise.",
                temperature: 0.8,
                maxOutputTokens: 250,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching chat response from Gemini API:", error);
        return "I'm having trouble connecting to the cosmos right now. Please try again in a moment.";
    }
};