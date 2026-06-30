import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { EventStackParamList } from './types';
import { EventTabs } from './EventTabs';
import { ChooseEventTypeScreen } from '../screens/events/ChooseEventTypeScreen';
import { CreateFunctionScreen } from '../screens/events/CreateFunctionScreen';
import { PendingApprovalScreen } from '../screens/events/PendingApprovalScreen';
import { MoiEntryScreen } from '../screens/moi/MoiEntryScreen';
import { QRCodeScreen } from '../screens/events/QRCodeScreen';
import { EventReportsScreen } from '../screens/reports/EventReportsScreen';
import { InvitationUploadScreen } from '../screens/events/InvitationUploadScreen';
import { InviteesUploadScreen } from '../screens/events/InviteesUploadScreen';
import { HostPaymentMethodScreen } from '../screens/events/HostPaymentMethodScreen';
import { EventSettingsScreen } from '../screens/events/EventSettingsScreen';
import { VoiceEntryScreen } from '../screens/moi/VoiceEntryScreen';
import { GiftEntryScreen } from '../screens/moi/GiftEntryScreen';

const Stack = createNativeStackNavigator<EventStackParamList>();

export function EventStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChooseEventType" component={ChooseEventTypeScreen} />
      <Stack.Screen name="CreateFunction" component={CreateFunctionScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="EventTabs" component={EventTabs} />
      <Stack.Screen name="MoiEntry" component={MoiEntryScreen} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} />
      <Stack.Screen name="EventReports" component={EventReportsScreen} />
      <Stack.Screen name="InvitationUpload" component={InvitationUploadScreen} />
      <Stack.Screen name="InviteesUpload" component={InviteesUploadScreen} />
      <Stack.Screen name="HostPaymentMethod" component={HostPaymentMethodScreen} />
      <Stack.Screen name="VoiceEntry" component={VoiceEntryScreen} />
      <Stack.Screen name="GiftEntry" component={GiftEntryScreen} />
      <Stack.Screen name="EventSettings" component={EventSettingsScreen} />
    </Stack.Navigator>
  );
}
