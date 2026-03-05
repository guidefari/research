import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Contacts from 'expo-contacts';

export default function ContactList({ onContactPress }) {
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'denied' | 'ready'

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setStatus('loading');

    const { status: permStatus } = await Contacts.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      setStatus('denied');
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
        Contacts.Fields.Company,
        Contacts.Fields.JobTitle,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    setContacts(data);
    setFiltered(data);
    setStatus('ready');
  }

  function handleSearch(text) {
    setQuery(text);
    if (!text.trim()) {
      setFiltered(contacts);
      return;
    }
    const lower = text.toLowerCase();
    setFiltered(
      contacts.filter((c) =>
        (c.name ?? '').toLowerCase().includes(lower)
      )
    );
  }

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.hint}>Loading contacts…</Text>
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>
          Contacts permission denied. Please enable it in Settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contacts</Text>
      <TextInput
        style={styles.search}
        placeholder="Search contacts…"
        value={query}
        onChangeText={handleSearch}
        clearButtonMode="while-editing"
        autoCorrect={false}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactRow contact={item} onPress={() => onContactPress(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts found.</Text>
        }
      />
    </View>
  );
}

function ContactRow({ contact, onPress }) {
  const phoneCount = contact.phoneNumbers?.length ?? 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(contact.name ?? '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{contact.name ?? '(No name)'}</Text>
        {phoneCount > 0 && (
          <Text style={styles.sub}>
            {phoneCount === 1
              ? contact.phoneNumbers[0].number
              : `${phoneCount} phone numbers`}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: '#000',
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e5e5ea',
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: '#000' },
  sub: { fontSize: 14, color: '#8e8e93', marginTop: 2 },
  chevron: { fontSize: 22, color: '#c7c7cc' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 72 },
  empty: { textAlign: 'center', color: '#8e8e93', marginTop: 32, fontSize: 15 },
  hint: { marginTop: 12, color: '#8e8e93', textAlign: 'center' },
});
