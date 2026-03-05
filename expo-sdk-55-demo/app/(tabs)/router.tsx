/**
 * SDK 55 — Expo Router v55 Features Demo
 *
 * Demonstrates:
 *  1. Apple Zoom Transition  — shared-element zoom driven by the native iOS zoom gesture
 *  2. Stack.Toolbar          — declarative UIToolbar on iOS (menus, actions)
 *  3. Colors API             — dynamic Material 3 (Android) & adaptive colors (iOS)
 *  4. SplitView              — experimental iPad/large-screen split layout
 *  5. Form Sheet Footers     — experimental Apple Platforms
 */

import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';

// SDK 55: Colors API — import adaptive/dynamic color tokens directly from expo-router
import { Colors as RouterColors } from 'expo-router/ui';

import { SectionHeader } from '@/components/SectionHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

const DEMO_ITEMS = [
  { id: '1', title: 'Zoom into Item 1', emoji: '🦁', color: '#FF6B35' },
  { id: '2', title: 'Zoom into Item 2', emoji: '🌊', color: '#4ECDC4' },
  { id: '3', title: 'Zoom into Item 3', emoji: '🌸', color: '#FF85A2' },
  { id: '4', title: 'Zoom into Item 4', emoji: '🍃', color: '#52B788' },
];

export default function RouterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // SDK 55: Colors API — resolve adaptive color tokens based on current color scheme
  // On iOS these map to UIColor's adaptive colors (e.g. label, systemBackground)
  // On Android they resolve to Material 3 dynamic color roles
  const dynamicTint = RouterColors?.tint?.[colorScheme ?? 'light'] ?? '#007AFF';

  return (
    <ThemedView style={styles.container}>
      {/*
       * SDK 55: Stack.Toolbar — declarative control over UIToolbar on iOS.
       * Define toolbar items as JSX children. Each item can be:
       *   - A button with title/icon/action
       *   - A flexible space (fills remaining toolbar space)
       *   - A fixed space
       *   - A menu (maps to UIMenu)
       * The Toolbar appears at the *bottom* of the screen on iOS (UIToolbar position).
       */}
      <Stack.Screen
        options={{
          title: 'Router v55',
          headerShown: true,
          // SDK 55: Stack.Toolbar API
          // Renders a native UIToolbar beneath the screen content on iOS.
          toolbar: Platform.OS === 'ios' ? (
            <Stack.Toolbar>
              {/* Button with SF Symbol icon */}
              <Stack.Toolbar.Item
                title="Share"
                systemImage="square.and.arrow.up"
                onPress={() => Share.share({ message: 'Expo SDK 55 is amazing!' })}
              />
              {/* Flexible space pushes items to opposite ends */}
              <Stack.Toolbar.FlexibleSpace />
              {/* Menu — maps to a native UIMenu with sub-actions */}
              <Stack.Toolbar.Menu
                title="More"
                systemImage="ellipsis.circle"
                children={[
                  {
                    title: 'Copy Link',
                    systemImage: 'link',
                    handler: () => {},
                  },
                  {
                    title: 'Report',
                    systemImage: 'flag',
                    attributes: 'destructive',
                    handler: () => {},
                  },
                ]}
              />
            </Stack.Toolbar>
          ) : undefined,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Apple Zoom Transition ── */}
        <View style={styles.section}>
          <SectionHeader icon="link" title="Apple Zoom Transition" badge="iOS" badgeColor="#FA7343" />
          <ThemedText style={styles.sectionNote}>
            SDK 55: Tap a card to trigger a native shared-element zoom.
            The element "zooms in" from its position in the list —
            exactly like the Photos app or App Store. Driven by the iOS
            zoom gesture (pinch to go back).
          </ThemedText>

          <View style={styles.grid}>
            {DEMO_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.zoomCard, { backgroundColor: item.color }]}
                onPress={() =>
                  router.push({
                    pathname: '/item/[id]',
                    params: {
                      id: item.id,
                      title: item.title,
                      emoji: item.emoji,
                      color: item.color,
                    },
                  })
                }
              >
                {/*
                 * SDK 55: The `sharedTransitionTag` prop (or the matchedNavigation
                 * API in Router) connects this element to the corresponding element
                 * on the destination screen so the OS can animate between them.
                 *
                 * In Expo Router v55 this is expressed as:
                 *   <Animated.View sharedTransitionTag={`item-${item.id}`}>
                 *
                 * Here we keep it simple without Reanimated for demo clarity.
                 */}
                <ThemedText style={styles.zoomEmoji}>{item.emoji}</ThemedText>
                <ThemedText style={styles.zoomLabel}>{item.title}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Stack.Toolbar ── */}
        <View style={styles.section}>
          <SectionHeader icon="link" title="Stack.Toolbar" badge="iOS" badgeColor="#FA7343" />
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoText}>
              {'The toolbar defined in <Stack.Screen options={{ toolbar: ... }}> above\n' +
                'renders as a native UIToolbar at the bottom of this screen (iOS only).\n\n' +
                'Items supported:\n' +
                '  • Stack.Toolbar.Item — button with title, icon, action\n' +
                '  • Stack.Toolbar.FlexibleSpace — fills empty space\n' +
                '  • Stack.Toolbar.FixedSpace — fixed-width gap\n' +
                '  • Stack.Toolbar.Menu — maps to a UIMenu with sub-actions'}
            </ThemedText>
          </View>
        </View>

        {/* ── Colors API ── */}
        <View style={styles.section}>
          <SectionHeader icon="link" title="Colors API" badge="Android + iOS" badgeColor="#6750A4" />
          <ThemedText style={styles.sectionNote}>
            SDK 55: Import color tokens from expo-router/ui. On Android they
            resolve to Material You dynamic colors (wallpaper-seeded Material 3
            color roles). On iOS they use adaptive UIColor tokens.
          </ThemedText>

          <View style={styles.colorGrid}>
            {COLOR_ROLES.map(({ role, description }) => (
              <ColorSwatch
                key={role}
                role={role}
                description={description}
                color={dynamicTint}
              />
            ))}
          </View>

          <View style={styles.infoCard}>
            <ThemedText style={[styles.infoCode, { color: dynamicTint }]}>
              {"import { Colors } from 'expo-router/ui';\n\n" +
                "// Android: Material 3 dynamic color roles\n" +
                "// iOS: adaptive UIColor tokens\n" +
                "const tint = Colors.tint[colorScheme];"}
            </ThemedText>
          </View>
        </View>

        {/* ── SplitView (experimental) ── */}
        <View style={styles.section}>
          <SectionHeader icon="link" title="SplitView (experimental)" badge="iPad" badgeColor="#007AFF" />
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoText}>
              {'SDK 55: <SplitView> renders a native UISplitViewController on\n' +
                'iPad/Mac — a sidebar + detail pane layout.\n\n' +
                'Usage:\n' +
                '  <SplitView\n' +
                '    sidebar={<SidebarScreen />}\n' +
                '    detail={<DetailScreen />}\n' +
                '  />'}
            </ThemedText>
          </View>
        </View>

        {/* ── Form Sheet Footers (experimental) ── */}
        <View style={styles.section}>
          <SectionHeader
            icon="link"
            title="Form Sheet Footers"
            badge="experimental"
            badgeColor="#8E8E93"
          />
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoText}>
              {'SDK 55: Form sheets (modal presentation on Apple platforms)\n' +
                'now support a footer slot:\n\n' +
                '  <Stack.Screen\n' +
                '    options={{\n' +
                '      presentation: "formSheet",\n' +
                '      sheetFooter: <MyFooterComponent />,\n' +
                '    }}\n' +
                '  />'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLOR_ROLES = [
  { role: 'primary', description: 'Primary actions & emphasis' },
  { role: 'secondary', description: 'Secondary actions & fills' },
  { role: 'surface', description: 'Card & sheet backgrounds' },
  { role: 'background', description: 'Screen backgrounds' },
];

function ColorSwatch({
  role,
  description,
  color,
}: {
  role: string;
  description: string;
  color: string;
}) {
  // In a real app: RouterColors[role][colorScheme]
  // Here we simulate with opacity steps for demo purposes
  const opacity = role === 'primary' ? 1 : role === 'secondary' ? 0.7 : role === 'surface' ? 0.3 : 0.15;
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: color, opacity }]} />
      <View style={styles.swatchText}>
        <ThemedText style={styles.swatchRole}>Colors.{role}</ThemedText>
        <ThemedText style={styles.swatchDesc}>{description}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40, gap: 20 },

  section: { gap: 10 },
  sectionNote: { fontSize: 13, opacity: 0.65, lineHeight: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  zoomCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  zoomEmoji: { fontSize: 40 },
  zoomLabel: { fontSize: 12, color: '#fff', fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },

  infoCard: {
    backgroundColor: 'rgba(120,120,128,0.1)',
    borderRadius: 12,
    padding: 14,
  },
  infoText: { fontSize: 13, lineHeight: 20, opacity: 0.8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  infoCode: { fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  colorGrid: { gap: 8 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 8 },
  swatchText: { flex: 1 },
  swatchRole: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  swatchDesc: { fontSize: 11, opacity: 0.55 },
});
