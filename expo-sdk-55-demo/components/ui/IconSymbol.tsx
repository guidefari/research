/**
 * SDK 55: expo-symbols supports SF Symbols on iOS.
 * On Android/web we fall back to @expo/vector-icons MaterialIcons.
 *
 * SDK 55 also adds SF Symbol support in tab bar icons via the
 * `renderingMode` prop (xcasset icon support).
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle, Platform } from 'react-native';

// Map from SF Symbol names used in the app to Material Icons equivalents
const SF_TO_MATERIAL: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'house.fill': 'home',
  'paintbrush.fill': 'brush',
  'link': 'link',
  'square.grid.2x2.fill': 'grid_view',
  'square.and.arrow.up': 'share',
  'ellipsis.circle': 'more_horiz',
  'waveform': 'graphic_eq',
  'cylinder': 'storage',
  'lock.fill': 'lock',
  'circle.grid.cross.fill': 'blur_on',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={name}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  const materialName = SF_TO_MATERIAL[name as string] ?? 'circle';
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={materialName}
      style={style as any}
    />
  );
}
