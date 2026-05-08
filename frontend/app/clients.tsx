import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, ChevronRight, FileText, Plus } from '../src/icons';
import { colors, radius, spacing, shadows } from '../src/theme';
import { api, Client } from '../src/api';
import { loadUser } from '../src/auth';

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query?: string) => {
    const u = await loadUser();
    if (!u) {
      router.replace('/');
      return;
    }
    setLoading(true);
    try {
      const data = await api.listClients(u.user_id, query);
      setClients(data);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(q);
    }, [load])
  );

  const onSearch = (text: string) => {
    setQ(text);
    load(text);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-button"
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft color={colors.textMain} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Entry</Text>
        <TouchableOpacity
          testID="header-add-button"
          style={[styles.iconBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => router.push('/new-entry')}
          activeOpacity={0.85}
        >
          <Plus color={colors.textInverse} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search color={colors.textMuted} size={18} />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          value={q}
          onChangeText={onSearch}
          placeholder="Search clients, order #, details"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          data={clients}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <FileText color={colors.textMuted} size={28} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>Tap the + button to create your first client entry</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`client-row-${item.id}`}
              style={styles.row}
              onPress={() => router.push({ pathname: '/client/[id]', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>
                  {item.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  #{item.order_number} · {item.installation_date}
                </Text>
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
  searchWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: colors.textMain,
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
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F0F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowAvatarText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: colors.primary,
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
    marginTop: spacing.lg,
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
