import * as THREE from 'three';
export const ROOT_ID = 'root';

export const getChildren = (parentId, activeCategories, dataset) => {
    if (parentId === ROOT_ID) {
        return dataset.filter(item => activeCategories.includes(item.parentId));
    }
    return dataset.filter(item => item.parentId === parentId);
};

export const getItem = (id, dataset) => dataset.find(i => i.id === id);

export function createLabelTexture(text, hasChildren) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Increased resolution for sharper text
    const fontSize = 64;
    const font = `bold ${fontSize}px Arial`;

    ctx.font = font;
    const textWidth = ctx.measureText(text).width;
    const padding = 30;
    const canvasWidth = textWidth + padding * 2;
    // Height needs to accommodate main text + potential subtext
    const canvasHeight = fontSize * 2.8;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Stronger Shadow/Stroke for readability against space
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, canvasWidth / 2, fontSize);

    // White fill (will be tinted by SpriteMaterial color)
    ctx.fillStyle = 'white';
    ctx.fillText(text, canvasWidth / 2, fontSize);

    if (hasChildren) {
        const subFontSize = 32;
        ctx.font = `italic ${subFontSize}px Arial`;
        ctx.fillStyle = '#dddddd';
        ctx.strokeText('(Hold to expand)', canvasWidth / 2, fontSize + subFontSize + 10);
        ctx.fillText('(Hold to expand)', canvasWidth / 2, fontSize + subFontSize + 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return { texture, aspect: canvasWidth / canvasHeight };
}

// Fibonacci Sphere Distribution
export function getPositions(count, radius = 5) {
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    return points;
}
