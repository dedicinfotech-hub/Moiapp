# MoiApp Android APK — test build

## 1. App icon & splash (Moi logo)

Default Expo placeholder icons are replaced with the **MoiApp wordmark** (`assets/logo.png`).

Regenerate anytime after changing the logo:

```bash
cd mobile
npm run icons
```

This writes:

| File | Size | Use |
|------|------|-----|
| `assets/icon.png` | 1024×1024 | App icon, notifications |
| `assets/adaptive-icon.png` | 1024×1024 | Android adaptive icon |
| `assets/splash.png` | 1284×2778 | Launch splash (yellow `#FFC107`) |

---

## 2. Build APK with EAS (recommended)

### One-time setup

```bash
npm install -g eas-cli
cd mobile
eas login
eas init
```

`eas init` links the project and fills `app.json` → `extra.eas.projectId` (replaces `REPLACE_WITH_EAS_PROJECT_ID`).

### Build test APK

```bash
cd mobile
npm run build:apk
```

- Profile: **preview** (`eas.json`)
- Output: **`.apk`** (install directly on device)
- API: `https://moipassbook.com/api` (from `app.json`)

When the build finishes, EAS prints a download URL. Open it on your phone or run:

```bash
eas build:list
```

### Local build (needs Android SDK + Docker)

```bash
npm run build:apk:local
```

---

## 3. Install on Android phone

1. Download the `.apk` from the EAS build page.
2. Enable **Install unknown apps** for your browser/files app.
3. Open the APK and install.
4. Sign in and test host / guest / admin flows against the live API.

---

## 4. Troubleshooting

| Issue | Fix |
|-------|-----|
| `REPLACE_WITH_EAS_PROJECT_ID` | Run `eas init` in `mobile/` |
| Build fails on credentials | Run `eas credentials` or let EAS manage keystore |
| Old icon after install | Uninstall app, rebuild APK, reinstall |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall old `com.moiapp.weddinggift` first (debug/local build used a different signing key than EAS). On phone: Settings → Apps → MoiApp → Uninstall. On emulator: `adb uninstall com.moiapp.weddinggift` then reinstall |
| App opens then closes immediately | Check `adb logcat` — often missing native module (e.g. `ExpoLinearGradient`). Add `expo-linear-gradient` to `package.json` only (not `app.json` plugins), then rebuild APK |
| API errors on device | Confirm phone has internet; API URL in `app.json` |

---

## 5. Production (Play Store)

Use App Bundle instead of APK:

```bash
eas build -p android --profile production
```

`production` profile builds an **`.aab`** for Google Play.
