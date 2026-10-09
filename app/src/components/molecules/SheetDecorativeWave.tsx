import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';

const waveBannerImg = require('../../assets/sheet_decorative_wave.png');

interface SheetDecorativeWaveProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Molecule: SheetDecorativeWave
 *
 * Exact high-fidelity decorative top graphic from reference UI:
 * - Flowing multiple curved mint wave ribbons sweeping across from left to right
 * - Subtle ambient mint gradient wash
 * - Segmented dashed trajectory path leading up the hill
 * - Stylized 3D miniature green sedan car climbing the slope
 * - Destination marker pin with inner dot
 */
const SheetDecorativeWave: React.FC<SheetDecorativeWaveProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={waveBannerImg}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 54,
  },
});

export default SheetDecorativeWave;
