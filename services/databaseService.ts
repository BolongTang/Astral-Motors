import type { Database, UserData, User, ActiveLoan } from '../types';

const DB_KEY = 'celestialToyotaDB';
const SESSION_KEY = 'celestialToyotaSession';

export const getDefaultUserData = (): UserData => ({
    userInput: {
        income: 75000,
        creditScore: 720,
        downPayment: 5000,
        loanTerm: 5,
        minSeats: 1,
        preferences: {
            categories: { style: [], useCase: [] },
            description: '',
        },
    },
    savedAlignments: [],
    chatbotConversations: [],
    activeLoans: [],
});

export const initializeDatabase = (): void => {
    if (localStorage.getItem(DB_KEY)) {
        return;
    }

    const defaultUser: User = {
        username: 'celestial',
        password_plaintext: 'password123',
        data: getDefaultUserData(),
    };
    
    const voyagerLoan: ActiveLoan = {
        id: 'loan-1678886400000-RAV4',
        vehicleModel: 'RAV4',
        imageUrl: 'RAV4.jpg',
        monthlyPayment: 550.75,
        totalCost: 33045, 
        loanStartDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Started a year ago
        loanTermInMonths: 60,
        paymentDayOfMonth: 15,
        color: '#3498db',
        amountLeft: 26436,
        planType: 'Financing',
        initialLoanAmount: 33045,
    };

    const anotherUser: User = {
        username: 'voyager',
        password_plaintext: 'explore',
        data: {
             ...getDefaultUserData(),
             userInput: {
                ...getDefaultUserData().userInput,
                income: 120000,
                creditScore: 810,
                downPayment: 20000,
             },
             activeLoans: [voyagerLoan],
        }
    };

    const db: Database = {
        users: {
            [defaultUser.username]: defaultUser,
            [anotherUser.username]: anotherUser,
        },
    };

    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const getDb = (): Database | null => {
    const dbString = localStorage.getItem(DB_KEY);
    return dbString ? JSON.parse(dbString) : null;
};

const saveDb = (db: Database): void => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const createUser = (username: string, password_plaintext: string): { success: boolean; message: string } => {
    const db = getDb();
    if (!db) {
        return { success: false, message: 'Database not found.' };
    }
    if (db.users[username]) {
        return { success: false, message: 'Username already taken. Please choose another.' };
    }
    
    const newUser: User = {
        username,
        password_plaintext, // In a real app, HASH this password before saving!
        data: getDefaultUserData(),
    };

    db.users[username] = newUser;
    saveDb(db);
    return { success: true, message: 'Account created successfully!' };
};

export const login = (username: string, password_plaintext: string): { success: boolean; message: string } => {
    const db = getDb();
    if (!db) {
        return { success: false, message: 'Database not found.' };
    }

    const user = db.users[username];
    // In a real application, you would compare a securely hashed password.
    // This is for simulation purposes only.
    if (user && user.password_plaintext === password_plaintext) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
        return { success: true, message: 'Login successful!' };
    }

    return { success: false, message: 'Invalid username or password.' };
};

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentSession = (): { username: string | null } => {
    const sessionString = localStorage.getItem(SESSION_KEY);
    if (sessionString) {
        return JSON.parse(sessionString);
    }
    return { username: null };
};

export const getUserData = (username: string): UserData | null => {
    const db = getDb();
    return db?.users[username]?.data || null;
};

export const updateUserData = (username: string, data: UserData): void => {
    const db = getDb();
    if (db && db.users[username]) {
        db.users[username].data = data;
        saveDb(db);
    }
};