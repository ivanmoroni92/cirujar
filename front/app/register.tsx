import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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

const PAD = 24;
const MIN_PASSWORD = 6;
const ALIAS_EMPTY = 'Completá este campo';
const SOFT_RED = '#d4535f';
const BORDER_BLUE = '#c7dbff';
const INPUT_ICON = '#5788d5';

export default function RegisterScreen() {
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, logoAnim]);

  const logoStyle = useMemo(
    () => ({
      opacity: logoAnim,
      transform: [
        {
          translateY: logoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 0],
          }),
        },
      ],
    }),
    [logoAnim]
  );

  const cardStyle = useMemo(
    () => ({
      opacity: cardAnim,
      transform: [
        {
          translateY: cardAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
      ],
    }),
    [cardAnim]
  );

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

  const animateButtonTap = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonPulse, {
        toValue: 0.98,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulse, {
        toValue: 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonPulse]);

  const onSubmit = useCallback(async () => {
    setAliasError(null);
    setEmailError(null);
    setPasswordError(null);
    setSubmitError(null);

    if (!runClientValidation()) {
      return;
    }

    animateButtonTap();
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
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [alias, animateButtonTap, contraseña, email, router, runClientValidation]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.bgBlobTop} />
        <View style={styles.bgBlobBottom} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.logoWrap, logoStyle]}>
              <Text style={styles.logoText}>
                <Text style={styles.logoDark}>Ciruj</Text>
                <Text style={styles.logoBlue}>AR</Text>
              </Text>
            </Animated.View>

            <Animated.View style={[styles.card, cardStyle]}>
              <View style={styles.titleRow}>
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Volver">
                  <Ionicons name="chevron-back" size={22} color="#233043" />
                </Pressable>
                <View style={styles.titleCopy}>
                  <Text style={styles.title}>Crear Cuenta</Text>
                  <Text style={styles.subtitle}>Unite para ver y publicar objetos</Text>
                </View>
              </View>

              <Text style={styles.label}>Alias</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={INPUT_ICON} />
                <TextInput
                  style={styles.input}
                  value={alias}
                  onChangeText={(t) => {
                    setAlias(t);
                    if (aliasError) setAliasError(null);
                    if (submitError) setSubmitError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Tu nombre en la app"
                  placeholderTextColor="#8ca2c0"
                />
              </View>
              {aliasError ? <Text style={styles.fieldError}>{aliasError}</Text> : null}

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={INPUT_ICON} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError(null);
                    if (submitError) setSubmitError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#8ca2c0"
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={INPUT_ICON} />
                <TextInput
                  style={styles.input}
                  value={contraseña}
                  onChangeText={(t) => {
                    setContraseña(t);
                    if (passwordError) setPasswordError(null);
                    if (submitError) setSubmitError(null);
                  }}
                  secureTextEntry
                  placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                  placeholderTextColor="#8ca2c0"
                />
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
              {submitError ? <Text style={styles.fieldError}>{submitError}</Text> : null}

              <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                <Pressable
                  onPress={onSubmit}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (pressed || submitting) && styles.primaryBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Registrarse">
                  <LinearGradient
                    colors={['#1d63d8', '#2f89ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Crear Cuenta</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Pressable
                onPress={() => router.push('/login' as Href)}
                style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
                accessibilityRole="button">
                <Text style={styles.linkText}>¿Ya tenés cuenta? Iniciar sesión</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fbff' },
  flex: { flex: 1 },
  bgBlobTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#e8f1ff',
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -110,
    left: -100,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#eef5ff',
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: PAD,
    paddingTop: 52,
    paddingBottom: 34,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  logoDark: {
    color: '#1f252f',
  },
  logoBlue: {
    color: '#2f89ff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#e9f0fc',
    shadowColor: '#245aa8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleCopy: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#192334',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#62708a',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f3c50',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fbfdff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_BLUE,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1d2a3d',
    paddingVertical: 0,
  },
  fieldError: {
    fontSize: 13,
    color: SOFT_RED,
    marginBottom: 12,
    marginTop: 2,
  },
  primaryBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center', padding: 8 },
  linkText: { fontSize: 15, color: '#2f74df', fontWeight: '600' },
  pressed: { opacity: 0.75 },
});
