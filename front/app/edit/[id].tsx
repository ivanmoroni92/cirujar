import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

import { fetchProductById } from '@/_services/api';
import { API_URL } from '@/_config';

const PAD = 16;
const TITLE_MIN = 3;
const TITLE_MAX = 50;
const DESC_MAX = 255;
const MAX_EXTRAS = 3;

export default function EditPostScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [detalles, setDetalles] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [mainUri, setMainUri] = useState<string | null>(null);
  const [extras, setExtras] = useState<(string | null)[]>(() =>
    Array.from({ length: MAX_EXTRAS }, () => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // LOAD
  useEffect(() => {
    if (!id) return;

    fetchProductById(id)
      .then((p) => {
        setTitulo(p.titulo ?? '');
        setDetalles(p.detalles ?? '');
        setUbicacion(p.ubicacionTexto ?? '');

        const fotos: string[] = p.fotos ?? [];
        setMainUri(fotos[0] ?? null);
        setExtras([
          fotos[1] ?? null,
          fotos[2] ?? null,
          fotos[3] ?? null,
        ]);
      })
      .catch(() => {
        Alert.alert('Error', 'No se pudo cargar');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  const ensureLibraryPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a la galería para adjuntar fotos.');
      return false;
    }
    return true;
  }, []);

  // PICK IMAGE
  const pickImage = useCallback(async (target: 'main' | number) => {
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
        next[target as number] = uri;
        return next;
      });
    }
  }, [ensureLibraryPermission]);

  // REMOVE
  const removeMain = () => {
    const firstExtra = extras.findIndex((x) => x !== null);
    if (firstExtra >= 0) {
      setMainUri(extras[firstExtra]);
      setExtras((prev) => {
        const next = [...prev];
        next[firstExtra] = null;
        return next;
      });
    } else {
      setMainUri(null);
    }
  };

  const removeExtra = (index: number) => {
    setExtras((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // VALIDATE
  const validate = () => {
    const e: string[] = [];
    if (!titulo.trim() || titulo.length < TITLE_MIN || titulo.length > TITLE_MAX) {
      e.push('“No se pudo editar la publicación. Intentá nuevamente.”');
    }
    if (detalles.length > DESC_MAX) {
      e.push('“No se pudo editar la publicación. Intentá nuevamente.”');
    }
    if (!mainUri) {
      e.push('“No se pudo editar la publicación. Intentá nuevamente.”');
    }
    return e;
  };

  // SAVE
  const onSave = async () => {
    const e = validate();
    setErrors(e);
    if (e.length) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim() || '');
      formData.append('detalles', detalles.trim() ?? '');
      formData.append('_force_update', '1');

      const allUris: string[] = [];
      if (mainUri) allUris.push(mainUri);
      for (const x of extras) {
        if (x) allUris.push(x);
      }

      allUris.forEach((uri) => {
        if (uri.startsWith('http')) {
          formData.append('fotosMantenidas', uri);
        } else {
          const name = uri.split('/').pop() || 'img.jpg';
          formData.append('fotosNuevas', { uri, name, type: 'image/jpeg' } as any);
        }
      });

      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        throw new Error('Error update');
      }

      router.replace('/(tabs)/home');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const extrasBlocked = !mainUri;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={26} color="#111" />
            </Pressable>
            <Text style={styles.headerTitle}>Editar publicación</Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ERRORS */}
            {errors.length > 0 && (
              <View style={styles.errorBanner}>
                {errors.map((e, i) => (
                  <Text key={i} style={styles.errorBannerText}>{e}</Text>
                ))}
              </View>
            )}

            {/* IMAGEN PRINCIPAL */}
            <Pressable
              key={mainUri ?? 'empty'}
              onPress={mainUri ? undefined : () => pickImage('main')}
              style={[styles.mainPhoto, !mainUri && styles.mainPhotoEmpty]}
              accessibilityRole="button"
              accessibilityLabel="Foto principal"
            >
              {mainUri ? (
                <>
                  <Image source={{ uri: mainUri }} style={styles.mainPhotoImg} resizeMode="cover" />
                  <Pressable onPress={removeMain} style={styles.deleteX}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </>
              ) : (
                <Text style={styles.mainPhotoLabel}>Toca para subir una imagen</Text>
              )}
            </Pressable>

            {/* IMÁGENES ADICIONALES */}
            <Text style={[styles.sectionHint, extrasBlocked && styles.sectionHintDisabled]}>
              Imágenes adicionales
            </Text>
            <View style={[styles.extraRow, extrasBlocked && styles.extraRowBlocked]}>
              {[0, 1, 2].map((index) => {
                const uri = extras[index];
                return (
                  <Pressable
                    key={index}
                    onPress={!uri && !extrasBlocked ? () => pickImage(index) : undefined}
                    style={[
                      styles.extraCell,
                      !uri && styles.extraCellEmpty,
                      extrasBlocked && styles.extraCellBlocked,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Imagen adicional ${index + 1}`}
                  >
                    {uri ? (
                      <>
                        <Image source={{ uri }} style={styles.extraImg} resizeMode="cover" />
                        <Pressable onPress={() => removeExtra(index)} style={styles.deleteX}>
                          <Ionicons name="close" size={16} color="#fff" />
                        </Pressable>
                      </>
                    ) : (
                      <Ionicons
                        name="image-outline"
                        size={22}
                        color={extrasBlocked ? '#ccc' : '#7a9aad'}
                      />
                    )}
                  </Pressable>
                );
              })}

              {/* Botón + */}
              <Pressable
                onPress={() => {
                  if (extrasBlocked || submitting) return;
                  const idx = extras.findIndex((x) => !x);
                  if (idx >= 0) void pickImage(idx);
                }}
                style={[
                  styles.extraCell,
                  styles.addCell,
                  (extrasBlocked || extras.every((x) => x !== null)) && styles.addCellDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Añadir imagen"
              >
                <Text style={[styles.addPlus, extrasBlocked && { color: '#ccc' }]}>+</Text>
              </Pressable>
            </View>

            {/* INPUTS */}
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

            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={22} color="#bbb" style={styles.inputIcon} />
              <View style={[styles.input, styles.inputFlex, styles.inputDisabled]}>
                <Text style={ubicacion ? styles.inputDisabledText : styles.inputDisabledPlaceholder}>
                  {ubicacion || 'Calle, altura, localidad'}
                </Text>
              </View>
            </View>

            {/* GUARDAR */}
            <Pressable
              onPress={onSave}
              disabled={submitting}
              style={({ pressed }) => [
                styles.publishBtn,
                pressed && !submitting && styles.pressed,
                submitting && styles.publishBtnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.publishBtnText}>Actualizar publicación</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  },
  mainPhotoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C1D9D5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#9ec4d4',
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
  deleteX: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sectionHint: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  sectionHintDisabled: {
    color: '#bbb',
  },
  extraRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  extraRowBlocked: {
    opacity: 0.5,
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
  extraCellBlocked: {
    backgroundColor: '#efefef',
    borderColor: '#ddd',
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
  inputDisabled: {
    backgroundColor: '#ebebeb',
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  inputDisabledText: {
    fontSize: 16,
    color: '#aaa',
  },
  inputDisabledPlaceholder: {
    fontSize: 16,
    color: '#bbb',
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

    loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});