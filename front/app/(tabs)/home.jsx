import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { fetchProducts } from '@/_services/api';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';
import MainHeader from '@/components/MainHeader';

export default function HomeMap() {
  const router = useRouter();

  const [permissionGranted, setPermissionGranted] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

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
                  style={styles.map}
                  initialRegion={userLocation}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  onPress={() => setSelectedPost(null)}
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
                          onPress={() => setSelectedPost(post)}
                      />
                  );
                })}
              </MapView>

              {selectedPost && (
                <View style={styles.previewCard}>
                  <Pressable
                    style={styles.previewCloseBtn}
                    onPress={() => setSelectedPost(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color="#666" />
                  </Pressable>

                  {selectedPost.fotos?.[0] ? (
                    <Image
                      source={{ uri: selectedPost.fotos[0] }}
                      style={styles.previewPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.previewPhotoPlaceholder}>
                      <Ionicons name="image-outline" size={36} color="#ccc" />
                    </View>
                  )}

                  <View style={styles.previewBody}>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {selectedPost.titulo || selectedPost.title}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.previewBtn,
                        pressed && styles.previewBtnPressed,
                      ]}
                      onPress={() =>
                        router.push(`/product/${selectedPost._id || selectedPost.id}`)
                      }
                    >
                      <Text style={styles.previewBtnText}>Ver detalle</Text>
                      <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </Pressable>
                  </View>
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
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPhoto: {
    width: '100%',
    height: 160,
  },
  previewPhotoPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#eaeaea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    padding: 12,
    gap: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 10,
  },
  previewBtnPressed: {
    opacity: 0.75,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});