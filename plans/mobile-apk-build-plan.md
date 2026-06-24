# MoiApp Mobile APK Build Plan

## Current State Analysis

### Existing Configuration
- **Capacitor**: Already installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android` v8.4.0)
- **App ID**: `com.moiapp.weddinggift`
- **Config files**: `capacitor.config.ts` and `capacitor.config.json` exist
- **TWA config**: `twa-config.json` exists for Trusted Web Activity
- **Next.js**: Configured for static export (`output: 'export'` in production)
- **Build guide**: `APK_BUILD_GUIDE.md` exists with instructions

### Issues Identified
1. **webDir mismatch**: `capacitor.config.ts` has `webDir: 'www'` but Next.js static export outputs to `out`
2. **Capacitor in devDependencies**: Should be in `dependencies` for production builds
3. **Missing `.env.production`**: No production environment file with API URL
4. **basePath in next.config.mjs**: May cause routing issues in static export for APK
5. **Build errors**: Pre-existing Next.js module resolution errors during static export

---

## Step-by-Step Build Plan

### Phase 1: Fix Configuration Issues

#### 1.1 Fix capacitor.config.ts
- Change `webDir` from `'www'` to `'out'` to match Next.js static export output
- Remove `server.url` (use local web assets, not remote server)
- Keep `androidScheme: 'https'` for proper API handling

#### 1.2 Update package.json
- Move Capacitor packages from `devDependencies` to `dependencies`
- Ensure versions are compatible (Capacitor 8.x with Next.js 14.x)

#### 1.3 Create .env.production
```
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_API_URL=https://your-live-api-domain.com/api
```

#### 1.4 Fix next.config.mjs for APK build
- Ensure `output: 'export'` is set for production
- Verify `basePath` is empty for APK (no subdirectory routing)
- Confirm `images.unoptimized: true` for static export

---

### Phase 2: Build Static Export

#### 2.1 Clean previous builds
```bash
cd frontend
rm -rf out .next
```

#### 2.2 Install dependencies
```bash
npm install
```

#### 2.3 Build Next.js app
```bash
npm run build
```
- Expected output: `out/` directory with static files
- Verify `out/index.html` exists

---

### Phase 3: Capacitor Android Setup

#### 3.1 Install Capacitor 7 (CRITICAL - fixes Java 21 issue)
```bash
cd frontend
npm install
```
This installs `@capacitor/android@^7.0.0` which uses `JavaVersion.VERSION_17` instead of 21.

#### 3.2 Re-sync Android platform (regenerates gradle files)
```bash
npx cap sync android
```

#### 3.3 Verify capacitor.build.gradle
Check that `frontend/android/app/capacitor.build.gradle` now shows:
```gradle
sourceCompatibility JavaVersion.VERSION_17
targetCompatibility JavaVersion.VERSION_17
```

---

### Phase 4: Android Configuration

#### 4.1 Update Android build.gradle
- Use AGP 8.0.2 (compatible with Gradle 8.5 and Java 17)
- Downgrade compileSdk from 34 to 33 (AGP 8.0.2 tested up to 33)
- Add signing configuration for release builds
- Set `minifyEnabled true` for release
- Configure ProGuard rules if needed

#### 4.2 Generate keystore (for release)
```bash
keytool -genkey -v -keystore moiapp.keystore -alias moiapp-key -keyalg RSA -keysize 2048 -validity 10000
```

#### 4.3 Configure app permissions in AndroidManifest.xml
- Internet permission (for API calls)
- Camera permission (for photo uploads)
- Microphone permission (for voice entry)
- Storage permission (for file uploads)

---

### Phase 5: Build APK

#### 5.1 Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
```
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 5.2 Release APK (for distribution)
```bash
cd android
./gradlew assembleRelease
```
- Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

#### 5.3 Sign the release APK
```bash
apksigner sign --ks moiapp.keystore --out app-release-signed.apk app-release-unsigned.apk
```

---

### Phase 6: Testing & Validation

#### 6.1 Install debug APK on device
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### 6.2 Test critical features
- [ ] App launches without blank screen
- [ ] Login/Register works
- [ ] Event list loads
- [ ] Moi entry (manual) works
- [ ] Voice entry works (microphone permission)
- [ ] Gift entry works
- [ ] Photo upload works (camera/gallery)
- [ ] Invitation upload works
- [ ] API calls succeed
- [ ] Navigation between screens works

#### 6.3 Fix common issues
- **Blank screen**: Check `webDir` path, ensure `out/index.html` exists
- **API failures**: Verify `NEXT_PUBLIC_API_URL` in `.env.production`
- **Routing issues**: Check `basePath` is empty for APK
- **File uploads**: Ensure Capacitor FilePicker plugin is configured

#### Issue: Gradle build fails with "Unsupported class file major version 69"
**Solution:** You have Java 25 installed. Use JDK 21:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v21)
java -version  # Must show 21.x
```

#### Issue: Gradle build fails with "invalid source release: 21"
**Solution:** JAVA_HOME is pointing to an older JDK. Force JDK 21 and clean:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v21)
cd frontend/android
./gradlew clean
cd ..
rm -rf ~/.gradle/caches/
npx cap sync android
```

#### Issue: Gradle build fails with "JdkImageTransform" / jlink error (AGP 8.1.x + JDK 21)
**Solution:** Downgraded AGP to 8.0.2 which is compatible with JDK 21. Clean caches and retry:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v21)
cd frontend/android
./gradlew clean
cd ..
rm -rf ~/.gradle/caches/
npx cap sync android
./gradlew assembleDebug
```

#### Issue: Gradle build fails with "Could not open settings generic class cache"
**Solution:** Clean Gradle cache and retry:
```bash
cd frontend/android
./gradlew clean
cd ..
rm -rf ~/.gradle/caches/
npx cap sync android
```

#### Issue: Gradle build fails with "JdkImageTransform" / jlink error
**Solution:** This happens with JDK 21 + AGP 8.1.2. Use JDK 17 instead:
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v17)
java -version  # Should show 17.x
```

---

## Recommended Next Steps

1. **Immediate**: Fix the `webDir` mismatch in `capacitor.config.ts`
2. **Short-term**: Create `.env.production` with your live API URL
3. **Then**: Run `npm run build` and verify `out/` directory
4. **Then**: Run `npx cap sync android` and open in Android Studio
5. **Finally**: Build and test debug APK before release

---

## Alternative: TWA (Trusted Web Activity)

If you prefer TWA over Capacitor:
- Use `twa-config.json` which is already configured
- Build with Bubblewrap CLI
- Requires Play Store publishing
- Better performance but less native integration

---

## Notes

- The app will be a wrapper around your web application
- All features work as long as the API is accessible from the device
- For production, use a release build with proper signing
- Test thoroughly on different Android versions (API 21+ recommended)
- Consider adding splash screen and app icon assets
