import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert, Linking, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { fetchProducts } from '@/_services/api';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';
import MainHeader from '@/components/MainHeader';

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

  const CARD_WIDTH = 140;
  const CARD_HEIGHT = 150;
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const calcCardPos = (lat, lng, region, dims) => {
    const { width, height } = dims;
    const x = (lng - region.longitude) / region.longitudeDelta * width + width / 2;
    const y = (region.latitude - lat) / region.latitudeDelta * height + height / 2;
    if (x < 0 || x > width || y < 0 || y > height) return null;
    const left = Math.max(8, Math.min(x - CARD_WIDTH / 2, width - CARD_WIDTH - 8));
    return { left, top: Math.max(8, y - CARD_HEIGHT - 48) };
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionGranted(status === 'granted');

    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02, // Controla el zoom inicial del mapa
          longitudeDelta: 0.02,
        });
      } catch (error) {
        console.error("Error obteniendo ubicación:", error);
      }
    }
  };

  const handleManualPermissionRequest = async () => {
    // Primero intentamos pedirlo de forma nativa
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      // Si de casualidad lo permitió, ejecutamos la función original para que cargue el mapa
      requestLocationPermission();
    } else if (!canAskAgain) {
      // Si rechazó y el SO ya no nos deja preguntar, lo mandamos a los ajustes del celu
      Alert.alert(
        "Permiso bloqueado",
        "Debes habilitar la ubicación manualmente desde la configuración de tu celular para ver el mapa.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir Configuración", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const loadMapData = useCallback(async () => {
    if (IS_MOCK) {
      setPosts(MOCK_POSTS);
      setLoading(false);
      return;
    }
    try {
      const products = await fetchProducts();
      setPosts(products);
    } catch (e) {
      console.error("Error cargando productos para el mapa:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMapData();
    }, [loadMapData])
  );


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* 1. MODAL DE CARGA */}
      <Modal visible={permissionGranted === null || loading} animationType="none" transparent={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      </Modal>

      {/* 2. MODAL BLOQUEANTE */}
      <Modal visible={permissionGranted === false} animationType="fade" transparent={false}>
        <SafeAreaView style={styles.blockedContainer}>
          <Text style={styles.blockedText}>Necesitas dar permiso a tu ubicación para continuar</Text>
          <Pressable style={styles.button} onPress={handleManualPermissionRequest}>
            <Text style={styles.buttonText}>Permitir ubicación</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* --- PANTALLA PRINCIPAL --- */}

      {/* 3. HEADER GLOBAL*/}
      <MainHeader />

      {/* 4. MAP FRAME */}
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
            onPress={() => { setSelectedPost(null); setCardPos(null); selectedPostRef.current = null; }}
            onRegionChange={(region) => {
              currentRegion.current = region;
              const post = selectedPostRef.current;
              if (!post) return;
              const lat = post.ubicacion?.coordinates?.[1] || post.latitude;
              const lng = post.ubicacion?.coordinates?.[0] || post.longitude;
              if (!lat || !lng) return;
              setCardPos(calcCardPos(lat, lng, region, mapDimensions.current));
            }}
          >
            {posts.map((post) => {
              const lat = post.ubicacion?.coordinates?.[1] || post.latitude;
              const lng = post.ubicacion?.coordinates?.[0] || post.longitude;

              if (!lat || !lng) return null;

              return (
                <Marker
                  key={post._id || post.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  pinColor="red"
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
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#0a7ea4" />
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
                onPress={() => router.push(`/product/${selectedPost._id || selectedPost.id}`)}
              >
                <Text style={styles.previewBtnText}>Ver detalle</Text>
              </Pressable>
              <Pressable style={styles.previewClose} onPress={() => { setSelectedPost(null); setCardPos(null); }}>
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>
          )}
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
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    padding: 30,
  },
  blockedText: {
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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