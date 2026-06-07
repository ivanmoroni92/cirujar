import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COUNT = 36;
const CONFETTI_COLORS = ['#2a9d5c', '#0a7ea4', '#f4b400', '#d11a2a', '#7e57c2', '#ff7043'];

type Props = {
    visible: boolean;
    onAccept: () => void;
    productTitle: string;
    productPhoto?: string;
    ubicacionTexto?: string;
    retiradoAt?: string | Date | null;
};

export default function RetiroSuccessModal({
    visible,
    onAccept,
    productTitle,
    productPhoto,
    ubicacionTexto,
    retiradoAt,
}: Props) {
    const dateLabel = useMemo(() => {
        const d = retiradoAt ? new Date(retiradoAt) : new Date();
        return d.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [retiradoAt]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onAccept}>
            <View style={styles.backdrop}>
                {visible && <Confetti />}

                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark" size={36} color="#fff" />
                    </View>

                    <Text style={styles.title}>¡Retiro confirmado!</Text>
                    <Text style={styles.subtitle}>Gracias por darle una segunda vida a este objeto.</Text>

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
                            {ubicacionTexto ? (
                                <View style={styles.row}>
                                    <Ionicons name="location-outline" size={13} color="#666" />
                                    <Text style={styles.metaText} numberOfLines={1}>
                                        {ubicacionTexto}
                                    </Text>
                                </View>
                            ) : null}
                            <View style={styles.row}>
                                <Ionicons name="calendar-outline" size={13} color="#666" />
                                <Text style={styles.metaText}>{dateLabel}</Text>
                            </View>
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

function Confetti() {
    const pieces = useRef(
        Array.from({ length: CONFETTI_COUNT }).map(() => ({
            translateY: new Animated.Value(-40),
            translateX: new Animated.Value(0),
            rotate: new Animated.Value(0),
            startX: Math.random() * SCREEN_W,
            driftX: (Math.random() - 0.5) * 120,
            duration: 1800 + Math.random() * 1600,
            delay: Math.random() * 600,
            size: 6 + Math.random() * 6,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            rotateTo: (Math.random() - 0.5) * 720,
        })),
    ).current;

    useEffect(() => {
        const animations = pieces.map((p) =>
            Animated.loop(
                Animated.parallel([
                    Animated.timing(p.translateY, {
                        toValue: SCREEN_H + 60,
                        duration: p.duration,
                        delay: p.delay,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(p.translateX, {
                        toValue: p.driftX,
                        duration: p.duration,
                        delay: p.delay,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(p.rotate, {
                        toValue: p.rotateTo,
                        duration: p.duration,
                        delay: p.delay,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
            ),
        );
        animations.forEach((a) => a.start());
        return () => animations.forEach((a) => a.stop());
    }, [pieces]);

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {pieces.map((p, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.confetti,
                        {
                            left: p.startX,
                            width: p.size,
                            height: p.size * 1.6,
                            backgroundColor: p.color,
                            transform: [
                                { translateY: p.translateY },
                                { translateX: p.translateX },
                                {
                                    rotate: p.rotate.interpolate({
                                        inputRange: [-720, 720],
                                        outputRange: ['-720deg', '720deg'],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            ))}
        </View>
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
        backgroundColor: '#2a9d5c',
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#666', flexShrink: 1 },
    acceptBtn: {
        width: '100%',
        backgroundColor: '#2a9d5c',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    acceptBtnPressed: { opacity: 0.75 },
    acceptText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    confetti: {
        position: 'absolute',
        top: 0,
        borderRadius: 2,
    },
});
