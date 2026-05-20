import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
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
    loadMapData();
  }, [loadMapData]);


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
              >
                {posts.map((post) => {
                  const lat = post.ubicacion?.coordinates?.[1] || post.latitude;
                  const lng = post.ubicacion?.coordinates?.[0] || post.longitude;

                  if (!lat || !lng) return null;

                  return (
                      <Marker
                          key={post._id || post.id}
                          coordinate={{ latitude: lat, longitude: lng }}
                          title={post.titulo || post.title}
                          description={post.detalles || post.description}
                          pinColor="red"
                          onCalloutPress={() => router.push(`/product/${post._id || post.id}`)}
                      />
                  );
                })}
              </MapView>
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
});