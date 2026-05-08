import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { fetchProductById, deleteProduct, type ApiProduct } from '@/_services/api';

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

function Content() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    fetchProductById(id)
      .then(setProduct)
      .catch((e) => setError(e?.message ?? 'Error al cargar el producto'))
      .finally(() => setLoading(false));
  }, [id]);

  const goTo = (index: number) => {
    carouselRef.current?.scrollTo({ x: index * width, animated: true });
    setPhotoIndex(index);
  };

  const handleDelete = () => {
  const productId = Array.isArray(id) ? id[0] : id;
  if (!productId) return;

  Alert.alert(
    'Eliminar publicación',
    '¿Estás seguro de que querés eliminar esta publicación?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(productId);
            Alert.alert('Publicación eliminada', 'La publicación fue eliminada correctamente');
            router.replace('/(tabs)/home');
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar la publicación');
          }
        },
      },
    ]
  );
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

            {/* 🔥 MINIATURAS (AGREGADO) */}
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

              {/* MAPA DE UBICACIÓN (NUEVO BLOQUE) */}
              {product.ubicacion && product.ubicacion.coordinates && (
                  <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                          // Recordatorio: MongoDB guarda como [longitud, latitud], por eso el índice 1 es la latitud
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
              <Text style={styles.location}>
                {product.ubicacionTexto ?? 'Sin ubicación'}
              </Text>
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

  // 🔥 MINIATURAS
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

    // Estilos del nuevo bloque de mapa
  mapCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    padding: 16,
    marginTop: 16, // Para que se separe de la tarjeta de descripción
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