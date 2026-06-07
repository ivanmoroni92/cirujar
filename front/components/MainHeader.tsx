import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface MainHeaderProps {
    style?: StyleProp<ViewStyle>;
    onSearchChange?: (query: string) => void;
}

export default function MainHeader({ style, onSearchChange }: MainHeaderProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleChange = useCallback((text: string) => {
        setQuery(text);
        onSearchChange?.(text);
    }, [onSearchChange]);

    const handleClear = useCallback(() => {
        setQuery('');
        onSearchChange?.('');
    }, [onSearchChange]);

    return (
        <View style={[styles.header, style]}>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={handleChange}
                    maxLength={30}
                    returnKeyType="search"
                    clearButtonMode="never"
                    autoCorrect={false}
                    autoCapitalize="none"
                />

                {/* CONTENEDOR DE ICONOS (A LA DERECHA DEL TEXTO) */}
                <View style={styles.iconsContainer}>
                    {/* CRUZ DE ELIMINAR (A la izquierda de la lupa) */}
                    {query.length > 0 && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Limpiar búsqueda"
                            onPress={handleClear}
                            style={({ pressed }) => [styles.clearIconBtn, pressed && { opacity: 0.5 }]}
                            hitSlop={8}
                        >
                            <Text style={styles.clearIcon}>✕</Text>
                        </Pressable>
                    )}

                    {/* LUPA SIMPLE */}
                    <View style={styles.searchIconBtn} pointerEvents="none">
                        <Text style={styles.searchIcon}>⌕</Text>
                    </View>
                </View>
            </View>

            {/* BOTÓN AGREGAR */}
            <View style={styles.headerRight}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Agregar publicación"
                    onPress={() => router.push('/add-post')}
                    style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                    hitSlop={6}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#f0f0f0',
        gap: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
        paddingLeft: 12,
        paddingRight: 6, // Un poco menos de padding aquí porque los iconos ya tienen sus márgenes
        height: 38,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#222',
        paddingVertical: 0,
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clearIconBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchIconBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 2, // Espacio sutil entre la cruz y la lupa
    },
    searchIcon: {
        fontSize: 22,
        color: '#666',
        marginTop: -4, // Ajuste para centrar el caracter '⌕'
    },
    clearIcon: {
        fontSize: 11,
        color: '#888',
        fontWeight: '700',
    },
    headerRight: {
        justifyContent: 'center',
    },
    addButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#2a9d5c',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#0f3d24',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    addButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    addButtonText: {
        fontSize: 28,
        lineHeight: 32,
        color: '#333',
        fontWeight: '300',
        marginTop: -2,
    },
});