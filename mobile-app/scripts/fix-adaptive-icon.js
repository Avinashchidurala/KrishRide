const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Creates a properly padded Android Adaptive Icon foreground
 * Size: 432x432px with 20-25% padding on all sides
 * This ensures the logo is fully visible in all Android launcher masks
 */
async function createAdaptiveIconForeground() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const foregroundOutput = path.join(assetsDir, 'adaptive-icon-foreground.png');
  
  // Input icon (use icon-new.png as base)
  const inputIcon = path.join(assetsDir, 'icon-new.png');
  
  if (!fs.existsSync(inputIcon)) {
    console.error('❌ Error: icon-new.png not found in assets folder');
    process.exit(1);
  }

  // Target size: 432x432px (Android Adaptive Icon foreground size)
  const canvasSize = 432;
  
  // Padding: 22% on all sides (slightly more than minimum 20% for safety)
  const padding = Math.round(canvasSize * 0.22); // ~95px padding
  const logoSize = canvasSize - (padding * 2); // ~242px logo area

  console.log('📱 Creating Android Adaptive Icon foreground...');
  console.log(`   Canvas size: ${canvasSize}x${canvasSize}px`);
  console.log(`   Padding: ${padding}px (${Math.round((padding/canvasSize)*100)}%)`);
  console.log(`   Logo area: ${logoSize}x${logoSize}px`);

  try {
    // Read and resize the input icon
    const inputBuffer = await sharp(inputIcon)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toBuffer();

    // Create canvas with transparent background and place logo centered
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      }
    })
    .composite([{
      input: inputBuffer,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(foregroundOutput);

    console.log('✅ Adaptive icon foreground created successfully!');
    console.log(`   Output: ${foregroundOutput}`);
    
    // Get file size
    const stats = fs.statSync(foregroundOutput);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return foregroundOutput;
  } catch (error) {
    console.error('❌ Error creating adaptive icon foreground:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAdaptiveIconForeground()
    .then(() => {
      console.log('\n📝 Next steps:');
      console.log('   1. Run: npx expo prebuild --clean (to regenerate Android icons)');
      console.log('   2. Or: npx expo run:android --variant release (to rebuild)');
    })
    .catch(console.error);
}

module.exports = { createAdaptiveIconForeground };

