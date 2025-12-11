import React, { useState } from 'react';
import { Button } from './Button';
import { LogIn, UserPlus, User } from 'lucide-react';
import GenomoLogo from '../content/GenomoLogo.gif';

export const LoginOverlay = ({ onLogin, onSignup, onGuest }) => {
    const [showGuestMessage, setShowGuestMessage] = useState(false);

    const handleGuestClick = () => {
        setShowGuestMessage(true);
    };
    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex flex-col items-center">
                    <img src={GenomoLogo} alt="Genomojo Logo" className="h-32 mb-4" />
                    <h1 className="text-4xl font-extrabold text-mohi-600 dark:text-mohi-400 mb-2">
                        Genomojo
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        The Human Mojo Project - Phase 1.
                    </p>
                </div>

                <div className="space-y-4 pt-8">
                    <Button
                        onClick={onSignup}
                        color="custom"
                        className="w-full h-14 text-lg font-semibold shadow-lg bg-[#58A76E] hover:bg-[#468C5A] text-white flex justify-center items-center"
                    >
                        <UserPlus className="mr-2" size={24} />
                        Sign up for free
                    </Button>

                    <Button
                        onClick={onLogin}
                        color="custom"
                        className="w-full h-14 text-lg font-semibold shadow-lg bg-[#58A76E] hover:bg-[#468C5A] text-white flex justify-center items-center"
                    >
                        <LogIn className="mr-2" size={24} />
                        Login
                    </Button>

                    <div className="pt-4">
                        <button
                            onClick={handleGuestClick}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium flex items-center justify-center w-full transition-colors"
                        >
                            <User className="mr-1" size={16} />
                            Continue as guest
                        </button>
                    </div>
                </div>
            </div>

            {/* Guest Message Overlay */}
            {showGuestMessage && (
                <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Welcome!</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            You can create an account later, just go to My Profile.
                        </p>
                        <Button
                            onClick={onGuest}
                            color="custom"
                            className="w-full bg-[#58A76E] hover:bg-[#468C5A] text-white"
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
