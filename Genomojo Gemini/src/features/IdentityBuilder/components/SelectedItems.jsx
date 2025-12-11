import React from 'react';
import { X } from 'lucide-react';

export function SelectedItems({ items, onRemove, onComplete }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 pb-20 sm:pb-4">
            <div className="max-w-md mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">Your Selection</h3>
                        <span className="text-sm text-gray-500">({items.length})</span>
                    </div>
                    <button
                        onClick={onComplete}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                    >
                        Done
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm font-medium border border-black/5 ${item.color ? `${item.color} text-white` : 'bg-gray-100 text-gray-800'}`}
                        >
                            <span className="truncate max-w-[150px]">{item.label}</span>
                            <button
                                onClick={() => onRemove(item.id)}
                                className="p-1 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
