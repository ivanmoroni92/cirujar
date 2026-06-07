import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DEFAULT_COLORS = ['#2a9d5c', '#0a7ea4', '#f4b400', '#d11a2a', '#7e57c2', '#ff7043'];

type Props = {
    count?: number;
    colors?: string[];
};

export default function Confetti({ count = 36, colors = DEFAULT_COLORS }: Props) {
    const pieces = useRef(
        Array.from({ length: count }).map(() => ({
            translateY: new Animated.Value(-40),
            translateX: new Animated.Value(0),
            rotate: new Animated.Value(0),
            startX: Math.random() * SCREEN_W,
            driftX: (Math.random() - 0.5) * 120,
            duration: 1800 + Math.random() * 1600,
            delay: Math.random() * 600,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
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
    confetti: {
        position: 'absolute',
        top: 0,
        borderRadius: 2,
    },
});
