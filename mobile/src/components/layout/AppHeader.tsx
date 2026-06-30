import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

export const HEADER_ROW_HEIGHT = 56;
export const HEADER_ICON_SLOT = 44;

type AppHeaderVariant = 'dashboard' | 'stack' | 'hero';

interface AppHeaderProps {
  variant: AppHeaderVariant;
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
  onBack?: () => void;
  onHelp?: () => void;
  hideLeft?: boolean;
  rightElement?: React.ReactNode;
  /** Extra content below the toolbar row (hero greeting, etc.). */
  heroExtension?: React.ReactNode;
}

function HeaderMenuButton({ onPress, lineColor }: { onPress: () => void; lineColor: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconSlot}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <View style={styles.menuIcon}>
        <View style={[styles.menuLine, { backgroundColor: lineColor }]} />
        <View style={[styles.menuLine, styles.menuLineShort, { backgroundColor: lineColor }]} />
        <View style={[styles.menuLine, { backgroundColor: lineColor }]} />
      </View>
    </TouchableOpacity>
  );
}

function HeaderIconPlaceholder() {
  return <View style={styles.iconSlot} />;
}

export function AppHeader({
  variant,
  title,
  subtitle,
  onMenuPress,
  showMenu = true,
  onBack,
  onHelp,
  hideLeft,
  rightElement,
  heroExtension,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { scaledFontSize: fs } = useScaledTheme();
  const isHero = variant === 'hero';
  const isStack = variant === 'stack';
  const lineColor = isHero ? colors.text : colors.textSecondary;
  const iconColor = isHero ? colors.text : colors.primary;

  const leftSlot = (() => {
    if (isStack) {
      if (hideLeft) return <View style={styles.iconSlotHidden} />;
      if (onBack) {
        return (
          <TouchableOpacity onPress={onBack} style={styles.iconSlot} hitSlop={12} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={iconColor} />
          </TouchableOpacity>
        );
      }
      return <HeaderIconPlaceholder />;
    }
    if (showMenu && onMenuPress) {
      return <HeaderMenuButton onPress={onMenuPress} lineColor={lineColor} />;
    }
    return <HeaderIconPlaceholder />;
  })();

  const rightSlot = rightElement ?? (isStack && onHelp ? (
    <TouchableOpacity onPress={onHelp} style={styles.iconSlot} hitSlop={12} accessibilityRole="button">
      <Ionicons name="help-circle-outline" size={22} color={iconColor} />
    </TouchableOpacity>
  ) : (
    <HeaderIconPlaceholder />
  ));

  const titleBlock = (
    <View style={[styles.titleBlock, isStack && styles.titleBlockCenter]}>
      <Text
        style={[
          styles.title,
          { fontSize: fs.lg },
          !isStack && styles.titleModule,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { fontSize: fs.xs },
            isHero && styles.subtitleHero,
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.wrap,
        isHero ? styles.wrapHero : styles.wrapSurface,
        { paddingTop: insets.top + spacing.sm },
      ]}
    >
      <View style={styles.row}>
        {leftSlot}
        {isStack ? (
          <>
            {titleBlock}
            {rightSlot}
          </>
        ) : (
          <>
            {titleBlock}
            <View style={styles.actions}>{rightSlot}</View>
          </>
        )}
      </View>
      {heroExtension ? <View style={styles.heroExtension}>{heroExtension}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  wrapSurface: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wrapHero: {
    backgroundColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_ROW_HEIGHT,
    gap: spacing.sm,
  },
  iconSlot: {
    width: HEADER_ICON_SLOT,
    height: HEADER_ICON_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotHidden: { width: 0 },
  menuIcon: { justifyContent: 'center', gap: 5 },
  menuLine: { height: 2, width: 20, borderRadius: 1 },
  menuLineShort: { width: 16 },
  titleBlock: { flex: 1 },
  titleBlockCenter: { alignItems: 'center' },
  title: { fontWeight: '800', color: colors.text },
  titleModule: { textTransform: 'capitalize' },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  subtitleHero: { color: colors.text, opacity: 0.75 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroExtension: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
});
