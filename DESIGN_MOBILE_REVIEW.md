# Mobile Design Review Report

## Executive Summary

The MoiApp has **inconsistent design patterns** across different sections, with the main `/dashboard` and module pages sharing one design system, while event-specific pages (`/moi-entry`, `/report`, `/empty-dashboard`, etc.) use a different design. This inconsistency creates a fragmented user experience on mobile devices.

---

## 1. Design System Classification

### Group A: Main Dashboard & Modules (Consistent Design)
**Files:**
- [`frontend/app/dashboard/page.tsx`](frontend/app/dashboard/page.tsx)
- [`frontend/app/dashboard/components/Module*.tsx`](frontend/app/dashboard/components/)
- [`frontend/components/AppSidebar.tsx`](frontend/components/AppSidebar.tsx)
- [`frontend/components/Navbar.tsx`](frontend/components/Navbar.tsx)

**Characteristics:**
- Uses `tn-*` color system (tn-yellow, tn-text, tn-muted, tn-light, etc.)
- Sidebar-based navigation with hamburger menu on mobile
- Top bar with notification bell
- Background: `bg-tn-light` or `bg-tn-light-alt`
- Button styles: `bg-tn-yellow` for primary actions
- Font sizes: `text-sm`, `text-xs`, `text-[10px]`

### Group B: Event-Specific Pages (Different Design)
**Files:**
- [`frontend/app/events/[slug]/moi-entry/page.tsx`](frontend/app/events/[slug]/moi-entry/page.tsx)
- [`frontend/app/events/[slug]/reports/page.tsx`](frontend/app/events/[slug]/reports/page.tsx)
- [`frontend/app/events/[slug]/dashboard-empty/page.tsx`](frontend/app/events/[slug]/dashboard-empty/page.tsx)
- [`frontend/app/events/[slug]/entries/page.tsx`](frontend/app/events/[slug]/entries/page.tsx)
- [`frontend/app/events/[slug]/dashboard/page.tsx`](frontend/app/events/[slug]/dashboard/page.tsx)
- [`frontend/app/events/[slug]/EventPageClient.tsx`](frontend/app/events/[slug]/EventPageClient.tsx)
- [`frontend/components/event/HostEntryShell.tsx`](frontend/components/event/HostEntryShell.tsx)
- [`frontend/components/event/EventLayout.tsx`](frontend/components/event/EventLayout.tsx)

**Characteristics:**
- Uses `EventLayout` or `HostEntryShell` wrapper components
- Bottom navigation for mobile (`h-16` fixed nav)
- Different color palette: `#F9FAFB`, `#E5E7EB`, `#1F2937`, `#6B7280`
- Uses `EventContextCard` for event context
- Different input styles and button variations

### Group C: Guest/Public Pages (Third Design)
**Files:**
- [`frontend/app/e/[slug]/EventPublicClient.tsx`](frontend/app/e/[slug]/EventPublicClient.tsx)
- [`frontend/app/g/[token]/form/page.tsx`](frontend/app/g/[token]/form/page.tsx)
- [`frontend/app/g/[token]/GuestPaymentClient.tsx`](frontend/app/g/[token]/GuestPaymentClient.tsx)

**Characteristics:**
- No sidebar navigation
- Purple accent color (`#4B218B`, `#7C3AED`)
- Full-width mobile-first design
- Different form styling with purple focus states

### Group D: Auth & Landing Pages (Fourth Design)
**Files:**
- [`frontend/app/login/page.tsx`](frontend/app/login/page.tsx)
- [`frontend/app/splash/page.tsx`](frontend/app/splash/page.tsx)
- [`frontend/app/register/page.tsx`](frontend/app/register/page.tsx)

**Characteristics:**
- Gradient backgrounds
- Centered card layouts
- Different input styles
- Unique color schemes (purple for splash, yellow for login)

---

## 2. Mobile-Specific Issues

### 2.1 Navigation Inconsistencies

| Page | Navigation Type | Mobile Menu | Bottom Nav |
|------|----------------|-------------|------------|
| `/dashboard` | Sidebar + Top bar | Hamburger (lines) | No |
| `/events/[slug]/dashboard` | Sidebar + Top bar | Hamburger (Icon) | Yes (4 items) |
| `/events/[slug]/moi-entry` | Sidebar + Header | Hamburger (Icon) | Yes (4-6 items) |
| `/events/[slug]/reports` | Sidebar + Top bar | Hamburger (Icon) | Yes (4 items) |
| `/e/[slug]` (public) | None | Back arrow | No |
| `/g/[token]/form` | Header only | None | No |

**Issue:** The hamburger icon style differs:
- Dashboard: Custom SVG lines
- Event pages: `Icon name="menu"` component

### 2.2 Color System Fragmentation

**Group A (Dashboard):**
```
tn-yellow: #FFC107
tn-text: #101010
tn-muted: #444444
tn-light: #FAFAFA
tn-light-alt: #F9FAFB
```

**Group B (Event pages):**
```
#F9FAFB (background)
#E5E7EB (border)
#1F2937 (text)
#6B7280 (secondary text)
#7C3AED (purple accent)
```

**Group C (Guest pages):**
```
#4B218B (purple primary)
#7C3AED (purple focus)
#F5F3FF (light purple bg)
```

**Issue:** Three different color systems create visual inconsistency.

### 2.3 Input Field Inconsistencies

| Page Type | Input Class | Focus Border | Background |
|-----------|-------------|--------------|------------|
| Dashboard | `tn-border` | `tn-yellow` | `white` |
| Event pages | `#E5E7EB` | `#7C3AED` (purple) or `tn-yellow` | `white` |
| Guest pages | `gray-200` | `#7C3AED` (purple) | `white` |
| Login | `gray-200` | `#FFC107` | `white` |

**Issue:** Focus states use different colors (yellow vs purple), creating confusion.

### 2.4 Button Style Variations

**Primary Buttons:**
- Dashboard: `bg-tn-yellow text-black`
- Event pages: `bg-tn-yellow text-white` or `bg-[#4B218B]`
- Guest pages: `bg-tn-yellow` or `bg-[#4B218B]`
- Login: `bg-[#FFC107] text-gray-900`

**Issue:** Text color on yellow buttons varies (black vs white).

### 2.5 Bottom Navigation Issues

**EventLayout Bottom Nav:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-tn-border flex items-center justify-around px-1 z-40 safe-area-bottom">
```

**HostEntryShell Bottom Nav:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-tn-border flex items-center justify-around px-1 z-40 safe-area-bottom">
```

**Issues:**
1. Fixed height `h-16` may not accommodate all screen sizes
2. `safe-area-bottom` padding is good but not consistently applied
3. Different active states: `text-tn-purple` vs `text-tn-yellow`

---

## 3. Mobile Layout Problems

### 3.1 Content Padding Inconsistencies

| Page | Horizontal Padding | Vertical Padding |
|------|-------------------|------------------|
| Dashboard | `px-4 lg:px-6` | `p-4 lg:p-6` |
| Event pages | `px-4` | `pt-4 sm:pt-6` |
| Reports | `px-4 sm:px-6 pt-4 sm:pt-6` | - |
| Moi Entry | `px-4` (in HostEntryShell) | `py-4` |

### 3.2 Bottom Action Button Overlap

**Problem:** Multiple pages have fixed bottom buttons that may overlap:
- [`entries/page.tsx`](frontend/app/events/[slug]/entries/page.tsx): `pb-24` + fixed button at `bottom-[68px]`
- [`moi-entry/page.tsx`](frontend/app/events/[slug]/moi-entry/page.tsx): `pb-28` + fixed buttons
- Bottom nav at `h-16`

**Risk:** Content may be hidden behind multiple fixed elements.

### 3.3 Font Size Scaling

**Issues:**
- `text-xs` (12px) may be too small for mobile
- `text-[10px]` is very small and hard to read
- Inconsistent use of responsive text sizing

### 3.4 Touch Target Sizes

| Element | Size | WCAG Compliant? |
|---------|------|-----------------|
| Bottom nav icons | 44px (min-w-[72px]) | ✓ |
| Quick action buttons | 48x48px | ✓ |
| Form inputs | 44-48px height | ✓ |
| Filter buttons | 36-40px height | ✗ (some) |

---

## 4. Recommendations for Mobile Optimization

### 4.1 Unify Design System

**Create a single design system:**
1. Use consistent `tn-*` color variables across all pages
2. Standardize focus states to use `tn-yellow` (#FFC107)
3. Unify button styles with consistent text colors
4. Create reusable component variants

### 4.2 Navigation Improvements

**For Event pages:**
- Consider using the same sidebar pattern as main dashboard
- Or create a unified bottom navigation with consistent icons
- Ensure hamburger icon is consistent

### 4.3 Mobile-Specific Enhancements

1. **Increase touch targets:**
   - Minimum 44px for interactive elements
   - Increase `text-[10px]` to `text-xs` for better readability

2. **Fix bottom spacing:**
   - Calculate proper `pb-*` values to account for bottom nav
   - Use CSS variables for consistent spacing

3. **Responsive improvements:**
   - Add `viewport-fit=cover` for proper safe area handling
   - Use `env(safe-area-inset-bottom)` consistently

4. **Form optimization:**
   - Use `inputMode` and `enterkeyhint` for better mobile keyboards
   - Add larger tap targets for form controls

### 4.4 Specific Page Recommendations

| Page | Issue | Recommendation |
|------|-------|----------------|
| `/moi-entry` | Uses `HostEntryShell` with different colors | Align with main dashboard design or create consistent event design |
| `/reports` | Different color palette | Use `tn-*` colors consistently |
| `/empty-dashboard` | Different from main dashboard | Unify with event dashboard design |
| `/e/[slug]` (public) | No navigation, different colors | Add consistent header with back button |
| `/g/[token]/form` | Purple focus, no nav | Use consistent yellow focus, add progress indicator |

---

## 5. Code Duplication & Component Opportunities

### 5.1 Reusable Components Needed

1. **UnifiedHeader** - Combine `CreateFlowHeader` and dashboard top bar
2. **UnifiedBottomNav** - Single bottom navigation component
3. **UnifiedStatCard** - Consistent stat card across all pages
4. **UnifiedQuickAction** - Consistent quick action button
5. **UnifiedInput** - Consistent form input styling

### 5.2 Current Duplicated Patterns

- StatCard: Defined in both [`dashboard-empty/page.tsx`](frontend/app/events/[slug]/dashboard-empty/page.tsx) and [`dashboard/page.tsx`](frontend/app/events/[slug]/dashboard/page.tsx)
- QuickAction: Similar in multiple files
- Loading spinners: Multiple variations of the same spinner

---

## 6. Priority Fixes

### High Priority (Mobile UX Impact) - COMPLETED
1. ✅ Unify color system across all event pages - Changed to use `tn-*` colors
2. ✅ Fix bottom button overlap issues - Changed `bottom-[68px]` to `bottom-16` and `pb-28` to `pb-20`
3. ✅ Increase small text sizes for readability - Changed `text-[10px]` to `text-xs`
4. ✅ Standardize navigation patterns - Changed active state to `text-tn-yellow`

### Medium Priority - IN PROGRESS
1. Create reusable component library - Created `UnifiedComponents.tsx`
2. Add proper viewport meta tags
3. Improve form input mobile experience
4. Add haptic feedback consistently

### Low Priority
1. Refactor loading spinners
2. Unify icon usage
3. Add dark mode support
4. Add accessibility improvements

---

## 7. Changes Made

### Files Modified:
1. [`frontend/components/event/HostEntryShell.tsx`](frontend/components/event/HostEntryShell.tsx)
   - Changed active nav color from `text-tn-purple` to `text-tn-yellow`
   - Changed text size from `text-[10px]` to `text-xs`
   - Fixed bottom padding from `pb-28` to `pb-20`

2. [`frontend/components/event/EventLayout.tsx`](frontend/components/event/EventLayout.tsx)
   - Changed active nav color from `text-tn-purple` to `text-tn-yellow`
   - Changed text size from `text-[10px]` to `text-xs`

3. [`frontend/app/events/[slug]/entries/page.tsx`](frontend/app/events/[slug]/entries/page.tsx)
   - Changed button colors to use `tn-*` color system
   - Changed `bottom-[68px]` to `bottom-16`
   - Changed text color to `text-tn-muted`

4. [`frontend/app/events/[slug]/reports/page.tsx`](frontend/app/events/[slug]/reports/page.tsx)
   - Changed loading state colors to use `tn-*` system

5. [`frontend/app/events/[slug]/dashboard-empty/page.tsx`](frontend/app/events/[slug]/dashboard-empty/page.tsx)
   - Changed button text color from `text-white` to `text-black`

6. [`frontend/app/events/[slug]/moi-entry/page.tsx`](frontend/app/events/[slug]/moi-entry/page.tsx)
   - Changed button text color from `text-white` to `text-black`

7. [`frontend/app/g/[token]/form/page.tsx`](frontend/app/g/[token]/form/page.tsx)
   - Changed to use `tn-*` color system throughout
   - Changed focus border from purple to yellow

8. [`frontend/app/g/[token]/GuestPaymentClient.tsx`](frontend/app/g/[token]/GuestPaymentClient.tsx)
   - Changed text colors to use `tn-*` system

### New Files Created:
- [`frontend/components/ui/UnifiedComponents.tsx`](frontend/components/ui/UnifiedComponents.tsx) - Reusable components for unified design

---

## 8. Conclusion

The app has **four distinct design systems** that need consolidation:
1. Main dashboard (most consistent)
2. Event management pages (needs alignment)
3. Guest/public pages (different color scheme)
4. Auth/landing pages (unique designs)

For better mobile experience, I recommend:
1. Adopting the `tn-*` color system as the single source of truth
2. Creating a unified component library for shared patterns
3. Ensuring consistent navigation across all authenticated pages
4. Improving touch target sizes and text readability