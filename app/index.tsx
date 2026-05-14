import { View, Text, StyleSheet } from 'react-native';

export default function ProfilePicker() {
  return (
    <View style={styles.container}>
      <Text>Profile Picker (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
