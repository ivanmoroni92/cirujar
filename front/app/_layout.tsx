import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { getStoredToken } from '@/_services/authToken';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PUBLIC_ROUTES = ['/login', '/register'];
const INTRO_VIDEO = require('../assets/images/loading_animation.mp4');

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const introPlayer = useVideoPlayer(INTRO_VIDEO, (player) => {
    player.loop = false;
    player.muted = true;
  });

  useEffect(() => {
    let mounted = true;

    try {
      introPlayer.play();
    } catch {
      // player puede haber sido liberado por fast refresh
    }

    const endSub = introPlayer.addListener('playToEnd', () => {
      if (mounted) setIntroDone(true);
    });
    const statusSub = introPlayer.addListener('statusChange', ({ status }) => {
      if (mounted && status === 'error') setIntroDone(true);
    });

    return () => {
      mounted = false;
      try { endSub.remove(); } catch { }
      try { statusSub.remove(); } catch { }
    };
  }, [introPlayer]);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getStoredToken();
      if (!active) return;
      setIsAuthenticated(Boolean(token));
      setAuthChecked(true);
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!authChecked) return;

    const currentPath = pathname ?? '/';
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/(tabs)/home');
    }
  }, [authChecked, isAuthenticated, pathname, router]);

  if (!authChecked || !introDone) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.loaderWrap}>
          <VideoView
            player={introPlayer}
            style={styles.loaderVideo}
            contentFit="cover"
            nativeControls={false}
          />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-post" options={{ headerShown: false }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loaderVideo: {
    width: '100%',
    height: '100%',
  },
});
// Initial commit dev



