import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useEffect } from 'react';
import { colors } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = String(args[0] ?? '');
      if (message.includes('props.pointerEvents is deprecated')) return;
      if (message.includes('Blocked aria-hidden on an element because its descendant retained focus')) return;
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const [loaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );
}
