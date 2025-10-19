import React, { useState } from 'react';
import * as db from '../services/databaseService';

interface LoginProps {
    onLoginSuccess: (username: string) => void;
    onContinueAsGuest: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            const result = db.login(username, password);
            if (result.success) {
                onLoginSuccess(username);
            } else {
                setError(result.message);
            }
            setIsLoading(false);
        }, 500);
    };

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            const createResult = db.createUser(username, password);
            if (createResult.success) {
                // Automatically log in the user after successful sign-up
                const loginResult = db.login(username, password);
                if (loginResult.success) {
                    onLoginSuccess(username);
                } else {
                    setError("Account created, but failed to log in. Please try logging in manually.");
                }
            } else {
                setError(createResult.message);
            }
            setIsLoading(false);
        }, 500);
    };

    const toggleForm = () => {
        setIsSigningUp(!isSigningUp);
        setError(null);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/seed/galaxy/2000/3000')] bg-cover bg-center bg-no-repeat opacity-20"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black"></div>
            
            <div className="relative z-10 w-full max-w-md mx-auto p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-white tracking-widest">
                        ASTRAL MOTORS
                    </h1>
                    <p className="text-lg text-gray-400 mt-2">
                        {isSigningUp ? 'Create an account to begin your journey.' : 'Log in to access your financial universe.'}
                    </p>
                </div>
                
                <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-8 space-y-6">
                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-300">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>
                    {isSigningUp && (
                        <div>
                            <label htmlFor="confirmPassword"  className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-center">
                            {error}
                        </p>
                    )}

                    <div className="text-center pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg tracking-wider uppercase shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Connecting...' : (isSigningUp ? 'Create Account' : 'Enter')}
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-400">
                        {isSigningUp ? 'Already have an account? ' : "Don't have an account? "}
                        <button type="button" onClick={toggleForm} className="font-semibold text-purple-300 hover:text-purple-200">
                            {isSigningUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </div>
                    
                    {!isSigningUp && (
                        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                             <p className="mb-2">Or explore without saving:</p>
                             <button type="button" onClick={onContinueAsGuest} className="w-full bg-gray-700/60 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-full text-sm tracking-wider uppercase hover:bg-gray-700 hover:text-white transition-all duration-300">
                                Continue as a Guest
                             </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;