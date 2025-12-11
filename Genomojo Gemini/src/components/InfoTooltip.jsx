import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle, X } from 'lucide-react';

export const InfoTooltip = ({
    content,
    icon: Icon = Info,
    className = "",
    position = "top",
    size = 20
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleTooltip = (e) => {
        e.stopPropagation(); // Prevent triggering parent clicks (like cards)
        setIsOpen(!isOpen);
    };

    // Position classes
    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
        // New alignments
        "bottom-start": "top-full left-0 mt-2", // Aligns left edge
        "bottom-end": "top-full right-0 mt-2", // Aligns right edge
        "top-start": "bottom-full left-0 mb-2",
        "top-end": "bottom-full right-0 mb-2"
    };

    return (
        <div className={`relative inline-flex items-center ${className}`} ref={tooltipRef}>
            <button
                onClick={toggleTooltip}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
                aria-label="More information"
            >
                <Icon size={size} />
            </button>

            {isOpen && (
                <div
                    className={`absolute z-50 w-64 max-w-[85vw] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-left ${positionClasses[position]}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {content.title}
                        </h4>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {content.text}
                    </p>

                    {/* Arrow */}
                    <div className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transform rotate-45 
                        ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
                        ${position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
                        ${position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
                        ${position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
                        ${position === 'bottom-start' ? 'top-[-6px] left-4 border-t border-l' : ''}
                        ${position === 'bottom-end' ? 'top-[-6px] right-4 border-t border-l' : ''}
                        ${position === 'top-start' ? 'bottom-[-6px] left-4 border-b border-r' : ''}
                        ${position === 'top-end' ? 'bottom-[-6px] right-4 border-b border-r' : ''}
                    `} />
                </div>
            )}
        </div>
    );
};
