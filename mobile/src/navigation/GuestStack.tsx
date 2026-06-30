import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GuestStackParamList, RootStackParamList } from './types';
import { GuestLandingScreen } from '../screens/guest/GuestLandingScreen';
import { GuestFormScreen } from '../screens/guest/GuestFormScreen';
import { GuestPaymentScreen } from '../screens/guest/GuestPaymentScreen';
import { PaymentSuccessScreen } from '../screens/guest/PaymentSuccessScreen';
import { GuestReceiptScreen } from '../screens/guest/GuestReceiptScreen';
import { LinkExpiredScreen } from '../screens/guest/LinkExpiredScreen';

const Stack = createNativeStackNavigator<GuestStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'GuestFlow'>;

export function GuestStack({ route }: Props) {
  const parentToken =
    route.params && typeof route.params === 'object' && 'token' in route.params
      ? (route.params as { token: string }).token
      : route.params?.params?.token;

  const sharedInitialParams = parentToken ? { token: parentToken } : undefined;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestLanding" component={GuestLandingScreen} initialParams={sharedInitialParams} />
      <Stack.Screen name="GuestForm" component={GuestFormScreen} />
      <Stack.Screen name="GuestPayment" component={GuestPaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="GuestReceipt" component={GuestReceiptScreen} />
      <Stack.Screen name="LinkExpired" component={LinkExpiredScreen} />
    </Stack.Navigator>
  );
}
