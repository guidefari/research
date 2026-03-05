import { useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import ContactList from './components/ContactList';
import ContactDetail from './components/ContactDetail';
import PhonePickerModal from './components/PhonePickerModal';

// App has three states:
//   'list'   — browsing/searching contacts
//   'detail' — viewing a selected contact
// When a contact with multiple phone numbers is picked, PhonePickerModal
// interrupts before transitioning to 'detail'.

export default function App() {
  const [screen, setScreen] = useState('list');
  const [selectedContact, setSelectedContact] = useState(null);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [pendingContact, setPendingContact] = useState(null);

  function handleContactPress(contact) {
    const phones = contact.phoneNumbers ?? [];

    if (phones.length > 1) {
      // Let the user pick which number before showing detail
      setPendingContact(contact);
      setPhoneModalVisible(true);
    } else {
      // Zero or one number — go straight to detail
      setSelectedContact(contact);
      setScreen('detail');
    }
  }

  function handlePhonePicked(phone) {
    // Attach the chosen number as `chosenPhone` so ContactDetail can highlight it
    setSelectedContact({ ...pendingContact, chosenPhone: phone });
    setPendingContact(null);
    setPhoneModalVisible(false);
    setScreen('detail');
  }

  function handleBack() {
    setSelectedContact(null);
    setScreen('list');
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {screen === 'list' && (
        <ContactList onContactPress={handleContactPress} />
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
});
