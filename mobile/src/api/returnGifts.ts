import { request } from './client';

export interface ReturnGift {
  id: number;
  event_id: number;
  moi_entry_id?: number;
  guest_name: string;
  return_type: 'cash' | 'gold' | 'gift' | 'none';
  return_amount?: number | null;
  return_gold_weight?: number | null;
  return_gift_description?: string | null;
  return_date?: string | null;
  status: 'pending' | 'returned' | 'not_applicable';
  note?: string;
  created_at: string;
  updated_at: string;
  original_guest?: string;
}

export const returnGiftsApi = {
  list: (eventId: number) =>
    request<{ return_gifts: ReturnGift[] }>(`/return-gifts.php?event_id=${eventId}`),

  listOverdue: () =>
    request<{ overdue: ReturnGift[] }>('/return-gifts.php?action=overdue'),

  add: (body: Partial<ReturnGift>) =>
    request<{ id: number }>('/return-gifts.php', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: number, body: Partial<ReturnGift>) =>
    request<{ success: boolean }>('/return-gifts.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...body }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/return-gifts.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};
