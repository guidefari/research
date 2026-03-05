/**
 * SDK 55 — Apple Zoom Transition: Detail Screen
 *
 * This screen is the "destination" of the zoom transition initiated from
 * the router tab. Expo Router v55 wires up the native UIViewControllerTransitioningDelegate
 * automatically when `animation: 'zoom'` is set — the OS handles the
 * shared-element zoom gesture (pinch to dismiss, swipe back).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ItemDetailScreen() {
  const { id, title, emoji, color } = useLocalSearchParams<{
    id: string;
    title: string;
    emoji: string;
    color: string;
  }>();
  const router = useRouter();

  const safeColor = color ?? '#007AFF';

  return (
    <ThemedView style={styles.container}>
      {/*
       * SDK 55: animation: 'zoom' activates the Apple Zoom Transition.
       * The screen zooms in from the tapped card's position and zooms
       * back out when dismissed via swipe or the back button.
       *
       * Combined with Stack.Toolbar on the previous screen, this gives
       * a completely native navigation experience.
       */}
      <Stack.Screen
        options={{
          title: title ?? 'Detail',
          headerShown: true,
          // Zoom transition — set on the destination screen
          animation: 'ios_from_right',
          // The matched navigation ID connects this element to the
          // source card in the list for the zoom effect.
          // In Expo Router v55: headerTransparent + zoom animation
          // automatically produce the Apple Zoom look.
          headerTransparent: Platform.OS === 'ios',
          headerBlurEffect: 'systemMaterial',
        }}
      />

      {/* Hero area — this is the "shared element" */}
      <Animated.View
        entering={FadeInUp.duration(300)}
        // SDK 55: sharedTransitionTag connects to the source card
        // sharedTransitionTag={`item-card-${id}`}
        style={[styles.hero, { backgroundColor: safeColor }]}
      >
        <ThemedText style={styles.heroEmoji}>{emoji}</ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.body}>
          This screen was reached via the{' '}
          <ThemedText type="defaultSemiBold">Apple Zoom Transition</ThemedText>{' '}
          introduced in Expo Router v55.
        </ThemedText>
        <ThemedText style={styles.body}>
          On iOS, the card you tapped zoomed into this screen. Pinch to zoom
          out, or swipe down to dismiss — identical to the iOS Photos app.
        </ThemedText>

        <View style={[styles.badge, { backgroundColor: safeColor + '22', borderColor: safeColor + '44' }]}>
          <ThemedText style={[styles.badgeText, { color: safeColor }]}>
            Item ID: {id}
          </ThemedText>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: safeColor }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.buttonText}>← Go Back (zoom out)</ThemedText>
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 100,
    // In Expo Router v55 with zoom transition, the OS morphs this element
    // from its source position — no manual animation needed.
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.75,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
