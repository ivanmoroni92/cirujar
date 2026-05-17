import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginUser } from '@/_services/api';
import { setStoredSession } from '@/_services/authToken';

const PAD = 16;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onLogin = useCallback(async () => {
    const e = email.trim();
    if (!e || !contraseña) {
      Alert.alert('Faltan datos', 'Ingresá email y contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      const { token, user } = await loginUser(e, contraseña);
      await setStoredSession(token, user._id);
      router.replace('/(tabs)/home' as Href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [contraseña, email, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Volver">
              <Ionicons name="chevron-back" size={26} color="#111" />
            </Pressable>
            <Text style={styles.headerTitle}>Iniciar sesión</Text>
            <View style={styles.headerSide} />
          </View>

          <View style={styles.body}>
            <Text style={styles.hint}>Ingresá con tu cuenta para publicar o editar.</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={contraseña}
              onChangeText={setContraseña}
              secureTextEntry
              placeholder="Contraseña"
            />

            <Pressable
              onPress={onLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || submitting) && styles.primaryBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ingresar">
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Ingresar</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push('/register' as Href)}
              style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.linkText}>¿No tenés cuenta? Registrate</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f6f6' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  body: { padding: PAD, paddingTop: 24 },
  hint: { fontSize: 14, color: '#555', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center', padding: 8 },
  linkText: { fontSize: 15, color: '#0a7ea4', fontWeight: '600' },
  pressed: { opacity: 0.75 },
});
