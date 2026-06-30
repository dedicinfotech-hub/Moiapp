export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder?: string;
  role?: 'admin' | 'user';
}

export interface Event {
  id: number;
  user_id: number;
  slug: string;
  event_type: 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'graduation' | 'custom';
  custom_title?: string;
  bride_name?: string;
  groom_name?: string;
  birthday_person_name?: string;
  birthday_person_age?: number;
  parent1_name?: string;
  parent2_name?: string;
  mother_name?: string;
  father_name?: string;
  host_name?: string;
  spouse_name?: string;
  graduate_name?: string;
  wedding_date: string;
  event_time?: string;
  city?: string | null;
  venue?: string | null;
  cover_photo: string | null;
  description?: string;
  is_active: number;
  event_mode?: 'past' | 'new';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_reason?: string | null;
  guest_token?: string | null;
  creator_name?: string;
  qr_enabled?: number;
  qr_payment_count?: number;
  created_at: string;
  guest_count?: number;
  total_moi?: number;
  stats?: { guest_count: number; total: number; qr_payment_count?: number };
  upi_id?: string;
}

export interface MoiEntry {
  id: number;
  event_id: number;
  guest_name: string;
  phone?: string | null;
  city?: string | null;
  company?: string | null;
  occupation?: string | null;
  amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  gold_weight?: number | null;
  gift_description?: string | null;
  approximate_value?: number | null;
  relation: 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other';
  payment_mode: 'cash' | 'upi' | 'card' | 'cheque' | 'other';
  upi_ref_id?: string | null;
  other_payment_details?: string | null;
  note: string;
  entered_by: string;
  created_at: string;
  entry_type?: 'moi' | 'advance';
}

export interface BreakdownItem {
  count: number;
  total: number;
  relation: string;
  payment_mode: string;
}

export interface DashboardSummaryResponse {
  success: boolean;
  summary: {
    total_events: number;
    total_guests: number;
    total_cash: number;
    total_gold: number;
    total_gifts: number;
    avg_cash_gift: number;
    pending_returns?: number;
  };
  recentEntries: DashboardEntry[];
  recentEvents: DashboardEvent[];
}

export interface DashboardEntry {
  id: number;
  event_id: number;
  guest_name: string;
  amount: number;
  gift_type: string;
  payment_mode: string;
  created_at: string;
  custom_title?: string;
  wedding_date?: string;
}

export interface DashboardEvent {
  id: number;
  slug: string;
  event_type: Event['event_type'];
  custom_title?: string;
  bride_name?: string;
  groom_name?: string;
  wedding_date: string;
  city?: string | null;
  venue?: string | null;
  event_mode?: 'past' | 'new';
  approval_status?: 'pending' | 'approved' | 'rejected';
  total_moi?: number;
  guest_count?: number;
}

export type RazorpayPaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'scan' | 'other';

export interface RazorpayCreateOrderRequest {
  guest_token?: string;
  event_slug?: string;
  payment_method: RazorpayPaymentMethod;
  guest_data: {
    guest_name: string;
    phone?: string;
    email?: string;
    city?: string;
    company?: string;
    occupation?: string;
    relation: 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other';
    gift_type: 'cash' | 'gold' | 'silver' | 'gift';
    amount: string | number;
    note?: string;
  };
}

export interface RazorpayOrderResponse {
  success: true;
  order_id: number;
  razorpay_key_id: string;
  order: { id: string; amount: number; currency: string; receipt: string };
  guest_name: string;
  email?: string | null;
  phone?: string | null;
  amount: number;
  fee: number;
  total_amount: number;
  payment_method: RazorpayPaymentMethod;
  event_title: string;
}

export interface RazorpayVerifyPaymentRequest {
  guest_token?: string;
  event_slug?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_method: RazorpayPaymentMethod;
}

export interface RazorpayPaymentResult {
  success: true;
  transaction_id: string;
  total_amount: number;
  amount: number;
  fee: number;
  payment_method: RazorpayPaymentMethod;
}

export interface RazorpayReceipt {
  guest_name: string;
  amount: number;
  fee: number;
  total_amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  payment_method: RazorpayPaymentMethod;
  transaction_id: string;
  created_at: string;
  event_title: string;
}

export interface Notification {
  id: number;
  user_id: number;
  event_id?: number;
  title: string;
  message?: string;
  type: 'reminder' | 'entry_saved' | 'return_gift' | 'function_date' | 'approval';
  is_read: number;
  scheduled_for?: string;
  created_at: string;
  event_name?: string;
}
