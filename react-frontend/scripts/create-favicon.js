// Script to create PNG favicons from logo
// Requires: npm install sharp

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try logo first, fallback to icon.png
const logoPath = path.join(__dirname, '../public/images/hushryd-logo-new.jpg');
const iconPath = path.join(__dirname, '../public/images/icon.png');
const outputDir = path.join(__dirname, '../public/images');

// Use icon.png as source since logo is a PDF
const sourcePath = fs.existsSync(iconPath) ? iconPath : logoPath;

// Check if source exists
if (!fs.existsSync(sourcePath)) {
  console.error('Source file not found:', sourcePath);
  process.exit(1);
}

console.log(`Using source: ${path.basename(sourcePath)}`);

async function createFavicons() {
  try {
    // Create different sizes for favicon
    const sizes = [
      { size: 32, name: 'favicon-32.png' },
      { size: 192, name: 'favicon-192.png' },
      { size: 512, name: 'favicon-512.png' },
    ];

    for (const { size, name } of sizes) {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(outputDir, name));
      
      console.log(`✓ Created ${name} (${size}x${size})`);
    }

    // Also create a main favicon.png (32x32)
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));

    console.log('✓ Created favicon.png (32x32)');
    console.log('\n✅ All favicon PNGs created successfully!');
  } catch (error) {
    console.error('Error creating favicons:', error.message);
    process.exit(1);
  }
}

createFavicons();

