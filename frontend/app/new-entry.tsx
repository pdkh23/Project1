import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { loadUser } from '../src/auth';
import { Dropdown } from '../src/Dropdown';

const PROVIDERS = ['Virgin', 'Bell'];

const MONTHS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1}`,
  value: pad(i + 1),
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => {
  const y = CURRENT_YEAR - 1 + i;
  return { label: `${y}`, value: `${y}` };
});

function todayParts() {
  const d = new Date();
  return {
    day: pad(d.getDate()),
    month: pad(d.getMonth() + 1),
    year: `${d.getFullYear()}`,
  };
}

function splitDate(iso?: string) {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return { year: y, month: m, day: d };
  }
  const t = todayParts();
  return { year: t.year, month: t.month, day: t.day };
}

export default function NewEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    phone_number?: string;
    order_number?: string;
    provider?: string;
    installation_date?: string;
    order_details?: string;
  }>();
  const isEdit = Boolean(params.id);

  const initial = useMemo(() => splitDate(params.installation_date), []);

  const [name, setName] = useState(params.name || '');
  const [phone, setPhone] = useState(params.phone_number || '');
  const [orderNumber, setOrderNumber] = useState(params.order_number || '');
  const [provider, setProvider] = useState(params.provider || '');
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [details, setDetails] = useState(params.order_details || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!name.trim() || !orderNumber.trim()) {
      setError('Name and Order Number are required.');
      return;
    }
    if (!day || !month || !year) {
      setError('Please pick a full installation date.');
      return;
    }
    const installation_date = `${year}-${month}-${day}`;
    // Sanity: validate date is real (e.g. Feb 30)
    const dt = new Date(installation_date);
    if (
      Number.isNaN(dt.getTime()) ||
      `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` !==
        installation_date
    ) {
      setError('That date is not valid. Please pick another.');
      return;
    }

    const u = await loadUser();
    if (!u) return router.replace('/');

    setSaving(true);
    try {
      if (isEdit && params.id) {
        await api.updateClient(params.id, {
          name: name.trim(),
          phone_number: phone.trim(),
          order_number: orderNumber.trim(),
          provider,
          installation_date,
          order_details: details.trim(),
        });
      } else {
        await api.createClient({
          owner_user_id: u.user_id,
          name: name.trim(),
          phone_number: phone.trim(),
          order_number: orderNumber.trim(),
          provider,
          installation_date,
          order_details: details.trim(),
        });
      }
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Save failed. Please try again.');
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
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox} testID="entry-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Name</Text>
            <TextInput
              testID="entry-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Client full name"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />

            <Text style={[styles.label, styles.spacer]}>Phone Number</Text>
            <TextInput
              testID="entry-phone-input"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1 416 555 0123"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoCorrect={false}
            />

            <Text style={[styles.label, styles.spacer]}>Order Number</Text>
            <TextInput
              testID="entry-order-input"
              style={styles.input}
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="e.g. ORD-2026-001"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={[styles.label, styles.spacer]}>Provider</Text>
            <View style={styles.chipsRow}>
              {PROVIDERS.map((p) => {
                const active = provider === p;
                return (
                  <TouchableOpacity
                    key={p}
                    testID={`entry-provider-${p.toLowerCase()}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setProvider(active ? '' : p)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, styles.spacer]}>Date of Installation</Text>
            <View style={styles.dateRow}>
              <Dropdown
                testID="entry-day-dropdown"
                value={day}
                onChange={setDay}
                options={DAYS}
                placeholder="Day"
              />
              <Dropdown
                testID="entry-month-dropdown"
                value={month}
                onChange={setMonth}
                options={MONTHS}
                placeholder="Month"
              />
              <Dropdown
                testID="entry-year-dropdown"
                value={year}
                onChange={setYear}
                options={YEARS}
                placeholder="Year"
              />
            </View>

            <Text style={[styles.label, styles.spacer]}>Order Details</Text>
            <TextInput
              testID="entry-details-input"
              style={[styles.input, styles.inputMultiline]}
              value={details}
              onChangeText={setDetails}
              placeholder="Service bought / notes"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
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
  spacer: { marginTop: spacing.md },
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
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.textMain,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    marginTop: spacing.lg,
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
