import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expo-ui"
        options={{
          title: 'Expo UI',
          tabBarIcon: ({ color }) => (
            // SDK 55: xcasset icon support + renderingMode prop in tabs
            <IconSymbol size={28} name="paintbrush.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="router"
        options={{
          title: 'Router',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="link" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="widgets"
        options={{
          title: 'Widgets & More',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
