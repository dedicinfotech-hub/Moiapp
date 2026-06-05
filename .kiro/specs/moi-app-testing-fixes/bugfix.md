# Bugfix Requirements Document

## Introduction

Three UX gaps were identified during user testing of MoiApp, a wedding Moi (gift contribution) tracking web app. All three issues are frontend-only and affect the public event page (`/e/[slug]`):

1. **Venue visibility** — The venue is stored and shown as text, but no location preview or prominent map link is surfaced inline on mobile; the embedded `<VenueMap>` component is only rendered inside the desktop left column.
2. **Missing gift types on the public form** — The public `MoiForm` only exposes a cash amount input. The backend (`api/moi.php`) already supports `gold` and `gift` gift types, and the admin form already has a full Gift Type selector — but guests using the public page cannot record Gold or Gift contributions.
3. **Share button ignores native mobile share sheet** — The Share button always calls `navigator.clipboard.writeText()`. On mobile this can silently fail or be blocked, and it bypasses the native share sheet (`navigator.share()`) which is the expected UX on mobile devices.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 – Venue visibility**

1.1 WHEN a guest views the public event page on a mobile device AND the event has a venue THEN the system displays only a plain text venue name with no map link or location preview visible without scrolling to the desktop-only `VenueMap` section.

1.2 WHEN a guest views the Event Details section on any viewport AND the event has a venue THEN the system renders the venue as text only, with no "Open in Maps" link directly adjacent to it.

**Bug 2 – Gold and Gift options missing from public form**

2.1 WHEN a guest opens the public Moi submission form THEN the system presents only a cash amount input and payment mode selector, with no option to select Gold or Gift as the contribution type.

2.2 WHEN a guest attempts to record a gold contribution via the public form THEN the system has no gold weight input available, making the submission impossible without cash data.

2.3 WHEN a guest attempts to record a physical gift via the public form THEN the system has no gift description input available, making the submission impossible.

**Bug 3 – Share button on mobile**

3.1 WHEN a guest taps the Share button on a mobile device THEN the system calls `navigator.clipboard.writeText()`, which may be silently blocked by the browser, and does not invoke the native mobile share sheet.

3.2 WHEN the share action completes on mobile THEN the system shows no consistent confirmation that the share action succeeded, because clipboard write may fail silently.

---

### Expected Behavior (Correct)

**Bug 1 – Venue visibility**

2.1 WHEN a guest views the public event page on a mobile device AND the event has a venue THEN the system SHALL display the venue name alongside a visible "Open in Maps" link directly in the Event Details section, without requiring additional navigation or scrolling.

2.2 WHEN a guest views the Event Details section on any viewport AND the event has a venue THEN the system SHALL render an inline "Open in Maps" link (or embedded map preview) adjacent to the venue name so location context is immediately visible.

**Bug 2 – Gold and Gift options missing from public form**

2.3 WHEN a guest opens the public Moi submission form THEN the system SHALL display a Gift Type selector with three options: Cash, Gold, and Gift — matching the selector already present in the admin form.

2.4 WHEN a guest selects Gold as the gift type on the public form THEN the system SHALL display a gold weight input (in grams) and submit the entry with `gift_type: "gold"` and `gold_weight` to the backend.

2.5 WHEN a guest selects Gift as the gift type on the public form THEN the system SHALL display a gift description input and submit the entry with `gift_type: "gift"` and `gift_description` to the backend.

**Bug 3 – Share button on mobile**

2.6 WHEN a guest taps the Share button AND `navigator.share` is available in the browser THEN the system SHALL invoke `navigator.share()` with the event URL, triggering the native mobile share sheet.

2.7 WHEN a guest taps the Share button AND `navigator.share` is NOT available THEN the system SHALL fall back to `navigator.clipboard.writeText()` and display a "Link Copied" confirmation.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a guest submits a Cash Moi contribution via the public form THEN the system SHALL CONTINUE TO accept a numeric amount and payment mode and record the entry correctly.

3.2 WHEN a guest views the public event page on desktop THEN the system SHALL CONTINUE TO render the `<VenueMap>` component in the left column as it does today.

3.3 WHEN a guest uses the Share button on a desktop browser where `navigator.share` is unavailable THEN the system SHALL CONTINUE TO copy the link to clipboard and show the "Link Copied" confirmation.

3.4 WHEN the admin uses the Share button on the admin event page (`/events/[slug]`) THEN the system SHALL CONTINUE TO copy the link to clipboard and show the "Share link copied!" alert, unaffected by changes to the public page.

3.5 WHEN the admin records a Moi entry via the admin form (`EventPageClient.tsx`) THEN the system SHALL CONTINUE TO support all three gift types (Cash, Gold, Gift) exactly as today.

3.6 WHEN the backend (`api/moi.php`) receives a POST with any valid `gift_type` value from the public form THEN the system SHALL CONTINUE TO validate and persist the entry using the existing logic without modification.
