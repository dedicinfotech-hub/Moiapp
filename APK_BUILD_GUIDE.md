# MoiApp - APK Build Guide

This guide will help you convert your Next.js web application into an Android APK using Capacitor.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Java JDK** (v11 or higher) - [Download here](https://adoptium.net/)
3. **Android Studio** - [Download here](https://developer.android.com/studio)
4. **Git** (optional but recommended)

---

## Step 1: Install Node.js Dependencies

Open your terminal and navigate to the frontend directory:

```bash
cd /Applications/MAMP/htdocs/MoiApp/frontend
npm install
```

---

## Step 2: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev
```

---

## Step 3: Initialize Capacitor

```bash
npx cap init "MoiApp" "com.moiapp.weddinggift" --web-dir out
```

This will create a `capacitor.config.ts` file. Replace its contents with:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moiapp.weddinggift',
  appName: 'MoiApp',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFC107',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFC107',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFC107'
    }
  }
};

export default config;
```

---

## Step 4: Build the Next.js Application

```bash
npm run build
```

This will create an `out` folder with the static build of your application.

---

## Step 5: Add Android Platform

```bash
npx cap add android
```

---

## Step 6: Sync the Build

```bash
npx cap sync android
```

---

## Step 7: Open in Android Studio

```bash
npx cap open android
```

This will open the project in Android Studio. From here:

1. Wait for the Gradle sync to complete
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Wait for the build to complete
4. Click on the notification or go to **Build > Build Bundle(s) / APK(s) > Locate** to find your APK

---

## Alternative: Build APK from Command Line

If you have the Android SDK configured, you can build from the command line:

```bash
cd android
./gradlew assembleDebug    # For debug APK
./gradlew assembleRelease  # For release APK (requires signing)
```

The APK will be located at:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## Step 8: Sign the Release APK (Optional)

For a release APK, you need to sign it:

1. Generate a keystore (if you don't have one):
```bash
keytool -genkey -v -keystore moiapp.keystore -alias moiapp-key -keyalg RSA -keysize 2048 -validity 10000
```

2. Place the keystore in `android/app/` directory

3. Edit `android/app/build.gradle` and add signing configs (see below)

---

## Important Configuration Files

### 1. Update `frontend/next.config.mjs`

Make sure your Next.js config is set for static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
```

### 2. Create `.env.production` in frontend folder

```
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 3. Android `build.gradle` signing configuration

Add this to `android/app/build.gradle` inside the `android` block:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## Troubleshooting

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: Gradle build fails
**Solution:** Make sure you have Java JDK 11+ installed and ANDROID_HOME environment variable set.

### Issue: App shows blank screen
**Solution:** Check that `webDir` in `capacitor.config.ts` matches your build output directory (`out`).

### Issue: API calls fail
**Solution:** Update `NEXT_PUBLIC_API_URL` in `.env.production` to point to your live API endpoint.

---

## Quick Start Script

Create a file named `build-apk.sh` in the frontend directory:

```bash
#!/bin/bash
echo "Building MoiApp APK..."

# Install dependencies
npm install

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev

# Build Next.js app
npm run build

# Add Android platform (if not already added)
npx cap add android

# Sync
npx cap sync android

echo "Opening Android Studio..."
npx cap open android
```

Make it executable:
```bash
chmod +x build-apk.sh
```

Run it:
```bash
./build-apk.sh
```

---

## Notes

- The app will be a wrapper around your web application
- All features will work as long as the API is accessible
- For production, use a release build with proper signing
- Test thoroughly on different Android versions

---

## Support

If you encounter issues:
1. Check Capacitor documentation: https://capacitorjs.com/docs
2. Check Next.js documentation: https://nextjs.org/docs
3. Ensure all prerequisites are installed correctly
