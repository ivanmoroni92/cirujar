import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    DeviceEventEmitter,
    Easing,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadImage, updateUser, type ApiUser } from '@/_services/api';
import { clearAuth, getStoredToken, getStoredUser, setStoredUser } from '@/_services/authToken';

const PAD = 24;
const AVATAR_SIZE = 120;
const AVATAR_ICON_SIZE = 56;
const SOFT_BLUE = '#2a6fd6';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const avatarAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            let active = true;
            (async () => {
                try {
                    // Try to get user from local storage first
                    let storedUser = await getStoredUser();

                    // If not in local storage, try to fetch from backend
                    if (!storedUser) {
                        const token = await getStoredToken();
                        if (!token) {
                            // No token, redirect to login
                            router.replace('/login' as Href);
                            return;
                        }

                        // Try to get from backend - need user ID from token or other method
                        // For now, just show error and redirect
                        setError('Sesión expirada. Por favor inicia sesión de nuevo.');
                        await clearAuth();
                        if (active) {
                            router.replace('/login' as Href);
                        }
                        return;
                    }

                    if (!active) return;

                    setUser(storedUser);
                    setError(null);
                    setLoading(false);

                    // Animate in
                    Animated.parallel([
                        Animated.timing(avatarAnim, {
                            toValue: 1,
                            duration: 400,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                        Animated.timing(contentAnim, {
                            toValue: 1,
                            duration: 500,
                            delay: 100,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                    ]).start();
                } catch (err) {
                    if (!active) return;
                    const msg = err instanceof Error ? err.message : 'Error al cargar perfil';
                    setError(msg);
                    setLoading(false);
                }
            })();

            return () => {
                active = false;
            };
        }, [avatarAnim, contentAnim, router])
    );

    const avatarStyle = useMemo(
        () => ({
            opacity: avatarAnim,
            transform: [
                {
                    scale: avatarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                    }),
                },
            ],
        }),
        [avatarAnim]
    );

    const contentStyle = useMemo(
        () => ({
            opacity: contentAnim,
            transform: [
                {
                    translateY: contentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                    }),
                },
            ],
        }),
        [contentAnim]
    );

    const handleLogout = useCallback(async () => {
        await clearAuth();
        DeviceEventEmitter.emit('cirujar:auth-user-updated');
        router.replace('/login' as Href);
    }, [router]);

    const handleAvatarPress = useCallback(async () => {
        if (!user) return;

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]?.uri) return;

        // Usar fileName y mimeType del asset directamente para evitar problemas
        // con URIs content:// en Android que no se parsean bien desde la ruta
        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = asset.fileName ?? null;
        const mimeType = asset.mimeType ?? null;
        const webFile = 'file' in asset ? asset.file : undefined;

        try {
            setUploading(true);
            const url = await uploadImage(uri, fileName, mimeType, webFile);
            console.log('[avatar] URL subida:', url);

            // Actualizar backend
            const updated = await updateUser(user._id, { imagenPerfil: url });
            console.log('[avatar] Usuario actualizado por backend:', updated);

            // Usar la URL confirmada para garantizar que el estado local refleje el cambio
            // aunque el backend no devuelva imagenPerfil en la respuesta
            const finalUser: ApiUser = { ...user, ...updated, imagenPerfil: url };
            await setStoredUser(finalUser);
            setUser(finalUser);
            DeviceEventEmitter.emit('cirujar:auth-user-updated');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al subir la foto';
            // Mostrar como alerta en lugar de setError para no ocultar el perfil
            Alert.alert('Error al subir foto', msg);
        } finally {
            setUploading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.loaderWrap}>
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !user) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.loaderWrap}>
                    <Text style={styles.errorText}>{error || 'Error al cargar perfil'}</Text>
                    <Pressable
                        onPress={async () => {
                            await clearAuth();
                            router.replace('/login' as Href);
                        }}
                        style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
                        <Text style={styles.retryBtnText}>Ir a Login</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
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
                        <Animated.View style={[styles.avatarSection, avatarStyle]}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    {user.imagenPerfil ? (
                                        <Image
                                            key={user.imagenPerfil}
                                            source={{ uri: user.imagenPerfil }}
                                            style={styles.avatarImage}
                                            onError={(e) => console.log('[avatar] Error cargando imagen:', e.nativeEvent)}
                                        />
                                    ) : (
                                        <Ionicons name="person" size={AVATAR_ICON_SIZE} color={SOFT_BLUE} />
                                    )}
                                </View>
                                <Pressable
                                    style={[styles.editAvatarBtn, uploading && styles.editAvatarBtnDisabled]}
                                    onPress={handleAvatarPress}
                                    disabled={uploading}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="camera" size={20} color="#fff" />
                                    )}
                                </Pressable>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.contentSection, contentStyle]}>
                            <View style={styles.usernameRow}>
                                <Text style={styles.username}>@{user.alias}</Text>
                                <Pressable style={styles.editUsernameBtn}>
                                    <Ionicons name="pencil" size={16} color={SOFT_BLUE} />
                                </Pressable>
                            </View>

                            <Text style={styles.email}>{user.email}</Text>

                            <View style={styles.infoCard}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Publicaciones</Text>
                                    <Text style={styles.infoValue}>0</Text>
                                </View>
                                <View style={styles.infoDivider} />
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Miembro desde</Text>
                                    <Text style={styles.infoValue}>
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString('es-AR', {
                                                year: 'numeric',
                                                month: 'short',
                                            })
                                            : '—'}
                                    </Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={handleLogout}
                                style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                                accessibilityRole="button"
                                accessibilityLabel="Cerrar sesión">
                                <View style={styles.logoutBtnInner}>
                                    <Ionicons name="log-out-outline" size={20} color={SOFT_BLUE} />
                                    <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
                                </View>
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
        paddingTop: 40,
        paddingBottom: 120, // espacio para la barra flotante (76px altura + 18px bottom + margen)
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
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: PAD,
    },
    loadingText: {
        fontSize: 16,
        color: '#62708a',
    },
    errorText: {
        fontSize: 14,
        color: '#d4535f',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: SOFT_BLUE,
        borderRadius: 10,
    },
    retryBtnPressed: {
        opacity: 0.8,
    },
    retryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#ffffff',
        borderWidth: 3,
        borderColor: SOFT_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#245aa8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    avatarImage: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: SOFT_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#245aa8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    editAvatarBtnDisabled: {
        opacity: 0.6,
    },
    contentSection: {
        flex: 1,
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 6,
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        color: '#192334',
        textAlign: 'center',
    },
    editUsernameBtn: {
        padding: 6,
    },
    email: {
        fontSize: 14,
        color: '#62708a',
        textAlign: 'center',
        marginBottom: 24,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e9f0fc',
        shadowColor: '#245aa8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoDivider: {
        width: 1,
        backgroundColor: '#e0e8f5',
    },
    infoLabel: {
        fontSize: 12,
        color: '#8ca2c0',
        marginBottom: 6,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#192334',
    },
    logoutBtn: {
        marginTop: 'auto',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: SOFT_BLUE,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#245aa8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutBtnPressed: { opacity: 0.85 },
    logoutBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    logoutBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: SOFT_BLUE,
    },
});
