import React from 'react';
import { Button } from './Button';

export const MessageOverlay = ({ isOpen, onClose, title, message, buttonText = "Got it", buttonColor = "custom" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100 dark:border-gray-700">
                {title && (
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                )}
                <p className="text-gray-600 dark:text-gray-300">
                    {message}
                </p>
                <Button
                    onClick={onClose}
                    color={buttonColor}
                    className={`w-full ${buttonColor === 'custom' ? 'bg-[#58A76E] hover:bg-[#468C5A] text-white' : ''}`}
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};
