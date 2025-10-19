import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Conversation, ChatMessage, AppStateForChatbot } from '../types';
import { getChatResponse } from '../services/geminiService';

interface ChatbotProps {
    appState: AppStateForChatbot;
    savedConversations: Conversation[];
    onSaveConversation: (conversation: Conversation) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ appState, savedConversations, onSaveConversation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 30, y: 30 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [view, setView] = useState<'chat' | 'history'>('chat');
    const [currentConversation, setCurrentConversation] = useState<Conversation>([
        { sender: 'ai', text: "Hello! I'm Cosmo, your Astral Motors assistant. How can I help you navigate the stars today?" }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const chatbotRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentConversation]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chatbotRef.current) return;
        setIsDragging(true);
        const rect = chatbotRef.current.getBoundingClientRect();
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !chatbotRef.current) return;
        let x = window.innerWidth - (e.clientX + (chatbotRef.current.offsetWidth - dragStart.x));
        let y = window.innerHeight - (e.clientY + (chatbotRef.current.offsetHeight - dragStart.y));

        x = Math.max(0, Math.min(x, window.innerWidth - chatbotRef.current.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - chatbotRef.current.offsetHeight));

        setPosition({ x, y });
    }, [isDragging, dragStart]);
    
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);
    
    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
        const updatedConversation = [...currentConversation, newUserMessage];
        setCurrentConversation(updatedConversation);
        const messageToSend = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getChatResponse(updatedConversation, messageToSend, appState);
            const newAiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
            setCurrentConversation(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I encountered a cosmic disturbance. Please try again." };
            setCurrentConversation(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConversation = () => {
        if (currentConversation.length <= 1) return; // Don't save initial message
        onSaveConversation(currentConversation);
        setCurrentConversation([
            { sender: 'ai', text: 'Conversation saved! How can I help you further?' }
        ]);
        setView('chat');
    };

    const handleLoadConversation = (index: number) => {
        setCurrentConversation(savedConversations[index]);
        setView('chat');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full text-white flex items-center justify-center z-[100] shadow-2xl shadow-purple-800/60 transform hover:scale-110 transition-transform duration-300"
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M4.913 2.658c2.075-.27 4.19-.168 6.22.319l.541.104c.463.09.894.226 1.295.421.407.197.774.453 1.079.787l.108.119c.404.442.74.949.967 1.515l.045.118c.328.85.538 1.76.65 2.701l.034.288c.117.936.137 1.884.09 2.82l-.015.302a12.001 12.001 0 01-2.096 4.887l-.108.119c-.404.442-.74.949-.967 1.515l-.045.118a7.502 7.502 0 01-6.101 4.542l-.288.034c-.936.117-1.884.137-2.82.09l-.302-.015a12.001 12.001 0 01-4.887-2.096l-.119-.108c-.442-.404-.949-.74-1.515-.967l-.118-.045a7.502 7.502 0 01-4.542-6.101l-.034-.288c-.117-.936-.137-1.884-.09-2.82l.015-.302a12.001 12.001 0 012.096-4.887l.119-.108c.404-.442.74.949.967-1.515l.045-.118a7.502 7.502 0 016.101-4.542l.288-.034zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zM12 15a.75.75 0 000 1.5.75.75 0 000-1.5z" />
                    <path fillRule="evenodd" d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12S6.201 22.5 12 22.5 22.5 17.799 22.5 12 17.799 1.5 12 1.5zM3 12a9 9 0 1018 0 9 9 0 00-18 0z" clipRule="evenodd" />
                </svg>
            </button>
        );
    }
    
    return (
        <div
            ref={chatbotRef}
            className="fixed flex flex-col w-[90vw] max-w-[360px] h-[70vh] max-h-[520px] bg-black/70 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/50 overflow-hidden z-[100] transition-all duration-300"
            style={{ bottom: `${position.y}px`, right: `${position.x}px` }}
        >
            <div onMouseDown={handleMouseDown} className="p-3 bg-gray-900/50 border-b border-purple-500/20 cursor-grab active:cursor-grabbing flex justify-between items-center">
                <h3 className="font-cinzel text-lg text-purple-300">Cosmo Assistant</h3>
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setIsOpen(false)} 
                    className="text-gray-400 hover:text-white text-2xl leading-none"
                >&times;</button>
            </div>

            {view === 'chat' ? (
                <>
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {currentConversation.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                                    {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-end gap-2">
                                <div className="max-w-[80%] p-2 rounded-lg text-sm bg-gray-800 text-gray-300">
                                    <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-purple-500/20 bg-black/30">
                        <div className="flex items-center gap-2">
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                placeholder="Ask a question..."
                                rows={1}
                                className="flex-1 bg-gray-900/70 border border-purple-500/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                            />
                            <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="bg-purple-600 rounded-lg p-2 disabled:opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                                    <path d="M3.105 3.105a1.5 1.5 0 011.06.44l11.568 11.568a1.5 1.5 0 01-2.122 2.122L2.045 5.667A1.5 1.5 0 013.105 3.105z" />
                                    <path d="M16.458 2.045a1.5 1.5 0 012.122 2.122L7.012 15.735a1.5 1.5 0 01-2.122-2.122L16.458 2.045z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                             <button onClick={() => setView('history')} className="text-xs text-gray-400 hover:text-purple-300">Previous Conversations ({savedConversations.length})</button>
                             <button onClick={handleSaveConversation} className="text-xs bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full hover:bg-teal-500/40">Save Conversation</button>
                        </div>
                    </div>
                </>
            ) : (
                 <>
                    <div className="flex-1 p-3 overflow-y-auto">
                        <h4 className="font-bold text-gray-300 mb-2">Saved Conversations</h4>
                        {savedConversations.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center mt-8">No conversations saved yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {savedConversations.map((convo, index) => (
                                    <li key={index} onClick={() => handleLoadConversation(index)} className="p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-purple-900/50">
                                        <p className="text-sm text-white truncate">"{convo.find(m => m.sender === 'user')?.text || 'Empty conversation'}"</p>
                                        <p className="text-xs text-gray-500">{convo.length} messages</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                     <div className="p-3 border-t border-purple-500/20 bg-black/30">
                        <button onClick={() => setView('chat')} className="text-sm text-purple-300 hover:text-white w-full text-center">&larr; Back to Chat</button>
                    </div>
                 </>
            )}
        </div>
    );
};

export default Chatbot;