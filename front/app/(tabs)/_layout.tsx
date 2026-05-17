import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Image, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser } from '@/_services/authToken';

type TabButtonProps = {
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  onLongPress?: () => void;
  children?: React.ReactNode;
};

type StoredUser = Awaited<ReturnType<typeof getStoredUser>>;

function ProfileAvatarIcon({ color, focused, user }: { color: string; focused: boolean; user: StoredUser }) {
  const avatarUri = user?.imagenPerfil?.trim();

  return (
    <View style={[styles.profileAvatarShadow, focused && styles.profileAvatarShadowFocused]}>
      <View style={styles.profileAvatarClip}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.profileAvatarImage} />
        ) : (
          <Ionicons name="person-outline" size={26} color={color} />
        )}
      </View>
    </View>
  );
}

function HomeTabButton({ accessibilityState, onPress, onLongPress, children }: TabButtonProps) {
  const focused = !!accessibilityState?.selected;
  const activeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [focused, activeAnim]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}>
      <Animated.View
        style={{
          transform: [
            {
              translateY: activeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            },
            {
              scale: activeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.08],
              }),
            },
          ],
        }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function ProfileTabButton({ accessibilityState, onPress, onLongPress, children }: TabButtonProps) {
  const focused = !!accessibilityState?.selected;
  const activeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: focused ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [focused, activeAnim]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}>
      <Animated.View
        style={[
          styles.profileButtonInner,
          {
            shadowOpacity: activeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.22, 0.35],
            }) as unknown as number,
            shadowRadius: activeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 24],
            }) as unknown as number,
            elevation: activeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 12],
            }) as unknown as number,
            transform: [
              {
                translateY: activeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
              {
                scale: activeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [storedUser, setStoredUser] = useState<StoredUser>(null);

  const refreshStoredUser = useCallback(async () => {
    const user = await getStoredUser();
    setStoredUser(user);
  }, []);

  useEffect(() => {
    refreshStoredUser();

    const subscription = DeviceEventEmitter.addListener('cirujar:auth-user-updated', refreshStoredUser);
    return () => {
      subscription.remove();
    };
  }, [refreshStoredUser]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#8b96ad',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarButton: (props) => <HomeTabButton {...props} />,
          tabBarItemStyle: styles.homeTabItem,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.homeIconWrap, focused && styles.homeIconWrapFocused]}>
              <Ionicons name="home-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarButton: (props) => <ProfileTabButton {...props} />,
          tabBarItemStyle: styles.profileTabItem,
          tabBarIcon: ({ color, focused }) => (
            <ProfileAvatarIcon color={color} focused={focused} user={storedUser} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    height: 76,
    borderTopWidth: 0,
    borderRadius: 34,
    backgroundColor: 'rgba(248, 251, 255, 0.94)',
    shadowColor: '#0f1c3d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    paddingHorizontal: 20,
  },
  homeTabItem: {
    maxWidth: 80,
    marginLeft: 4,
  },
  profileTabItem: {
    position: 'absolute',
    left: '50%',
    marginLeft: -36,
    top: -24,
    width: 72,
    height: 72,
  },
  homeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonPressed: {
    opacity: 0.9,
  },
  homeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 76, 128, 0.06)',
  },
  homeIconWrapFocused: {
    backgroundColor: 'rgba(41, 111, 214, 0.18)',
  },
  profileButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    opacity: 0.95,
  },
  profileButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#1a3a6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  profileAvatarShadow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2fb',
    borderWidth: 1.5,
    borderColor: 'rgba(41, 111, 214, 0.18)',
    shadowColor: '#1a3a6b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatarShadowFocused: {
    borderColor: 'rgba(41, 111, 214, 0.45)',
    borderWidth: 2,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 9,
  },
  profileAvatarClip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2fb',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
});

