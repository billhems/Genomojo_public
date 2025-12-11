import React from 'react';

/**
 * Reusable Button Component with Tailwind styling.
 * @param {object} props
 * @param {string} [props.color] - 'green', 'red', 'gray', 'primary', 'custom'. Defaults to 'primary'.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @param {function} props.onClick - Click handler.
 * @param {React.ReactNode} props.children - Button content.
 * @param {string} [props.className] - Additional Tailwind classes.
 */
export const Button = ({ color = 'primary', disabled, onClick, children, className = '' }) => {
    let baseStyle = 'px-4 py-2 font-semibold text-white rounded-xl transition-all duration-200 shadow-md';
    let hoverStyle = '';

    switch (color) {
        case 'green':
            baseStyle += ' bg-green-500';
            hoverStyle = ' hover:bg-green-600 active:bg-green-700';
            break;
        case 'red':
            baseStyle += ' bg-red-500';
            hoverStyle = ' hover:bg-red-600 active:bg-red-700';
            break;
        case 'gray':
            baseStyle += ' bg-gray-500';
            hoverStyle = ' hover:bg-gray-600 active:bg-gray-700';
            break;
        case 'custom':
            // No default background/hover styles; rely on className
            // We still keep basic structural styles if desired, or maybe just minimal
            baseStyle = 'px-4 py-2 font-semibold text-white rounded-xl transition-all duration-200 shadow-md';
            break;
        case 'primary':
        default:
            baseStyle += ' bg-indigo-600';
            hoverStyle = ' hover:bg-indigo-700 active:bg-indigo-800';
            break;
    }

    if (disabled) {
        baseStyle = 'px-4 py-2 font-semibold text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-xl cursor-not-allowed shadow-inner';
        hoverStyle = '';
    }

    return (
        <button
            className={`${baseStyle} ${hoverStyle} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};