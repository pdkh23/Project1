import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Hash,
  Calendar,
  FileText,
  User as UserIcon,
} from '../../src/icons';
import { colors, radius, spacing, shadows } from '../../src/theme';
import { api, Client } from '../../src/api';

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await api.getClient(id);
      setClient(c);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load client');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onEdit = () => {
    if (!client) return;
    router.push({
      pathname: '/new-entry',
      params: {
        id: client.id,
        name: client.name,
        order_number: client.order_number,
        installation_date: client.installation_date,
        order_details: client.order_details,
      },
    });
  };

  const onDelete = () => {
    if (!client) return;
    Alert.alert(
      'Delete entry',
      `Delete ${client.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteClient(client.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Delete failed', e.message);
            }
          },
        },
      ]
    );
  };

  if (loading || !client) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Client</Text>
        <TouchableOpacity
          testID="delete-button"
          style={[styles.iconBtn, { borderColor: '#FCD7D7', backgroundColor: '#FEF2F2' }]}
          onPress={onDelete}
        >
          <Trash2 color={colors.danger} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {client.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name} testID="client-name">{client.name}</Text>
          <Text style={styles.metaInline}>Order #{client.order_number}</Text>
        </View>

        <View style={styles.detailCard}>
          <DetailRow Icon={UserIcon} label="Full Name" value={client.name} />
          <DetailRow Icon={Hash} label="Order Number" value={client.order_number} />
          <DetailRow Icon={Calendar} label="Installation Date" value={client.installation_date} />
          <DetailRow
            Icon={FileText}
            label="Order Details"
            value={client.order_details || '—'}
            multiline
            isLast
          />
        </View>

        <TouchableOpacity
          testID="edit-button"
          style={styles.editBtn}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <Pencil color={colors.textInverse} size={18} />
          <Text style={styles.editText}>Edit Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  Icon,
  label,
  value,
  multiline,
  isLast,
}: {
  Icon: any;
  label: string;
  value: string;
  multiline?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Icon color={colors.primary} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, multiline && { lineHeight: 22 }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 30,
    color: colors.textInverse,
  },
  name: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: colors.textInverse,
    textAlign: 'center',
  },
  metaInline: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 4,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F0F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: colors.textMain,
    marginTop: 4,
  },
  editBtn: {
    marginTop: spacing.lg,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  editText: {
    color: colors.textInverse,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
  },
});
