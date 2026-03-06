import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type Feature = {
  emoji: string;
  title: string;
  subtitle: string;
  items: string[];
};

const SDK55_FEATURES: Feature[] = [
  {
    emoji: '🎨',
    title: 'Expo UI — Actually Native',
    subtitle: 'Real SwiftUI & Jetpack Compose, zero bridging hacks',
    items: [
      'DatePicker, Toggle, ProgressView, ConfirmationDialog',
      'SwiftUI modifier naming conventions matched 1:1',
      'Compose DSL: Card, LazyColumn, ModalBottomSheet',
      'Material 3 components: FilterChip, RadioButton, Carousel',
      'Markdown in Text, custom modifier extensions',
    ],
  },
  {
    emoji: '🔗',
    title: 'Expo Router v55',
    subtitle: 'Native navigation that feels like native navigation',
    items: [
      'Apple Zoom Transition — shared-element zoom via iOS gesture',
      'Stack.Toolbar — declarative UIToolbar on iOS',
      'Colors API — dynamic Material 3 & iOS adaptive colors',
      'SplitView (experimental)',
      'Form sheet footers (experimental)',
      'Safe area auto-handling in native-tabs',
    ],
  },
  {
    emoji: '📦',
    title: 'expo-widgets (Alpha, iOS)',
    subtitle: 'Home screen widgets & Live Activities — zero native code',
    items: [
      'Built with Expo UI components',
      'Widget timelines via JS SharedObject API',
      'Live Activity management',
      'No Xcode / Swift required',
    ],
  },
  {
    emoji: '🎵',
    title: 'expo-audio Upgrades',
    subtitle: 'Rich audio features now in the "next" API',
    items: [
      'Lock-screen controls (Now Playing widget)',
      'Background recording',
      'Playlist / queue support',
      'Native audio preloading',
    ],
  },
  {
    emoji: '💾',
    title: 'expo-sqlite Improvements',
    subtitle: 'Ergonomic and type-safe',
    items: [
      'Tagged template literals for type-safe SQL',
      'New DevTools inspector panel',
      'Better performance for large datasets',
    ],
  },
  {
    emoji: '🌀',
    title: 'expo-blur on Android',
    subtitle: 'Efficient blur using RenderNode API (Android 12+)',
    items: [
      'BlurTargetView wrapper component',
      'Hardware-accelerated, no full-screen blur tricks',
    ],
  },
  {
    emoji: '🚀',
    title: 'Core Runtime',
    subtitle: 'New Architecture is now mandatory',
    items: [
      'React Native 0.83 + React 19.2',
      'Legacy Architecture dropped — all apps run New Arch',
      'Hermes v1 opt-in with modern JS support',
      'EAS Update: ~75 % smaller downloads via bytecode diffing',
    ],
  },
];

export default function OverviewScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">Expo SDK 55</ThemedText>
          <ThemedText type="subtitle" style={styles.tagline}>
            "Basically native" just became actually native
          </ThemedText>
        </View>

        {SDK55_FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Explore each tab to see the new APIs in action.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function FeatureCard({ emoji, title, subtitle, items }: Feature) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        <View style={styles.cardTitles}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            {title}
          </ThemedText>
          <ThemedText style={styles.cardSubtitle}>{subtitle}</ThemedText>
        </View>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <ThemedText style={styles.bullet}>•</ThemedText>
          <ThemedText style={styles.bulletText}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  tagline: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(120,120,128,0.1)',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardTitles: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 13,
    opacity: 0.65,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bullet: {
    opacity: 0.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    opacity: 0.8,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    opacity: 0.5,
    textAlign: 'center',
  },
});
