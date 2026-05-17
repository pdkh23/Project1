import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, ClipboardList, Plus, BellRing, LogOut, Calendar } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api, Client, User } from '../src/api';
import { clearUser, loadUser } from '../src/auth';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) {
      router.replace('/');
      return;
    }
    setUser(u);
    try {
      const r = await api.getReminders(u.user_id);
      setReminders(r);
    } catch {}
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onLogout = async () => {
    await clearUser();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.brand} testID="home-greeting">{user?.display_name || 'BRS'}</Text>
          </View>
          <TouchableOpacity
            testID="logout-button"
            onPress={onLogout}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <LogOut color={colors.textMain} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Action cards */}
        <View style={styles.cardsCol}>
          <ActionCard
            testID="card-past-entry"
            title="Past Entry"
            description="Browse all your saved client orders"
            Icon={ClipboardList}
            onPress={() => router.push('/clients')}
          />
          <ActionCard
            testID="card-new-entry"
            title="New Entry"
            description="Add a new client and order details"
            Icon={Plus}
            onPress={() => router.push('/new-entry')}
            highlight
          />
          <ActionCard
            testID="card-daily-reminder"
            title="Daily Reminder"
            description="Upcoming installations in next 2 days"
            Icon={BellRing}
            badge={reminders.length}
            onPress={() => router.push('/reminders')}
          />
        </View>

        {/* Reminders preview */}
        <View style={styles.previewBlock}>
          <View style={styles.previewHeader}>
            <Text style={styles.sectionTitle}>Daily Reminder</Text>
            {reminders.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/reminders')} testID="view-all-reminders">
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            )}
          </View>

          {reminders.length === 0 ? (
            <View style={[styles.emptyCard]}>
              <Calendar color={colors.textMuted} size={22} />
              <Text style={styles.emptyText}>No upcoming installations</Text>
            </View>
          ) : (
            reminders.slice(0, 3).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.reminderRow}
                onPress={() => router.push({ pathname: '/client/[id]', params: { id: c.id } })}
                activeOpacity={0.85}
                testID={`reminder-row-${c.id}`}
              >
                <View style={styles.dotCol}>
                  <View style={styles.dot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>{c.name}</Text>
                  <Text style={styles.reminderDate}>Installation: {c.installation_date}</Text>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  title,
  description,
  Icon,
  onPress,
  badge,
  highlight,
  testID,
}: {
  title: string;
  description: string;
  Icon: any;
  onPress: () => void;
  badge?: number;
  highlight?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.actionCard, highlight && styles.actionCardHighlight]}
    >
      <View
        style={[
          styles.actionIcon,
          highlight && { backgroundColor: 'rgba(255,255,255,0.18)' },
        ]}
      >
        <Icon
          color={highlight ? colors.textInverse : colors.primary}
          size={26}
          strokeWidth={2}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, highlight && { color: colors.textInverse }]}>
          {title}
        </Text>
        <Text style={[styles.actionDesc, highlight && { color: 'rgba(255,255,255,0.85)' }]}>
          {description}
        </Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge} testID={`${testID}-badge`}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight
        color={highlight ? colors.textInverse : colors.textMuted}
        size={22}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  welcome: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.textMuted,
  },
  brand: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: colors.textMain,
    letterSpacing: -0.8,
    marginTop: 2,
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
  cardsCol: { gap: spacing.md },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  actionCardHighlight: {
    backgroundColor: colors.primary,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F0F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 19,
    color: colors.textMain,
  },
  actionDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.secondary,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: colors.textMain,
  },
  previewBlock: {
    marginTop: spacing.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    color: colors.textMain,
  },
  linkText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.card,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  reminderRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.card,
  },
  dotCol: { width: 16, alignItems: 'center', marginRight: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  reminderName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: colors.textMain,
  },
  reminderDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
