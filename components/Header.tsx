import React from 'react';

interface HeaderProps {
    onNavigate: (view: 'navigator' | 'saved' | 'timeline' | 'samples') => void;
    username: string | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, username, onLogout }) => {
  return (
    <header className="py-6 px-4 md:px-8 backdrop-blur-sm bg-black/30 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <button onClick={() => onNavigate('navigator')} className="text-2xl md:text-3xl font-bold font-cinzel text-white tracking-widest text-left">
          ASTRAL MOTORS
        </button>
        <nav className="flex items-center space-x-4 md:space-x-8">
          <button onClick={() => onNavigate('navigator')} className="text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wider">Navigator</button>
          <button onClick={() => onNavigate('saved')} className="text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wider">My Plans</button>
          <button onClick={() => onNavigate('timeline')} className="text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wider">My Timeline</button>
          <button onClick={() => onNavigate('samples')} className="text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wider">Sample Users</button>
          
          <div className="hidden sm:flex items-center space-x-4">
            {username && username !== 'guest' ? (
                <>
                    <span className="text-sm text-gray-300">Welcome, <span className="font-bold text-purple-300">{username}</span></span>
                    <button 
                        onClick={onLogout}
                        className="bg-purple-500/20 text-white py-2 px-5 rounded-full border border-purple-400 hover:bg-purple-500/40 transition-all duration-300 text-sm shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    >
                        Logout
                    </button>
                </>
            ) : username === 'guest' ? (
                 <>
                    <span className="text-sm text-gray-300">Guest Mode</span>
                     <button 
                        onClick={onLogout}
                        className="bg-purple-500/20 text-white py-2 px-5 rounded-full border border-purple-400 hover:bg-purple-500/40 transition-all duration-300 text-sm shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    >
                        Login / Sign Up
                    </button>
                 </>
            ) : (
                 <span className="text-sm text-gray-400">Please Login</span>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;