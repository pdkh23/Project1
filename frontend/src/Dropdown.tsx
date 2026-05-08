import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { ChevronRight } from './icons';
import { colors, radius, spacing, shadows } from './theme';

type Props = {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  testID?: string;
  width?: number | string;
};

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select',
  testID,
  width,
}: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        testID={testID}
        style={[styles.field, width ? { width: width as any } : { flex: 1 }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.fieldText, !current && { color: colors.textMuted }]}>
          {current ? current.label : placeholder}
        </Text>
        <View style={styles.caret}>
          <ChevronRight color={colors.textMuted} size={16} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`${testID}-option-${item.value}`}
                  style={[
                    styles.option,
                    item.value === value && styles.optionActive,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    backgroundColor: '#FAFBFD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: colors.textMain,
  },
  caret: {
    transform: [{ rotate: '90deg' }],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6,18,36,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  sheetTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: colors.textMain,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.input,
  },
  optionActive: {
    backgroundColor: '#E8F0F9',
  },
  optionText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: colors.textMain,
  },
  optionTextActive: {
    color: colors.primary,
    fontFamily: 'Outfit_600SemiBold',
  },
});
