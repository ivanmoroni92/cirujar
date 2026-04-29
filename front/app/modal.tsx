import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Modal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <Link href="/" style={styles.link}>
        Dismiss
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    fontSize: 16,
  },
});
