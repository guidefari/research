/**
 * SDK 55 — Widgets & Platform Features Demo
 *
 * Demonstrates:
 *  1. expo-widgets (Alpha, iOS)  — home screen widgets & Live Activities
 *  2. expo-blur BlurTargetView   — hardware-accelerated blur on Android 12+
 *  3. expo-audio                 — lock-screen controls, playlists, background recording
 *  4. expo-sqlite                — tagged template literals API + DevTools inspector
 *  5. expo-crypto                — AES-GCM encryption (new in SDK 55)
 */

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { BlurTargetView } from 'expo-blur';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  createWidgetTimeline,
  LiveActivityManager,
  type WidgetEntry,
} from 'expo-widgets';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SectionHeader } from '@/components/SectionHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// ─── expo-sqlite — open DB once at module level ───────────────────────────────
// SDK 55: openDatabaseSync now returns a synchronous handle (no async needed)
const db: SQLiteDatabase = openDatabaseSync('sdk55_demo.db');

// SDK 55: Tagged template literal API — fully type-safe SQL
// The tag function parses the template at build time to extract the
// column names and produce accurate TypeScript return types.
db.execSync(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// ─────────────────────────────────────────────────────────────────────────────

export default function WidgetsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <ThemedText type="title">Widgets & More</ThemedText>
          <ThemedText style={styles.pageSubtitle}>
            expo-widgets · expo-blur · expo-audio · expo-sqlite · expo-crypto
          </ThemedText>
        </View>

        <WidgetsSection />
        <BlurSection />
        <AudioSection />
        <SQLiteSection />
        <CryptoSection />
      </ScrollView>
    </ThemedView>
  );
}

// ─── 1. expo-widgets ──────────────────────────────────────────────────────────

function WidgetsSection() {
  const [status, setStatus] = useState<string>('idle');

  const scheduleWidget = async () => {
    setStatus('scheduling…');
    try {
      /**
       * SDK 55: expo-widgets (Alpha, iOS)
       *
       * Build iOS Home Screen Widgets and Live Activities using Expo UI
       * components — no Swift, no Xcode required.
       *
       * createWidgetTimeline() schedules a series of widget states
       * (entries) with timestamps. WidgetKit picks up the timeline
       * and updates the home screen widget automatically.
       */
      const entries: WidgetEntry[] = [
        {
          date: new Date(),
          // Content is described as Expo UI component trees — rendered
          // natively by the iOS WidgetKit extension.
          view: {
            type: 'VStack',
            props: { spacing: 4 },
            children: [
              { type: 'Text', props: { children: '🚀 SDK 55', font: 'headline' } },
              { type: 'Text', props: { children: 'Widget via JS!', font: 'caption' } },
            ],
          },
        },
        {
          date: new Date(Date.now() + 60_000), // 1 minute from now
          view: {
            type: 'VStack',
            props: { spacing: 4 },
            children: [
              { type: 'Text', props: { children: '⏱️ 1 min later', font: 'headline' } },
              { type: 'Text', props: { children: 'Timeline updated', font: 'caption' } },
            ],
          },
        },
      ];

      await createWidgetTimeline({
        kind: 'sdk55DemoWidget',
        policy: { type: 'atEnd' }, // reload timeline after last entry
        entries,
      });

      setStatus('Widget timeline scheduled! ✓');
    } catch (e: unknown) {
      // On simulator/non-iOS this will throw — that's expected.
      setStatus(`Error (expected on simulator): ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const startLiveActivity = async () => {
    setStatus('starting live activity…');
    try {
      /**
       * SDK 55: LiveActivityManager — manage Dynamic Island / Lock Screen
       * Live Activities entirely from JavaScript.
       */
      const activity = await LiveActivityManager.startActivity({
        activityType: 'sdk55DemoActivity',
        attributes: { title: 'SDK 55 Demo' },
        contentState: { progress: 0.5, subtitle: 'In progress…' },
      });

      setStatus(`Live Activity started: ${activity.id} ✓`);

      // Update after 3 seconds
      setTimeout(async () => {
        await LiveActivityManager.updateActivity(activity.id, {
          contentState: { progress: 1.0, subtitle: 'Complete!' },
        });
        setStatus('Live Activity updated to 100% ✓');
      }, 3000);
    } catch (e: unknown) {
      setStatus(`Error (expected on simulator): ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader icon="square.grid.2x2.fill" title="expo-widgets" badge="Alpha · iOS" badgeColor="#FA7343" />
      <ThemedText style={styles.sectionNote}>
        SDK 55: Build home screen widgets and Live Activities with Expo UI
        components. No Swift, no Xcode, no native code.
      </ThemedText>

      <View style={styles.buttonGroup}>
        <ActionButton label="Schedule Widget Timeline" onPress={scheduleWidget} color="#FA7343" />
        <ActionButton label="Start Live Activity" onPress={startLiveActivity} color="#FF2D55" />
      </View>

      {status !== 'idle' && (
        <View style={styles.statusBox}>
          <ThemedText style={styles.statusText}>{status}</ThemedText>
        </View>
      )}

      <CodeSnippet
        code={
          "// SDK 55: expo-widgets — schedule a widget timeline from JS\n" +
          "await createWidgetTimeline({\n" +
          "  kind: 'myWidget',\n" +
          "  policy: { type: 'atEnd' },\n" +
          "  entries: [\n" +
          "    { date: new Date(), view: <MyWidgetView /> },\n" +
          "  ],\n" +
          "});\n\n" +
          "// Live Activities\n" +
          "const a = await LiveActivityManager.startActivity({\n" +
          "  activityType: 'myActivity',\n" +
          "  contentState: { progress: 0 },\n" +
          "});"
        }
      />
    </View>
  );
}

// ─── 2. expo-blur — BlurTargetView (Android) ─────────────────────────────────

function BlurSection() {
  const [intensity, setIntensity] = useState(50);

  return (
    <View style={styles.section}>
      <SectionHeader
        icon="circle.grid.cross.fill"
        title="expo-blur — BlurTargetView"
        badge="Android 12+"
        badgeColor="#3DDC84"
      />
      <ThemedText style={styles.sectionNote}>
        SDK 55: BlurTargetView wraps any view and blurs only that subtree using
        Android's RenderNode API — hardware-accelerated, no full-screen hacks.
        (Always available on iOS via the existing BlurView.)
      </ThemedText>

      {/*
       * BlurTargetView — new in SDK 55 for Android
       * On iOS we fall back to the existing BlurView behaviour.
       * intensity ranges from 0 (no blur) to 100 (full blur).
       */}
      <BlurTargetView intensity={intensity} style={styles.blurContainer}>
        <View style={styles.blurContent}>
          <ThemedText style={styles.blurTitle}>Behind the blur</ThemedText>
          <ThemedText style={styles.blurBody}>
            This content is being blurred by the native RenderNode pipeline on Android.
            Drag the slider to change intensity.
          </ThemedText>
          <View style={styles.blurBadges}>
            {['RenderNode', 'Hardware GPU', 'Android 12+'].map((t) => (
              <View key={t} style={styles.blurBadge}>
                <ThemedText style={styles.blurBadgeText}>{t}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </BlurTargetView>

      <View style={styles.sliderRow}>
        <ThemedText style={styles.sliderLabel}>Intensity: {intensity}</ThemedText>
        <View style={styles.sliderButtons}>
          <ActionButton label="-10" onPress={() => setIntensity(Math.max(0, intensity - 10))} color="#3DDC84" />
          <ActionButton label="+10" onPress={() => setIntensity(Math.min(100, intensity + 10))} color="#3DDC84" />
        </View>
      </View>
    </View>
  );
}

// ─── 3. expo-audio ────────────────────────────────────────────────────────────

function AudioSection() {
  /**
   * SDK 55 expo-audio "next" API improvements:
   *  - Lock-screen controls / Now Playing widget
   *  - Background recording
   *  - Playlist / queue management
   *  - Native audio preloading
   *
   * useAudioPlayer is the new hook-based API (replaces the class-based Sound).
   */
  const player = useAudioPlayer(
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  );
  const status = useAudioPlayerStatus(player);

  // SDK 55: Lock-screen controls — just set the nowPlayingInfo option
  useEffect(() => {
    player.setNowPlayingInfo?.({
      title: 'SDK 55 Demo Track',
      artist: 'Expo Team',
      albumTitle: 'Expo SDK 55',
      duration: 100,
    });
  }, [player]);

  // SDK 55: preload — native buffering before playback
  const handlePreload = () => player.preload?.();

  return (
    <View style={styles.section}>
      <SectionHeader icon="waveform" title="expo-audio" badge="SDK 55 enhancements" badgeColor="#007AFF" />
      <ThemedText style={styles.sectionNote}>
        SDK 55: Lock-screen controls, background recording, playlist support, and
        native preloading. The Now Playing widget on the lock screen is controlled
        entirely from JS.
      </ThemedText>

      <View style={styles.playerCard}>
        <ThemedText type="defaultSemiBold">Now Playing</ThemedText>
        <ThemedText style={styles.trackTitle}>SDK 55 Demo Track</ThemedText>
        <ThemedText style={styles.trackMeta}>
          Status: {status.playing ? 'Playing ▶' : 'Paused ⏸'}{' '}
          · {status.currentTime?.toFixed(1) ?? '0.0'}s
        </ThemedText>

        <View style={styles.playerControls}>
          <ActionButton
            label="⏮ Prev"
            onPress={() => Alert.alert('Playlist API', 'player.seekToPreviousItem() — SDK 55 playlist support')}
            color="#007AFF"
          />
          <ActionButton
            label={status.playing ? '⏸ Pause' : '▶ Play'}
            onPress={() => (status.playing ? player.pause() : player.play())}
            color="#007AFF"
          />
          <ActionButton
            label="⏭ Next"
            onPress={() => Alert.alert('Playlist API', 'player.seekToNextItem() — SDK 55 playlist support')}
            color="#007AFF"
          />
        </View>

        <View style={styles.playerSecondary}>
          <ActionButton label="⬇ Preload" onPress={handlePreload} color="#5856D6" />
          <ActionButton
            label="🎙 Background Rec"
            onPress={() => Alert.alert('Background Recording', 'SDK 55: recorder.record({ background: true })')}
            color="#FF3B30"
          />
        </View>
      </View>

      <CodeSnippet
        code={
          "// SDK 55: Lock-screen controls\n" +
          "player.setNowPlayingInfo({\n" +
          "  title: 'My Track',\n" +
          "  artist: 'Artist Name',\n" +
          "  duration: 240,\n" +
          "});\n\n" +
          "// Native preloading\n" +
          "await player.preload();\n\n" +
          "// Playlist navigation\n" +
          "await player.seekToNextItem();\n" +
          "await player.seekToPreviousItem();"
        }
      />
    </View>
  );
}

// ─── 4. expo-sqlite ───────────────────────────────────────────────────────────

function SQLiteSection() {
  const [notes, setNotes] = useState<Array<{ id: number; body: string; created_at: string }>>([]);
  const [insertCount, setInsertCount] = useState(0);

  const fetchNotes = () => {
    /**
     * SDK 55: Tagged template literal API for expo-sqlite.
     *
     * The `sql` tag parses the query at build time to extract column names,
     * giving you a typed result without any manual type assertions.
     *
     *   const results = db.getAllSync(sql`SELECT * FROM notes`);
     *   //    ^-- typed as Array<{ id: number; body: string; created_at: string }>
     *
     * The tag also handles parameterized queries safely:
     *   const row = db.getFirstSync(sql`SELECT * FROM notes WHERE id = ${id}`);
     */
    // Using plain string here for compatibility with the demo build,
    // but annotated to show the SDK 55 API.
    const rows = db.getAllSync<{ id: number; body: string; created_at: string }>(
      'SELECT * FROM notes ORDER BY id DESC LIMIT 5'
    );
    setNotes(rows);
  };

  const insertNote = () => {
    const count = insertCount + 1;
    setInsertCount(count);
    // SDK 55 tagged literal equivalent:
    //   db.runSync(sql`INSERT INTO notes (body, created_at) VALUES (${body}, ${now})`);
    db.runSync(
      'INSERT INTO notes (body, created_at) VALUES (?, ?)',
      [`Note ${count} — written at ${new Date().toLocaleTimeString()}`, new Date().toISOString()]
    );
    fetchNotes();
  };

  useEffect(() => { fetchNotes(); }, []);

  return (
    <View style={styles.section}>
      <SectionHeader icon="cylinder" title="expo-sqlite" badge="SDK 55 DX upgrades" badgeColor="#FF9F0A" />
      <ThemedText style={styles.sectionNote}>
        SDK 55: Tagged template literals give you type-safe SQL queries.
        The new DevTools inspector lets you browse your SQLite database
        directly from the Expo dev tools panel.
      </ThemedText>

      <CodeSnippet
        code={
          "// SDK 55: Tagged template literal API\n" +
          "import { openDatabaseSync, sql } from 'expo-sqlite';\n\n" +
          "const db = openDatabaseSync('myapp.db');\n\n" +
          "// Type-safe — TypeScript infers the shape from the query\n" +
          "const notes = db.getAllSync(sql`\n" +
          "  SELECT id, body, created_at FROM notes\n" +
          "`);\n" +
          "// notes: Array<{ id: number; body: string; created_at: string }>\n\n" +
          "// Parameterized — no SQL injection risk\n" +
          "db.runSync(sql`\n" +
          "  INSERT INTO notes (body) VALUES (${userInput})\n` +\n" +
          ");"
        }
      />

      <View style={styles.dbControls}>
        <ActionButton label="+ Insert Note" onPress={insertNote} color="#FF9F0A" />
        <ActionButton label="↻ Refresh" onPress={fetchNotes} color="#FF9F0A" />
      </View>

      <View style={styles.dbTable}>
        <View style={styles.dbRow}>
          <ThemedText style={[styles.dbCell, styles.dbHeader]}>ID</ThemedText>
          <ThemedText style={[styles.dbCellWide, styles.dbHeader]}>Body</ThemedText>
          <ThemedText style={[styles.dbCell, styles.dbHeader]}>Created</ThemedText>
        </View>
        {notes.length === 0 && (
          <ThemedText style={styles.dbEmpty}>No notes yet — insert some!</ThemedText>
        )}
        {notes.map((note) => (
          <View key={note.id} style={styles.dbRow}>
            <ThemedText style={styles.dbCell}>{note.id}</ThemedText>
            <ThemedText style={styles.dbCellWide} numberOfLines={1}>{note.body}</ThemedText>
            <ThemedText style={styles.dbCell}>
              {new Date(note.created_at).toLocaleTimeString()}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 5. expo-crypto — AES-GCM ────────────────────────────────────────────────

function CryptoSection() {
  const [plaintext, setPlaintext] = useState('Hello, SDK 55!');
  const [encrypted, setEncrypted] = useState<string>('');
  const [decrypted, setDecrypted] = useState<string>('');
  const keyRef = useRef<CryptoKey | null>(null);
  const ivRef = useRef<Uint8Array | null>(null);

  const encrypt = async () => {
    /**
     * SDK 55: expo-crypto now exposes AES-GCM encrypt/decrypt.
     * Uses the Web Crypto API surface — the same API you know from browsers —
     * but backed by native crypto on the device.
     */
    const key = await Crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    keyRef.current = key;

    const iv = Crypto.getRandomValues(new Uint8Array(12));
    ivRef.current = iv;

    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await Crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const base64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    setEncrypted(base64);
    setDecrypted('');
  };

  const decrypt = async () => {
    if (!keyRef.current || !ivRef.current || !encrypted) return;

    const cipherBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const decryptedBuffer = await Crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivRef.current },
      keyRef.current,
      cipherBytes
    );

    setDecrypted(new TextDecoder().decode(decryptedBuffer));
  };

  return (
    <View style={styles.section}>
      <SectionHeader icon="lock.fill" title="expo-crypto — AES-GCM" badge="New in SDK 55" badgeColor="#5856D6" />
      <ThemedText style={styles.sectionNote}>
        SDK 55: AES-GCM encrypt/decrypt via the familiar Web Crypto API,
        backed by native crypto on device.
      </ThemedText>

      <View style={styles.cryptoCard}>
        <ThemedText style={styles.cryptoLabel}>Plaintext</ThemedText>
        <ThemedText style={styles.cryptoValue}>{plaintext}</ThemedText>

        {encrypted ? (
          <>
            <ThemedText style={styles.cryptoLabel}>Ciphertext (base64, truncated)</ThemedText>
            <ThemedText style={styles.cryptoValue} numberOfLines={2}>
              {encrypted}
            </ThemedText>
          </>
        ) : null}

        {decrypted ? (
          <>
            <ThemedText style={styles.cryptoLabel}>Decrypted</ThemedText>
            <ThemedText style={[styles.cryptoValue, styles.cryptoSuccess]}>{decrypted}</ThemedText>
          </>
        ) : null}

        <View style={styles.buttonGroup}>
          <ActionButton label="🔒 Encrypt" onPress={encrypt} color="#5856D6" />
          <ActionButton
            label="🔓 Decrypt"
            onPress={decrypt}
            color={encrypted ? '#5856D6' : '#8E8E93'}
          />
        </View>
      </View>

      <CodeSnippet
        code={
          "// SDK 55: AES-GCM via expo-crypto\n" +
          "import * as Crypto from 'expo-crypto';\n\n" +
          "const key = await Crypto.subtle.generateKey(\n" +
          "  { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']\n" +
          ");\n" +
          "const iv = Crypto.getRandomValues(new Uint8Array(12));\n\n" +
          "const ciphertext = await Crypto.subtle.encrypt(\n" +
          "  { name: 'AES-GCM', iv },\n" +
          "  key,\n" +
          "  new TextEncoder().encode(plaintext)\n" +
          ");"
        }
      />
    </View>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function ActionButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: color + (pressed ? 'CC' : '22'), borderColor: color + '44' },
      ]}
      onPress={onPress}
    >
      <ThemedText style={[styles.actionBtnText, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

function CodeSnippet({ code }: { code: string }) {
  return (
    <View style={styles.codeBox}>
      <ThemedText style={styles.codeText}>{code}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 60, gap: 24 },
  pageHeader: { gap: 4, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, opacity: 0.55 },

  section: { gap: 12 },
  sectionNote: { fontSize: 13, opacity: 0.65, lineHeight: 18 },

  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  statusBox: {
    backgroundColor: 'rgba(120,120,128,0.1)',
    borderRadius: 8,
    padding: 10,
  },
  statusText: { fontSize: 12, opacity: 0.7 },

  codeBox: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: 12,
  },
  codeText: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.8,
  },

  // Blur section
  blurContainer: { borderRadius: 14, overflow: 'hidden' },
  blurContent: { padding: 20, gap: 10, backgroundColor: 'rgba(100,100,200,0.3)' },
  blurTitle: { fontSize: 18, fontWeight: '700' },
  blurBody: { fontSize: 13, opacity: 0.8, lineHeight: 18 },
  blurBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blurBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  blurBadgeText: { fontSize: 11, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sliderLabel: { fontSize: 13, opacity: 0.7 },
  sliderButtons: { flexDirection: 'row', gap: 8 },

  // Audio section
  playerCard: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  trackTitle: { fontSize: 16, fontWeight: '600' },
  trackMeta: { fontSize: 12, opacity: 0.6, fontVariant: ['tabular-nums'] },
  playerControls: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  playerSecondary: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  // SQLite section
  dbControls: { flexDirection: 'row', gap: 8 },
  dbTable: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  dbRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(120,120,128,0.2)', padding: 8 },
  dbCell: { width: 36, fontSize: 11, opacity: 0.7 },
  dbCellWide: { flex: 1, fontSize: 11, opacity: 0.7 },
  dbHeader: { fontWeight: '700', opacity: 1 },
  dbEmpty: { padding: 12, fontSize: 12, opacity: 0.5, textAlign: 'center' },

  // Crypto section
  cryptoCard: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cryptoLabel: { fontSize: 11, fontWeight: '600', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  cryptoValue: { fontSize: 13, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  cryptoSuccess: { color: '#30D158' },

  // Action buttons
  actionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});
