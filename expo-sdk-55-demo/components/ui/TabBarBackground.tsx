import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';

export default function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        // System chrome material automatically adapts to the user's theme.
        tint="systemChromeMaterial"
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  // On Android/web, no background component needed (default opaque background is fine)
  return null;
}
