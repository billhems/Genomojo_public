
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("CRITICAL ERROR: VITE_GEMINI_API_KEY is missing! Please check your .env file.");
} else {
    console.log("Gemini API Key loaded successfully (length: " + API_KEY.length + ")");
}

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

const fetchWithBackoff = async (url, options) => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            if (response.status === 429 && attempt < 4) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                continue;
            }
            throw new Error(`API Error: ${response.statusText}`);
        } catch (error) {
            if (attempt === 4) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
};

export const getFactorInsight = async (text, isMoHi) => {
    const model = 'gemini-2.5-flash-preview-09-2025';
    const prompt = `Analyze this crowd-sourced well-being factor: "${text}". Categorize its influence (e.g., Social, Environmental, Physiological, Financial, Emotional, Other) and provide a single, short, thoughtful reflective sentence about its potential impact. The factor is ${isMoHi ? 'positive (MoHi)' : 'negative (MoLo)'}.`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "You are a concise well-being analysis bot. Respond only with a JSON object." }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "category": { "type": "STRING", "description": "One primary category." },
                    "reflection": { "type": "STRING", "description": "A single, short sentence reflection." }
                }
            }
        }
    };

    const url = `${API_BASE}${model}:generateContent?key=${API_KEY}`;
    try {
        const response = await fetchWithBackoff(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? JSON.parse(text) : { category: "Unknown", reflection: "Could not generate insight." };
    } catch (error) {
        console.error("Insight API error:", error);
        return { category: "API Error", reflection: "Failed to connect to the Gemini API." };
    }
};

export const getTtsAudio = async (text) => {
    const model = "gemini-2.5-flash-preview-tts";
    const url = `${API_BASE}${model}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
            }
        }
    };

    try {
        const response = await fetchWithBackoff(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        const part = result.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/")) {
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000;
            return { audioData, sampleRate };
        }
        throw new Error("TTS response missing audio data.");
    } catch (error) {
        console.error("TTS API error:", error);
        return null;
    }
};

export const generateCharacterImage = async (age, gender, traits) => {
    // Using a model that supports image generation
    const model = 'gemini-2.5-flash-image-preview';
    const url = `${API_BASE}${model}:generateContent?key=${API_KEY}`;

    const prompt = `Generate an image of a character card for a board game similar to Cluedo, Jumanji etc, personifying the person described by these traits which are their defining characteristics:

Age ${age}

Gender ${gender}

${traits}

(Use the Nano Banana style/model if available)`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ["IMAGE"],
        }
    };

    try {
        const response = await fetchWithBackoff(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        // Check for image data
        const part = result.candidates?.[0]?.content?.parts?.[0];
        const imageData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (imageData && mimeType && mimeType.startsWith("image/")) {
            return `data:${mimeType};base64,${imageData}`;
        }

        console.warn("No image data in response:", result);
        return null;
    } catch (error) {
        console.error("Image Generation API error:", error);
        return null;
    }
};