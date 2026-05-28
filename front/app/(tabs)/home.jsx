import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { fetchProducts } from '@/_services/api';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';
import MainHeader from '@/components/MainHeader';

const MAP_PIN_IMAGE = require('../../assets/pins/pin_30x30_1.png');

function normalize(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function postMatchesQuery(post, query) {
    if (!query) return true;
    const q = normalize(query);
    const title = normalize(post.titulo ?? post.title ?? '');
    const desc = normalize(post.detalles ?? post.description ?? '');
    const loc = normalize(post.ubicacionTexto ?? post.location ?? '');
    return title.includes(q) || desc.includes(q) || loc.includes(q);
}

export default function HomeMap() {
    const router = useRouter();

    const mapRef = useRef(null);
    const selectedPostRef = useRef(null);
    const currentRegion = useRef(null);
    const mapDimensions = useRef({ width: 0, height: 0 });
    const [permissionGranted, setPermissionGranted] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [cardPos, setCardPos] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const CARD_WIDTH = 140;
    const CARD_HEIGHT = 150;
    const FALLBACK_REGION = {
        latitude: -34.6037,
        longitude: -58.3816,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    const filteredPosts = searchQuery
        ? posts.filter((p) => postMatchesQuery(p, searchQuery))
        : posts;

    const calcCardPos = (lat, lng, region, dims) => {
        const { width, height } = dims;
        const x = (lng - region.longitude) / region.longitudeDelta * width + width / 2;
        const y = (region.latitude - lat) / region.latitudeDelta * height + height / 2;
        if (x < 0 || x > width || y < 0 || y > height) return null;
        const left = Math.max(8, Math.min(x - CARD_WIDTH / 2, width - CARD_WIDTH - 8));
        return { left, top: Math.max(8, y - CARD_HEIGHT - 48) };
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionGranted(status === 'granted');

            if (status === 'granted') {
                try {
                    const location = await Location.getCurrentPositionAsync({});
                    setUserLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    });
                } catch (error) {
                    console.error('Error obteniendo ubicacion:', error);
                    setUserLocation(FALLBACK_REGION);
                }
            }
        } catch (error) {
            console.error('Error solicitando permisos de ubicacion:', error);
            setPermissionGranted(false);
            setUserLocation(FALLBACK_REGION);
        }
    };

    const handleManualPermissionRequest = async () => {
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
            requestLocationPermission();
        } else if (!canAskAgain) {
            Alert.alert(
                'Permiso bloqueado',
                'Debes habilitar la ubicacion manualmente desde la configuracion de tu celular para ver el mapa.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Abrir Configuracion', onPress: () => Linking.openSettings() },
                ]
            );
        }
    };

    const loadMapData = useCallback(async () => {
        setLoading(true);
        if (IS_MOCK) {
            setPosts(MOCK_POSTS);
            setLoading(false);
            return;
        }
        try {
            const products = await fetchProducts();
            setPosts(products);
        } catch (e) {
            console.error('Error cargando productos para el mapa:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedPost && !filteredPosts.some((p) => (p._id || p.id) === (selectedPost._id || selectedPost.id))) {
            setSelectedPost(null);
            setCardPos(null);
            selectedPostRef.current = null;
        }
    }, [filteredPosts, selectedPost]);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMapData();
        }, [loadMapData])
    );

    useEffect(() => {
        if (userLocation) {
            setMapReady(false);
        }
    }, [userLocation]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <MainHeader onSearchChange={setSearchQuery} />

            {permissionGranted === false && (
                <View style={styles.permissionBanner}>
                    <Text style={styles.permissionBannerText}>
                        La ubicacion esta desactivada. Puedes habilitarla para centrar mejor el mapa.
                    </Text>
                    <Pressable style={styles.permissionBannerBtn} onPress={handleManualPermissionRequest}>
                        <Text style={styles.permissionBannerBtnText}>Habilitar ubicacion</Text>
                    </Pressable>
                </View>
            )}

            {userLocation && (
                <View style={styles.mapFrame}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={userLocation}
                        onMapReady={() => setMapReady(true)}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        onLayout={(e) => {
                            mapDimensions.current = {
                                width: e.nativeEvent.layout.width,
                                height: e.nativeEvent.layout.height,
                            };
                        }}
                        onPress={() => {
                            setSelectedPost(null);
                            setCardPos(null);
                            selectedPostRef.current = null;
                        }}
                        onRegionChange={(region) => {
                            currentRegion.current = region;
                            const post = selectedPostRef.current;
                            if (!post) return;
                            const lat = post.ubicacion?.coordinates?.[1] || post.latitude;
                            const lng = post.ubicacion?.coordinates?.[0] || post.longitude;
                            if (!lat || !lng) return;
                            setCardPos(calcCardPos(lat, lng, region, mapDimensions.current));
                        }}>
                        {filteredPosts.map((post) => {
                            const lat = post.ubicacion?.coordinates?.[1] || post.latitude;
                            const lng = post.ubicacion?.coordinates?.[0] || post.longitude;

                            if (!lat || !lng) return null;

                            return (
                                <Marker
                                    key={post._id || post.id}
                                    coordinate={{ latitude: lat, longitude: lng }}
                                    image={MAP_PIN_IMAGE}
                                    onPress={() => {
                                        setSelectedPost(post);
                                        selectedPostRef.current = post;
                                        if (currentRegion.current) {
                                            setCardPos(calcCardPos(lat, lng, currentRegion.current, mapDimensions.current));
                                        }
                                    }}
                                />
                            );
                        })}
                    </MapView>

                    {!mapReady && (
                        <View pointerEvents="none" style={styles.mapLoadingOverlay}>
                            <ActivityIndicator size="large" color="#0a7ea4" />
                        </View>
                    )}

                    {loading && (
                        <View pointerEvents="none" style={styles.dataLoadingBadge}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.dataLoadingText}>Actualizando publicaciones...</Text>
                        </View>
                    )}

                    {selectedPost && cardPos && (
                        <View style={[styles.previewCard, { left: cardPos.left, top: cardPos.top }]}>
                            {selectedPost.fotos?.[0] ? (
                                <Image
                                    source={{ uri: selectedPost.fotos[0] }}
                                    style={styles.previewPhoto}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.previewPhotoPlaceholder} />
                            )}
                            <Pressable
                                style={styles.previewBtn}
                                onPress={() => router.push(`/product/${selectedPost._id || selectedPost.id}`)}>
                                <Text style={styles.previewBtnText}>Ver detalle</Text>
                            </Pressable>
                            <Pressable
                                style={styles.previewClose}
                                onPress={() => {
                                    setSelectedPost(null);
                                    setCardPos(null);
                                }}>
                                <Text style={styles.previewCloseText}>X</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {!userLocation && permissionGranted !== false && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0a7ea4" />
                    <Text style={styles.loadingText}>Cargando mapa...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    loadingText: {
        marginTop: 10,
        color: '#4d5b6a',
        fontSize: 14,
    },
    permissionBanner: {
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 6,
        backgroundColor: '#fff3cd',
        borderColor: '#f1d68a',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    permissionBannerText: {
        color: '#6e5a22',
        fontSize: 13,
    },
    permissionBannerBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    permissionBannerBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    mapFrame: {
        flex: 1,
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: '#eaeaea',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(240, 240, 240, 0.9)',
    },
    dataLoadingBadge: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        backgroundColor: 'rgba(25, 25, 25, 0.72)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    dataLoadingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    previewCard: {
        position: 'absolute',
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 8,
    },
    previewPhoto: {
        width: 140,
        height: 110,
    },
    previewPhotoPlaceholder: {
        width: 140,
        height: 110,
        backgroundColor: '#ddd',
    },
    previewBtn: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 8,
        alignItems: 'center',
    },
    previewBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    previewClose: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewCloseText: {
        fontSize: 11,
        color: '#fff',
        lineHeight: 14,
    },
});
