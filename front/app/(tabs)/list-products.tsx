import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';
import { IMAGE_PLACEHOLDER } from '@/_constants';
import { fetchProducts } from '@/_services/api';
import MainHeader from '@/components/MainHeader';
import FloatingAddButton from '@/components/floating-add-button';

// 1. DEFINICIÓN DE TIPOS (INTERFACES)
interface ProductLocation {
    coordinates?: [number, number]; // [longitud, latitud]
}

interface ProductUser {
    alias?: string;
}

// Así viene el producto de la API o base de datos
interface Product {
    _id: string;
    titulo?: string;
    detalles?: string;
    usuario?: ProductUser;
    createdAt?: string | Date;
    ubicacion?: ProductLocation;
    ubicacionTexto?: string;
    fotos?: string[];
}

// Así lo procesa el componente para renderizar la Card
interface Post {
    id: string;
    title: string;
    description: string;
    authorAlias: string;
    creation: Date;
    location: string;
    image: string;
}

interface PostCardImageProps {
    imageUri?: string;
    style?: StyleProp<ViewStyle>;
}

// 2. FUNCIONES AUXILIARES TIPADAS
function isRemoteImageUrl(value: any): boolean {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function mapProductToPost(product: Product): Post {
    const coords = product.ubicacion?.coordinates;
    const lng = coords?.[0];
    const lat = coords?.[1];

    const fromCoords =
        typeof lat === 'number' && typeof lng === 'number'
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : null;

    const location = (product.ubicacionTexto && String(product.ubicacionTexto).trim()) || fromCoords || '—';

    return {
        id: String(product._id),
        title: product.titulo ?? '',
        description: product.detalles ?? '',
        authorAlias: product.usuario?.alias ? `@${product.usuario.alias}` : '@usuario',
        creation: product.createdAt ? new Date(product.createdAt) : new Date(),
        location,
        image: product.fotos?.[0] ?? '',
    };
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function matchesQuery(post: Post, query: string): boolean {
    if (!query) return true;
    const q = normalize(query);
    return (
        normalize(post.title).includes(q) ||
        normalize(post.description).includes(q) ||
        normalize(post.location).includes(q)
    );
}

function PostCardImage({ imageUri, style }: PostCardImageProps) {
    const [remoteFailed, setRemoteFailed] = useState(false);

    useEffect(() => {
        setRemoteFailed(false);
    }, [imageUri]);

    const useRemote = isRemoteImageUrl(imageUri) && !remoteFailed;
    const source = useRemote ? { uri: imageUri } : IMAGE_PLACEHOLDER;
    const resizeMode = useRemote ? 'cover' : 'contain';

    return (
        <View style={[styles.photoShell, style, !useRemote && styles.photoShellLocal]}>
            <View style={[styles.photoInner, !useRemote && styles.photoPlaceholderInset]}>
                <Image
                    style={styles.photoFill}
                    resizeMode={resizeMode}
                    source={source as any}
                    onError={() => {
                        if (useRemote) setRemoteFailed(true);
                    }}
                />
            </View>
        </View>
    );
}

// 3. COMPONENTE PRINCIPAL
export default function ListProducts() {
    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>(IS_MOCK ? (MOCK_POSTS as unknown as Post[]) : []);
    const [loading, setLoading] = useState<boolean>(!IS_MOCK);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const loadPosts = useCallback(async (options?: { refresh?: boolean }) => {
        const isPullRefresh = Boolean(options?.refresh);

        if (IS_MOCK) {
            setPosts(MOCK_POSTS as unknown as Post[]);
            setLoading(false);
            setRefreshing(false);
            setError(null);
            return;
        }

        if (isPullRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const products: Product[] = await fetchProducts();
            setPosts(products.map(mapProductToPost));
        } catch (e: any) {
            setError(e?.message ?? 'No se pudieron cargar los productos');
            setPosts([]);
        } finally {
            if (isPullRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPosts();
        }, [loadPosts])
    );

    // Posts filtrados según la búsqueda (se recalcula solo cuando cambian posts o searchQuery)
    const filteredPosts = useMemo(() => {
        const reversed = [...posts].reverse();
        return reversed.filter((p) => matchesQuery(p, searchQuery));
    }, [posts, searchQuery]);

    const calculateTime = (creation: Date): string => {
        const diff = new Date().getTime() - creation.getTime();
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diff / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diff / (1000 * 60));
        const diffSeconds = Math.floor(diff / 1000);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMinutes < 1) {
            return "hace: " + diffSeconds + " seg";
        } else if (diffHours < 1) {
            return "hace: " + diffMinutes + " min";
        } else if (diffHours < 24) {
            return "hace: " + diffHours + " h";
        } else if (diffDays < 30) {
            return "hace: " + diffDays + " días";
        } else {
            return "hace: " + diffMonths + " meses";
        }
    };

    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = useMemo(() => {
        const totalGaps = COLUMN_GAP * 2;
        return (windowWidth - H_PADDING * 2 - totalGaps) / 3;
    }, [windowWidth]);

    const renderItem = ({ item }: { item: Post }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                { width: cardWidth },
                pressed && { opacity: 0.75 }
            ]}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <PostCardImage imageUri={item.image} />
            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
            </Text>
            <Text style={styles.authorText} numberOfLines={1}>
                {item.authorAlias}
            </Text>
            <View style={styles.descRow}>
                <Text style={styles.description} numberOfLines={1}>
                    {item.description}
                </Text>
                <Text style={styles.time}>{calculateTime(item.creation)}</Text>
            </View>
            <View style={styles.locationRow}>
                <Text style={styles.pin}>📍</Text>
                <Text style={styles.location} numberOfLines={1}>
                    {item.location}
                </Text>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>

            {/* 1. HEADER GLOBAL (con búsqueda) */}
            <MainHeader onSearchChange={setSearchQuery} />

            {/* 2. CONTENIDO PRINCIPAL */}
            {error ? (
                <View style={styles.feedbackBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Reintentar"
                        onPress={() => loadPosts()}
                        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </Pressable>
                </View>
            ) : loading ? (
                <View style={styles.feedbackBox}>
                    <ActivityIndicator size="large" color="#333" />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    renderItem={renderItem}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadPosts({ refresh: true })}
                            tintColor="#333"
                            colors={['#333']}
                        />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {searchQuery.length > 0
                                ? 'No se encontraron resultados'
                                : (!IS_MOCK ? 'No hay productos.' : null)}
                        </Text>
                    }
                />
            )}

            <FloatingAddButton />
        </SafeAreaView>
    );
}

const H_PADDING = 16;
const COLUMN_GAP = 8;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    photoShell: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#eaeaea',
    },
    photoShellLocal: {
        backgroundColor: '#ececec',
    },
    photoInner: {
        ...StyleSheet.absoluteFillObject,
    },
    photoPlaceholderInset: {
        padding: 10,
    },
    photoFill: {
        width: '100%',
        height: '100%',
    },
    listContent: {
        paddingHorizontal: H_PADDING,
        paddingBottom: 120,
    },
    columnWrapper: {
        gap: COLUMN_GAP,
        marginBottom: COLUMN_GAP,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ddd',
    },
    photoPlaceholder: {
        aspectRatio: 1,
        width: '100%',
        borderRadius: 4,
        backgroundColor: '#b8dce8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    photoLabel: {
        color: '#5a7a8a',
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },
    authorText: {
        fontSize: 10,
        color: '#5d6b86',
        marginBottom: 4,
    },
    descRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginBottom: 4,
    },
    description: {
        flex: 1,
        fontSize: 10,
        color: '#444',
    },
    time: {
        fontSize: 9,
        color: '#666',
        flexShrink: 0,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    pin: {
        fontSize: 10,
    },
    location: {
        flex: 1,
        fontSize: 10,
        color: '#555',
    },
    feedbackBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: H_PADDING,
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: '#a33',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#e8e8e8',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
    },
    retryButtonPressed: {
        opacity: 0.75,
    },
    retryButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 14,
        color: '#666',
    },
});