import React from 'react';

export function SelectionIndicator({ current, max }) {
    const percentage = Math.min((current / max) * 100, 100);

    return (
        <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">
                    {current} of {max} selected
                </span>
                {current === max && (
                    <span className="text-green-600 font-bold">Complete!</span>
                )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ease-out ${current >= max ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
