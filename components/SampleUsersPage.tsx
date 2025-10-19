import React, { useState } from 'react';
import type { SampleUser } from '../types';

interface SampleUsersPageProps {
    samples: SampleUser[];
    onSaveNew: (name: string) => void;
    onOverwrite: (id: string) => void;
    onDelete: (id: string) => void;
    onTryOut: (id: string) => void;
    isGuest: boolean;
}

const SampleUsersPage: React.FC<SampleUsersPageProps> = ({ samples, onSaveNew, onOverwrite, onDelete, onTryOut, isGuest }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAddClick = () => {
        setIsAdding(true);
    };

    const handleCancelClick = () => {
        setIsAdding(false);
        setNewName('');
    };

    const handleSaveNewClick = () => {
        if (newName.trim()) {
            onSaveNew(newName.trim());
            handleCancelClick();
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-4xl md:text-5xl font-bold font-cinzel text-white">
                        Sample Users
                    </h3>
                    <p className="text-lg text-gray-400 mt-2">
                        Save, load, and manage different user profiles and scenarios.
                    </p>
                </div>
            </div>

            <div className="bg-black/20 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-black/30 text-xs text-purple-300 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-1/3">Profile Name</th>
                            <th scope="col" className="px-6 py-3">Saved Date</th>
                            <th scope="col" className="px-6 py-3 text-right">
                                {!isAdding && (
                                    <button onClick={handleAddClick} title="Add new sample" className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-purple-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                             <tr className="border-b border-gray-800 bg-purple-900/20">
                                <td className="px-6 py-4">
                                    <input
                                        type="text-white"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Enter new profile name..."
                                        className="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-6 py-4 text-white italic">Saving now...</td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                     <button onClick={handleSaveNewClick} className="font-medium text-green-400 hover:text-green-300">Save</button>
                                     <button onClick={handleCancelClick} className="font-medium text-gray-400 hover:text-gray-300">Cancel</button>
                                </td>
                            </tr>
                        )}
                        {samples.map(sample => (
                            <tr key={sample.id} className="border-b border-gray-800 hover:bg-black/30">
                                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{sample.name}</td>
                                <td className="px-6 py-4 text-gray-400">{new Date(sample.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right space-x-4 whitespace-nowrap">
                                    {isGuest && <button onClick={() => onTryOut(sample.id)} className="font-medium text-teal-400 hover:text-teal-300">Try Out</button>}
                                    <button onClick={() => onOverwrite(sample.id)} className="font-medium text-purple-400 hover:text-purple-300">Save</button>
                                    <button onClick={() => onDelete(sample.id)} className="font-medium text-red-500 hover:text-red-400">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {samples.length === 0 && !isAdding && (
                    <div className="text-center py-16 text-gray-500">
                        <p>No sample users saved yet.</p>
                        <p>Click the '+' button above to save your current session as a new profile.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SampleUsersPage;
