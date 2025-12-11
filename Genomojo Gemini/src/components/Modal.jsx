import React from 'react';
import { XCircle } from 'lucide-react';

/**
 * Reusable, responsive modal component.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls visibility.
 * @param {function} props.onClose - Function to close the modal.
 * @param {React.ReactNode} props.children - Content of the modal.
 * @param {string} [props.title] - Optional title for the modal header.
 * @param {string} [props.className] - Optional Tailwind classes for the content box.
 */
export const Modal = ({ isOpen, onClose, children, title, className = '' }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose} // Allows closing by clicking backdrop
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 ${className}`}
                onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 transition duration-150"
                        aria-label="Close"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};