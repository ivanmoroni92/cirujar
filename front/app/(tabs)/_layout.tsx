import { Tabs, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Image, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser } from '@/_services/authToken';

type TabButtonProps = {
    accessibilityState?: any;
    onPress?: ((...args: any[]) => void) | null;
    onLongPress?: ((...args: any[]) => void) | null;
    children?: React.ReactNode;
};

type StoredUser = Awaited<ReturnType<typeof getStoredUser>>;

// AVATAR AJUSTADO PARA EL BOTÓN LATERAL
function ProfileAvatarIcon({ color, focused, user }: { color: string; focused: boolean; user: StoredUser }) {
    const avatarUri = user?.imagenPerfil?.trim();

    return (
        <View style={[styles.sideIconWrap, focused && styles.sideIconWrapFocused]}>
            {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.sideAvatarImage} />
            ) : (
                <Ionicons name="person-outline" size={30} color={color} />
            )}
        </View>
    );
}

// BOTÓN ESTÁNDAR (Izquierda y Derecha)
function SideTabButton({ accessibilityState, onPress, onLongPress, children }: TabButtonProps) {
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
            style={({ pressed }) => [styles.sideButton, pressed && styles.sideButtonPressed]}>
            <Animated.View
                style={{
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
                }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

// BOTÓN FLOTANTE (Centro)
function CenterTabButton({ accessibilityState, onPress, onLongPress, children }: TabButtonProps) {
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
            style={({ pressed }) => [styles.centerButton, pressed && styles.centerButtonPressed]}>
            <Animated.View
                style={[
                    styles.centerButtonInner,
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
                                    outputRange: [0, -10],
                                }),
                            },
                            {
                                scale: activeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.06],
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
    const router = useRouter();

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
            initialRouteName="home"
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                tabBarInactiveTintColor: '#8b96ad',
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
            }}>

            {/* BOTÓN IZQUIERDO: Perfil Ciruja */}
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarButton: (props) => <SideTabButton {...props} />,
                    tabBarItemStyle: styles.leftTabItem,
                    tabBarIcon: ({ color, focused }) => (
                        <ProfileAvatarIcon color={color} focused={focused} user={storedUser} />
                    ),
                }}
            />

            {/* BOTÓN CENTRAL: Vista Mapa (Flotante) */}
            <Tabs.Screen
                name="home"
                options={{
                    tabBarButton: (props) => <CenterTabButton {...props} />,
                    tabBarItemStyle: styles.centerTabItem,
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.centerIconShadow, focused && styles.centerIconShadowFocused]}>
                            <Ionicons name={focused ? "map" : "map-outline"} size={36} color={color} />
                        </View>
                    ),
                }}
            />

            {/* BOTÓN DERECHO: Vista Listado  */}
            <Tabs.Screen
                name="list-products"
                options={{
                    tabBarButton: (props) => <SideTabButton {...props} />,
                    tabBarItemStyle: styles.rightTabItem,
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.sideIconWrap, focused && styles.sideIconWrapFocused]}>
                            <Ionicons name={focused ? "list" : "list-outline"} size={30} color={color} />
                        </View>
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
        bottom: 14,
        height: 64,
        borderTopWidth: 0,
        borderRadius: 32,
        backgroundColor: 'rgba(248, 251, 255, 0.94)',
        shadowColor: '#0f1c3d',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    leftTabItem: {
        height: '100%',
        flex: 0,
        width: 64,
    },
    rightTabItem: {
        height: '100%',
        flex: 0,
        width: 64,
    },
    centerTabItem: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -28,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
    },

    // ESTILOS PARA BOTONES LATERALES
    sideButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sideButtonPressed: {
        opacity: 0.9,
    },
    sideIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(40, 76, 128, 0.06)',
        overflow: 'hidden',
    },
    sideIconWrapFocused: {
        backgroundColor: 'rgba(41, 111, 214, 0.18)',
    },
    sideAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },

    // ESTILOS PARA EL BOTÓN CENTRAL FLOTANTE
    centerButton: {
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonPressed: {
        opacity: 0.95,
    },
    centerButtonInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 10,
    },
    centerIconShadow: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2fb',
        borderWidth: 1,
        borderColor: 'rgba(41, 111, 214, 0.18)',
    },
    centerIconShadowFocused: {
        borderColor: 'rgba(41, 111, 214, 0.45)',
        borderWidth: 1.5,
        backgroundColor: '#e5edfa',
    },
});