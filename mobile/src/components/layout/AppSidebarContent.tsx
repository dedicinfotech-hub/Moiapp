import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppSidebarSections, type AppModule } from '../../lib/navigation';
import { useAuthStore } from '../../store/authStore';
import { useFeatures } from '../../hooks/useFeatures';
import { useModuleLabels } from '../../i18n/useModuleLabels';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { navigateToModule, registerModuleNavigateListener } from '../../navigation/navigationRef';
import { useSidebar } from '../../context/SidebarContext';
import { LogoImage } from '../ui/LogoImage';
import { APP_NAME } from '../../constants/brand';

interface AppSidebarContentProps {
  activeModule?: string | null;
  onItemPress?: () => void;
  onLogout?: () => void;
}

export function AppSidebarContent({ activeModule, onItemPress, onLogout }: AppSidebarContentProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isEnabled } = useFeatures();
  const { label, sectionMenu, sectionAdmin, adminBadge, signOut } = useModuleLabels();
  const { scaledFontSize: fs } = useScaledTheme();
  const { setActiveModule } = useSidebar();
  const isAdmin = user?.role === 'admin';
  const sections = getAppSidebarSections({ isAdmin, isEnabled });

  useEffect(() => {
    return registerModuleNavigateListener((module) => setActiveModule(module));
  }, [setActiveModule]);

  const handlePress = (id: AppModule) => {
    navigateToModule(id);
    setActiveModule(id);
    onItemPress?.();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.brandRow}>
        <LogoImage width={110} height={28} />
        {isAdmin ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>{adminBadge}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.label}>
            <Text style={[styles.sectionLabel, { fontSize: fs.xs }]}>
              {section.label === 'Admin' ? sectionAdmin : sectionMenu}
            </Text>
            {section.items.map((item) => {
              const active = activeModule === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handlePress(item.id)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Text style={[styles.navText, { fontSize: fs.sm }, active && styles.navTextActive]}>
                    {label(item.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'M'}</Text>
        </View>
        <View style={styles.footerInfo}>
          <Text style={styles.footerName} numberOfLines={1}>{user?.name || `${APP_NAME} User`}</Text>
          <Text style={styles.footerEmail} numberOfLines={1}>{user?.email || 'Account'}</Text>
        </View>
        {onLogout ? (
          <TouchableOpacity onPress={onLogout} hitSlop={8}>
            <Text style={[styles.logout, { fontSize: fs.xs }]}>{signOut}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

interface AppSidebarDrawerProps {
  visible: boolean;
  activeModule?: string | null;
  onClose: () => void;
  onLogout?: () => void;
}

export function AppSidebarDrawer({ visible, activeModule, onClose, onLogout }: AppSidebarDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          <AppSidebarContent
            activeModule={activeModule}
            onItemPress={onClose}
            onLogout={() => {
              onLogout?.();
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  brandAccent: { color: colors.primary },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '800', color: colors.text, textTransform: 'uppercase' },
  nav: { flex: 1 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  navItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRightWidth: 3,
    borderRightColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
    borderRightColor: colors.primary,
  },
  navText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  navTextActive: { color: colors.text, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: fontSize.sm, color: colors.text },
  footerInfo: { flex: 1 },
  footerName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  footerEmail: { fontSize: 11, color: colors.textMuted },
  logout: { fontSize: fontSize.xs, color: colors.error, fontWeight: '600' },
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { width: 240, backgroundColor: colors.surface },
});
