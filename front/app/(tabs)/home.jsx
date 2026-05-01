import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IS_MOCK, MOCK_POSTS } from '@/_fake';
import { IMAGE_PLACEHOLDER } from '@/_constants';
import { fetchProducts } from '@/_services/api';

const H_PADDING = 16;
const COLUMN_GAP = 8;

function isRemoteImageUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function mapProductToPost(product) {
  const coords = product.ubicacion?.coordinates;
  const lng = coords?.[0];
  const lat = coords?.[1];
  const fromCoords =
    typeof lat === 'number' && typeof lng === 'number'
      ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      : null;
  const location =
    (product.ubicacionTexto && String(product.ubicacionTexto).trim()) || fromCoords || '—';

  return {
    id: String(product._id),
    title: product.titulo ?? '',
    description: product.detalles ?? '',
    creation: product.createdAt ? new Date(product.createdAt) : new Date(),
    location,
    image: product.fotos?.[0] ?? '',
  };
}

function PostCardImage({ imageUri, style }) {
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
          source={source}
          onError={() => {
            if (useRemote) setRemoteFailed(true);
          }}
        />
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState(IS_MOCK ? MOCK_POSTS : []);
  const [loading, setLoading] = useState(!IS_MOCK);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async (options) => {
    const isPullRefresh = Boolean(options?.refresh);
    if (IS_MOCK) {
      setPosts(MOCK_POSTS);
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
      const products = await fetchProducts();
      setPosts(products.map(mapProductToPost));
    } catch (e) {
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


  const calculateTime = (creation) => {
    const diff = new Date().getTime() - creation.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffSeconds = Math.floor(diff / 1000);
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMinutes < 1) {
      return "hace: " + diffSeconds + "seg";
    } else if (diffHours < 1) {
      return "hace: " + diffMinutes + "min";
    } else if (diffHours < 24) {
      return "hace: " + diffHours + "h";
    } else if (diffDays < 30) {
      return "hace: " + diffDays + "días";
    } else {
      return "hace: " + diffMonths + "meses";
    } 
  }
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = useMemo(() => {
    const totalGaps = COLUMN_GAP * 2;
    return (windowWidth - H_PADDING * 2 - totalGaps) / 3;
  }, [windowWidth]);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      <PostCardImage imageUri={item.image} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar publicación"
          onPress={() => {
            router.push('/add-post');
          }}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            onPress={loadPosts}
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
          data={posts}
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
            !IS_MOCK ? (
              <Text style={styles.emptyText}>No hay productos.</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: H_PADDING,
    paddingBottom: 12,
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
  headerSpacer: {
    flex: 1,
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
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 24,
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
    marginBottom: 6,
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
