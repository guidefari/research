import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Contacts from 'expo-contacts';

import ContactDetail from './components/ContactDetail';
import PhonePickerModal from './components/PhonePickerModal';

// Flow:
//   Home screen → "Pick a Contact" button
//     → native OS picker (presentContactPickerAsync)
//     → if multiple numbers: PhonePickerModal to choose one
//     → ContactDetail screen
//
// Permission notes:
//   iOS  — presentContactPickerAsync needs NO permission (OS handles it)
//   Android — READ_CONTACTS permission required before calling the picker

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'detail'
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [pendingContact, setPendingContact] = useState(null);
  const [error, setError] = useState(null);

  async function handlePickContact() {
    setError(null);

    // Android requires the permission grant before the picker opens.
    // On iOS this block is a no-op — permission is not required.
    if (Platform.OS === 'android') {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Contacts permission is required on Android.');
        return;
      }
    }

    setLoading(true);
    try {
      // Opens the native OS contact picker (People app on Android,
      // Contacts.app on iOS). Returns null if the user cancels.
      const picked = await Contacts.presentContactPickerAsync();

      if (!picked) {
        // User cancelled — do nothing
        return;
      }

      // The picker only returns a subset of fields.
      // Fetch the full contact record so we have phones, emails, etc.
      const full = await Contacts.getContactByIdAsync(picked.id, {
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Image,
        ],
      });

      const contact = full ?? picked; // fall back to picker result if fetch fails
      const phones = contact.phoneNumbers ?? [];

      if (phones.length > 1) {
        setPendingContact(contact);
        setPhoneModalVisible(true);
      } else {
        setSelectedContact(contact);
        setScreen('detail');
      }
    } catch (e) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handlePhonePicked(phone) {
    setSelectedContact({ ...pendingContact, chosenPhone: phone });
    setPendingContact(null);
    setPhoneModalVisible(false);
    setScreen('detail');
  }

  function handleBack() {
    setSelectedContact(null);
    setScreen('home');
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <View style={styles.center}>
          <Text style={styles.title}>Contacts PoC</Text>
          <Text style={styles.subtitle}>
            Uses the native OS picker on iOS and Android
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePickContact}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pick a Contact</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}

      {screen === 'detail' && selectedContact && (
        <ContactDetail contact={selectedContact} onBack={handleBack} />
      )}

      <PhonePickerModal
        visible={phoneModalVisible}
        contact={pendingContact}
        onPick={handlePhonePicked}
        onCancel={() => {
          setPhoneModalVisible(false);
          setPendingContact(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  error: {
    marginTop: 20,
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 14,
  },
});
