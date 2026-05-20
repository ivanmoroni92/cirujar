import React from 'react';
import { View, StyleSheet, Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';


interface MainHeaderProps {
    style?: StyleProp<ViewStyle>;
}

export default function MainHeader({ style }: MainHeaderProps) {
    const router = useRouter();

    return (
        <View style={[styles.header, style]}>
            <View style={styles.headerRight}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Agregar publicación"
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
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end', // Botón a la derecha
        paddingHorizontal: 16, // Padding estándar (H_PADDING)
        backgroundColor: '#f0f0f0',
    },
    headerRight: {
        justifyContent: 'center',
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
        // Sombras premium que definimos
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