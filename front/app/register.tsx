import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  REGISTER_DUPLICATE_EMAIL_ERROR,
  REGISTER_EMAIL_ERROR,
  REGISTER_PASSWORD_ERROR,
  isValidEmailFormat,
  registerUser,
} from '@/_services/api';

const PAD = 16;
const MIN_PASSWORD = 6;
const ALIAS_EMPTY = 'Completá este campo';

export default function RegisterScreen() {
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runClientValidation = useCallback(() => {
    let ok = true;
    const a = alias.trim();
    const e = email.trim();
    const p = contraseña;

    if (!a) {
      setAliasError(ALIAS_EMPTY);
      ok = false;
    } else {
      setAliasError(null);
    }

    if (!isValidEmailFormat(e)) {
      setEmailError(REGISTER_EMAIL_ERROR);
      ok = false;
    } else {
      setEmailError(null);
    }

    if (p.length < MIN_PASSWORD) {
      setPasswordError(REGISTER_PASSWORD_ERROR);
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  }, [alias, email, contraseña]);

  const onSubmit = useCallback(async () => {
    setAliasError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!runClientValidation()) {
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        alias: alias.trim(),
        email: email.trim(),
        contraseña,
      });
      router.replace('/login' as Href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === REGISTER_DUPLICATE_EMAIL_ERROR) {
        setEmailError(REGISTER_DUPLICATE_EMAIL_ERROR);
      } else if (msg === REGISTER_EMAIL_ERROR) {
        setEmailError(REGISTER_EMAIL_ERROR);
      } else if (msg === REGISTER_PASSWORD_ERROR) {
        setPasswordError(REGISTER_PASSWORD_ERROR);
      } else if (msg) {
        setEmailError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [alias, contraseña, email, router, runClientValidation]);

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
            <Text style={styles.headerTitle}>Crear cuenta</Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.hint}>Registrate para ver y publicar objetos.</Text>

            <Text style={styles.label}>Alias</Text>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={(t) => {
                setAlias(t);
                if (aliasError) setAliasError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Tu nombre en la app"
            />
            {aliasError ? <Text style={styles.fieldError}>{aliasError}</Text> : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={contraseña}
              onChangeText={(t) => {
                setContraseña(t);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || submitting) && styles.primaryBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Registrarse">
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Registrarse</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push('/login' as Href)}
              style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.linkText}>¿Ya tenés cuenta? Iniciar sesión</Text>
            </Pressable>
          </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: PAD, paddingBottom: 40 },
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
    marginBottom: 4,
  },
  fieldError: {
    fontSize: 13,
    color: '#b00020',
    marginBottom: 12,
    marginTop: 2,
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center', padding: 8 },
  linkText: { fontSize: 15, color: '#0a7ea4', fontWeight: '600' },
  pressed: { opacity: 0.75 },
});
