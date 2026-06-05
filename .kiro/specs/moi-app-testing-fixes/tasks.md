# Implementation Tasks: MoiApp Testing Fixes

All changes are in `frontend/app/e/[slug]/EventPublicClient.tsx`.

---

- [x] 1. Add inline "Open in Maps" links next to venue name
  In `EventDetailView`, add a Google Maps anchor (`https://maps.google.com/?q=<encoded venue>`) in two places:
  - The header row `📍 venue` paragraph (under the title/date line)
  - The Event Details list `📍 Venue` row (in the details section below the photos)
  Both links open in a new tab with `target="_blank" rel="noopener noreferrer"`.
  Do not remove or modify the existing `<VenueMap>` component.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`

- [x] 2. Extend GuestForm interface with gift_type fields
  Add `gift_type: 'cash' | 'gold' | 'gift'`, `gold_weight: string`, and `gift_description: string` to the `GuestForm` interface.
  Update the initial state in `MoiForm` to include `gift_type: 'cash'`, `gold_weight: ''`, `gift_description: ''`.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`

- [x] 3. Add Gift Type selector to MoiForm
  Insert a 3-button row (Cash / Gold / Gift) above the Amount section, using the same pill-button style as the admin form:
  - Active: `border-[#FFC107] bg-[#FFFCF5] text-[#B8860B]`
  - Inactive: `border-[#E8E8E8] text-[#444444] hover:border-[#FFC107]`
  Labels: `💵 Cash`, `✨ Gold`, `🎁 Gift`.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`

- [x] 4. Conditionally render amount / gold / gift inputs
  Replace the always-visible Amount block and Payment Mode selector with conditional rendering based on `form.gift_type`:
  - `cash`: show the existing Amount input with preset chips and Payment Mode selector (no change to cash flow)
  - `gold`: show a "Gold Weight (grams)" number input (min 0.01, step 0.01, placeholder `e.g. 8`)
  - `gift`: show a "Gift Description" text input (placeholder `e.g. Silver plate, wall clock`)
  The preset amount chips must only render when `gift_type === 'cash'`.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`

- [x] 5. Update handleSubmit validation and API payload
  In `MoiForm.handleSubmit`, replace the single `amount > 0` check with per-type validation:
  - Cash: `parseFloat(form.amount) > 0`, error: "Please enter a valid amount"
  - Gold: `parseFloat(form.gold_weight) > 0`, error: "Please enter gold weight in grams"
  - Gift: `form.gift_description.trim() !== ''`, error: "Please describe the gift"
  Update the `moiApi.add(...)` call to pass `gift_type`, `gold_weight` (or null), and `gift_description` (or null) in addition to the existing fields.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`

- [x] 6. Replace handleCopy with handleShare (native share API)
  Remove the existing `handleCopy` function and replace it with `handleShare`:
  - If `navigator.share` is available: call `navigator.share({ title, text, url })` and catch cancellation silently
  - Otherwise: call `navigator.clipboard.writeText(url)`, set `copied = true`, reset after 2 seconds
  Update all `onClick={handleCopy}` references in `EventDetailView` (mobile top bar button and desktop sidebar share button) to `onClick={handleShare}`.
  **File:** `frontend/app/e/[slug]/EventPublicClient.tsx`
