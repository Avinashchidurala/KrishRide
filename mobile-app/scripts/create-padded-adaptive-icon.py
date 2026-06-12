#!/usr/bin/env python3
"""
Creates properly padded Android Adaptive Icon foreground
Size: 1024x1024px with 22% padding on all sides
This ensures the logo is fully visible in all Android launcher masks
"""

import sys
from PIL import Image
import os

def create_padded_icon():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, '..', 'assets')
    input_icon = os.path.join(assets_dir, 'icon-new.png')
    output_icon = os.path.join(assets_dir, 'adaptive-icon-padded.png')
    
    # Check if input exists
    if not os.path.exists(input_icon):
        print(f'❌ Error: {input_icon} not found')
        sys.exit(1)
    
    # Canvas size: 1024x1024 (Expo adaptive icon size)
    canvas_size = 1024
    
    # Padding: 22% on all sides (225px)
    padding = int(canvas_size * 0.22)
    logo_size = canvas_size - (padding * 2)  # 574px logo area
    
    print('📱 Creating properly padded Android Adaptive Icon...')
    print(f'   Canvas size: {canvas_size}x{canvas_size}px')
    print(f'   Padding: {padding}px ({int((padding/canvas_size)*100)}%)')
    print(f'   Logo area: {logo_size}x{logo_size}px')
    print(f'   Input: {input_icon}')
    print(f'   Output: {output_icon}')
    
    try:
        # Open and resize the input icon
        logo = Image.open(input_icon)
        
        # Convert to RGBA if needed
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        # Resize logo to fit within padded area (maintain aspect ratio)
        # Use LANCZOS resampling (high quality)
        try:
            # Try new API first (Pillow >= 10.0.0)
            logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
        except AttributeError:
            # Fallback to old API (Pillow < 10.0.0)
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
        
        # Create canvas with transparent background
        canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        
        # Calculate position to center the logo
        x = (canvas_size - logo.width) // 2
        y = (canvas_size - logo.height) // 2
        
        # Paste logo onto canvas
        canvas.paste(logo, (x, y), logo)
        
        # Save output
        canvas.save(output_icon, 'PNG')
        
        print('✅ Adaptive icon created successfully!')
        print(f'   Output: {output_icon}')
        
        # Get file size
        file_size = os.path.getsize(output_icon)
        print(f'   Size: {file_size / 1024:.2f} KB')
        
        print('')
        print('📝 Next steps:')
        print(f'   1. Replace adaptive-icon.png:')
        print(f'      cp {output_icon} {os.path.join(assets_dir, "adaptive-icon.png")}')
        print('   2. Run: npx expo prebuild --clean')
        print('   3. Or rebuild: npx expo run:android --variant release')
        
        return output_icon
        
    except Exception as e:
        print(f'❌ Error creating adaptive icon: {e}')
        sys.exit(1)

if __name__ == '__main__':
    create_padded_icon()

