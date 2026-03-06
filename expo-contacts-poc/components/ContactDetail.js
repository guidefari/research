import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ContactDetail({ contact, onBack }) {
  const {
    name,
    phoneNumbers = [],
    emails = [],
    company,
    jobTitle,
    chosenPhone, // set when user picked from multi-number modal
  } = contact;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name ?? '(No name)'}</Text>
        {(company || jobTitle) && (
          <Text style={styles.subtitle}>
            {[jobTitle, company].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      {/* Chosen phone highlight */}
      {chosenPhone && (
        <Section title="Selected number">
          <InfoRow
            label={chosenPhone.label ?? 'phone'}
            value={chosenPhone.number}
            highlighted
          />
        </Section>
      )}

      {/* All phone numbers */}
      {phoneNumbers.length > 0 && (
        <Section title={`Phone numbers (${phoneNumbers.length})`}>
          {phoneNumbers.map((p, i) => (
            <InfoRow
              key={i}
              label={p.label ?? 'phone'}
              value={p.number}
              highlighted={chosenPhone && p.number === chosenPhone.number}
            />
          ))}
        </Section>
      )}

      {/* Emails */}
      {emails.length > 0 && (
        <Section title="Email">
          {emails.map((e, i) => (
            <InfoRow key={i} label={e.label ?? 'email'} value={e.email} />
          ))}
        </Section>
      )}

      {/* Raw dump — handy for a PoC */}
      <Section title="Raw contact object">
        <Text style={styles.raw}>{JSON.stringify(contact, null, 2)}</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, highlighted }) {
  return (
    <View style={[styles.row, highlighted && styles.rowHighlighted]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlighted && styles.valueHighlighted]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#007AFF', fontSize: 17 },

  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 15, color: '#8e8e93', marginTop: 4 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  rowHighlighted: { backgroundColor: '#e8f4ff' },
  label: { fontSize: 15, color: '#8e8e93', textTransform: 'capitalize' },
  value: { fontSize: 15, color: '#000', flexShrink: 1, textAlign: 'right' },
  valueHighlighted: { color: '#007AFF', fontWeight: '600' },

  raw: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#3a3a3a',
    padding: 12,
  },
});
