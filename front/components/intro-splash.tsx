import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

const INTRO_VIDEO = require('../assets/images/loading_animation.mp4');

type Props = {
    onFinish: () => void;
};

export default function IntroSplash({ onFinish }: Props) {
    const player = useVideoPlayer(INTRO_VIDEO, (p) => {
        p.loop = false;
        p.muted = true;
    });

    useEffect(() => {
        let mounted = true;

        try {
            player.play();
        } catch {
            // player puede estar liberado (fast refresh)
        }

        const endSub = player.addListener('playToEnd', () => {
            if (mounted) onFinish();
        });
        const statusSub = player.addListener('statusChange', ({ status }) => {
            if (mounted && status === 'error') onFinish();
        });

        // Fallback de seguridad: si el video no dispara playToEnd en 6s, continuar igual
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
            <VideoView
                player={player}
                style={styles.video}
                contentFit="cover"
                nativeControls={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});
