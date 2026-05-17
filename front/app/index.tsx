import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getStoredToken } from '@/_services/authToken';

export default function Index() {
    const [destination, setDestination] = useState<'/(tabs)/home' | '/login' | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const token = await getStoredToken();
            if (!active) return;
            setDestination(token ? '/(tabs)/home' : '/login');
        })();

        return () => {
            active = false;
        };
    }, []);

    if (!destination) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc' }}>
                <ActivityIndicator size="large" color="#2a6fd6" />
            </View>
        );
    }

    return <Redirect href={destination} />;
}
