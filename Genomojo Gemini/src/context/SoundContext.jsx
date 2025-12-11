import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Assets
import voteSound from '../assets/vote.mp3';
import skipSound from '../assets/skip.mp3';
import submitSound from '../assets/submit.mp3';

const SoundContext = createContext();

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    // Initialize mute state from localStorage, default to false (sound on)
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('genomojo_sound_muted');
        return saved === 'true';
    });

    const audioRefs = useRef({});

    // Preload sounds
    useEffect(() => {
        const sounds = {
            vote: new Audio(voteSound),
            skip: new Audio(skipSound),
            submit: new Audio(submitSound)
        };

        // Configure sounds
        Object.values(sounds).forEach(audio => {
            audio.load();
        });

        audioRefs.current = sounds;
    }, []);

    // Persist mute state
    useEffect(() => {
        localStorage.setItem('genomojo_sound_muted', isMuted);
    }, [isMuted]);

    const playSound = (soundName) => {
        if (isMuted) return;

        const audio = audioRefs.current[soundName];
        if (audio) {
            // Reset time to 0 to allow rapid replays
            audio.currentTime = 0;
            audio.play().catch(err => console.error("Error playing sound:", err));
        } else {
            console.warn(`Sound "${soundName}" not found.`);
        }
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    const value = {
        isMuted,
        toggleMute,
        playSound
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};
