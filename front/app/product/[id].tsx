import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchProductById, deleteProduct, retirarProduct, type ApiProduct } from '@/_services/api';
import { getStoredUser } from '@/_services/authToken';

const { width } = Dimensions.get('window');
const PAD = 16;

export default function ProductDetail() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Content />
    </>
  );
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'CirujaApp/1.0',
      },
    });
    if (!res.ok) {
      return 'Sin ubicación';
    }
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return 'Sin ubicación';

    const localidad =
      addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.municipality ?? '';
    const provincia = addr.state ?? '';

    if (localidad && provincia) return `${provincia}, ${localidad}`;
    if (provincia) return provincia;
    if (localidad) return localidad;
    return 'Sin ubicación';
  } catch (e) {
    console.error('[reverseGeocode] error:', e);
    return 'Sin ubicación';
  }
}

function Content() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [retirando, setRetirando] = useState(false);
  const [retirarError, setRetirarError] = useState<string | null>(null);
  const [ubicacionLabel, setUbicacionLabel] = useState<string>('...');

  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    getStoredUser().then((storedUser) => {
      setCurrentUserId(storedUser?._id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProductById(id)
      .then(setProduct)
      .catch((e) => setError(e?.message ?? 'Error al cargar el producto'))
      .finally(() => setLoading(false));
  }, [id]);

  // Reverse geocoding cuando el producto carga
  useEffect(() => {
    if (!product) return;

    if (product.ubicacion?.coordinates) {
      const lat = product.ubicacion.coordinates[1];
      const lon = product.ubicacion.coordinates[0];
      reverseGeocode(lat, lon).then(setUbicacionLabel);
    } else {
      setUbicacionLabel('Sin ubicación');
    }
  }, [product]);

  const isOwner = !!product?.usuario?._id && product.usuario._id === currentUserId;

  const goTo = (index: number) => {
    carouselRef.current?.scrollTo({ x: index * width, animated: true });
    setPhotoIndex(index);
  };

  const handleDelete = () => {
    if (!isOwner) return;

    const productId = Array.isArray(id) ? id[0] : id;
    if (!productId) return;

    const doDelete = async () => {
      try {
        await deleteProduct(productId);
        if (Platform.OS === 'web') {
          window.alert('La publicación fue eliminada correctamente');
        } else {
          Alert.alert('Publicación eliminada', 'La publicación fue eliminada correctamente');
        }
        router.replace('/(tabs)/home');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo eliminar la publicación';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${msg}`);
        } else {
          Alert.alert('Error', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que querés eliminar esta publicación?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Eliminar publicación',
        '¿Estás seguro de que querés eliminar esta publicación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const haversineMeters = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleRetirar = async () => {
    if (!product || retirando) return;
    setRetirarError(null);
    setRetirando(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setRetirarError('Necesitamos acceso a tu ubicación para validar que estás cerca.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      if (product.ubicacion?.coordinates) {
        const pubLat = product.ubicacion.coordinates[1];
        const pubLon = product.ubicacion.coordinates[0];
        const distancia = haversineMeters(
          loc.coords.latitude, loc.coords.longitude,
          pubLat, pubLon
        );

        if (distancia > 200) {
          setRetirarError('Debes estar cerca del lugar para retirar el objeto.');
          return;
        }
      }

      const productId = Array.isArray(id) ? id[0] : id;
      if (!productId) return;

      const updated = await retirarProduct(productId);
      setProduct(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo retirar la publicación.';
      setRetirarError(msg);
    } finally {
      setRetirando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={26} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>
          Detalle de la publicación
        </Text>

        <View style={styles.headerActions}>
          {isOwner ? (
            <>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.headerBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="trash-outline" size={22} color="#d11a2a" />
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/edit/[id]',
                    params: { id },
                  })
                }
                style={({ pressed }) => [
                  styles.headerBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="create-outline" size={22} color="#111" />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : error || !product ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? 'Producto no encontrado'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
          >
            {/* CARRUSEL */}
            {product.fotos?.length ? (
              <View style={styles.carouselWrapper}>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / width
                    );
                    setPhotoIndex(index);
                  }}
                >
                  {product.fotos.map((uri, index) => (
                    <View key={index} style={{ width }}>
                      <View style={{ marginHorizontal: PAD }}>
                        <Image
                          source={{ uri }}
                          style={{
                            width: width - PAD * 2,
                            height: width - PAD * 2,
                            borderRadius: 14,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {photoIndex > 0 && (
                  <Pressable
                    style={[styles.arrow, styles.arrowLeft]}
                    onPress={() => goTo(photoIndex - 1)}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </Pressable>
                )}

                {photoIndex < product.fotos.length - 1 && (
                  <Pressable
                    style={[styles.arrow, styles.arrowRight]}
                    onPress={() => goTo(photoIndex + 1)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </Pressable>
                )}

                {product.fotos.length > 1 && (
                  <View style={styles.dots}>
                    {product.fotos.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, i === photoIndex && styles.dotActive]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholder} />
            )}

            {/* MINIATURAS */}
            {product.fotos?.length > 1 && (
              <View style={styles.thumbsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbsScroll}
                >
                  {product.fotos.map((uri, index) => {
                    const isActive = index === photoIndex;

                    return (
                      <Pressable
                        key={index}
                        onPress={() => goTo(index)}
                        style={[
                          styles.thumbWrapper,
                          isActive && styles.thumbWrapperActive,
                        ]}
                      >
                        <Image
                          source={{ uri }}
                          style={styles.thumbImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* BODY */}
            <View style={styles.body}>
              <Text style={styles.title}>{product.titulo}</Text>

              <View style={styles.authorCard}>
                <View style={styles.authorAvatarWrap}>
                  {product.usuario?.imagenPerfil ? (
                    <Image
                      source={{ uri: product.usuario.imagenPerfil } as ImageSourcePropType}
                      style={styles.authorAvatar}
                    />
                  ) : (
                    <Ionicons name="person-outline" size={18} color="#5a6a84" />
                  )}
                </View>
                <View style={styles.authorTextWrap}>
                  <Text style={styles.authorLabel}>Publicado por</Text>
                  <Text style={styles.authorAlias}>
                    {product.usuario?.alias ? `@${product.usuario.alias}` : '@usuario'}
                  </Text>
                </View>
              </View>

              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionLabel}>Descripción</Text>
                <View style={styles.descriptionDivider} />

                {product.detalles ? (
                  <Text style={styles.description}>{product.detalles}</Text>
                ) : (
                  <View style={styles.emptyRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={15}
                      color="#bbb"
                    />
                    <Text style={styles.descriptionEmpty}>
                      Sin descripción disponible
                    </Text>
                  </View>
                )}
              </View>

              {/* MAPA DE UBICACIÓN */}
              {product.ubicacion && product.ubicacion.coordinates && (
                  <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: product.ubicacion.coordinates[1],
                          longitude: product.ubicacion.coordinates[0],
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        zoomControlEnabled={true}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                      <UrlTile
                          urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                          maximumZ={19}
                      />
                      <Marker
                          coordinate={{
                            latitude: product.ubicacion.coordinates[1],
                            longitude: product.ubicacion.coordinates[0],
                          }}
                      />
                    </MapView>
                  </View>
              )}
            </View>
          </ScrollView>

          {/* META */}
          <View
            style={[
              styles.metaContainer,
              { paddingBottom: insets.bottom + 12 },
            ]}
          >
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color="#666" />
              <Text style={styles.location}>{ubicacionLabel}</Text>
            </View>

            {product.createdAt && (
              <Text style={styles.time}>
                Publicado el{' '}
                {new Date(product.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}

            {!isOwner && product.estado !== 'retirado' && (
              <View style={styles.retirarSection}>
                {retirarError && (
                  <Text style={styles.retirarErrorText}>{retirarError}</Text>
                )}
                <Pressable
                  onPress={handleRetirar}
                  disabled={retirando}
                  style={({ pressed }) => [
                    styles.retirarBtn,
                    (pressed || retirando) && styles.retirarBtnPressed,
                  ]}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.retirarBtnText}>
                    {retirando ? 'Validando...' : 'Retirar'}
                  </Text>
                </Pressable>
              </View>
            )}

            {product.estado === 'retirado' && (
              <View style={styles.retiradoBadge}>
                <Ionicons name="checkmark-done-circle" size={16} color="#fff" />
                <Text style={styles.retiradoBadgeText}>Retirado</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },

  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 82,
    justifyContent: 'flex-end',
  },

  pressed: { opacity: 0.75 },

  carouselWrapper: { position: 'relative' },

  placeholder: {
    width,
    height: width,
    backgroundColor: '#ccc',
    borderRadius: 14,
  },

  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: PAD + 8 },
  arrowRight: { right: PAD + 8 },

  dots: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },

  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#999' },
  dotActive: { backgroundColor: '#fff' },

  body: {
    padding: PAD,
    gap: 12,
  },

  title: { fontSize: 26, fontWeight: '800', color: '#111' },

  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f7f9fc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d7dfec',
  },
  authorAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9eff8',
  },
  authorAvatar: {
    width: '100%',
    height: '100%',
  },
  authorTextWrap: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 11,
    color: '#6c7891',
    marginBottom: 2,
  },
  authorAlias: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b2940',
  },

  descriptionCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    padding: 16,
  },

  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginBottom: 10,
  },

  descriptionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },

  description: { fontSize: 15, color: '#333', lineHeight: 24 },

  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  descriptionEmpty: { fontSize: 14, color: '#bbb' },

  metaContainer: {
    paddingHorizontal: PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { fontSize: 13, color: '#666' },
  time: { fontSize: 12, color: '#999' },

  errorText: { color: '#a33' },

  thumbsContainer: { marginTop: 10 },

  thumbsScroll: {
    paddingHorizontal: PAD,
    gap: 4,
  },

  thumbWrapper: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  thumbWrapperActive: {
    borderColor: '#0a7ea4',
  },

  thumbImage: {
    width: '100%',
    height: '100%',
  },

  retirarSection: {
    marginTop: 12,
    gap: 6,
  },
  retirarErrorText: {
    fontSize: 12,
    color: '#d11a2a',
    textAlign: 'center',
  },
  retirarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a9d5c',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  retirarBtnPressed: {
    opacity: 0.7,
  },
  retirarBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  retiradoBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d11a2a',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  retiradoBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  mapCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});