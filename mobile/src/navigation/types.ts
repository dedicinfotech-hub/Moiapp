import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Event, MoiEntry } from '../api/types';

export type PublicStackParamList = {
  PublicHome: undefined;
  PublicEventsList: undefined;
  PublicEventDetail: { slug: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Settings: undefined;
  Organizers: undefined;
  Guests: undefined;
  Features: undefined;
  AdminPanel: NavigatorScreenParams<AdminStackParamList> | undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminApprovals: undefined;
  AdminUsers: undefined;
  AdminRevenue: undefined;
  AdminAnalytics: undefined;
  AdminSupport: undefined;
  AdminPrivateEvents: undefined;
  AdminFeatures: undefined;
  AdminLoginLogs: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  OTP: { phone: string; delivery?: 'sms' | 'email' | 'dev' };
  ProfileSetup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  PublicBrowse: NavigatorScreenParams<PublicStackParamList> | undefined;
  Dashboard: undefined;
  Functions: undefined;
  MoiList: undefined;
  ReportsTab: undefined;
  More: undefined;
};

export type EventStackParamList = {
  ChooseEventType: undefined;
  CreateFunction: { mode: 'new' | 'past' };
  PendingApproval: { slug: string };
  EventTabs: { slug: string };
  EventDashboard: { slug: string };
  EventDashboardEmpty: { slug: string };
  MoiEntries: { slug: string };
  MoiEntry: { slug: string };
  GiftEntry: { slug: string; giftType?: 'gold' | 'silver' | 'gift' };
  VoiceEntry: { slug: string };
  QRCode: { slug: string };
  EventReports: { slug: string };
  InvitationUpload: { slug: string };
  InviteesUpload: { slug: string };
  HostPaymentMethod: { slug: string };
  EventSettings: { slug: string };
};

export type EventTabParamList = {
  EventMoiRegister: { slug: string };
  EventPhotos: { slug: string };
  EventSummary: { slug: string };
  EventInvitations: { slug: string };
  EventReturnTracker: { slug: string };
};

export type GuestStackParamList = {
  GuestLanding: { token: string };
  GuestForm: { token: string };
  GuestPayment: { token: string };
  PaymentSuccess: { token: string; transactionId: string; total: number };
  GuestReceipt: { token: string; transactionId: string };
  LinkExpired: { token: string };
};

export type RootStackParamList = {
  Auth: undefined;
  PublicFlow: undefined;
  Main: undefined;
  Notifications: undefined;
  EventFlow:
    | { screen?: keyof EventStackParamList; params?: EventStackParamList[keyof EventStackParamList] }
    | undefined;
  GuestFlow:
    | { screen?: keyof GuestStackParamList; params?: GuestStackParamList[keyof GuestStackParamList] }
    | { token: string }
    | undefined;
};

export type EventScreenProps<T extends keyof EventStackParamList> = NativeStackScreenProps<
  EventStackParamList,
  T
>;

export type GuestScreenProps<T extends keyof GuestStackParamList> = NativeStackScreenProps<
  GuestStackParamList,
  T
>;

export type { RazorpayPaymentMethod } from '../api/types';

export interface GuestFormData {
  guest_name: string;
  phone: string;
  email: string;
  city: string;
  relation: string;
  company: string;
  occupation: string;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  amount: string;
  gold_weight: string;
  gold_unit: 'g' | 'lb';
  silver_weight: string;
  silver_unit: 'g' | 'lb';
  gift_description: string;
  note: string;
}
