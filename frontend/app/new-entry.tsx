import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { loadUser } from '../src/auth';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    order_number?: string;
    installation_date?: string;
    order_details?: string;
  }>();
  const isEdit = Boolean(params.id);

  const [name, setName] = useState(params.name || '');
  const [orderNumber, setOrderNumber] = useState(params.order_number || '');
  const [installDate, setInstallDate] = useState(params.installation_date || todayISO());
  const [details, setDetails] = useState(params.order_details || '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!name.trim() || !orderNumber.trim() || !installDate.trim()) {
      Alert.alert('Missing info', 'Name, order number and installation date are required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(installDate.trim())) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format (e.g. 2026-02-20).');
      return;
    }
    const u = await loadUser();
    if (!u) return router.replace('/');

    setSaving(true);
    try {
      if (isEdit && params.id) {
        await api.updateClient(params.id, {
          name: name.trim(),
          order_number: orderNumber.trim(),
          installation_date: installDate.trim(),
          order_details: details.trim(),
        });
      } else {
        await api.createClient({
          owner_user_id: u.user_id,
          name: name.trim(),
          order_number: orderNumber.trim(),
          installation_date: installDate.trim(),
          order_details: details.trim(),
        });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.textMain} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Entry' : 'New Entry'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Field
              label="Client Name"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              testID="entry-name-input"
            />
            <Field
              label="Order Number"
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="e.g. ORD-2026-001"
              testID="entry-order-input"
              autoCapitalize="characters"
            />
            <Field
              label="Date of Installation"
              value={installDate}
              onChangeText={setInstallDate}
              placeholder="YYYY-MM-DD"
              testID="entry-date-input"
              autoCapitalize="none"
            />
            <Field
              label="Order Details"
              value={details}
              onChangeText={setDetails}
              placeholder="Service bought / notes"
              testID="entry-details-input"
              multiline
            />

            <TouchableOpacity
              testID="save-button"
              style={[styles.button, saving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Save color={colors.textInverse} size={18} />
                  <Text style={styles.buttonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline,
  ...rest
}: {
  label: string;
  multiline?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.textMuted}
      />
    </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: colors.textMain,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textMain,
    backgroundColor: '#FAFBFD',
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  button: {
    marginTop: spacing.sm,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: colors.textInverse,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
  },
});
