import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { saveUser } from '../src/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignup = async () => {
    setError(null);
    const uid = userId.trim();
    const code = storeCode.trim();
    const confirm = confirmCode.trim();
    const name = displayName.trim();

    if (!uid || !code || !confirm) {
      setError('Please fill in User ID, Store Code and Confirm Code.');
      return;
    }
    if (uid.length < 3) {
      setError('User ID must be at least 3 characters.');
      return;
    }
    if (code.length < 4) {
      setError('Store Code must be at least 4 characters.');
      return;
    }
    if (code !== confirm) {
      setError('Store Codes do not match.');
      return;
    }

    setLoading(true);
    try {
      const user = await api.register(uid, code, name || undefined);
      await saveUser(user);
      router.replace('/home');
    } catch (e: any) {
      setError(e?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.textMain} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.title}>Set up your store</Text>
            <Text style={styles.subtitle}>
              Pick a unique User ID and a Store Code you&apos;ll remember. You&apos;ll use these to sign in
              later.
            </Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox} testID="signup-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Display Name <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              testID="signup-name-input"
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. My Electronics Store"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>User ID</Text>
            <TextInput
              testID="signup-userid-input"
              style={styles.input}
              value={userId}
              onChangeText={(t) => {
                setUserId(t);
                if (error) setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="3+ characters, e.g. STORE7"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Store Code</Text>
            <TextInput
              testID="signup-storecode-input"
              style={styles.input}
              value={storeCode}
              onChangeText={(t) => {
                setStoreCode(t);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="4+ characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Confirm Store Code</Text>
            <TextInput
              testID="signup-confirm-input"
              style={styles.input}
              value={confirmCode}
              onChangeText={(t) => {
                setConfirmCode(t);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Re-enter store code"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={onSignup}
            />

            <TouchableOpacity
              testID="signup-submit-button"
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={onSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/')} testID="goto-login">
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.textMain,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: { marginBottom: spacing.lg, marginTop: spacing.sm },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: colors.textMain,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.input,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: colors.textMain,
    marginBottom: 8,
  },
  optional: {
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textMuted,
    fontSize: 12,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});
