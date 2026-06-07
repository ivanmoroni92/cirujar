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
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar publicación"
                onPress={() => router.push('/add-post')}
                hitSlop={8}
                style={({ pressed }) => [
                    styles.fab,
                    { bottom, right },
                    pressed && styles.fabPressed,
                ]}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0a3a52',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    fabPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.95 }],
    },
});
