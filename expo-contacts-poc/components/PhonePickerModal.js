import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';

// Shown when a contact has more than one phone number.
// The user picks the number they want to use before the detail screen opens.

export default function PhonePickerModal({ visible, contact, onPick, onCancel }) {
  if (!contact) return null;

  const phones = contact.phoneNumbers ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      {/* Dim backdrop — tap it to cancel */}
      <Pressable style={styles.backdrop} onPress={onCancel} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>{contact.name ?? 'Contact'}</Text>
        <Text style={styles.subtitle}>This contact has multiple numbers. Which one do you want to use?</Text>

        <FlatList
          data={phones}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.option}
              onPress={() => onPick(item)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.optionNumber}>{item.number}</Text>
                {item.label && (
                  <Text style={styles.optionLabel}>{item.label}</Text>
                )}
              </View>
              <Text style={styles.optionChevron}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d1d6',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionNumber: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  optionLabel: { fontSize: 13, color: '#8e8e93', marginTop: 2, textTransform: 'capitalize' },
  optionChevron: { fontSize: 22, color: '#c7c7cc' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e5ea' },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
});
