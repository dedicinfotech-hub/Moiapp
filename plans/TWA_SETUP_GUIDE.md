# Trusted Web Activity (TWA) Setup Guide

## Prerequisites

1. Install Bubblewrap CLI:
```bash
npm install -g @bubblewrap/cli
```

2. Install Java JDK 8 or later
3. Install Android Studio (for APK signing)

## Setup Steps

### 1. Initialize TWA Project

```bash
cd frontend
bubblewrap init --manifest twa-config.json
```

### 2. Build the APK

```bash
bubblewrap build
```

### 3. Generate Signed APK for Play Store

```bash
# Generate keystore (do this once)
keytool -genkey -v -keystore keystore/moiapp.keystore -alias moiapp-key -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
bubblewrap build --release
```

### 4. Required Assets

Place the following files in `frontend/public/`:

- `icons/icon-48x48.png` - 48x48px
- `icons/icon-72x72.png` - 72x72px
- `icons/icon-96x96.png` - 96x96px
- `icons/icon-144x144.png` - 144x144px
- `icons/icon-192x192.png` - 192x192px
- `icons/icon-512x512.png` - 512x512px
- `splash/splash-320x320.png` - 320x320px
- `splash/splash-640x640.png` - 640x640px
- `splash/splash-1024x1024.png` - 1024x1024px

### 5. Play Store Submission

1. Create a Google Play Console account
2. Create a new application
3. Upload the signed APK
4. Fill in store listing details:
   - App name: MoiApp - Wedding Gift Tracker
   - Short description: Track wedding moi (gift money) easily
   - Full description: Create a wedding page, collect moi online or offline, and keep a clear gift record for the couple and family.
   - Screenshots: Add mobile screenshots
   - Feature graphic: 1024x500px
   - Promo graphic: 180x120px

## Important Notes

- The app must be served over HTTPS
- Ensure the PWA works well on mobile devices
- Test the TWA on Android devices before submission
- Update the `twa-config.json` with your actual domain

## Testing

```bash
# Install on connected device
bubblewrap install

# Or run in emulator
bubblewrap validate