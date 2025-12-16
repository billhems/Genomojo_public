import React from 'react';
import { X, Clapperboard } from 'lucide-react';

const genres = [
    "Romcom", "Horror", "Fantasy", "Sci-Fi", "Action",
    "Drama", "Comedy", "Disaster", "Superhero", "Animation",
    "Crime", "Thriller", "War", "Period Drama"
];

export const GenrePickerOverlay = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <Clapperboard className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">The Movie of Your Life</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8 font-medium">
                        If they were making the movie of your life right now, what genre would it be?
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {genres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => onSelect(genre)}
                                className="group relative px-4 py-3 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-500/30 transition-all duration-200"
                            >
                                <span className="block text-center font-semibold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                                    {genre}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-400">
                    Select a genre to begin casting
                </div>
            </div>
        </div>
    );
};
