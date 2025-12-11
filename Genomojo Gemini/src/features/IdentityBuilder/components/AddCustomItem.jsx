import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export function AddCustomItem({ onAdd, onCancel }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 flex items-center gap-2">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter custom item..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
                type="submit"
                disabled={!value.trim()}
                className="p-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="p-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
            >
                <X className="w-4 h-4" />
            </button>
        </form>
    );
}
