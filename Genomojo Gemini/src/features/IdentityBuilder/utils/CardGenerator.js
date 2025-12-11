const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Optional: Register a custom brand font if you have one
// registerFont('path/to/cluedo-font.ttf', { family: 'MysteryFont' });

async function generateCharacterCard(userProfile, aiImageUrl) {

    // 1. CONFIGURATION
    const cardWidth = 800;
    const cardHeight = 1200;

    // The "Window" where the character sits (coordinate mapping)
    // You measure these pixels once on your template PNG
    const windowRect = { x: 50, y: 100, w: 700, h: 700 };

    // 2. SETUP CANVAS
    const canvas = createCanvas(cardWidth, cardHeight);
    const ctx = canvas.getContext('2d');

    // 3. LOAD ASSETS
    // In production, you might fetch the AI image from a URL buffer
    const aiImage = await loadImage(aiImageUrl);
    const frameImage = await loadImage('./assets/card_frame_transparent.png');

    // 4. LAYER 1: THE AI CHARACTER (The "Meat")
    // We draw this FIRST so it sits behind the frame.
    // We use 'cover' logic to ensure the image fills the window without stretching.
    drawImageProp(ctx, aiImage, windowRect.x, windowRect.y, windowRect.w, windowRect.h);

    // 5. LAYER 2: THE FRAME (The "Bread")
    // This PNG has a transparent hole in the middle
    ctx.drawImage(frameImage, 0, 0, cardWidth, cardHeight);

    // 6. LAYER 3: TEXT & STATS (The "Garnish")
    // Now we write the data on top of the frame

    // -- Name --
    ctx.fillStyle = '#330000'; // Dark red for Cluedo vibe
    ctx.font = 'bold 60px "Arial"'; // or 'MysteryFont'
    ctx.textAlign = 'center';
    ctx.fillText(userProfile.name.toUpperCase(), cardWidth / 2, 900);

    // -- Stats Block --
    ctx.font = '30px "Arial"';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';

    const startX = 100;
    let startY = 1000;
    const lineHeight = 45;

    // Loop through traits and print them
    const stats = [
        `Occupation: ${userProfile.job}`,
        `Hobby: ${userProfile.hobby}`,
        `Trait: ${userProfile.trait}`
    ];

    stats.forEach(text => {
        ctx.fillText(text, startX, startY);
        startY += lineHeight;
    });

    // 7. EXPORT
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`output_${userProfile.name.replace(/\s/g, '_')}.png`, buffer);
    console.log("Card generated successfully!");
}

// --- HELPER FUNCTION: Object fit 'cover' implementation for Canvas ---
// This ensures the AI image fills the box nicely even if aspect ratios differ
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // Default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // decide which gap to fill    
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);
    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

// --- USAGE ---
const mockUser = {
    name: "The Tired Coder",
    job: "Software Engineer",
    hobby: "Rock Climbing",
    trait: "Always drinking coffee"
};

// You would pass the URL or path to the image Gemini just generated
generateCharacterCard(mockUser, './gemini_output_temp.png');