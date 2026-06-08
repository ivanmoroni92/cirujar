import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const INTRO_VIDEO = require('../assets/images/loading_animation.mp4');
const INTRO_POSTER = require('../assets/images/loading_screen.png');

type Props = {
    onFinish: () => void;
};

export default function IntroSplash({ onFinish }: Props) {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    const player = useVideoPlayer(INTRO_VIDEO, (p) => {
        p.loop = false;
        p.muted = true;
    });

    useEffect(() => {
        let mounted = true;

        const statusSub = player.addListener('statusChange', ({ status }) => {
            if (!mounted) return;
            if (status === 'readyToPlay') {
                setReady(true);
                try { player.play(); } catch { }
            } else if (status === 'error') {
                setFailed(true);
                onFinish();
            }
        });

        const endSub = player.addListener('playToEnd', () => {
            if (mounted) onFinish();
        });

        // Fallback de seguridad: si nada ocurre en 6s, continuar igual
        const timeout = setTimeout(() => {
            if (mounted) onFinish();
        }, 6000);

        return () => {
            mounted = false;
            clearTimeout(timeout);
            try { endSub.remove(); } catch { }
            try { statusSub.remove(); } catch { }
        };
    }, [player, onFinish]);

    return (
        <View style={styles.wrap}>
            {/* Poster siempre debajo, evita pantalla en blanco mientras el video arranca o si falla */}
            <Image source={INTRO_POSTER} style={styles.poster} resizeMode="cover" />
            {ready && !failed && (
                <VideoView
                    player={player}
                    style={styles.video}
                    contentFit="cover"
                    nativeControls={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    poster: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    video: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
});
