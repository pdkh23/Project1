import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { loadUser, saveUser } from '../src/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await loadUser();
      if (u) {
        router.replace('/home');
      } else {
        setBootstrapping(false);
      }
    })();
  }, []);

  const onLogin = async () => {
    if (!userId.trim() || !storeCode.trim()) {
      Alert.alert('Missing info', 'Please enter both User ID and Store Code.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.login(userId.trim(), storeCode.trim());
      await saveUser(user);
      router.replace('/home');
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (bootstrapping) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon} testID="brand-icon">
              <Bell color={colors.primary} size={28} strokeWidth={2.2} />
            </View>
            <Text style={styles.brand}>BRS</Text>
            <Text style={styles.tagline}>Reminder & Order Tracker</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in to your store account</Text>

            <Text style={styles.label}>User ID</Text>
            <TextInput
              testID="login-userid-input"
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="e.g. BRS"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Store Code</Text>
            <TextInput
              testID="login-storecode-input"
              style={styles.input}
              value={storeCode}
              onChangeText={setStoreCode}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g. 1001"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={onLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              Demo: <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>BRS / 1001</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  brandWrap: { alignItems: 'center', marginBottom: spacing.xl },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E8F0F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: colors.textMain,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: colors.textMain,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textMain,
    backgroundColor: '#FAFBFD',
  },
  button: {
    marginTop: spacing.lg,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textInverse,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
  },
  hint: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
});
