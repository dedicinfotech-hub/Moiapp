import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moiapp.weddinggift',
  appName: 'Moi PassBook',
  webDir: 'out',
  server: {
    // Load webapp from server directly - simplest and most reliable solution
    url: 'https://moipassbook.com',
    // Allow navigation to the same origin
    allowNavigation: ['moipassbook.com'],
    androidScheme: 'https',
    cleartext: false,
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
    },
    WebView: {
      androidScheme: 'https'
    }
  }
};

export default config;
