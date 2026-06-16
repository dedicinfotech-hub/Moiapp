/**
 * Splash Screen Generation Script for MoiApp
 * 
 * Creates splash screens for PWA/TWA loading screens.
 * Run: node scripts/generate-splash.js
 */

const fs = require('fs');
const path = require('path');

// Create splash directory if it doesn't exist
const splashDir = path.join(__dirname, '../frontend/public/splash');
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// SVG template for splash screen
const createSplashSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#FFFCF5"/>
  <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.1}" fill="#FFC107"/>
  <path d="M12 21c-3.5-2.4-6-5.4-6-8.5A6 6 0 0 1 12 6.5a6 6 0 0 1 6 6c0 3.1-2.5 6.1-6 8.5Z" stroke="#101010" stroke-width="${size * 0.04}" fill="none"/>
  <path d="M12 6.5v14.5" stroke="#101010" stroke-width="${size * 0.04}"/>
  <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="${size * 0.16}" font-weight="bold" fill="#101010">MoiApp</text>
</svg>
`;

// Generate splash screens in different sizes
const sizes = [320, 640, 1024];

sizes.forEach(size => {
  const svg = createSplashSVG(size);
  fs.writeFileSync(
    path.join(splashDir, `splash-${size}x${size}.svg`),
    svg
  );
  console.log(`Created splash-${size}x${size}.svg`);
});

console.log('\nSplash screen generation complete!');
console.log('Note: For Play Store, convert SVG files to PNG format.');