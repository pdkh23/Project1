import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronRight, BellRing, Calendar } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api, Client } from '../src/api';
import { loadUser } from '../src/auth';

export default function RemindersScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) return router.replace('/');
    setLoading(true);
    try {
      const r = await api.getReminders(u.user_id);
      setItems(r);
    } catch {}
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-button"
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.textMain} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Reminder</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <BellRing color={colors.primary} size={26} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Next 2 Days</Text>
          <Text style={styles.heroSub}>
            {items.length} upcoming installation{items.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          data={items}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Calendar color={colors.textMuted} size={26} />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptyText}>No installations scheduled in the next 2 days</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`reminder-row-${item.id}`}
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/client/[id]', params: { id: item.id } })
              }
              activeOpacity={0.85}
            >
              <View style={styles.dateBlock}>
                <Text style={styles.dateText}>{item.installation_date.slice(5)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>Order #{item.order_number}</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={20} />
            </TouchableOpacity>
          )}
        />
      )}
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
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#E8F0F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.textMain,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  dateBlock: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: colors.textMain,
  },
  rowName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: colors.textMain,
  },
  rowMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    ...shadows.card,
  },
  emptyTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: colors.textMain,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
