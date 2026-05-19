import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { fetchProducts } from '@/_services/api';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';

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
      <View style={styles.container}>

        {/* 1. MODAL DE CARGA (Tapa todo mientras procesa) */}
        <Modal visible={permissionGranted === null || loading} animationType="none" transparent={false}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#333" />
          </View>
        </Modal>

        {/* 2. MODAL BLOQUEANTE (Tapa todo si denegó el permiso) */}
        <Modal visible={permissionGranted === false} animationType="fade" transparent={false}>
          <SafeAreaView style={styles.blockedContainer}>
            <Text style={styles.blockedText}>Necesitas dar permiso a tu ubicación para continuar</Text>
            <Pressable style={styles.button} onPress={handleManualPermissionRequest}>
              <Text style={styles.buttonText}>Permitir ubicación</Text>
            </Pressable>
          </SafeAreaView>
        </Modal>

        {/* 3. VISTA PRINCIPAL (Solo interactiva cuando los modales están ocultos) */}
        {userLocation && (
            <MapView
                style={styles.map}
                initialRegion={userLocation}
                showsUserLocation={true}
                showsMyLocationButton={false}
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
        )}

        <View style={styles.headerAbsolute}>
          <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/add-post')}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

      </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
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
    backgroundColor: '#4A90E2', // Ajustar al color exacto si es necesario
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 28,
    lineHeight: 32,
    color: '#333',
    fontWeight: '300',
    marginTop: -2,
  },
});