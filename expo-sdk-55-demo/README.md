# Expo SDK 55 Demo

A hands-on demo app illustrating every major new feature in **Expo SDK 55** — the release that makes React Native apps indistinguishable from apps built natively in Swift or Kotlin.

## Running the app

```bash
cd expo-sdk-55-demo
npm install
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with the Expo Go app.

> **Note:** Expo Go ships with SDK 55. Some features (expo-widgets, Live Activities) require a custom development build via `npx expo run:ios`.

---

## What's demonstrated

### Tab 1 — Overview
A summary card for every SDK 55 feature covered in the demo.

### Tab 2 — Expo UI (`@expo/ui`)

**SwiftUI (iOS)**

| Component | What's new in SDK 55 |
|-----------|----------------------|
| `DatePicker` | Renamed from `DateTimePicker`; now supports **date ranges** |
| `Toggle` | Renamed from `Switch` to match SwiftUI naming exactly |
| `ProgressView` | Replaces `CircularProgress` + `LinearProgress` |
| `ConfirmationDialog` | **New** — maps to SwiftUI's `confirmationDialog` modifier |
| `Text` | Now renders **Markdown** natively via `AttributedString` |

**Jetpack Compose (Android) — promoted from Alpha → Beta**

| Component | What's new in SDK 55 |
|-----------|----------------------|
| `Card` | **New** Material 3 card (elevated / filled / outlined) |
| `FilterChip` | **New** Material 3 filter chip |
| `RadioButton` | **New** Material 3 radio button |
| `LazyColumn` | **New** — only renders visible items |
| `ListItem` | **New** Material 3 list item with leading/trailing slots |
| `ModalBottomSheet` | **New** native bottom sheet |
| `Host.colorScheme` | **New** — dynamic Material 3 theming from system wallpaper |

### Tab 3 — Expo Router v55

| Feature | Details |
|---------|---------|
| **Apple Zoom Transition** | `animation: 'zoom'` — shared-element zoom driven by the native iOS zoom gesture (pinch to go back). Tap any card to see it. |
| **Stack.Toolbar** | `<Stack.Toolbar>` renders a native `UIToolbar` on iOS with buttons, menus, and flexible spaces. Visible at the bottom of the Router tab on iOS. |
| **Colors API** | `import { Colors } from 'expo-router/ui'` — dynamic Material 3 (Android) and adaptive UIColor (iOS) tokens. |
| **SplitView** _(experimental)_ | `<SplitView>` for native `UISplitViewController` on iPad/Mac. |
| **Form sheet footers** _(experimental)_ | `sheetFooter` option on `presentation: 'formSheet'` screens. |

### Tab 4 — Widgets & More

| Feature | Details |
|---------|---------|
| **expo-widgets** _(Alpha, iOS)_ | Schedule home screen widget timelines and manage Live Activities from JavaScript — no Swift or Xcode required. |
| **expo-blur** — `BlurTargetView` | Hardware-accelerated blur of a specific view subtree on Android 12+ using the `RenderNode` API. |
| **expo-audio** | Lock-screen controls (`setNowPlayingInfo`), playlist navigation (`seekToNextItem`), background recording, and native preloading. |
| **expo-sqlite** | Tagged template literal API for type-safe SQL queries + new DevTools inspector panel. |
| **expo-crypto** — AES-GCM | `Crypto.subtle.encrypt/decrypt` with AES-GCM, backed by native crypto. |

---

## Architecture notes

- **New Architecture is mandatory** in SDK 55 — all apps run on the New Architecture (JSI + Fabric). The Legacy Architecture is gone.
- React Native **0.83** + React **19.2**
- **Hermes v1** available as opt-in for improved performance and modern JS (requires building from source)
- EAS Update bytecode diffing gives **~75% smaller update downloads** (opt-in SDK 55, default SDK 56)

---

## Key SDK 55 files

```
app/
├── _layout.tsx              # Root Stack — zoom transition configured here
├── (tabs)/
│   ├── _layout.tsx          # Tab bar with SF Symbol icons + HapticTab
│   ├── index.tsx            # Overview — feature summary cards
│   ├── expo-ui.tsx          # @expo/ui: SwiftUI + Jetpack Compose demos
│   ├── router.tsx           # Router v55: Zoom, Toolbar, Colors API
│   └── widgets.tsx          # expo-widgets, expo-blur, expo-audio, expo-sqlite, expo-crypto
└── item/[id].tsx            # Zoom transition destination screen
```
