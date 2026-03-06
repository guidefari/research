/**
 * SDK 55 — @expo/ui Demo
 *
 * Shows off real SwiftUI components (via the swift-ui sub-package) and
 * real Jetpack Compose components (via the jetpack-compose sub-package).
 * These are NOT wrappers around React Native views — they render actual
 * platform UI trees via Expo Modules' native host component infrastructure.
 */

import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

// ─── SwiftUI (iOS) ────────────────────────────────────────────────────────────
// SDK 55 renamed all components to match SwiftUI naming conventions exactly:
//   DateTimePicker  → DatePicker   (+ date range support)
//   Switch          → Toggle
//   CircularProgress / LinearProgress → ProgressView
//   New: ConfirmationDialog, ScrollView, contentShape(), scaleEffect, ignoreSafeArea
import {
  ConfirmationDialog,
  DatePicker,
  ProgressView,
  ScrollView as SwiftUIScrollView,
  Text as SwiftUIText,
  Toggle,
} from '@expo/ui/swift-ui';

// ─── Jetpack Compose (Android) ────────────────────────────────────────────────
// SDK 55 promoted Compose support from Alpha → Beta.
// New Material 3 components: Card, LazyColumn, ListItem, ModalBottomSheet,
//   Carousel, RadioButton, FilterChip, Icon (Material Symbols XML drawables)
// Functional DSL pattern: View("ComponentName") { props => ... }
import {
  Card,
  FilterChip,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  ModalBottomSheet,
  RadioButton,
} from '@expo/ui/jetpack-compose';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SectionHeader } from '@/components/SectionHeader';

// ─────────────────────────────────────────────────────────────────────────────

export default function ExpoUIScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <ThemedText type="title">@expo/ui</ThemedText>
          <ThemedText style={styles.pageSubtitle}>
            Real SwiftUI & Jetpack Compose — rendered by the OS, not React Native
          </ThemedText>
        </View>

        {Platform.OS === 'ios' ? <SwiftUISection /> : <ComposeSection />}

        {/* Show both sections on web so reviewers can see the APIs */}
        {Platform.OS === 'web' && (
          <>
            <ThemedText style={styles.platformNote}>
              On a real device this renders actual SwiftUI (iOS) or Compose (Android).
            </ThemedText>
            <SwiftUISection />
            <ComposeSection />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// ─── SwiftUI Section ─────────────────────────────────────────────────────────

function SwiftUISection() {
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isOn, setIsOn] = useState(false);
  const [progress] = useState(0.65);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <View style={styles.section}>
      <SectionHeader
        icon="swift"
        title="SwiftUI Components"
        badge="iOS"
        badgeColor="#FA7343"
      />

      {/* ── DatePicker ── */}
      {/* SDK 55: renamed from DateTimePicker; now supports date ranges */}
      <DemoCard title="DatePicker" note="SDK 55: renamed from DateTimePicker + range support">
        <SwiftUIScrollView style={styles.nativeHost}>
          <DatePicker
            date={date}
            onDateChange={(newDate) => setDate(newDate)}
            // Range mode — new in SDK 55
            startDate={date}
            endDate={endDate}
            onEndDateChange={(d) => setEndDate(d)}
            displayedComponents="date"
            style={styles.nativePicker}
          />
        </SwiftUIScrollView>
        <ThemedText style={styles.demoValue}>
          Selected: {date.toLocaleDateString()}
          {endDate ? ` → ${endDate.toLocaleDateString()}` : ''}
        </ThemedText>
      </DemoCard>

      {/* ── Toggle ── */}
      {/* SDK 55: renamed from Switch; identical to SwiftUI's Toggle */}
      <DemoCard title="Toggle" note="SDK 55: renamed from Switch to match SwiftUI exactly">
        <SwiftUIScrollView style={styles.nativeHost}>
          <Toggle
            value={isOn}
            onValueChange={setIsOn}
            label="Enable native feature"
            style={styles.nativeToggle}
          />
        </SwiftUIScrollView>
        <ThemedText style={styles.demoValue}>
          State: {isOn ? 'ON' : 'OFF'}
        </ThemedText>
      </DemoCard>

      {/* ── ProgressView ── */}
      {/* SDK 55: replaces CircularProgress + LinearProgress */}
      <DemoCard title="ProgressView" note="SDK 55: replaces CircularProgress & LinearProgress">
        <SwiftUIScrollView style={styles.nativeHost}>
          <ProgressView
            progress={progress}
            progressViewStyle="linear"
            style={styles.nativeProgress}
          />
          <ProgressView
            progressViewStyle="circular"
            style={styles.nativeCircular}
          />
        </SwiftUIScrollView>
        <ThemedText style={styles.demoValue}>
          Linear: {(progress * 100).toFixed(0)}% — Circular: indeterminate
        </ThemedText>
      </DemoCard>

      {/* ── Text with Markdown ── */}
      {/* SDK 55: Text now supports Markdown content */}
      <DemoCard title="Text (Markdown)" note="SDK 55: SwiftUI Text now renders Markdown">
        <SwiftUIScrollView style={styles.nativeHost}>
          <SwiftUIText
            style={styles.nativeText}
            // Markdown is parsed natively by SwiftUI's AttributedString
          >
            {"**Bold**, _italic_, `monospaced`, and ~~strikethrough~~ — all rendered by SwiftUI."}
          </SwiftUIText>
        </SwiftUIScrollView>
      </DemoCard>

      {/* ── ConfirmationDialog ── */}
      {/* SDK 55: New component — maps directly to SwiftUI's confirmationDialog modifier */}
      <DemoCard title="ConfirmationDialog" note="SDK 55: New — maps to SwiftUI confirmationDialog">
        <View style={styles.buttonRow}>
          <SwiftUIScrollView style={styles.nativeHost}>
            <Toggle
              value={showDialog}
              onValueChange={setShowDialog}
              label="Show confirmation"
              style={styles.nativeToggle}
            />
          </SwiftUIScrollView>
          <ConfirmationDialog
            isPresented={showDialog}
            title="Delete item?"
            message="This action cannot be undone."
            actions={[
              {
                title: 'Delete',
                role: 'destructive',
                handler: () => setShowDialog(false),
              },
              {
                title: 'Cancel',
                role: 'cancel',
                handler: () => setShowDialog(false),
              },
            ]}
          />
        </View>
      </DemoCard>
    </View>
  );
}

// ─── Jetpack Compose Section ──────────────────────────────────────────────────

function ComposeSection() {
  const [selectedRadio, setSelectedRadio] = useState<string>('option_a');
  const [chips, setChips] = useState({
    swift: false,
    kotlin: false,
    typescript: true,
  });
  const [sheetVisible, setSheetVisible] = useState(false);

  const toggleChip = (key: keyof typeof chips) =>
    setChips((prev) => ({ ...prev, [key]: !prev[key] }));

  // colorScheme from Host gives dynamic Material 3 theming (SDK 55)
  const colorScheme = Host.colorScheme ?? 'light';

  return (
    <View style={styles.section}>
      <SectionHeader
        icon="android"
        title="Jetpack Compose (Beta)"
        badge="Android"
        badgeColor="#3DDC84"
      />

      {/* ── Card ── */}
      {/* SDK 55: New Material 3 Card component */}
      <DemoCard title="Card" note="SDK 55: New Material 3 Card — elevated, filled, outlined variants">
        <Host style={styles.nativeHost} colorScheme={colorScheme}>
          <Card variant="elevated" style={styles.composeCard}>
            <ListItem
              headlineContent="Material 3 Card"
              supportingContent="Rendered by Jetpack Compose, not React Native"
              leadingContent={<Icon name="star" />}
            />
          </Card>
          <Card variant="outlined" style={[styles.composeCard, styles.mt8]}>
            <ListItem
              headlineContent="Outlined Card"
              supportingContent="SDK 55 Beta — available in your JS bundle"
              leadingContent={<Icon name="info" />}
            />
          </Card>
        </Host>
      </DemoCard>

      {/* ── FilterChip ── */}
      {/* SDK 55: New Material 3 FilterChip */}
      <DemoCard title="FilterChip" note="SDK 55: New Material 3 FilterChip">
        <Host style={styles.nativeHost} colorScheme={colorScheme}>
          <View style={styles.chipRow}>
            {(['swift', 'kotlin', 'typescript'] as const).map((lang) => (
              <FilterChip
                key={lang}
                label={lang.charAt(0).toUpperCase() + lang.slice(1)}
                selected={chips[lang]}
                onPress={() => toggleChip(lang)}
              />
            ))}
          </View>
        </Host>
        <ThemedText style={styles.demoValue}>
          Selected: {Object.entries(chips).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}
        </ThemedText>
      </DemoCard>

      {/* ── RadioButton ── */}
      {/* SDK 55: New RadioButton */}
      <DemoCard title="RadioButton" note="SDK 55: New Material 3 RadioButton">
        <Host style={styles.nativeHost} colorScheme={colorScheme}>
          {['option_a', 'option_b', 'option_c'].map((opt) => (
            <RadioButton
              key={opt}
              label={opt.replace('_', ' ').toUpperCase()}
              selected={selectedRadio === opt}
              onPress={() => setSelectedRadio(opt)}
            />
          ))}
        </Host>
        <ThemedText style={styles.demoValue}>Selected: {selectedRadio}</ThemedText>
      </DemoCard>

      {/* ── LazyColumn + ListItem ── */}
      {/* SDK 55: LazyColumn uses Compose's LazyColumn — only renders visible items */}
      <DemoCard title="LazyColumn + ListItem" note="SDK 55: Compose LazyColumn — only visible items rendered">
        <Host style={[styles.nativeHost, styles.lazyHost]} colorScheme={colorScheme}>
          <LazyColumn>
            {Array.from({ length: 8 }, (_, i) => (
              <ListItem
                key={i}
                headlineContent={`List item ${i + 1}`}
                supportingContent="Efficiently rendered by Compose"
                leadingContent={<Icon name={i % 2 === 0 ? 'check_circle' : 'radio_button_unchecked'} />}
              />
            ))}
          </LazyColumn>
        </Host>
      </DemoCard>

      {/* ── ModalBottomSheet ── */}
      {/* SDK 55: New ModalBottomSheet */}
      <DemoCard title="ModalBottomSheet" note="SDK 55: New Compose ModalBottomSheet">
        <Host style={styles.nativeHost} colorScheme={colorScheme}>
          <FilterChip
            label="Open Bottom Sheet"
            selected={sheetVisible}
            onPress={() => setSheetVisible(true)}
          />
          <ModalBottomSheet
            visible={sheetVisible}
            onDismiss={() => setSheetVisible(false)}
          >
            <ListItem
              headlineContent="Native bottom sheet"
              supportingContent="This is a real Compose ModalBottomSheet, not a JS modal."
            />
            <ListItem
              headlineContent="Swipe down to dismiss"
              supportingContent="Or tap outside the sheet."
            />
          </ModalBottomSheet>
        </Host>
      </DemoCard>

      {/* ── Host.colorScheme — dynamic Material 3 theming ── */}
      {/* SDK 55: New Colors API + Host.colorScheme for dynamic theming on Android */}
      <DemoCard
        title="Host.colorScheme"
        note="SDK 55: Dynamic Material 3 color scheme from system wallpaper (Android 12+)"
      >
        <Host style={styles.nativeHost} colorScheme={colorScheme}>
          <Card variant="filled" style={styles.composeCard}>
            <ListItem
              headlineContent={`Current scheme: ${colorScheme}`}
              supportingContent="Colors adapt to the user's system wallpaper via Material You"
              leadingContent={<Icon name="palette" />}
            />
          </Card>
        </Host>
      </DemoCard>
    </View>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function DemoCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.demoCard}>
      <ThemedText type="defaultSemiBold" style={styles.demoTitle}>
        {title}
      </ThemedText>
      <ThemedText style={styles.demoNote}>{note}</ThemedText>
      <View style={styles.demoContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  pageHeader: { gap: 4, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, opacity: 0.65 },
  platformNote: { fontSize: 12, opacity: 0.5, textAlign: 'center', fontStyle: 'italic', marginVertical: 4 },

  section: { gap: 12 },

  demoCard: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  demoTitle: { fontSize: 15 },
  demoNote: { fontSize: 11, opacity: 0.55, marginBottom: 8 },
  demoContent: { gap: 8 },
  demoValue: { fontSize: 12, opacity: 0.7, fontVariant: ['tabular-nums'] },
  buttonRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },

  // Native host containers
  nativeHost: { borderRadius: 8, overflow: 'hidden' },
  lazyHost: { height: 280 },

  // SwiftUI component styles
  nativePicker: { height: 180 },
  nativeToggle: { height: 44, paddingHorizontal: 8 },
  nativeProgress: { height: 8, borderRadius: 4 },
  nativeCircular: { height: 44, width: 44, alignSelf: 'center' },
  nativeText: { padding: 12, fontSize: 16 },

  // Compose component styles
  composeCard: { borderRadius: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 },
  mt8: { marginTop: 8 },
});
