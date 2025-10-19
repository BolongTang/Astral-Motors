import type { SampleUser, UserData } from '../types';

const SAMPLE_USERS_KEY = 'astralMotorsSampleUsers';

export const getSampleUsers = (): SampleUser[] => {
    const data = localStorage.getItem(SAMPLE_USERS_KEY);
    try {
        const users = data ? JSON.parse(data) : [];
        return Array.isArray(users) ? users : [];
    } catch (e) {
        return [];
    }
};

const saveSampleUsers = (users: SampleUser[]): void => {
    localStorage.setItem(SAMPLE_USERS_KEY, JSON.stringify(users));
};

export const addSampleUser = (name: string, data: UserData): SampleUser => {
    const users = getSampleUsers();
    const newUser: SampleUser = {
        id: `sample-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        data,
    };
    const updatedUsers = [newUser, ...users];
    saveSampleUsers(updatedUsers);
    return newUser;
};

export const overwriteSampleUser = (id: string, data: UserData): void => {
    const users = getSampleUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
        users[userIndex].data = data;
        users[userIndex].createdAt = new Date().toISOString(); // Update timestamp
        saveSampleUsers(users);
    }
};

export const deleteSampleUser = (id: string): void => {
    let users = getSampleUsers();
    users = users.filter(user => user.id !== id);
    saveSampleUsers(users);
};
