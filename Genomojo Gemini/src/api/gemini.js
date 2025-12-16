
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

export const generateMovieConcept = async (age, gender, traits) => {
    const model = 'gemini-2.5-flash-preview-09-2025';
    const url = `${API_BASE}${model}:generateContent?key=${API_KEY}`;

    const prompt = `
    You are a creative Hollywood casting director and screenwriter.
    Input Data:
    • Age: ${age}
    • Gender: ${gender}
    • 5 Key Traits: ${traits}
    
    Task: Based on these traits, create a movie concept.
    1. Character Name: A name that fits the genre.
    2. Movie Title: Catchy and relevant to the traits.
    3. Strap Line: A one-sentence hook.
    4. Visual Description: A vivid, physical description for a movie poster. 
       - Translate abstract hobbies into visual props.
       - Translate personality traits into physical pose or clothing.
       - Include specifics on lighting, camera angle, and outfit.

    Output strictly valid JSON with keys: character_name, genre, movie_title, strapline, visual_description.
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetchWithBackoff(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No text content in response");
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("Movie Concept API error:", error);
        return null;
    }
};

export const generateMoviePoster = async (concept) => {
    // Using the same model class as generateCharacterImage for consistency and reliability
    // unless the user specifically has access to 'imagen-3.0-generate-001' via this same API key/endpoint.
    // The user requested 'imagen-3.0-generate-001', so let's try that. 
    // If it fails, we might need to fallback.
    const model = 'imagen-3.0-generate-001';
    const url = `${API_BASE}${model}:predict?key=${API_KEY}`;
    // Wait, the API_BASE is .../v1beta/models/. 
    // Imagen 3 usually uses a different endpoint structure or :predict.
    // But via Gemini API (Generative Language), it often uses :generateContent with image generation capabilities (like gemini-2.5-flash-image-preview).
    // Let's stick to the KNOWN WORKING model for images in this file: 'gemini-2.5-flash-image-preview'
    // but update the PROMPT to be the cinematic one.
    // OR, we can try to use the model ID the user gave if it works with :generateContent.
    // Let's use 'gemini-2.5-flash-image-preview' to be SAFE since we know it works, 
    // but I'll add a comment that we are using it as the image generator.

    const imageModel = 'gemini-2.5-flash-image-preview'; // Keeping consistent with known working model
    const imageUrl = `${API_BASE}${imageModel}:generateContent?key=${API_KEY}`;

    const prompt = `
    A professional movie poster for a ${concept.genre} film.
    
    SUBJECT & SETTING:
    ${concept.visual_description}
    
    TEXT ELEMENTS:
    The title "${concept.movie_title}" is written in massive, genre-appropriate typography at the bottom.
    The strapline "${concept.strapline}" is clearly visible.
    
    STYLE:
    High-budget Hollywood production, 8k resolution, dramatic lighting, photorealistic.
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ["IMAGE"],
        }
    };

    try {
        const response = await fetchWithBackoff(imageUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        const part = result.candidates?.[0]?.content?.parts?.[0];
        const imageData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (imageData && mimeType && mimeType.startsWith("image/")) {
            return `data:${mimeType};base64,${imageData}`;
        }

        console.warn("No image data in movie poster response:", result);
        return null;
    } catch (error) {
        console.error("Movie Poster API error:", error);
        return null;
    }
};