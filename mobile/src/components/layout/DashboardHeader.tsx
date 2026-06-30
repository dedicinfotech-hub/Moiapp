import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { AppModule } from '../../lib/navigation';
import { useModuleLabels } from '../../i18n/useModuleLabels';
import { useSidebar } from '../../context/SidebarContext';
import { navigateNewEvent } from '../../navigation/navigationRef';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { AppHeader } from './AppHeader';
import { colors, spacing, radius } from '../../theme';

interface DashboardHeaderProps {
  module: AppModule;
  rightElement?: React.ReactNode;
  showNewEvent?: boolean;
  showMenu?: boolean;
}

export function DashboardHeader({ module, rightElement, showNewEvent = true, showMenu = true }: DashboardHeaderProps) {
  const { open } = useSidebar();
  const { label, subtitle, newEvent } = useModuleLabels();
  const { scaledFontSize: fs } = useScaledTheme();

  const actions = (
    <View style={styles.actions}>
      {rightElement}
      {showNewEvent ? (
        <TouchableOpacity style={styles.newBtn} onPress={navigateNewEvent}>
          <Text style={[styles.newBtnText, { fontSize: fs.xs }]}>{newEvent}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <AppHeader
      variant="dashboard"
      title={label(module)}
      subtitle={subtitle(module)}
      onMenuPress={open}
      showMenu={showMenu}
      rightElement={actions}
    />
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  newBtnText: { fontWeight: '800', color: colors.text },
});
