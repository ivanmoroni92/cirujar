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

import { loginUser } from '@/_services/api';
import { setStoredToken, setStoredUser } from '@/_services/authToken';

const PAD = 24;
const SOFT_RED = '#d4535f';
const BORDER_BLUE = '#c7dbff';
const INPUT_ICON = '#5788d5';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
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

  const validate = useCallback(() => {
    let ok = true;
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError('Ingresá tu email');
      ok = false;
    } else {
      setEmailError(null);
    }

    if (!contraseña) {
      setPasswordError('Ingresá tu contraseña');
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  }, [contraseña, email]);

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

  const onLogin = useCallback(async () => {
    setSubmitError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!validate()) {
      return;
    }

    const e = email.trim();
    animateButtonTap();

    setSubmitting(true);
    try {
      const response = await loginUser(e, contraseña);
      console.log('[login] Response from backend:', response);
      await setStoredToken(response.token);
      console.log('[login] Token stored');
      await setStoredUser(response.user);
      console.log('[login] User stored, redirecting to home');
      router.replace('/(tabs)/home' as Href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [animateButtonTap, contraseña, email, router, validate]);

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
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>Accedé para ver y gestionar publicaciones</Text>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={INPUT_ICON} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError(null);
                    if (submitError) setSubmitError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="tu@email.com"
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
                  onChangeText={(value) => {
                    setContraseña(value);
                    if (passwordError) setPasswordError(null);
                    if (submitError) setSubmitError(null);
                  }}
                  secureTextEntry
                  placeholder="Tu contraseña"
                  placeholderTextColor="#8ca2c0"
                />
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
              {submitError ? <Text style={styles.fieldError}>{submitError}</Text> : null}

              <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                <Pressable
                  onPress={onLogin}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (pressed || submitting) && styles.primaryBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Iniciar Sesión">
                  <LinearGradient
                    colors={['#1d63d8', '#2f89ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Pressable
                onPress={() => router.push('/register' as Href)}
                style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Ir a registro">
                <Text style={styles.linkText}>Registrate</Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: PAD,
    paddingTop: 52,
    paddingBottom: 34,
  },
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
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#192334',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
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
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: '#142036',
  },
  fieldError: {
    fontSize: 13,
    color: SOFT_RED,
    marginTop: 6,
    marginBottom: 14,
  },
  primaryBtn: {
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  linkWrap: { marginTop: 18, alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 15, color: '#2a6fd6', fontWeight: '600' },
  pressed: { opacity: 0.75 },
});
