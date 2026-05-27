import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { createProduct } from '@/_services/api';
import * as Location from 'expo-location';

const PAD = 16;
const TITLE_MIN = 3;
const TITLE_MAX = 50;
const UBIC_MIN = 3;
const UBIC_MAX = 50;
const DESC_MAX = 255;
const MAX_EXTRAS = 3;

const LABEL_TITLE = 'Título';
const LABEL_UBIC = 'Ubicación';
const LABEL_PHOTOS = 'Fotos';

function unresolvedMsg(fieldLabel: string) {
  return `Tienes campos sin resolver ${fieldLabel}`;
}

export default function AddPostScreen() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [detalles, setDetalles] = useState('');
  const [mainUri, setMainUri] = useState<string | null>(null);
  const [extras, setExtras] = useState<(string | null)[]>(() =>
    Array.from({ length: MAX_EXTRAS }, () => null)
  );

  //Ver si las cambio por coordenas desde el celular
  const [coordenadas, setCoordenadas] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  useEffect(() => {
    setValidationMessages([]);
  }, [titulo, detalles, mainUri, extras]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No podemos centrar el mapa sin acceso a tu ubicación.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordenadas({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const ensureLibraryPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos',
        'Necesitamos acceso a la galería para adjuntar fotos.'
      );
      return false;
    }
    return true;
  }, []);

  const pickImage = useCallback(
    async (target: 'main' | number) => {
      if (!(await ensureLibraryPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      if (target === 'main') {
        setMainUri(uri);
      } else {
        setExtras((prev) => {
          const next = [...prev];
          next[target] = uri;
          return next;
        });
      }
    },
    [ensureLibraryPermission]
  );

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    const t = titulo.trim();
    const d = detalles;

    if (!t || t.length < TITLE_MIN || t.length > TITLE_MAX) {
      errs.push(unresolvedMsg(LABEL_TITLE));
    }
    if (d.length > DESC_MAX) {
      errs.push(`La descripción no puede superar ${DESC_MAX} caracteres`);
    }
    if (!mainUri) {
      errs.push(unresolvedMsg(LABEL_PHOTOS));
    }
    return errs;
  }, [titulo, detalles, mainUri]);

  const onPublish = useCallback(async () => {
    const errs = validate();
    setValidationMessages(errs);
    if (errs.length > 0) return;

    const uris: string[] = [];
    if (mainUri) uris.push(mainUri);
    for (const x of extras) {
      if (x) uris.push(x);
    }

    setSubmitting(true);
    try {
      await createProduct({
        titulo: titulo.trim(),
        detalles: detalles.trim(),
        latitud: coordenadas.latitude,
        longitud: coordenadas.longitude,
        imageUris: uris,
      });
      router.replace('/(tabs)/home');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo publicar';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [validate, titulo, detalles, mainUri, extras, coordenadas, router]);

  const addPlusDisabled =
    submitting ||
    Boolean(mainUri !== null && extras.every((x) => x !== null));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={26} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>Nueva publicación</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {validationMessages.length > 0 ? (
            <View style={styles.errorBanner}>
              {validationMessages.map((m, i) => (
                <Text key={i} style={styles.errorBannerText}>
                  {m}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={() => pickImage('main')}
            style={[styles.mainPhoto, !mainUri && styles.mainPhotoEmpty]}
            accessibilityRole="button"
            accessibilityLabel="Foto principal">
            {mainUri ? (
              <View style={styles.mainPhotoImageWrap}>
                <Image
                  source={{ uri: mainUri }}
                  style={styles.mainPhotoImg}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <Text style={styles.mainPhotoLabel}>Toca para subir una imagen</Text>
            )}
          </Pressable>

          <Text style={styles.sectionHint}>Imágenes adicionales</Text>
          <View style={styles.extraRow}>
            {[0, 1, 2].map((index) => {
              const uri = extras[index];
              return (
                <Pressable
                  key={index}
                  onPress={() => pickImage(index)}
                  style={[styles.extraCell, !uri && styles.extraCellEmpty]}
                  accessibilityRole="button"
                  accessibilityLabel={`Imagen adicional ${index + 1}`}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.extraImg} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={22} color="#7a9aad" />
                  )}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                if (addPlusDisabled) return;
                if (!mainUri) void pickImage('main');
                else {
                  const idx = extras.findIndex((x) => !x);
                  if (idx >= 0) void pickImage(idx);
                }
              }}
              style={[styles.extraCell, styles.addCell, addPlusDisabled && styles.addCellDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Añadir imagen">
              <Text style={styles.addPlus}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del objeto"
            placeholderTextColor="#999"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={TITLE_MAX}
            editable={!submitting}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Descripción (opcional)"
            placeholderTextColor="#999"
            value={detalles}
            onChangeText={setDetalles}
            maxLength={DESC_MAX}
            multiline
            numberOfLines={3}
            editable={!submitting}
          />

          <Text style={styles.label}>Posición exacta en el mapa</Text>
          <Text style={styles.sectionHint}>Mantén presionado y arrastra el pin o toca en otro lugar para corregir la ubicación.</Text>
          <View style={styles.mapContainer}>
            <MapView
                style={styles.map}
                region={{
                  latitude: coordenadas.latitude,
                  longitude: coordenadas.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                onPress={(e) => setCoordenadas(e.nativeEvent.coordinate)}
            >
              <UrlTile
                  urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                  maximumZ={19}
              />
              <Marker
                  draggable
                  coordinate={coordenadas}
                  onDragEnd={(e) => setCoordenadas(e.nativeEvent.coordinate)}
              />
            </MapView>
          </View>

          <Pressable
            onPress={onPublish}
            disabled={submitting}
            style={({ pressed }) => [
              styles.publishBtn,
              pressed && !submitting && styles.pressed,
              submitting && styles.publishBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Publicar">
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.publishBtnText}>Publicar</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: PAD,
    paddingBottom: 32,
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8b4b4',
    gap: 6,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#a32',
  },
  mainPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  mainPhotoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C1D9D5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#9ec4d4',
  },
  mainPhotoImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  mainPhotoImg: {
    width: '100%',
    height: '100%',
  },
  mainPhotoLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333C45',
    letterSpacing: 2,
  },
  sectionHint: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  extraRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  extraCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcecf4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#b8d4e6',
  },
  extraCellEmpty: {
    backgroundColor: '#e8f4fa',
  },
  extraImg: {
    width: '100%',
    height: '100%',
  },
  addCell: {
    backgroundColor: '#e8e8e8',
    borderColor: '#ccc',
  },
  addCellDisabled: {
    opacity: 0.45,
  },
  addPlus: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
    marginTop: -4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
    paddingLeft: 40,
  },
  publishBtn: {
    marginTop: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },

  // ESTILOS NUEVOS PARA EL MAPA
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    marginBottom: 20,
    marginTop: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
