import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Confetti from './confetti';

type Props = {
    visible: boolean;
    onAccept: () => void;
    productTitle: string;
    productPhoto?: string;
};

export default function PublishSuccessModal({
    visible,
    onAccept,
    productTitle,
    productPhoto,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onAccept}>
            <View style={styles.backdrop}>
                {visible && <Confetti />}

                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark" size={36} color="#fff" />
                    </View>

                    <Text style={styles.title}>¡Publicación creada!</Text>
                    <Text style={styles.subtitle}>
                        Tu objeto ya está visible para la comunidad.
                    </Text>

                    <View style={styles.summary}>
                        {productPhoto ? (
                            <Image source={{ uri: productPhoto }} style={styles.photo} />
                        ) : (
                            <View style={[styles.photo, styles.photoPlaceholder]}>
                                <Ionicons name="image-outline" size={22} color="#9aa4b3" />
                            </View>
                        )}
                        <View style={styles.summaryText}>
                            <Text style={styles.productTitle} numberOfLines={2}>
                                {productTitle}
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        onPress={onAccept}
                        style={({ pressed }) => [styles.acceptBtn, pressed && styles.acceptBtnPressed]}
                    >
                        <Text style={styles.acceptText}>Aceptar</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 20,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 18,
    },
    summary: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        backgroundColor: '#f6f7f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
    },
    photo: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: '#e7e9ee',
    },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: { flex: 1, gap: 4, justifyContent: 'center' },
    productTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
    acceptBtn: {
        width: '100%',
        backgroundColor: '#0a7ea4',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    acceptBtnPressed: { opacity: 0.75 },
    acceptText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
