import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { getStoredToken } from '@/_services/authToken';
import IntroSplash from '@/components/intro-splash';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleIntroFinish = useCallback(() => {
    setIntroDone(true);
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

  if (!authChecked || !introDone) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <IntroSplash onFinish={handleIntroFinish} />
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

// Initial commit dev



