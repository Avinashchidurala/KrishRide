const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
  const assetsDir = path.join(__dirname, 'assets');

  // Create main app icon (1024x1024)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 107, b: 53, alpha: 1 } // #FF6B35 - HUSHRYD orange
    }
  })
  .composite([{
    input: Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="#FF6B35"/>
      <text x="512" y="520" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">HUSHRYD</text>
    </svg>
    `),
    top: 0,
    left: 0
  }])
  .png()
  .toFile(path.join(assetsDir, 'icon.png'));

  // Create adaptive icon foreground (1024x1024) - transparent background
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
    }
  })
  .composite([{
    input: Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <circle cx="512" cy="512" r="480" fill="#FF6B35"/>
      <text x="512" y="520" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">HUSHRYD</text>
    </svg>
    `),
    top: 0,
    left: 0
  }])
  .png()
  .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  console.log('App icons created successfully!');
  console.log('Main icon: assets/icon.png');
  console.log('Adaptive icon: assets/adaptive-icon.png');
}

createIcons().catch(console.error);
