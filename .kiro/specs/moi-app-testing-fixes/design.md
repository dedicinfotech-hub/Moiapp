# Technical Design: MoiApp Testing Fixes

## Overview

All three fixes are isolated to `frontend/app/e/[slug]/EventPublicClient.tsx`. No backend changes are needed — `api/moi.php` already handles `gift_type`, `gold_weight`, and `gift_description`. The `MoiEntry` type in `lib/api.ts` already includes these fields.

---

## Fix 1 – Venue Visibility

### Problem
The venue name appears as plain text in two places (the header row and the Event Details list). The `<VenueMap>` component renders an embedded iframe inside the desktop left column, but on mobile that section is below the fold and easy to miss. There is no direct "Open in Maps" link adjacent to the venue name.

### Solution
Add a Google Maps link (`https://maps.google.com/?q=<encoded venue>`) as a small tappable element directly next to the venue name in **both** locations where the venue already appears:

1. **Header row** (the `📍 venue` line under the event title) — append a `↗ Map` link after the venue text.
2. **Event Details list** (the `📍 Venue` row in the details section) — append the same `↗ Map` link below the venue value.

This is purely additive — no existing markup is removed. The `<VenueMap>` embedded iframe stays as-is for desktop.

### Implementation Detail
```tsx
// Reusable helper — no new component needed
const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(event.venue)}`;

// Inline usage alongside existing venue text
<a href={mapsUrl} target="_blank" rel="noopener noreferrer"
   className="text-[#FFC107] text-xs font-semibold underline ml-1 whitespace-nowrap">
  ↗ Map
</a>
```

Applied in two JSX locations inside `EventDetailView`.

---

## Fix 2 – Gold & Gift Options on Public Form

### Problem
`MoiForm` renders a hardcoded cash-only UI. The `GuestForm` interface has `amount`, `payment_mode`, and `note` — but no `gift_type`, `gold_weight`, or `gift_description` fields.

### Solution

#### 2a — Extend `GuestForm` interface
```ts
interface GuestForm {
  guest_name: string;
  gift_type: 'cash' | 'gold' | 'gift';   // NEW
  amount: string;
  gold_weight: string;                     // NEW
  gift_description: string;               // NEW
  relation: string;
  payment_mode: string;
  note: string;
}
```
Default: `gift_type: 'cash'`, `gold_weight: ''`, `gift_description: ''`.

#### 2b — Add Gift Type selector
Insert a 3-button row (identical style to the admin form) above the Amount field:

```
[ 💵 Cash ]  [ ✨ Gold ]  [ 🎁 Gift ]
```

Active button uses `border-[#FFC107] bg-[#FFFCF5] text-[#B8860B]`; inactive uses `border-[#E8E8E8] text-[#444444]`.

#### 2c — Conditional input rendering
- **Cash selected**: show existing `Amount (₹)` input + preset chips + `Payment Mode` selector (current behaviour, unchanged)
- **Gold selected**: hide amount/payment-mode; show `Gold Weight (grams)` number input (min 0.01, step 0.01, placeholder `e.g. 8`)
- **Gift selected**: hide amount/payment-mode; show `Gift Description` text input (placeholder `e.g. Silver plate, wall clock`)

The preset amount chips are only rendered when `gift_type === 'cash'`.

#### 2d — Validation
Update `handleSubmit` to validate per gift type:
- Cash: `amount > 0` required
- Gold: `gold_weight > 0` required
- Gift: `gift_description.trim() !== ''` required

#### 2e — API payload
`moiApi.add` already accepts `Partial<MoiEntry> & { slug? }`. Extend the submission object:
```ts
await moiApi.add({
  slug: event.slug,
  guest_name: form.guest_name.trim(),
  gift_type: form.gift_type,
  amount: form.gift_type === 'cash' ? parseFloat(form.amount) : 0,
  gold_weight: form.gift_type === 'gold' ? parseFloat(form.gold_weight) : null,
  gift_description: form.gift_type === 'gift' ? form.gift_description.trim() : null,
  relation: form.relation as MoiEntry['relation'],
  payment_mode: form.payment_mode as MoiEntry['payment_mode'],
  note: form.note.trim(),
});
```

No changes to `lib/api.ts` or any PHP file.

---

## Fix 3 – Mobile-Friendly Share

### Problem
Both the mobile top bar share button and the desktop sidebar share button call `handleCopy`, which always calls `navigator.clipboard.writeText()`. On mobile, this may silently fail and never shows the native share sheet.

### Solution
Replace `handleCopy` with a unified `handleShare` function:

```ts
const handleShare = async () => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${event.bride_name} & ${event.groom_name} Wedding`,
        text: 'Give Moi for the wedding!',
        url,
      });
    } catch {
      // User cancelled — no action needed
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silent fallback
    }
  }
};
```

Replace all `onClick={handleCopy}` references in `EventDetailView` with `onClick={handleShare}`. The `copied` state and "Link copied!" label continue to work for the desktop fallback path. On mobile where `navigator.share` is used, the native sheet handles its own confirmation so no extra UI state is needed.

The `handleCopy` function can be removed entirely once replaced.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/app/e/[slug]/EventPublicClient.tsx` | All three fixes (venue links, gift type selector, share handler) |

No other files require modification.

---

## No-Change Zones

- `api/moi.php` — backend already handles all gift types
- `frontend/lib/api.ts` — `MoiEntry` type already has `gift_type`, `gold_weight`, `gift_description`
- `frontend/app/events/[slug]/EventPageClient.tsx` — admin form untouched
- Any PHP config or database schema files
