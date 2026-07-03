/**
 * Icon Generation Script for MoiApp
 * 
 * This script creates placeholder icons for PWA/Play Store.
 * For production, replace with actual app icons.
 * 
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../frontend/public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for MoiApp icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#FFC107"/>
  <path d="M12 21c-3.5-2.4-6-5.4-6-8.5A6 6 0 0 1 12 6.5a6 6 0 0 1 6 6c0 3.1-2.5 6.1-6 8.5Z" stroke="#101010" stroke-width="${size * 0.1}" fill="none"/>
  <path d="M12 6.5v14.5" stroke="#101010" stroke-width="${size * 0.1}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="#101010">M</text>
</svg>
`;

// Generate icons in different sizes
const sizes = [48, 72, 96, 144, 192, 512];

sizes.forEach(size => {
  const svg = createIconSVG(size);
  // For now, save as SVG (in production, convert to PNG)
  fs.writeFileSync(
    path.join(iconsDir, `icon-${size}x${size}.svg`),
    svg
  );
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('\nIcon generation complete!');
console.log('Note: For Play Store, convert SVG files to PNG format.');
console.log('Recommended: Use a design tool to create proper app icons.');