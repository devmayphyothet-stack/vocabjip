import React from 'react';
import { View, Image, StyleSheet, StyleProp, ImageStyle, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function BrandLogo({
  size = 40,
  rounded = true,
  style,
  containerStyle,
}: BrandLogoProps) {
  const borderRadius = rounded ? Math.round(size * 0.22) : 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require('../../assets/logo/vocabjip.png')}
        style={[
          {
            width: size,
            height: size,
            borderRadius,
          },
          style,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

