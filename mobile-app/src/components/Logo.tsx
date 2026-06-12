import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import images from '../assets/images';

interface LogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}

export const Logo: React.FC<LogoProps> = ({
  width = 150,
  height = 60,
  style,
  resizeMode = 'contain',
}) => {
  return (
    <Image
      source={images.logo}
      style={[
        {
          width,
          height,
        },
        style,
      ] as StyleProp<ImageStyle>}
      resizeMode={resizeMode}
    />
  );
};

export default Logo;

