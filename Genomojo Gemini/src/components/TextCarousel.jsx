import React, { useState, useEffect } from 'react';

export const TextCarousel = ({ phrases, colorClassName = 'text-gray-500' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Reset index if phrases change (e.g. switching MoHi/MoLo)
        setCurrentIndex(0);
    }, [phrases]);

    useEffect(() => {
        const interval = setInterval(() => {
            handleNext();
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex, phrases.length]);

    const handleNext = () => {
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % phrases.length);
            setIsFading(false);
        }, 200); // Wait for fade out
    };

    return (
        <div
            onClick={handleNext}
            className={`min-h-[3rem] flex items-center justify-center cursor-pointer select-none transition-opacity duration-200 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
            <span className={`text-2xl sm:text-3xl font-bold text-center ${colorClassName}`}>
                {phrases[currentIndex]}
            </span>
        </div>
    );
};
