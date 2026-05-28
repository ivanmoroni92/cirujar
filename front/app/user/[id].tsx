import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    type ImageSourcePropType,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchProducts, fetchUserById, type ApiUser } from '@/_services/api';

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

export default function PublicProfileScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Content />
        </>
    );
}

function Content() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publicationCount, setPublicationCount] = useState(0);

    const avatarAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const userId = Array.isArray(id) ? id[0] : id;
                if (!userId) {
                    throw new Error('Usuario inválido');
                }

                const [profile, products] = await Promise.all([
                    fetchUserById(userId),
                    fetchProducts(),
                ]);

                if (!active) return;

                setUser(profile);
                setPublicationCount(products.filter((p) => p.usuario?._id === profile._id).length);
                setError(null);

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
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [avatarAnim, contentAnim, id]);

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

    const activeSinceText = useMemo(() => {
        if (!user?.createdAt) return '—';

        const created = new Date(user.createdAt);
        if (Number.isNaN(created.getTime())) return '—';

        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const dayMs = 1000 * 60 * 60 * 24;
        const days = Math.max(0, Math.floor(diffMs / dayMs));

        if (days < 1) return 'Hoy';
        if (days < 30) return `${days} día${days === 1 ? '' : 's'}`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}`;

        const years = Math.floor(months / 12);
        return `${years} año${years === 1 ? '' : 's'}`;
    }, [user?.createdAt]);

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
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
                        <Text style={styles.retryBtnText}>Volver</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.bgBlobTop} />
            <View style={styles.bgBlobBottom} />

            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </Pressable>
                <Text style={styles.headerTitle}>Perfil público</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.avatarSection, avatarStyle]}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {user.imagenPerfil ? (
                                <Image
                                    key={user.imagenPerfil}
                                    source={{ uri: user.imagenPerfil }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Ionicons name="person" size={AVATAR_ICON_SIZE} color={SOFT_BLUE} />
                            )}
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.contentSection, contentStyle]}>
                    <View style={styles.usernameRow}>
                        <Text style={styles.username}>@{user.alias}</Text>
                    </View>

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
                                <Text style={styles.badgeLevelText}>Nivel {collectorLevel.level}</Text>
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
                                <Text style={styles.badgeLevelText}>Nivel {publisherLevel.level}</Text>
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
                            <Text style={styles.infoLabel}>Activo desde</Text>
                            <Text style={styles.infoValue}>{activeSinceText}</Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f9fbff' },
    scroll: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: PAD,
        paddingTop: 24,
        paddingBottom: 120,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: PAD,
        paddingTop: 6,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e4ecfa',
    },
    headerBtnPressed: {
        opacity: 0.8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#192334',
    },
    headerSpacer: {
        width: 40,
        height: 40,
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
        marginTop: 10,
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
    contentSection: {
        flex: 1,
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        color: '#192334',
        textAlign: 'center',
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
    badgeLevelText: {
        marginTop: 4,
        fontSize: 12,
        color: '#5f7391',
        fontWeight: '700',
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
});
