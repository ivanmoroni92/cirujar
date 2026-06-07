import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
    bottom?: number;
    right?: number;
};

export default function FloatingAddButton({ bottom = 96, right = 20 }: Props) {
    const router = useRouter();

    return (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {/* FAB superior: crear publicación vacía */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Crear publicación"
                onPress={() => router.push('/add-post')}
                hitSlop={8}
                style={({ pressed }) => [
                    styles.fabSecondary,
                    { bottom: bottom + 60, right },
                    pressed && styles.fabPressed,
                ]}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </Pressable>

            {/* FAB principal: abrir cámara directo */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Crear publicación con foto"
                onPress={() => router.push('/add-post?source=camera')}
                hitSlop={8}
                style={({ pressed }) => [
                    styles.fab,
                    { bottom, right },
                    pressed && styles.fabPressed,
                ]}
            >
                <Ionicons name="camera" size={24} color="#fff" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0a3a52',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 8,
    },
    fabSecondary: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0a3a52',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 8,
    },
    fabPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.95 }],
    },
});


