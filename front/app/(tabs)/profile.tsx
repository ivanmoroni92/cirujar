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
    type ImageSourcePropType,
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

import { uploadImage, updateUser, fetchProducts, type ApiUser } from '@/_services/api';
import { clearAuth, getStoredToken, getStoredUser, setStoredUser } from '@/_services/authToken';

const PAD = 24;
const AVATAR_SIZE = 120;
const AVATAR_ICON_SIZE = 56;
const SOFT_BLUE = '#2a6fd6';

type CollectorLevelMeta = {
    level: number;
    minPosts: number;
    nextLevelMinPosts: number | null;
    badgeImage: ImageSourcePropType | null;
};

function getCollectorLevelMeta(publicationCount: number): CollectorLevelMeta {
    if (publicationCount > 40) {
        return {
            level: 5,
            minPosts: 41,
            nextLevelMinPosts: null,
            // Fallback temporal: falta el asset Recolector_lv_6.png en el repo.
            badgeImage: require('../../assets/levels/recolector/Recolector_lv_5.png'),
        };
    }
    if (publicationCount >= 25) {
        return {
            level: 4,
            minPosts: 25,
            nextLevelMinPosts: 41,
            badgeImage: require('../../assets/levels/recolector/Recolector_lv_5.png'),
        };
    }
    if (publicationCount >= 15) {
        return {
            level: 3,
            minPosts: 15,
            nextLevelMinPosts: 25,
            badgeImage: require('../../assets/levels/recolector/Recolector_lv_4.png'),
        };
    }
    if (publicationCount >= 5) {
        return {
            level: 2,
            minPosts: 5,
            nextLevelMinPosts: 15,
            badgeImage: require('../../assets/levels/recolector/Recolector_lv_3.png'),
        };
    }
    if (publicationCount >= 2) {
        return {
            level: 1,
            minPosts: 2,
            nextLevelMinPosts: 5,
            badgeImage: require('../../assets/levels/recolector/Recolector_lv_2.png'),
        };
    }

    return {
        level: 0,
        minPosts: 0,
        nextLevelMinPosts: 2,
        badgeImage: null,
    };
}

function getPublisherLevelMeta(publicationCount: number): CollectorLevelMeta {
    if (publicationCount > 40) {
        return {
            level: 5,
            minPosts: 41,
            nextLevelMinPosts: null,
            badgeImage: require('../../assets/levels/publicador/publicador_lv_6.png'),
        };
    }
    if (publicationCount >= 25) {
        return {
            level: 4,
            minPosts: 25,
            nextLevelMinPosts: 41,
            badgeImage: require('../../assets/levels/publicador/publicador_lv_5.png'),
        };
    }
    if (publicationCount >= 15) {
        return {
            level: 3,
            minPosts: 15,
            nextLevelMinPosts: 25,
            badgeImage: require('../../assets/levels/publicador/publicador_lv_4.png'),
        };
    }
    if (publicationCount >= 5) {
        return {
            level: 2,
            minPosts: 5,
            nextLevelMinPosts: 15,
            badgeImage: require('../../assets/levels/publicador/publicador_lv_3.png'),
        };
    }
    if (publicationCount >= 2) {
        return {
            level: 1,
            minPosts: 2,
            nextLevelMinPosts: 5,
            badgeImage: require('../../assets/levels/publicador/publicador_lv_2.png'),
        };
    }

    return {
        level: 0,
        minPosts: 0,
        nextLevelMinPosts: 2,
        badgeImage: null,
    };
}

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isEditingAlias, setIsEditingAlias] = useState(false);
    const [aliasInput, setAliasInput] = useState('');
    const [savingAlias, setSavingAlias] = useState(false);
    const [aliasError, setAliasError] = useState<string | null>(null);
    const [publicationCount, setPublicationCount] = useState(0);

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
                    setAliasInput(storedUser.alias ?? '');
                    setError(null);
                    setLoading(false);

                    // Load publication count
                    try {
                        const products = await fetchProducts();
                        console.log('[profile] storedUser completo:', JSON.stringify(storedUser, null, 2));
                        console.log('[profile] storedUser._id:', storedUser._id, 'tipo:', typeof storedUser._id);
                        console.log('[profile] productos traídos:', products.length);
                        if (products.length > 0) {
                            console.log('[profile] primer producto:', JSON.stringify(products[0], null, 2));
                        }
                        const userPublications = products.filter((p) => {
                            const match = p.usuario?._id === storedUser._id;
                            console.log(`[profile] comparando ${p.usuario?._id} === ${storedUser._id} → ${match}`);
                            return match;
                        });
                        console.log('[profile] publicaciones del usuario después de filtrar:', userPublications.length);
                        if (active) {
                            setPublicationCount(userPublications.length);
                        }
                    } catch (err) {
                        console.error('[profile] Error al cargar publicaciones:', err);
                        // No mostrar error, solo dejar el conteo como 0
                    }

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

    const collectorLevel = useMemo(
        () => getCollectorLevelMeta(publicationCount),
        [publicationCount]
    );

    const publisherLevel = useMemo(
        () => getPublisherLevelMeta(publicationCount),
        [publicationCount]
    );

    const progressPercent = useMemo(() => {
        if (collectorLevel.nextLevelMinPosts === null) return 100;

        const span = collectorLevel.nextLevelMinPosts - collectorLevel.minPosts;
        if (span <= 0) return 0;

        const progress = publicationCount - collectorLevel.minPosts;
        const normalized = Math.max(0, Math.min(progress / span, 1));
        return normalized * 100;
    }, [collectorLevel, publicationCount]);

    const progressMessage = useMemo(() => {
        if (collectorLevel.nextLevelMinPosts === null) {
            return 'Nivel máximo de recolección alcanzado';
        }

        const remaining = Math.max(0, collectorLevel.nextLevelMinPosts - publicationCount);
        const label = remaining === 1 ? 'publicación' : 'publicaciones';
        return `Faltan ${remaining} ${label} para nivel ${collectorLevel.level + 1}`;
    }, [collectorLevel, publicationCount]);

    const performLogout = useCallback(async () => {
        await clearAuth();
        DeviceEventEmitter.emit('cirujar:auth-user-updated');
        router.replace('/login' as Href);
    }, [router]);

    const handleLogout = useCallback(() => {
        Alert.alert('Confirmación', '¿Querés cerrar sesión?', [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Cerrar sesión',
                style: 'destructive',
                onPress: () => {
                    void performLogout();
                },
            },
        ]);
    }, [performLogout]);

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

    const handleAliasButtonPress = useCallback(async () => {
        if (!user) return;

        if (!isEditingAlias) {
            setAliasInput(user.alias ?? '');
            setAliasError(null);
            setIsEditingAlias(true);
            return;
        }

        const nextAlias = aliasInput.trim();
        if (!nextAlias) {
            setAliasError('El nombre no puede estar vacío');
            return;
        }

        if (nextAlias === user.alias) {
            setIsEditingAlias(false);
            return;
        }

        try {
            setSavingAlias(true);
            const updated = await updateUser(user._id, { alias: nextAlias });
            const finalUser: ApiUser = { ...user, ...updated, alias: nextAlias };
            await setStoredUser(finalUser);
            setUser(finalUser);
            setAliasInput(nextAlias);
            setAliasError(null);
            setIsEditingAlias(false);
            DeviceEventEmitter.emit('cirujar:auth-user-updated');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar alias';
            Alert.alert('Error al actualizar alias', msg);
        } finally {
            setSavingAlias(false);
        }
    }, [aliasInput, isEditingAlias, user]);

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
                                {isEditingAlias ? (
                                    <TextInput
                                        value={aliasInput}
                                        onChangeText={(v) => { setAliasInput(v); if (aliasError) setAliasError(null); }}
                                        style={[styles.usernameInput, aliasError ? styles.usernameInputError : null]}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        maxLength={30}
                                        returnKeyType="done"
                                        onSubmitEditing={handleAliasButtonPress}
                                    />
                                ) : (
                                    <Text style={styles.username}>@{user.alias}</Text>
                                )}
                                <Pressable
                                    style={[styles.editUsernameBtn, savingAlias && styles.editUsernameBtnDisabled]}
                                    onPress={handleAliasButtonPress}
                                    disabled={savingAlias}>
                                    {savingAlias ? (
                                        <ActivityIndicator size="small" color={SOFT_BLUE} />
                                    ) : (
                                        <Ionicons
                                            name={isEditingAlias ? 'checkmark' : 'pencil'}
                                            size={16}
                                            color={SOFT_BLUE}
                                        />
                                    )}
                                </Pressable>
                            </View>
                            {aliasError ? (
                                <Text style={styles.aliasErrorText}>{aliasError}</Text>
                            ) : null}

                            <Text style={styles.email}>{user.email}</Text>

                            <View style={styles.badgeTopSection}>
                                <View style={styles.badgeRow}>
                                    <View style={styles.badgeSlotLeft}>
                                        <Text style={styles.badgeSlotTitle}>Recolector</Text>
                                        {collectorLevel.badgeImage ? (
                                            <Image
                                                source={collectorLevel.badgeImage}
                                                style={styles.collectorBadge}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <View style={styles.badgeEmptyWrap}>
                                                <Text style={styles.badgeEmptyText}>Sin insignia</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.badgeSlotRight}>
                                        <Text style={[styles.badgeSlotTitle, styles.badgeSlotTitleRight]}>Publicador</Text>
                                        {publisherLevel.badgeImage ? (
                                            <Image
                                                source={publisherLevel.badgeImage}
                                                style={[styles.collectorBadge, styles.collectorBadgeRight]}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <View style={[styles.badgeEmptyWrap, styles.badgeEmptyWrapRight]}>
                                                <Text style={styles.badgeEmptyText}>Sin insignia</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.badgeSection}>
                                <Text style={styles.badgeTitle}>Nivel de recolección</Text>

                                <View style={styles.progressWrap}>
                                    <View style={styles.levelCircle}>
                                        <Text style={styles.levelCircleText}>{collectorLevel.level}</Text>
                                    </View>

                                    <View style={styles.progressTrack}>
                                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                                    </View>
                                </View>

                                <Text style={styles.progressText}>{progressMessage}</Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Publicaciones</Text>
                                    <Text style={styles.infoValue}>{publicationCount}</Text>
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
    editUsernameBtnDisabled: {
        opacity: 0.65,
    },
    usernameInput: {
        minWidth: 150,
        maxWidth: 240,
        fontSize: 22,
        fontWeight: '700',
        color: '#192334',
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#9cbcf0',
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    usernameInputError: {
        borderBottomColor: '#d11a2a',
    },
    aliasErrorText: {
        fontSize: 12,
        color: '#d11a2a',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: -8,
    },
    email: {
        fontSize: 14,
        color: '#62708a',
        textAlign: 'center',
        marginBottom: 14,
    },
    badgeTopSection: {
        marginBottom: 10,
    },
    badgeSection: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e9f0fc',
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 18,
        shadowColor: '#245aa8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    badgeTitle: {
        fontSize: 12,
        color: '#8ca2c0',
        fontWeight: '700',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    badgeSlotLeft: {
        minHeight: 62,
        width: '42%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeSlotRight: {
        minHeight: 62,
        width: '42%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeSlotTitle: {
        fontSize: 11,
        color: '#8ca2c0',
        fontWeight: '700',
        marginBottom: 4,
    },
    badgeSlotTitleRight: {
        textAlign: 'center',
    },
    collectorBadge: {
        width: 132,
        height: 64,
    },
    collectorBadgeRight: {
        alignSelf: 'center',
    },
    badgeEmptyWrap: {
        minHeight: 58,
        justifyContent: 'center',
    },
    badgeEmptyWrapRight: {
        alignItems: 'center',
    },
    badgeEmptyText: {
        fontSize: 12,
        color: '#8ca2c0',
        fontWeight: '600',
    },
    progressWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    levelCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#b38a25',
        backgroundColor: '#f7df8a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelCircleText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#7a5b0f',
    },
    progressTrack: {
        flex: 1,
        height: 12,
        borderRadius: 999,
        backgroundColor: '#cfeeff',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#47b55f',
        borderRadius: 999,
    },
    progressText: {
        marginTop: 8,
        fontSize: 12,
        color: '#5f7391',
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
