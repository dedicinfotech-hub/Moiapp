# MoiApp Mobile (React Native / Expo)

Yellow-themed React Native app matching the MoiApp UI mockups. Connects to the existing PHP API.

## Quick Start

```bash
cd mobile
npm install
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## API Configuration

Edit `app.json` → `expo.extra.apiUrl`:

```json
"extra": {
  "apiUrl": "https://dsitesai.com/moiapp/api"
}
```

For local MAMP development, use your machine IP:

```json
"apiUrl": "http://192.168.x.x:8888/MoiApp/api"
```

## Screens Implemented

### Auth
- Splash, Login (Phone/Email), OTP, Profile Setup

### Host
- Home Dashboard, Functions list
- Choose Event Type, Create Function, Pending Approval
- Event Dashboard (with data + empty state)
- Moi Entries, Moi Entry, Gift Entry, Voice Entry
- QR Code, Reports, Invitation Upload, Settings

### Guest
- Guest Landing, Guest Form, Payment, Payment Success, Receipt, Link Expired

## Project Structure

```
mobile/src/
  api/          # PHP REST client (ported from frontend/lib/api.ts)
  components/   # Shared UI (Button, Input, EventContextCard, etc.)
  navigation/   # Auth, Main Tabs, Event Stack, Guest Stack
  screens/      # All screen components
  store/        # Zustand auth store
  theme/        # Yellow color tokens (#FFC107)
  utils/        # Formatting helpers
```

## Theme

Primary yellow: `#FFC107` — matches the web app's `tn-yellow` tokens.

## Complete User Flows

### Host Flow (requires login)
1. **Splash** → **Login** (Phone OTP or Email)
2. **OTP Verify** → **Profile Setup** (new users)
3. **Home Dashboard** → **Create New Function**
4. **Choose Event Type** (New / Past) → **Create Function**
5. **Pending Approval** (new events) OR **Event Tabs** (approved/past)
6. **Event Tabs:** Dashboard | Moi Entries | Voice Entry | Gift Entry | More
7. From **More:** Add Moi Entry, QR Code, Reports, Invitation Upload, Event Settings

### Guest Flow (no login required)
1. Open link `https://dsitesai.com/moiapp/g/{token}` or scan QR
2. **Guest Landing** → **Guest Form** → **Payment**
3. **Razorpay** (UPI/Card/NetBanking/Wallet) or **Scan & Pay** (direct UPI)
4. **Payment Success** → **Receipt**

### Test guest flow in app (while logged in)
Navigate programmatically or use deep link: `moiapp://g/YOUR_GUEST_TOKEN`

## Razorpay

- **Web (`npm run web`):** Full Razorpay checkout.js modal
- **Native (Expo Go / APK):** Opens browser for payment (use web for full Razorpay testing)
