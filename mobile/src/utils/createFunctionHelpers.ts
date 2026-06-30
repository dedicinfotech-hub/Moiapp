import type { Event } from '../api/types';
import { getEventTypeLabel } from './format';

export type EventType = Event['event_type'];
export type EventMode = 'new' | 'past';

export const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding', icon: 'heart-outline' },
  { value: 'birthday', label: 'Birthday', icon: 'gift-outline' },
  { value: 'engagement', label: 'Engagement', icon: 'diamond-outline' },
  { value: 'valakaappu', label: 'Valakaappu', icon: 'sparkles-outline' },
  { value: 'housewarming', label: 'Housewarming', icon: 'home-outline' },
  { value: 'graduation', label: 'Graduation', icon: 'school-outline' },
  { value: 'custom', label: 'Others', icon: 'ellipsis-horizontal-outline' },
];

export const CITY_OPTIONS = ['Coimbatore', 'Chennai', 'Madurai', 'Salem', 'Trichy', 'Erode', 'Tiruppur', 'Other'];

export interface CreateFunctionForm {
  event_type: EventType;
  function_name: string;
  custom_title: string;
  bride_name: string;
  groom_name: string;
  birthday_person_name: string;
  birthday_person_age: string;
  parent1_name: string;
  parent2_name: string;
  mother_name: string;
  father_name: string;
  host_name: string;
  spouse_name: string;
  graduate_name: string;
  wedding_date: string;
  wedding_time: string;
  venue: string;
  city: string;
  description: string;
}

export const emptyCreateForm = (): CreateFunctionForm => ({
  event_type: 'wedding',
  function_name: '',
  custom_title: '',
  bride_name: '',
  groom_name: '',
  birthday_person_name: '',
  birthday_person_age: '',
  parent1_name: '',
  parent2_name: '',
  mother_name: '',
  father_name: '',
  host_name: '',
  spouse_name: '',
  graduate_name: '',
  wedding_date: '',
  wedding_time: '',
  venue: '',
  city: '',
  description: '',
});

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const EVENT_TYPE_I18N_KEYS: Record<EventType, string> = {
  wedding: 'evtWedding',
  birthday: 'evtBirthday',
  engagement: 'evtEngagement',
  valakaappu: 'evtValakaappu',
  housewarming: 'evtHousewarming',
  graduation: 'evtGraduation',
  custom: 'evtOthers',
};

export function getTranslatedNameLabels(
  t: (key: string) => string,
  eventType: EventType,
) {
  switch (eventType) {
    case 'wedding':
      return { name1: t('lblBrideName'), name2: t('lblGroomName'), ph1: 'Priya', ph2: 'Ravi' };
    case 'engagement':
      return { name1: t('lblPartner1'), name2: t('lblPartner2'), ph1: 'Priya', ph2: 'Ravi' };
    case 'valakaappu':
      return { name1: t('lblMotherName'), name2: t('lblFatherName'), ph1: 'Lakshmi', ph2: 'Ravi' };
    case 'housewarming':
      return { name1: t('lblHostName'), name2: t('lblSpouseName'), ph1: 'Arun', ph2: 'Priya' };
    default:
      return { name1: t('lblPersonName'), name2: t('lblPersonName'), ph1: '', ph2: '' };
  }
}

export function getNameLabels(eventType: EventType) {
  switch (eventType) {
    case 'wedding':
      return { name1: 'Bride Name', name2: 'Groom Name', ph1: 'Priya', ph2: 'Ravi' };
    case 'engagement':
      return { name1: 'Partner 1 Name', name2: 'Partner 2 Name', ph1: 'Priya', ph2: 'Ravi' };
    case 'valakaappu':
      return { name1: 'Mother Name', name2: 'Father Name', ph1: 'Lakshmi', ph2: 'Ravi' };
    case 'housewarming':
      return { name1: 'Host Name', name2: 'Spouse Name', ph1: 'Arun', ph2: 'Priya' };
    default:
      return { name1: 'Name 1', name2: 'Name 2', ph1: '', ph2: '' };
  }
}

export function buildFunctionName(form: CreateFunctionForm): string {
  if (form.function_name.trim()) return form.function_name.trim();
  const date = form.wedding_date
    ? new Date(form.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  switch (form.event_type) {
    case 'wedding':
      if (form.bride_name && form.groom_name) return `${form.bride_name} & ${form.groom_name} Wedding${date ? ` - ${date}` : ''}`;
      break;
    case 'birthday':
      if (form.birthday_person_name) return `${form.birthday_person_name}'s Birthday${date ? ` - ${date}` : ''}`;
      break;
    case 'engagement':
      if (form.bride_name && form.groom_name) return `${form.bride_name} & ${form.groom_name} Engagement`;
      break;
    case 'valakaappu':
      if (form.bride_name && form.groom_name) return `${form.bride_name} & ${form.groom_name} Valakaappu`;
      break;
    case 'housewarming':
      if (form.host_name) return `${form.host_name}${form.spouse_name ? ` & ${form.spouse_name}` : ''} Housewarming`;
      break;
    case 'graduation':
      if (form.graduate_name) return `${form.graduate_name}'s Graduation`;
      break;
    case 'custom':
      if (form.custom_title) return form.custom_title;
      break;
  }
  return `${getEventTypeLabel(form.event_type)}${date ? ` - ${date}` : ''}`;
}

export function syncFunctionName(form: CreateFunctionForm, field: keyof CreateFunctionForm, value: string): CreateFunctionForm {
  const next = { ...form, [field]: value };
  switch (form.event_type) {
    case 'wedding':
    case 'engagement':
    case 'valakaappu': {
      const bride = field === 'bride_name' ? value : next.bride_name;
      const groom = field === 'groom_name' ? value : next.groom_name;
      const suffix = form.event_type === 'wedding' ? 'Wedding' : form.event_type === 'engagement' ? 'Engagement' : 'Valakaappu';
      if (bride || groom) next.function_name = `${bride}${bride && groom ? ' & ' : ''}${groom} ${suffix}`.trim();
      break;
    }
    case 'birthday': {
      const name = field === 'birthday_person_name' ? value : next.birthday_person_name;
      if (name) next.function_name = `${name}'s Birthday Celebration`;
      break;
    }
    case 'housewarming': {
      const host = field === 'host_name' ? value : next.host_name;
      const spouse = field === 'spouse_name' ? value : next.spouse_name;
      if (host) next.function_name = `${host}${spouse ? ` & ${spouse}` : ''} Housewarming`;
      break;
    }
    case 'graduation': {
      const grad = field === 'graduate_name' ? value : next.graduate_name;
      if (grad) next.function_name = `${grad}'s Graduation`;
      break;
    }
    case 'custom':
      if (field === 'custom_title' || field === 'function_name') {
        next.custom_title = field === 'custom_title' ? value : next.custom_title;
        next.function_name = field === 'function_name' ? value : next.function_name || value;
      }
      break;
  }
  return next;
}

export function validateStep(form: CreateFunctionForm, mode: EventMode, step: 1 | 2 | 3): string | null {
  if (step === 1) return null;

  if (step === 2) {
    if (!form.wedding_date) return 'Date is required';
    const today = todayStr();
    if (mode === 'past' && form.wedding_date > today) return 'Past events must use today or an earlier date';
    if (mode === 'new' && form.wedding_date < today) return 'New events must use today or a future date';

    switch (form.event_type) {
      case 'wedding':
        if (!form.bride_name.trim() || !form.groom_name.trim()) return 'Bride and groom names are required';
        break;
      case 'birthday':
        if (!form.birthday_person_name.trim()) return 'Person name is required';
        break;
      case 'engagement':
        if (!form.bride_name.trim() || !form.groom_name.trim()) return 'Partner names are required';
        if (!form.mother_name.trim() || !form.father_name.trim()) return 'Mother and father names are required';
        break;
      case 'valakaappu':
        if (!form.bride_name.trim() || !form.groom_name.trim()) return 'Mother and father names are required';
        break;
      case 'housewarming':
        if (!form.host_name.trim() || !form.spouse_name.trim()) return 'Host and spouse names are required';
        break;
      case 'graduation':
        if (!form.graduate_name.trim()) return 'Graduate name is required';
        break;
      case 'custom':
        if (!form.custom_title.trim() && !form.function_name.trim()) return 'Event title is required';
        break;
    }
    return null;
  }

  return null;
}

export function buildPayload(form: CreateFunctionForm, mode: EventMode, asDraft: boolean) {
  const title = buildFunctionName(form);
  const payload: Record<string, unknown> = {
    event_type: form.event_type,
    event_mode: mode,
    custom_title: title,
    wedding_date: form.wedding_date || todayStr(),
    wedding_time: form.wedding_time || undefined,
    venue: form.venue,
    city: form.city,
    description: form.description,
    approval_status: asDraft ? 'draft' : mode === 'past' ? 'approved' : 'pending',
  };

  switch (form.event_type) {
    case 'wedding':
      payload.bride_name = form.bride_name;
      payload.groom_name = form.groom_name;
      break;
    case 'birthday':
      payload.birthday_person_name = form.birthday_person_name;
      if (form.birthday_person_age) payload.birthday_person_age = parseInt(form.birthday_person_age, 10);
      break;
    case 'engagement':
      payload.bride_name = form.bride_name;
      payload.groom_name = form.groom_name;
      payload.parent1_name = form.bride_name;
      payload.parent2_name = form.groom_name;
      payload.mother_name = form.mother_name;
      payload.father_name = form.father_name;
      break;
    case 'valakaappu':
      payload.bride_name = form.bride_name;
      payload.groom_name = form.groom_name;
      break;
    case 'housewarming':
      payload.host_name = form.host_name;
      payload.spouse_name = form.spouse_name;
      break;
    case 'graduation':
      payload.graduate_name = form.graduate_name;
      break;
    case 'custom':
      payload.custom_title = form.function_name || form.custom_title;
      break;
  }

  return payload;
}
