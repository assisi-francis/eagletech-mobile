import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'eagletech_biometrics_enabled';
const BIOMETRICS_CREDS_KEY = 'eagletech_biometrics_creds';

export async function isBiometricSupported(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (e) {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
    return val === 'true';
  } catch (e) {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRICS_CREDS_KEY);
    }
  } catch (e) {
    console.warn('Error setting biometric preference:', e);
  }
}

export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      BIOMETRICS_CREDS_KEY,
      JSON.stringify({ email, password })
    );
  } catch (e) {
    console.warn('Error saving biometric credentials:', e);
  }
}

export async function getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(BIOMETRICS_CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function promptBiometricAuth(): Promise<boolean> {
  try {
    const supported = await isBiometricSupported();
    if (!supported) return false;

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with Face ID / Fingerprint',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    return res.success;
  } catch (e) {
    console.warn('Biometric prompt failed:', e);
    return false;
  }
}
