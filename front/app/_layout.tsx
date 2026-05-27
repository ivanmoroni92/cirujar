import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { getStoredToken } from '@/_services/authToken';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [startupDelayDone, setStartupDelayDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartupDelayDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

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

  if (!authChecked || !startupDelayDone) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.loaderWrap}>
          <Image
            source={require('../assets/images/loading_animation.gif')}
            style={styles.loaderGif}
            contentFit="contain"
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loaderGif: {
    width: 220,
    height: 220,
  },
});
// Initial commit dev



