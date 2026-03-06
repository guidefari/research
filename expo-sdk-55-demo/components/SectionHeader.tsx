/**
 * Shared section header used across all demo screens.
 * Shows an icon, title, and a platform/status badge.
 */
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

type Props = {
  icon: string;     // SF Symbol name (used via IconSymbol or as text fallback)
  title: string;
  badge: string;
  badgeColor: string;
};

export function SectionHeader({ title, badge, badgeColor }: Props) {
  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '55' }]}>
        <ThemedText style={[styles.badgeText, { color: badgeColor }]}>{badge}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 17,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
